import type { Service } from "@/types";

// 홈과 검색 화면에 놓는 "영상 종류" 바로가기.
// 개수는 검색과 같은 조건(제목·설명)으로 세고, 하나도 없는 종류는 화면에서 숨긴다.
export const VIDEO_TYPES = ["힐링", "운세", "소개", "브랜딩"] as const;

// 서비스가 낱말에 걸리는지 본다. 검색(searchServicesClient, countPublicServices)이 쓰는
// "제목 또는 설명에 포함" 조건과 같아야, 버튼에 적힌 개수와 눌렀을 때 결과 수가 맞는다.
export function matchesKeyword(service: Pick<Service, "title" | "description">, keyword: string): boolean {
  const needle = keyword.toLowerCase();
  return service.title.toLowerCase().includes(needle) || service.description.toLowerCase().includes(needle);
}
