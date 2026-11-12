-- v14: 보안 정책 강화
-- 2026-11-11 운영 DB 정책 감사에서 확인된 문제를 DB 레벨에서 막는다.
-- 이 파일의 변경은 서버(API)가 세션 클라이언트로 수행하는 정상 쓰기 경로
-- (프로필 name/phone/bio/avatar 수정, pending 주문 생성, 대화 참여자의 메시지 전송,
--  본인 주문에 대한 리뷰 작성, 전문가의 리뷰 답글)와 호환되도록 작성했다.
-- 알림 생성, 합의견적 생성·변경, 결제 기록, 전문가 정보 변경은 service_role(서버) 전용으로 바꾼다.
--
-- 막는 것:
--   1) 로그인 사용자가 자기 profiles 행의 role / is_admin / verified_* 를 직접 바꿔 관리자가 되는 문제
--   2) 결제 없이 status='paid' 주문을 직접 INSERT 하는 문제 (기본값도 'paid' 였음),
--      다른 전문가의 서비스에 자신을 판매자로 지정해 주문을 만드는 문제
--   3) 결제 1건(payment_id)으로 여러 주문을 결제 완료 처리하는 문제
--   4) 구매자가 합의견적(deal_offers) 금액을 직접 수정한 뒤 수락하는 문제
--   5) 아무 사용자에게나 알림을 INSERT 하는 문제
--   6) 참여하지 않은 대화방에 메시지를 INSERT 하거나 system/deal_offer 메시지를 위조하는 문제
--   7) 구매하지 않은 서비스·다른 전문가에게 리뷰를 INSERT 하는 문제,
--      전문가가 자기 리뷰의 별점·본문을 고치는 문제
--   8) 사용자가 payments 행을 직접 INSERT 하는 문제, processed_webhooks 의 RLS 누락
--   9) 전문가가 자기 experts 행의 is_prime / is_master / rating 을 직접 바꾸는 문제

-- 잠금을 오래 기다리며 다른 쿼리를 막지 않도록 한다 (트랜잭션 안에서만 적용됨).
SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 0. 관리자 플래그 컬럼 보정 (운영 DB에는 이미 있음. schema.sql 기반 새 DB 용)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ---------------------------------------------------------------------------
-- 1. 관리자 판별 단일화: 앱 코드는 role = 'admin', 기존 RLS 정책은 is_admin 플래그를 본다.
--    둘 중 하나만 맞아도 관리자로 인정해 두 기준이 어긋나지 않게 한다.
--    (두 컬럼 모두 아래 2·3번에서 일반 사용자가 바꿀 수 없게 된다.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (p.is_admin = true OR p.role = 'admin')
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. profiles: 일반 사용자가 쓸 수 있는 컬럼을 컬럼 권한으로 제한
--    (role, is_admin, is_expert_verified, verified_*, email, deleted_at 은 서버 전용.
--     프로필 행은 handle_new_user 트리거가 만들므로 사용자 INSERT 권한은 두지 않는다.)
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

DO $$
DECLARE
  upd_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO upd_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = ANY (ARRAY[
      'name', 'phone', 'bio', 'avatar_url', 'updated_at',
      'notification_preferences', 'marketing_agreed'
    ]);

  IF upd_cols IS NOT NULL THEN
    EXECUTE format('GRANT UPDATE (%s) ON public.profiles TO authenticated', upd_cols);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. profiles: 권한 컬럼 보호 트리거 (권한이 다시 넓게 부여되더라도 막는 이중 방어)
--    service_role(서버) 과 DB 관리 역할만 권한 컬럼을 바꿀 수 있다.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  protected_cols text[] := ARRAY[
    'id', 'email', 'role', 'is_admin', 'is_expert_verified',
    'verified_name', 'verified_birth_date', 'verified_phone', 'verified_ci', 'verified_at',
    'deleted_at', 'created_at'
  ];
  col text;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
BEGIN
  -- PostgREST 사용자 요청(anon / authenticated)만 제한한다.
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY protected_cols LOOP
    IF (old_row -> col) IS DISTINCT FROM (new_row -> col) THEN
      RAISE EXCEPTION 'profiles.% 컬럼은 서버에서만 변경할 수 있습니다', col
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profiles_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- 4. orders: 사용자는 결제 전(pending) 주문만, 해당 서비스의 실제 전문가를 판매자로 해서만
--    만들 수 있다. 결제·정산 필드는 서버 전용.
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS auth_insert_orders ON public.orders;
DROP POLICY IF EXISTS "Buyers insert own pending orders" ON public.orders;
CREATE POLICY "Buyers insert own pending orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = buyer_id
    AND status = 'pending'
    AND payment_id IS NULL
    AND transaction_id IS NULL
    AND pg_tx_id IS NULL
    AND cancellation_id IS NULL
    AND coalesce(refunded_amount, 0) = 0
    AND coalesce(fee, 0) = 0
    AND completed_at IS NULL
    AND delivered_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.services s
      WHERE s.id = orders.service_id
        AND s.expert_id = orders.seller_id
    )
  );

