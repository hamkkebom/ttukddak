-- v15: 서비스 소유자 접근 정책 정리
-- 2026-11-13 관리자 정지 기능을 고치면서 확인한 문제를 DB 레벨에서 막는다.
--
-- 막는 것:
--   1) 전문가가 자기 서비스의 status 를 직접 'active' 로 바꿔 관리자 승인 없이 공개하는 문제
--   2) 관리자가 정지(suspended)한 서비스를 전문가가 직접 되돌리는 문제
--   3) 전문가가 자기 서비스 행을 직접 삭제(행 삭제)하는 문제
--
-- 원인은 예전 스크립트가 만든 expert_manage_services 정책이다. 소유자에게 모든 작업을
-- 조건 없이 허용한다 (FOR ALL, WITH CHECK 없음). v13 에서 상태를 제한한 정책을 추가했지만
-- 허용 정책은 OR 로 합쳐지므로 예전 정책이 남아 있는 한 제한이 걸리지 않았다.
--
-- 앱은 서비스 생성·수정·삭제를 모두 서버 API(service_role)로 하므로 이 정책에 기대는
-- 클라이언트 쓰기 경로가 없다. 소유자의 조회는 "Experts read own services" 가 계속 허용한다.
--
-- 변경 후 소유자가 세션으로 직접 할 수 있는 것:
--   - 자기 서비스 조회 (상태 무관)
--   - draft / pending_review 로 새 서비스 INSERT ("Experts insert own services", v13)
--   - 정지되지 않은 자기 서비스를 draft / pending_review / deleted 상태로 UPDATE
-- 할 수 없는 것: active 로 변경, 정지된 서비스 변경, 행 삭제

SET LOCAL lock_timeout = '5s';

-- 1) 소유자에게 모든 작업을 조건 없이 허용하던 예전 정책 제거
DROP POLICY IF EXISTS expert_manage_services ON public.services;
DROP POLICY IF EXISTS expert_manage_own_services ON public.services;

-- 2) 소유자 직접 수정 정책: 정지된 서비스는 대상에서 뺀다
DROP POLICY IF EXISTS "Experts update own draft services" ON public.services;
CREATE POLICY "Experts update own draft services" ON public.services
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = expert_id AND status <> 'suspended')
  WITH CHECK (
    (SELECT auth.uid()) = expert_id
    AND status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'deleted'::text])
  );

-- ---------------------------------------------------------------------------
-- 되돌리기 (필요할 때만):
--   DROP POLICY IF EXISTS "Experts update own draft services" ON public.services;
--   CREATE POLICY "Experts update own draft services" ON public.services
--     FOR UPDATE
--     USING (auth.uid() = expert_id)
--     WITH CHECK ((auth.uid() = expert_id) AND (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'deleted'::text])));
--   CREATE POLICY expert_manage_services ON public.services
--     FOR ALL TO authenticated
--     USING ((SELECT auth.uid()) = expert_id);
-- ---------------------------------------------------------------------------
