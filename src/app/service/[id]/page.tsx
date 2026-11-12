import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicServiceById, getPublicExpertById, getPublicCategoryById, getPublicServicesByExpert } from "@/lib/db-public";
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

  const [expert, category, expertServices] = await Promise.all([
    getPublicExpertById(service.expertId),
    getPublicCategoryById(service.categoryId),
    getPublicServicesByExpert(service.expertId),
  ]);

  if (!expert || !category) notFound();

  return (
    <ServiceDetailPageClient
      service={service}
      expert={expert}
      category={category}
      expertServices={expertServices}
    />
  );
}
