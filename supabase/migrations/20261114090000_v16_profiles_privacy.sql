-- v16: 회원 표(profiles) 읽기 범위 축소, 리뷰 작성자 이름을 가려서 저장
-- 2026-11-14
--
-- 막는 것:
--   1) profiles 의 모든 행·모든 칸이 로그인 없이(anon) 읽히던 문제.
--      예전 정책 anyone_read_profiles 는 USING (true) 였고, anon·authenticated 가
--      표 전체에 SELECT 권한을 갖고 있었다 (이메일, 전화번호, 본인인증 값, 관리자 여부 포함).
--   2) reviews.reviewer_name 에 작성자 이름 전체가 저장되어 공개 리뷰와 함께 읽히던 문제.
--
-- 바꾼 뒤의 규칙:
--   [칸] anon          : id, name, avatar_url 만 읽을 수 있다.
--        authenticated : id, name, avatar_url, role 만 읽을 수 있다.
--        그 밖의 칸(email, phone, verified_*, is_admin, notification_preferences 등)은
--        service_role(서버 API)만 읽는다. 칸을 새로 추가해도 자동으로 공개되지 않는다.
--        → 세션 클라이언트에서 profiles 에 select("*") 를 쓰면 권한 오류가 난다. 칸을 적어서 읽을 것.
--        → 본인의 전화번호·알림 설정처럼 본인만 봐야 하는 값도 서버 API 를 거쳐서 읽는다.
--   [행] anon          : 전문가(experts 에 행이 있는 회원)만.
--        authenticated : 본인, 전문가, 나에게 문의·주문한 사람.
--                        전문가는 여기에 더해 자기가 볼 수 있는 견적 요청의 작성자.
--                        관리자는 전체 (기존 정책 admin_profiles).
--   [리뷰] reviewer_name 은 DB 가 프로필 이름의 첫 글자만 남겨 저장한다 ("홍**").
--        누가 썼는지는 reviewer_id 로 계속 알 수 있다.
--
-- 함께 바꾸는 것:
--   다른 표의 정책 7개가 관리자 확인을 위해 profiles 를 직접 읽고 있었다
--   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')).
--   profiles 의 새 정책이 quote_requests 등을 읽으므로 그대로 두면 정책이 서로를 부르는
--   순환이 생기고, anon 은 role 칸 권한이 없어 조회가 오류로 끝난다.
--   기존 함수 is_admin() (SECURITY DEFINER) 으로 바꾼다. 다른 표의 관리자 정책과 같은 방식이다.
--
-- 주의 (나중에 이 표의 권한을 건드릴 때):
--   GRANT SELECT ON public.profiles TO anon / authenticated, GRANT ... ON ALL TABLES IN SCHEMA public
--   같은 문장은 오류 없이 모든 칸을 다시 열어 버린다. 맨 아래의 확인 쿼리로 점검할 것.

SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1) 다른 표의 정책: 관리자 확인을 is_admin() 으로
-- ---------------------------------------------------------------------------
ALTER POLICY "Authenticated read quote requests" ON public.quote_requests
  USING (
    (auth.role() = 'authenticated'::text)
    AND (
      (status = ANY (ARRAY['open'::text, 'matched'::text, 'quoted'::text, 'in_discussion'::text]))
      OR (auth.uid() = requester_id)
      OR (SELECT public.is_admin())
    )
  );

ALTER POLICY "Users update own quote requests" ON public.quote_requests
  USING ((auth.uid() = requester_id) OR (SELECT public.is_admin()));

ALTER POLICY "Participants read deal offers" ON public.deal_offers
  USING ((auth.uid() = buyer_id) OR (auth.uid() = expert_id) OR (SELECT public.is_admin()));

ALTER POLICY "Participants read deliveries" ON public.deliveries
  USING (
    (EXISTS (
      SELECT 1 FROM public.orders o
      WHERE (o.id = deliveries.order_id) AND ((o.buyer_id = auth.uid()) OR (o.seller_id = auth.uid()))
    ))
    OR (SELECT public.is_admin())
  );

ALTER POLICY "Users read own expert applications" ON public.expert_applications
  USING ((auth.uid() = user_id) OR (SELECT public.is_admin()));

ALTER POLICY "Admins update expert applications" ON public.expert_applications
  USING ((SELECT public.is_admin()));

ALTER POLICY "Admins read reports" ON public.reports
  USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2) profiles: 볼 수 있는 행
-- ---------------------------------------------------------------------------
-- 새 정책의 EXISTS 가 쓰는 칸
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations (buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations (seller_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_requester_id ON public.quote_requests (requester_id);

DROP POLICY IF EXISTS anyone_read_profiles ON public.profiles;
DROP POLICY IF EXISTS anon_read_expert_profiles ON public.profiles;
DROP POLICY IF EXISTS auth_read_related_profiles ON public.profiles;

-- 로그인하지 않은 방문자: 전문가만
CREATE POLICY anon_read_expert_profiles ON public.profiles
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.experts e WHERE e.id = profiles.id));

