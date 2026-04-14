import type { Metadata } from "next";
import { getCategoryBySlugDB, getServicesByCategory, getCategories } from "@/lib/db-server";
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
  const category = await getCategoryBySlugDB(slug);

  const name = category?.name || "카테고리";
  const description = category?.description || "AI 영상 전문가 서비스를 찾아보세요.";
  return {
    title: name,
    description,
    openGraph: { title: `${name} | 뚝딱`, description },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { slug } = await params;
  const [category, allCategories] = await Promise.all([
    getCategoryBySlugDB(slug),
    getCategories(),
  ]);
  const initialServices = category ? await getServicesByCategory(category.id) : [];

  return (
    <CategoryPageClient
      slug={slug}
      category={category}
      initialServices={initialServices}
      allCategories={allCategories}
    />
  );
}
