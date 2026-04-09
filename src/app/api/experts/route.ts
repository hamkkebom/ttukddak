import { NextResponse } from "next/server";
import { getExperts, getExpertsByCategory } from "@/lib/db-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  const result = category
    ? await getExpertsByCategory(category)
    : await getExperts();

  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = result.slice(start, end);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    meta: {
      total: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit),
    },
  });
}
