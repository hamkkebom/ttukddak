-- v17: 비공개 파일 보관함 접근 범위 축소, 쿠폰 코드 공개 읽기 제거, 서비스 숫자 직접 수정 차단
-- 2026-11-14
--
-- 막는 것:
--   1) 로그인한 회원이면 누구나 attachments·deliveries 보관함의 모든 파일을 목록으로 보고
--      내려받을 수 있던 문제. 예전 정책은 bucket_id 만 확인했다.
--      attachments 에는 메시지 첨부뿐 아니라 전문가 신청 서류(신분증, 사업자등록증)도 올라간다.
--   2) 같은 보관함에 아무 경로로나 올릴 수 있던 문제 (남의 대화방·주문 폴더 포함).
--   3) 사용 중인 쿠폰 코드가 로그인 없이 전부 읽히던 문제 (anyone_read_coupons).
--   4) 전문가가 자기 서비스의 판매 수·평점·리뷰 수·조회 수·프라임 표시를 API 로 직접 넣거나 고칠 수 있던 문제.
--      정책은 소유자와 상태만 확인했고, 쓰기 권한은 모든 칸에 열려 있었다.
--   5) 전문가 행이 새로 생길 때 완료율 100, 응답 시간 '2시간 이내' 가 기본값으로 들어가던 문제.
--   6) 같은 본인인증 값(CI)이 동시에 두 계정에 저장될 수 있던 문제 (확인 뒤 저장 사이의 틈).
--
-- 바꾼 뒤의 규칙:
--   attachments 읽기 : 올린 사람, 관리자, 그리고 messages/<대화방 id>/ 아래 파일은 그 대화의 두 사람.
--   attachments 올리기: messages/<대화방 id>/ 는 그 대화의 두 사람만.
--                       quotes/, reviews/, verification/ 은 로그인한 회원 (읽기는 올린 사람과 관리자뿐).
--   deliveries 읽기   : 올린 사람, 관리자, 그리고 orders/<주문 id>/ 아래 파일은 그 주문의 구매자와 판매자.
--   deliveries 올리기 : orders/<주문 id>/ 에 그 주문의 판매자만.
--   coupons           : 관리자(admin_coupons)와 서버(service_role)만 읽는다.
--                       앱은 쿠폰 확인·적용을 모두 서버 API 로 하므로 화면 동작은 그대로다.
--
-- 경로 규칙은 앱의 올리기 코드(src/lib/storage.ts 를 부르는 곳)와 맞춰져 있다:
--   messages/<conversation id>/..., quotes/..., reviews/..., verification/id|business/..., orders/<order id>/...
-- 새 폴더를 쓰려면 이 정책에도 추가해야 올라간다.
--
-- 아래 EXISTS 는 조회하는 사람의 권한으로 실행되므로 conversations·orders 의 RLS 도 함께 적용된다.

SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1) coupons: 공개 읽기 제거
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS anyone_read_coupons ON public.coupons;
REVOKE ALL ON TABLE public.coupons FROM anon;

-- ---------------------------------------------------------------------------
-- 2) attachments 보관함
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Attachment auth read" ON storage.objects;
DROP POLICY IF EXISTS "Attachment auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Attachment read scoped" ON storage.objects;
DROP POLICY IF EXISTS "Attachment upload scoped" ON storage.objects;

CREATE POLICY "Attachment read scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (
      owner_id = (SELECT auth.uid())::text
      OR (SELECT public.is_admin())
      OR (
        (storage.foldername(name))[1] = 'messages'
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id::text = (storage.foldername(objects.name))[2]
            AND (SELECT auth.uid()) IN (c.buyer_id, c.seller_id)
        )
      )
    )
  );

CREATE POLICY "Attachment upload scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND (
      (
        (storage.foldername(name))[1] = 'messages'
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id::text = (storage.foldername(objects.name))[2]
            AND (SELECT auth.uid()) IN (c.buyer_id, c.seller_id)
        )
      )
      OR (storage.foldername(name))[1] IN ('quotes', 'reviews', 'verification')
    )
  );

-- ---------------------------------------------------------------------------
-- 3) deliveries 보관함
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Delivery auth read" ON storage.objects;
DROP POLICY IF EXISTS "Delivery auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Delivery read scoped" ON storage.objects;
DROP POLICY IF EXISTS "Delivery upload scoped" ON storage.objects;

CREATE POLICY "Delivery read scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'deliveries'
    AND (
      owner_id = (SELECT auth.uid())::text
      OR (SELECT public.is_admin())
      OR (
        (storage.foldername(name))[1] = 'orders'
        AND EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id::text = (storage.foldername(objects.name))[2]
            AND (SELECT auth.uid()) IN (o.buyer_id, o.seller_id)
        )
      )
    )
  );

CREATE POLICY "Delivery upload scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deliveries'
    AND (storage.foldername(name))[1] = 'orders'
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (storage.foldername(objects.name))[2]
        AND o.seller_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4) services: 세션으로 직접 쓸 수 있는 칸을 내용에 해당하는 칸으로 제한
-- ---------------------------------------------------------------------------
-- 판매 수·평점·리뷰 수·조회 수·프라임·빠른 응답·반려 사유·소유자·id 는 서버(service_role)만 쓴다.
-- 앱은 서비스 생성·수정을 모두 서버 API 로 하므로 화면 동작은 그대로다 (v15 참고).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.services FROM anon;
REVOKE INSERT, UPDATE ON TABLE public.services FROM authenticated;
GRANT INSERT (expert_id, category_id, title, description, thumbnail_url, video_url, images, price, tags, status)
  ON TABLE public.services TO authenticated;
GRANT UPDATE (category_id, title, description, thumbnail_url, video_url, images, price, tags, status, updated_at)
  ON TABLE public.services TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) experts: 지어낸 기본값 제거
-- ---------------------------------------------------------------------------
ALTER TABLE public.experts
  ALTER COLUMN completion_rate SET DEFAULT 0,
  ALTER COLUMN response_time DROP DEFAULT;

-- ---------------------------------------------------------------------------
-- 6) profiles: 같은 본인인증 값(CI)은 한 계정에만
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_profiles_verified_ci;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_verified_ci_uniq
  ON public.profiles (verified_ci) WHERE verified_ci IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 되돌리기 (예전처럼 로그인한 회원 모두에게 다시 열린다. 급한 장애 때만):
--   DROP POLICY IF EXISTS "Attachment read scoped" ON storage.objects;
--   DROP POLICY IF EXISTS "Attachment upload scoped" ON storage.objects;
--   DROP POLICY IF EXISTS "Delivery read scoped" ON storage.objects;
--   DROP POLICY IF EXISTS "Delivery upload scoped" ON storage.objects;
--   CREATE POLICY "Attachment auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');
--   CREATE POLICY "Attachment auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
--   CREATE POLICY "Delivery auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deliveries');
--   CREATE POLICY "Delivery auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliveries');
--   CREATE POLICY anyone_read_coupons ON public.coupons FOR SELECT USING (is_active = true);
--   GRANT SELECT ON TABLE public.coupons TO anon;
--   GRANT INSERT, UPDATE ON TABLE public.services TO authenticated;
--   (4~6 의 나머지는 되돌릴 이유가 없다.)
-- ---------------------------------------------------------------------------
