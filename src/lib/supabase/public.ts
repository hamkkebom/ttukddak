import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

// 로그인 세션을 쓰지 않는 공개 조회용 클라이언트.
// 쿠키를 읽지 않으므로, 이 클라이언트만 쓰는 페이지는 정적으로 캐시(ISR)할 수 있다.
// RLS 는 anon 역할로 적용되어 누구에게나 공개된 데이터만 읽힌다.
// 세션 같은 상태를 갖지 않으므로 하나를 만들어 계속 쓴다.
export function createPublicSupabaseClient(): SupabaseClient {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
  return client;
}
