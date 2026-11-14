import { NextRequest, NextResponse } from "next/server";
import { getServices, getServicesByCategory, searchServicesDB, createService } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { parsePackages } from "@/lib/service-packages";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  let services;
  let totalCount: number;

  if (category) {
    const data = await getServicesByCategory(category);
    services = data;
    totalCount = data.length;
  } else if (query) {
    const { services: found, total } = await searchServicesDB(query, { limit, offset: (page - 1) * limit });
    services = found;
    totalCount = total;
  } else {
    const data = await getServices();
    services = data;
    totalCount = data.length;
  }

  // For non-search paths, apply manual pagination
  const paginatedData = query ? services : services.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다" }, { status: 400 });
  }

  if (body.status && !["draft", "pending_review"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid service status" }, { status: 400 });
  }
  const status: "draft" | "pending_review" = body.status === "draft" ? "draft" : "pending_review";

  // 심사 신청이면 패키지가 하나 이상 있어야 한다. 임시 저장은 비어 있어도 된다.
  const parsed = parsePackages(body.packages ?? [], { requireOne: status === "pending_review" });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // 서비스는 전문가 행(experts)에 묶인다. 없으면 외래 키 오류(500) 대신 이유를 알려 준다.
  const admin = createAdminSupabaseClient();
  const { data: expert, error: expertError } = await admin
    .from("experts")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (expertError) {
    console.error("[POST /api/services] 전문가 조회 실패", expertError);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
  if (!expert) {
    return NextResponse.json({ error: "전문가로 등록된 회원만 서비스를 만들 수 있습니다" }, { status: 403 });
  }

  // 받은 값을 그대로 넘기지 않고 저장할 칸만 골라 만든다. 판매자는 로그인한 회원으로 정한다.
  const id = await createService({
    expertId: user.id,
    categoryId: typeof body.categoryId === "string" ? body.categoryId : "",
    title: typeof body.title === "string" ? body.title : "",
    description: typeof body.description === "string" ? body.description : "",
    // 가격은 요청에서 받지 않는다. 패키지가 있으면 가장 싼 패키지 가격이 되고, 없으면(임시 저장) 0 이다.
    price: 0,
    tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown): t is string => typeof t === "string") : [],
    images: Array.isArray(body.images) ? body.images.filter((u: unknown): u is string => typeof u === "string") : [],
    status,
    packages: parsed.packages,
  });
  if (!id) return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  return NextResponse.json({ success: true, id }, { status: 201 });
}
