// 운영 화면에서 실제 결제를 받는지. 결제를 열기 전까지 안내 페이지는 결제를 지금 할 수 있는 일처럼 적지 않는다.
// NEXT_PUBLIC_ 값은 빌드할 때 코드에 박힌다. 호스팅 설정에서 값을 바꿔도 다시 배포해야 반영된다.
// 정확히 "live" 일 때만 열린 것으로 본다. 값이 없거나 다른 값이면 (예: "test") 닫힌 것이다.
export const PAYMENT_OPEN = process.env.NEXT_PUBLIC_PAYMENT_MODE === "live";

// 결제를 열기 전에 안내 페이지에 그대로 쓰는 문장.
export const PAYMENT_CLOSED_NOTICE =
  "결제는 아직 열지 않았습니다. 지금은 서비스 둘러보기, 전문가에게 문의하기, 견적 요청까지 이용할 수 있습니다.";
