import type { Metadata } from "next";
import { getPublicCategoryBySlug, getPublicServicesByCategory, getPublicCategories } from "@/lib/db-public";
import CategoryPageClient from "./CategoryPageClient";

type CategoryPageParams = {
  slug: string;
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
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

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
    getPublicCategoryBySlug(slug),
    getPublicCategories(),
  ]);
  const initialServices = category ? await getPublicServicesByCategory(category.id) : [];

  return (
    <CategoryPageClient
      slug={slug}
      category={category}
      initialServices={initialServices}
      allCategories={allCategories}
    />
  );
}