-- 로그인한 회원.
-- 대화·주문은 "받은 쪽(seller)이 보낸 쪽(buyer)을 본다"는 한 방향만 둔다. 반대 방향의 상대는
-- 전문가라서 이미 보인다 (seller_id 는 외래 키로 experts 만 가리킨다). 한 방향만 두면
-- 내가 만든 행으로 남의 프로필을 열 수 없다: buyer_id 는 정책상 본인만 넣을 수 있기 때문이다.
-- 아래 EXISTS 는 조회하는 사람의 권한으로 실행되므로 각 표의 RLS 도 함께 적용된다.
-- (quote_requests 는 상태 조건을 따로 적지 않고 그 표의 RLS 에 맡긴다: 열려 있는 요청만 보인다.)
CREATE POLICY auth_read_related_profiles ON public.profiles
  FOR SELECT TO authenticated
  USING (
    -- 본인
    id = (SELECT auth.uid())
    -- 전문가
    OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = profiles.id)
    -- 나에게 문의한 사람
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.buyer_id = profiles.id AND c.seller_id = (SELECT auth.uid())
    )
    -- 나에게 주문한 사람
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.buyer_id = profiles.id AND o.seller_id = (SELECT auth.uid())
    )
    -- 내가 전문가라면: 볼 수 있는 견적 요청의 작성자
    OR (
      EXISTS (SELECT 1 FROM public.experts me WHERE me.id = (SELECT auth.uid()))
      AND EXISTS (SELECT 1 FROM public.quote_requests q WHERE q.requester_id = profiles.id)
    )
  );

-- ---------------------------------------------------------------------------
-- 3) profiles: 읽을 수 있는 칸
-- ---------------------------------------------------------------------------
-- 표 단위 권한을 거두면 칸 단위 권한도 함께 사라지므로, 거둔 뒤에 필요한 칸만 다시 준다.
REVOKE ALL ON TABLE public.profiles FROM anon;
GRANT SELECT (id, name, avatar_url) ON TABLE public.profiles TO anon;

-- authenticated 의 UPDATE(일부 칸)·DELETE(관리자 정책) 권한은 그대로 둔다.
REVOKE SELECT, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.profiles FROM authenticated;
GRANT SELECT (id, name, avatar_url, role) ON TABLE public.profiles TO authenticated;

COMMENT ON TABLE public.profiles IS
  'anon 은 id·name·avatar_url, authenticated 는 여기에 role 까지만 읽을 수 있다 (v16). 나머지 칸은 service_role 전용이며, 세션 클라이언트의 select(*) 는 권한 오류가 난다.';

-- ---------------------------------------------------------------------------
-- 4) reviews: 작성자 이름은 첫 글자만 남겨 저장
-- ---------------------------------------------------------------------------
-- 값은 항상 프로필 이름에서 만든다 (요청에 실어 보낸 reviewer_name 은 쓰지 않는다).
-- 앱의 maskName (src/lib/mask-name.ts) 과 같은 규칙이다.
CREATE OR REPLACE FUNCTION public.set_review_reviewer_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_name text;
BEGIN
  SELECT btrim(p.name) INTO v_name FROM public.profiles p WHERE p.id = NEW.reviewer_id;
  -- 이름이 없으면 비워 둔다 (화면은 빈 값을 "구매자"로 적는다).
  NEW.reviewer_name := CASE
    WHEN coalesce(v_name, '') = '' THEN NULL
    ELSE left(v_name, 1) || '**'
  END;
  RETURN NEW;
END;
$function$;

-- 트리거로만 쓰는 함수다. API(rpc)로 부를 수 없게 한다.
REVOKE ALL ON FUNCTION public.set_review_reviewer_name() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reviews_set_reviewer_name ON public.reviews;
CREATE TRIGGER reviews_set_reviewer_name
  BEFORE INSERT OR UPDATE OF reviewer_name, reviewer_id ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_review_reviewer_name();

-- 이미 있는 리뷰도 같은 규칙으로 다시 저장한다 (적용 시점의 리뷰는 0건).
UPDATE public.reviews SET reviewer_name = reviewer_name;

-- ---------------------------------------------------------------------------
-- 확인 쿼리 (결과가 모두 false 여야 한다):
--   SELECT has_table_privilege('anon', 'public.profiles', 'SELECT')                    AS anon_table,
--          has_table_privilege('authenticated', 'public.profiles', 'SELECT')           AS auth_table,
--          has_column_privilege('anon', 'public.profiles', 'email', 'SELECT')          AS anon_email,
--          has_column_privilege('authenticated', 'public.profiles', 'email', 'SELECT') AS auth_email,
--          has_column_privilege('anon', 'public.profiles', 'role', 'SELECT')           AS anon_role;
--
-- 되돌리기 (예전처럼 회원 표 전체가 다시 열린다. 급한 장애 때만):
--   DROP POLICY IF EXISTS anon_read_expert_profiles ON public.profiles;
--   DROP POLICY IF EXISTS auth_read_related_profiles ON public.profiles;
--   CREATE POLICY anyone_read_profiles ON public.profiles FOR SELECT USING (true);
--   GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
--   DROP TRIGGER IF EXISTS reviews_set_reviewer_name ON public.reviews;
-- (1번의 정책 7개는 is_admin() 그대로 두어도 된다.)
-- ---------------------------------------------------------------------------
