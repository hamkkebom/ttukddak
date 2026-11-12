/**
 * 로그인 후 이동 경로처럼 사용자 입력으로 들어오는 리다이렉트 대상을 검증한다.
 *
 * 같은 사이트 안의 절대 경로("/..." 형태)만 허용하고, 그 외에는 fallback 을 돌려준다.
 * 외부 의존성이 없는 순수 모듈이다.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;

  // "/" 로 시작해야 한다. ("https://...", "evil.com", "@evil.com", ".evil.com" 차단)
  if (!raw.startsWith("/")) return fallback;

  // "//host" 와 "/\host" 는 브라우저가 다른 출처로 해석한다.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;

  // 역슬래시와 제어 문자는 허용하지 않는다.
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;

  return raw;
}
