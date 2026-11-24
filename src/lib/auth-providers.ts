// 로그인·회원가입 화면에 보여 줄 소셜 로그인 방식.
// 2026-11 점검 결과 세 가지 모두 실제로는 동작하지 않아 숨겨 두었다.
// - Google, 카카오: Supabase 에서 공급자가 꺼져 있어 400(provider is not enabled).
//   Supabase 대시보드 Authentication > Providers 에서 켠 뒤 true 로 바꾸면 버튼이 다시 보인다.
// - 네이버: Supabase 가 기본으로 지원하지 않는 공급자라 400(Provider naver could not be found).
//   켜려면 별도 연동을 먼저 만들어야 한다.
export const GOOGLE_LOGIN_ENABLED = false;
export const KAKAO_LOGIN_ENABLED = false;
export const NAVER_LOGIN_ENABLED = false;

export const ANY_SOCIAL_LOGIN_ENABLED = GOOGLE_LOGIN_ENABLED || KAKAO_LOGIN_ENABLED || NAVER_LOGIN_ENABLED;
