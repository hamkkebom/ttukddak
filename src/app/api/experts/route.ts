import { NextResponse } from "next/server";
import { getExperts, getExpertsByCategory } from "@/lib/db-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const offset = (page - 1) * limit;

  const { experts, total } = category
    ? await getExpertsByCategory(category, limit, offset)
    : await getExperts(limit, offset);

  return NextResponse.json({
    success: true,
    data: experts,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
