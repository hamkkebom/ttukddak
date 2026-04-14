import { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 검색",
  description: "AI 영상 제작 전문가와 서비스를 검색해보세요. 카테고리, 가격, 평점으로 필터링하세요.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
