import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceByIdDB, getExpertByIdDB, getCategoryByIdDB, getServicesByExpertDB } from "@/lib/db-server";
import ServiceDetailPageClient from "./ServiceDetailPageClient";

type ServicePageParams = {
  id: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<ServicePageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getServiceByIdDB(id);

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

  const service = await getServiceByIdDB(id);
  if (!service) notFound();

  const [expert, category, expertServices] = await Promise.all([
    getExpertByIdDB(service.expertId),
    getCategoryByIdDB(service.categoryId),
    getServicesByExpertDB(service.expertId),
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