-- 결제 1건은 주문 1건에만 연결된다.
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_unique
  ON public.orders(payment_id)
  WHERE payment_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. messages: 대화 참여자만, 사용자 메시지 타입으로만 직접 INSERT 가능
--    (deal_offer / system 메시지는 서버가 service_role 로 기록한다.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS auth_insert_messages ON public.messages;
DROP POLICY IF EXISTS "Participants insert own messages" ON public.messages;
CREATE POLICY "Participants insert own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND coalesce(message_type, 'text') IN ('text', 'file', 'image')
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (SELECT auth.uid()) IN (c.buyer_id, c.seller_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 6. reviews: 납품받았거나 완료된 본인 주문에 대해, 그 주문의 판매자에게만 리뷰 작성 가능
--    ('review_pending' 은 이전 코드의 납품 완료 상태)
--    전문가는 답글 컬럼만 수정할 수 있다 (별점·본문 수정 불가).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS auth_insert_reviews ON public.reviews;
DROP POLICY IF EXISTS "Buyers insert reviews for own orders" ON public.reviews;
CREATE POLICY "Buyers insert reviews for own orders"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = reviewer_id
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = reviews.order_id
        AND o.buyer_id = (SELECT auth.uid())
        AND o.service_id = reviews.service_id
        AND o.seller_id = reviews.expert_id
        AND o.status IN ('delivered', 'review_pending', 'completed')
    )
  );

REVOKE UPDATE ON public.reviews FROM anon, authenticated;
GRANT UPDATE (expert_reply, expert_reply_at) ON public.reviews TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. notifications: 알림 생성은 서버(service_role) 전용
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS auth_insert_notifications ON public.notifications;

-- ---------------------------------------------------------------------------
-- 8. deal_offers: 생성·변경은 서버(service_role) 전용, 참여자는 조회만
--    (API 라우트가 권한 확인 후 service_role 로 기록한다.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Experts create deal offers" ON public.deal_offers;
DROP POLICY IF EXISTS "Participants update deal offers" ON public.deal_offers;

-- ---------------------------------------------------------------------------
-- 9. payments / processed_webhooks: 서버 전용
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP POLICY IF EXISTS auth_insert_payments ON public.payments;
  END IF;
END $$;

ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.processed_webhooks FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. experts: 등급(is_prime/is_master)·평점은 서버 전용. 앱에 사용자 쓰기 경로가 없으므로
--     조회만 남긴다.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS auth_update_expert ON public.experts;
REVOKE INSERT, UPDATE, DELETE ON public.experts FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 되돌리기 참고 (적용 전 운영 DB 상태)
--   GRANT INSERT, UPDATE ON public.profiles TO anon, authenticated;
--   DROP TRIGGER protect_profiles_privileged_columns ON public.profiles;
--   is_admin(): profiles.is_admin = true 만 확인하던 정의로 복원
--   ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'paid';
--   CREATE POLICY auth_insert_orders ON public.orders FOR INSERT TO authenticated
--     WITH CHECK ((SELECT auth.uid()) = buyer_id);
--   DROP INDEX public.orders_payment_id_unique;
--   CREATE POLICY auth_insert_messages ON public.messages FOR INSERT TO authenticated
--     WITH CHECK ((SELECT auth.uid()) = sender_id);
--   CREATE POLICY auth_insert_reviews ON public.reviews FOR INSERT TO authenticated
--     WITH CHECK ((SELECT auth.uid()) = reviewer_id);
--   GRANT UPDATE ON public.reviews TO anon, authenticated;
--   CREATE POLICY auth_insert_notifications ON public.notifications FOR INSERT TO authenticated
--     WITH CHECK (true);
--   CREATE POLICY auth_insert_payments ON public.payments FOR INSERT TO authenticated
--     WITH CHECK ((SELECT auth.uid()) = user_id);
--   deal_offers 의 "Experts create deal offers" / "Participants update deal offers" 는 v12 정의 참고
--   ALTER TABLE public.processed_webhooks DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON public.processed_webhooks TO anon, authenticated;
--   CREATE POLICY auth_update_expert ON public.experts FOR UPDATE TO authenticated
--     USING ((SELECT auth.uid()) = id);
--   GRANT INSERT, UPDATE, DELETE ON public.experts TO anon, authenticated;
-- ---------------------------------------------------------------------------
