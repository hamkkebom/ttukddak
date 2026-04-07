import type { Metadata } from "next";
import { getServiceById } from "@/data/services";
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
  const service = getServiceById(id);

  return {
    title: `${service?.title || "서비스"} | 뚝딱`,
    description: service?.description || "AI 영상 전문가 서비스를 확인해보세요.",
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<ServicePageParams>;
}) {
  const { id } = await params;
  return <ServiceDetailPageClient id={id} />;
}
