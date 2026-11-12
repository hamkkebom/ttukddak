-- v11: Realtime publication 명시적 활성화
-- 이미 등록된 테이블에서도 fresh DB 리허설이 멈추지 않도록 idempotent 처리한다.

DO $$
DECLARE
  rel text;
  rels text[] := ARRAY['messages', 'conversations', 'notifications', 'orders', 'deal_offers'];
BEGIN
  FOREACH rel IN ARRAY rels LOOP
    IF to_regclass(format('public.%I', rel)) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = rel
      )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', rel);
    END IF;
  END LOOP;
END $$;
