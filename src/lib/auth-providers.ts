// 로그인·회원가입 화면에 보여 줄 소셜 로그인 방식.
// Supabase 에서 Google 공급자가 꺼져 있어 버튼을 누르면 400(provider is not enabled)이 난다.
// Supabase 대시보드 Authentication > Providers 에서 Google 을 켠 뒤 true 로 바꾸면 버튼이 다시 보인다.
export const GOOGLE_LOGIN_ENABLED = false;
