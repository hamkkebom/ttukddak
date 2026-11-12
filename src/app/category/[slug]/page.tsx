import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  // 없는 카테고리는 안내 화면(200)이 아니라 404 로 응답한다. 임의의 주소가 캐시에 쌓이는 것도 막는다.
  if (!category) notFound();
  const initialServices = await getPublicServicesByCategory(category.id);

  return (
    <CategoryPageClient
      slug={slug}
      category={category}
      initialServices={initialServices}
      allCategories={allCategories}
    />
  );
}
