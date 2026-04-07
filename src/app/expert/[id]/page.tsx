import type { Metadata } from "next";
import { getExpertById } from "@/data/experts";
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
  const expert = getExpertById(id);

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
  return <ExpertProfilePageClient id={id} />;
}
