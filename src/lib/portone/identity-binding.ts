// 본인인증 결과를 "인증을 시작한 회원"에게 묶는다.
//
// 인증을 시작할 때 customData 에 회원 id 를 넣어 두고, 서버가 결제사에서 결과를 조회했을 때
// 그 값이 지금 로그인한 회원과 같은지 확인한다. customData 는 인증을 시작한 브라우저만 정할 수 있고
// 결제사가 결과와 함께 그대로 돌려준다.
//
// 이 확인이 없으면 남의 인증 번호(identityVerificationId)를 알게 된 사람이
// 그 인증 결과(이름·생년월일·연계정보)를 자기 계정에 붙일 수 있다.

export function buildIdentityCustomData(userId: string): string {
  return JSON.stringify({ userId });
}

export function isVerificationForUser(customData: unknown, userId: string): boolean {
  if (typeof customData !== "string" || !userId) return false;
  try {
    const parsed: unknown = JSON.parse(customData);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { userId?: unknown }).userId === userId
    );
  } catch {
    return false;
  }
}

// 인증 번호는 이 앱이 만든 형식(iv-<uuid>)만 받는다. 주소에 그대로 실리는 값이라 형식을 좁혀 둔다.
const VERIFICATION_ID = /^iv-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidVerificationId(value: unknown): value is string {
  return typeof value === "string" && VERIFICATION_ID.test(value);
}
