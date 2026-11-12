import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicExpertById, getPublicServicesByExpert, getPublicCategoryById } from "@/lib/db-public";
import ExpertProfilePageClient from "./ExpertProfilePageClient";

type ExpertPageParams = {
  id: string;
};

// 공개 데이터만 쓰는 페이지라 정적으로 만들어 두고 60초마다 다시 만든다 (ISR).
export const revalidate = 60;

// 빌드 때 미리 만들지 않고, 처음 요청될 때 만들어 캐시한다.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ExpertPageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const expert = await getPublicExpertById(id);

  const name = expert?.name || "전문가";
  const description = expert?.introduction || "AI 영상 전문가를 만나보세요.";
  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | 뚝딱`,
      description,
      ...(expert?.profileImage ? { images: [{ url: expert.profileImage }] } : {}),
    },
  };
}

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<ExpertPageParams>;
}) {
  const { id } = await params;

  const expert = await getPublicExpertById(id);
  if (!expert) notFound();

  const [services, category] = await Promise.all([
    getPublicServicesByExpert(expert.id),
    getPublicCategoryById(expert.categoryId),
  ]);

  if (!category) notFound();

  return (
    <ExpertProfilePageClient
      expert={expert}
      services={services}
      category={category}
    />
  );
}
