import type { Metadata } from "next";
import { getCategoryBySlug } from "@/data/categories";
import CategoryPageClient from "./CategoryPageClient";

type CategoryPageParams = {
  slug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  return {
    title: `${category?.name || "카테고리"} | 뚝딱`,
    description: category?.description || "AI 영상 전문가 서비스를 찾아보세요.",
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { slug } = await params;
  return <CategoryPageClient slug={slug} />;
}
