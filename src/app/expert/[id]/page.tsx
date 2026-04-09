import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExpertByIdDB, getServicesByExpertDB, getCategoryByIdDB } from "@/lib/db-server";
import ExpertProfilePageClient from "./ExpertProfilePageClient";

type ExpertPageParams = {
  id: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<ExpertPageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const expert = await getExpertByIdDB(id);

  return {
    title: `${expert?.name || "전문가"} | 뚝딱`,
    description: expert?.introduction || "AI 영상 전문가를 만나보세요.",
  };
}

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<ExpertPageParams>;
}) {
  const { id } = await params;

  const expert = await getExpertByIdDB(id);
  if (!expert) notFound();

  const [services, category] = await Promise.all([
    getServicesByExpertDB(expert.id),
    getCategoryByIdDB(expert.categoryId),
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
