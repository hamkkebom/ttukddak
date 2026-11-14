// 리뷰 작성자처럼 이름 전체를 드러내지 않아야 하는 자리에 쓰는 표시 이름.
// 첫 글자만 남기고 가린다 ("홍길동" → "홍**"). 이름이 없으면 "구매자".
//
// 이미 가린 값("홍**")을 다시 넣어도 결과가 같다. DB 에 가려서 저장된 값과
// 가리지 않은 값을 같은 함수로 다룰 수 있게 하기 위해서다.
export function maskName(name: string | null | undefined): string {
  const first = Array.from((name ?? "").trim())[0];
  return first ? `${first}**` : "구매자";
}
