// PortOne V2 본인인증 (휴대폰 본인확인) 클라이언트 헬퍼
// 사용하려면 PortOne 콘솔에서 본인인증 채널을 추가하고
// NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY 환경변수를 설정해야 합니다.
//
// 비용: 건당 약 50원 (KCB/나이스 본인인증 PG 계약 필요)

import PortOne from "@portone/browser-sdk/v2";
import { buildIdentityCustomData } from "@/lib/portone/identity-binding";

export interface VerificationResult {
  ok: boolean;
  identityVerificationId?: string;
  // 인증 성공 시 서버에서 PortOne API로 조회 가능한 결과:
  // - name (실명)
  // - phoneNumber
  // - birthDate
  // - gender
  // - ci (연계정보)
  // - di (중복가입확인정보)
  error?: string;
}

// userId: 지금 로그인한 회원의 id. 인증 결과를 이 회원에게 묶는 데 쓴다 (identity-binding 참고).
export async function requestIdentityVerification(userId: string): Promise<VerificationResult> {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY;

  if (!storeId || !channelKey) {
    return { ok: false, error: "본인인증이 아직 활성화되지 않았습니다. 운영자에게 문의해주세요." };
  }

  const identityVerificationId = `iv-${crypto.randomUUID()}`;

  try {
    const response = await PortOne.requestIdentityVerification({
      storeId,
      channelKey,
      identityVerificationId,
      // 서버가 "누가 시작한 인증인지" 확인할 수 있게 회원 id 를 함께 보낸다.
      customData: buildIdentityCustomData(userId),
      // 선택 옵션:
      // operator: "KT" | "SKT" | "LGU" | "KTM" | "SKTM" | "LGUM",
      // method: "SMS" | "PASS",
    });

    if (response?.code !== undefined) {
      return { ok: false, error: response.message || "본인인증에 실패했습니다." };
    }

    return { ok: true, identityVerificationId };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
