import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicExpertById,
  getPublicServicesByExpert,
  getPublicCategoryById,
  getPublicReviewsByExpert,
} from "@/lib/db-public";
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

  const [services, category, { reviews, total: reviewTotal }] = await Promise.all([
    getPublicServicesByExpert(expert.id),
    getPublicCategoryById(expert.categoryId),
    // 리뷰는 없어도 되는 내용이다. 읽지 못했다고 화면 전체를 오류로 만들지 않고 리뷰 구역만 뺀다.
    getPublicReviewsByExpert(expert.id).catch((error) => {
      console.error("[expert profile] review query failed:", error);
      return { reviews: [], total: 0 };
    }),
  ]);

  if (!category) notFound();

  return (
    <ExpertProfilePageClient
      // 다른 전문가로 넘어가면 열려 있던 문의 창 상태가 남지 않도록 새로 만든다.
      key={expert.id}
      expert={expert}
      services={services}
      category={category}
      reviews={reviews}
      reviewTotal={reviewTotal}
    />
  );
}
