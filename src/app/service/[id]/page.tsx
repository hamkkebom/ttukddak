import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicServiceById,
  getPublicExpertById,
  getPublicCategoryById,
  getPublicServicesByExpert,
  getPublicReviewsByService,
} from "@/lib/db-public";
import ServiceDetailPageClient from "./ServiceDetailPageClient";

type ServicePageParams = {
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
  params: Promise<ServicePageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getPublicServiceById(id);

  const title = service?.title || "서비스";
  const description = service?.description || "AI 영상 전문가 서비스를 확인해보세요.";
  return {
    title,
    description,
    openGraph: {
      title: `${title} | 뚝딱`,
      description,
      ...(service?.thumbnail ? { images: [{ url: service.thumbnail }] } : {}),
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<ServicePageParams>;
}) {
  const { id } = await params;

  const service = await getPublicServiceById(id);
  if (!service) notFound();

  const [expert, category, expertServices, { reviews, total: reviewTotal }] = await Promise.all([
    getPublicExpertById(service.expertId),
    getPublicCategoryById(service.categoryId),
    getPublicServicesByExpert(service.expertId),
    // 리뷰는 없어도 되는 내용이다. 읽지 못했다고 서비스 화면 전체를 오류로 만들지 않고 리뷰 구역만 뺀다.
    getPublicReviewsByService(service.id).catch((error) => {
      console.error("[service detail] 리뷰를 읽지 못했습니다:", error);
      return { reviews: [], total: 0 };
    }),
  ]);

  if (!expert || !category) notFound();

  return (
    <ServiceDetailPageClient
      // 다른 서비스로 넘어가면 고른 영상·패키지가 남지 않도록 새로 만든다.
      key={service.id}
      service={service}
      expert={expert}
      category={category}
      expertServices={expertServices}
      reviews={reviews}
      reviewTotal={reviewTotal}
    />
  );
}
