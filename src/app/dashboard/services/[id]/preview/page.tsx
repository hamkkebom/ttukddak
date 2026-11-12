import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceByIdDB, getExpertByIdDB, getCategoryByIdDB, getServicesByExpertDB } from "@/lib/db-server";
import ServiceDetailPageClient from "@/app/service/[id]/ServiceDetailPageClient";

// 전문가가 자기 서비스를 공개 전에 확인하는 화면 (관리자도 심사할 때 쓴다).
//
// 공개 상세(/service/[id])는 캐시되는 공개 데이터만 보여 주므로, 승인 전(초안·검수 중·반려)
// 서비스는 거기서 보이지 않는다. 이 경로는 로그인 세션 기준으로 읽어서 본인 서비스라면
// 상태와 관계없이 보여 준다. 남의 비공개 서비스는 RLS 로 읽히지 않아 404 가 된다.
export const metadata: Metadata = {
  title: "서비스 미리보기",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "임시저장",
  pending_review: "승인 대기",
  active: "공개 중",
  rejected: "반려",
  suspended: "정지",
  deleted: "삭제됨",
};

export default async function ServicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const status = service.status ?? "active";
  const isPublic = status === "active";

  return (
    <>
      <div
        role="status"
        className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
      >
        미리보기 화면입니다. 현재 상태: <strong>{STATUS_LABELS[status] ?? status}</strong>
        {!isPublic && " · 구매자에게는 아직 보이지 않습니다."}
      </div>
      <ServiceDetailPageClient
        service={service}
        expert={expert}
        category={category}
        expertServices={expertServices}
      />
    </>
  );
}
