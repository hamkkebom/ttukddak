import "server-only";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ttukddak.kr";
const SITE_NAME = "뚝딱";

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Pretendard,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#1a1a1a;">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
    <tr><td style="padding:24px 32px;background:linear-gradient(135deg,#f97316,#ea580c);">
      <a href="${SITE_URL}" style="font-size:20px;font-weight:bold;color:#fff;text-decoration:none;">${SITE_NAME}</a>
    </td></tr>
    <tr><td style="padding:32px;">${body}</td></tr>
    <tr><td style="padding:16px 32px;background:#fafafa;font-size:12px;color:#888;border-top:1px solid #eee;">
      <p style="margin:0">본 메일은 ${SITE_NAME} 서비스 이용 관련 알림입니다.</p>
      <p style="margin:4px 0 0"><a href="${SITE_URL}/settings" style="color:#888;">알림 설정 변경</a> · <a href="${SITE_URL}" style="color:#888;">${SITE_URL}</a></p>
    </td></tr>
  </table>
</body></html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${label}</a>`;
}

// === 주문 알림 (전문가에게) ===
export function newOrderEmail(opts: { expertName: string; serviceName: string; orderId: string; amount: number; buyerName: string }): { subject: string; html: string } {
  const url = `${SITE_URL}/dashboard/orders`;
  const html = shell("새 주문 도착", `
    <h2 style="margin:0 0 16px;font-size:20px;">새 주문이 도착했습니다 🎉</h2>
    <p style="margin:0 0 8px;color:#525252;">${opts.expertName}님 안녕하세요. 새로운 주문이 들어왔어요.</p>
    <table style="width:100%;margin:24px 0;border-collapse:collapse;">
      <tr><td style="padding:12px;background:#f9f9f9;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#888;">서비스</p>
        <p style="margin:0;font-weight:600;">${opts.serviceName}</p>
        <p style="margin:8px 0 4px;font-size:12px;color:#888;">주문자</p>
        <p style="margin:0;">${opts.buyerName}</p>
        <p style="margin:8px 0 4px;font-size:12px;color:#888;">결제 금액</p>
        <p style="margin:0;font-weight:600;color:#ea580c;">${opts.amount.toLocaleString()}원</p>
      </td></tr>
    </table>
    <p>${btn(url, "주문 확인하기")}</p>
  `);
  return { subject: `[${SITE_NAME}] 새 주문이 도착했습니다 - ${opts.serviceName}`, html };
}

// === 납품 알림 (구매자에게) ===
export function deliveryEmail(opts: { buyerName: string; serviceName: string; orderId: string; expertName: string }): { subject: string; html: string } {
  const url = `${SITE_URL}/order/${opts.orderId}/tracking`;
  const html = shell("작업 납품 완료", `
    <h2 style="margin:0 0 16px;font-size:20px;">작업이 납품되었습니다 📦</h2>
    <p style="margin:0 0 8px;color:#525252;">${opts.buyerName}님 안녕하세요.</p>
    <p style="margin:0 0 16px;color:#525252;">${opts.expertName} 전문가가 ${opts.serviceName} 작업을 완료했습니다.</p>
    <p style="margin:16px 0;padding:12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:13px;color:#92400e;">
      ⏰ 7일 이내 검수 후 구매확정해주세요. 7일 후 자동 구매확정됩니다.
    </p>
    <p>${btn(url, "납품물 확인하기")}</p>
  `);
  return { subject: `[${SITE_NAME}] ${opts.serviceName} 납품 완료`, html };
}

// === 리뷰 요청 알림 (구매확정 후) ===
export function reviewRequestEmail(opts: { buyerName: string; serviceName: string; orderId: string }): { subject: string; html: string } {
  const url = `${SITE_URL}/order/${opts.orderId}/review`;
  const html = shell("리뷰를 남겨주세요", `
    <h2 style="margin:0 0 16px;font-size:20px;">소중한 리뷰를 남겨주세요 ⭐</h2>
    <p style="margin:0 0 8px;color:#525252;">${opts.buyerName}님 안녕하세요.</p>
    <p style="margin:0 0 16px;color:#525252;"><strong>${opts.serviceName}</strong> 거래는 만족스러우셨나요?</p>
    <p style="margin:0 0 16px;color:#525252;">남겨주신 리뷰는 다른 분들의 선택에 큰 도움이 됩니다.</p>
    <p>${btn(url, "리뷰 작성하기")}</p>
  `);
  return { subject: `[${SITE_NAME}] ${opts.serviceName} 리뷰를 남겨주세요`, html };
}

// === 정산 알림 (전문가) ===
export function settlementEmail(opts: { expertName: string; amount: number; period: string }): { subject: string; html: string } {
  const url = `${SITE_URL}/dashboard/earnings`;
  const html = shell("정산 완료", `
    <h2 style="margin:0 0 16px;font-size:20px;">정산이 완료되었습니다 💰</h2>
    <p style="margin:0 0 8px;color:#525252;">${opts.expertName}님 안녕하세요.</p>
    <p style="margin:0 0 16px;color:#525252;">${opts.period} 정산이 완료되어 등록 계좌로 입금됩니다.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:16px;background:#f9f9f9;border-radius:8px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#888;">정산 금액</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#ea580c;">${opts.amount.toLocaleString()}원</p>
      </td></tr>
    </table>
    <p>${btn(url, "정산 내역 확인")}</p>
  `);
  return { subject: `[${SITE_NAME}] ${opts.amount.toLocaleString()}원 정산 완료`, html };
}

// === 회원가입 환영 ===
export function welcomeEmail(opts: { name: string }): { subject: string; html: string } {
  const html = shell("환영합니다", `
    <h2 style="margin:0 0 16px;font-size:20px;">${opts.name}님, 환영합니다 🎉</h2>
    <p style="margin:0 0 16px;color:#525252;">${SITE_NAME}에 가입해주셔서 감사합니다.</p>
    <p style="margin:0 0 16px;color:#525252;">국내 최고의 AI 영상 전문가들이 ${opts.name}님의 프로젝트를 기다리고 있어요.</p>
    <p>${btn(SITE_URL, "둘러보기")} ${btn(SITE_URL + "/expert/register", "전문가 등록")}</p>
  `);
  return { subject: `[${SITE_NAME}] ${opts.name}님, 환영합니다!`, html };
}
