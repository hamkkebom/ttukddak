-- v18: 서비스 패키지(service_packages) 값 제약과 쓰기 경로 정리
-- 2026-11-14
--
-- 배경: 서비스 등록·수정 화면의 패키지(기간, 수정 횟수, 구성)가 저장되지 않고 있었다.
-- 앱이 패키지를 서버 API(service_role)로 저장하게 되면서, 표가 그 저장 방식과 맞도록 정리한다.
-- 적용 당시 이 표는 0행이다.
--
-- 바꾸는 것:
--   1) 한 서비스 안에서 패키지 이름은 하나씩만 (주문이 이름으로 패키지를 찾는다).
--   2) 값의 범위: 가격 1,000원 이상 1억 원 이하, 작업 기간 1~365일, 수정 횟수 0~99회.
--      앱의 검증(src/lib/service-packages.ts)과 같은 범위다.
--   3) 세션으로 직접 쓰는 길을 닫는다. 예전 정책 expert_manage_packages 는 소유자에게
--      모든 작업을 허용했는데, 이 길로는 앱의 검증을 거치지 않고 값을 넣을 수 있다.
--      읽기는 그대로 누구나 할 수 있다 (anyone_read_packages).
--   4) 패키지 목록과 서비스의 대표 가격(services.price)을 한 번에 바꾸는 함수를 둔다.
--      여러 번의 요청으로 나눠 쓰면 중간에 실패했을 때 패키지와 대표 가격이 어긋난다.

SET LOCAL lock_timeout = '5s';

-- 1) 이름은 서비스마다 하나씩
CREATE UNIQUE INDEX IF NOT EXISTS service_packages_service_name_uniq
  ON public.service_packages (service_id, name);

-- 2) 값의 범위
ALTER TABLE public.service_packages
  ADD CONSTRAINT service_packages_price_range CHECK (price BETWEEN 1000 AND 100000000),
  ADD CONSTRAINT service_packages_delivery_days_range CHECK (delivery_days BETWEEN 1 AND 365),
  ADD CONSTRAINT service_packages_revisions_range CHECK (revisions IS NULL OR revisions BETWEEN 0 AND 99);

-- 3) 쓰기는 서버만
DROP POLICY IF EXISTS expert_manage_packages ON public.service_packages;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.service_packages FROM anon, authenticated;

-- 4) 패키지 목록을 한 번에 바꾸는 함수 (서버 전용)
-- p_packages: [{"name": "...", "price": 50000, "deliveryDays": 5, "revisions": 1, "features": ["..."]}, ...]
--   - 목록에 없는 이름의 패키지는 지운다. 주문이 가리키는 패키지면 외래 키 오류(23503)로 전체가 되돌려진다.
--   - 같은 이름은 고쳐 쓰고, 새 이름은 넣는다. 순서(sort_order)는 목록의 순서다.
--   - 패키지가 하나라도 있으면 services.price 를 가장 싼 패키지 가격으로 맞춘다.
-- 값의 검증은 앱(parsePackages)이 먼저 하고, 범위는 위의 CHECK 가 한 번 더 막는다.
CREATE OR REPLACE FUNCTION public.replace_service_packages(p_service_id uuid, p_packages jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_names text[];
BEGIN
  IF p_packages IS NULL OR jsonb_typeof(p_packages) <> 'array' THEN
    RAISE EXCEPTION 'p_packages must be a json array' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(array_agg(x ->> 'name'), '{}') INTO v_names
    FROM jsonb_array_elements(p_packages) AS x;

  DELETE FROM public.service_packages sp
   WHERE sp.service_id = p_service_id
     AND NOT (sp.name = ANY (v_names));

  INSERT INTO public.service_packages (service_id, name, price, delivery_days, revisions, features, sort_order)
  SELECT p_service_id,
         t.x ->> 'name',
         (t.x ->> 'price')::integer,
         (t.x ->> 'deliveryDays')::integer,
         (t.x ->> 'revisions')::integer,
         coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(t.x -> 'features', '[]'::jsonb))), '{}'),
         (t.ord - 1)::integer
    FROM jsonb_array_elements(p_packages) WITH ORDINALITY AS t(x, ord)
  ON CONFLICT (service_id, name) DO UPDATE
    SET price = EXCLUDED.price,
        delivery_days = EXCLUDED.delivery_days,
        revisions = EXCLUDED.revisions,
        features = EXCLUDED.features,
        sort_order = EXCLUDED.sort_order;

  IF jsonb_array_length(p_packages) > 0 THEN
    UPDATE public.services s
       SET price = (SELECT min(sp.price) FROM public.service_packages sp WHERE sp.service_id = p_service_id),
           updated_at = now()
     WHERE s.id = p_service_id;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.replace_service_packages(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_service_packages(uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- 되돌리기 (필요할 때만):
--   GRANT INSERT, UPDATE, DELETE ON TABLE public.service_packages TO authenticated;
--   CREATE POLICY expert_manage_packages ON public.service_packages
--     FOR ALL TO authenticated
--     USING (service_id IN (SELECT services.id FROM public.services WHERE services.expert_id = (SELECT auth.uid())));
--   ALTER TABLE public.service_packages
--     DROP CONSTRAINT service_packages_price_range,
--     DROP CONSTRAINT service_packages_delivery_days_range,
--     DROP CONSTRAINT service_packages_revisions_range;
--   DROP INDEX public.service_packages_service_name_uniq;
--   DROP FUNCTION public.replace_service_packages(uuid, jsonb);
-- ---------------------------------------------------------------------------
