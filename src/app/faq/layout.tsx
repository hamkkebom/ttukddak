import { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문 | 뚝딱",
  description: "뚝딱 이용에 관한 자주 묻는 질문과 답변을 확인하세요.",
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
