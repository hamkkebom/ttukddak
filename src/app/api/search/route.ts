import { NextResponse } from "next/server";
import { searchServicesDB, searchExpertsDB } from "@/lib/db-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const sort = (searchParams.get("sort") || "popular") as
    | "popular"
    | "rating"
    | "price_low"
    | "price_high"
    | "relevance";
  const category = searchParams.get("category") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const offset = (page - 1) * limit;

  if (!query) {
    return NextResponse.json({
      success: true,
      data: {
        services: [],
        experts: [],
        total: 0,
        page: 1,
        limit,
      },
    });
  }

  const [{ services: serviceResults, total }, expertResults] = await Promise.all([
    searchServicesDB(query, { sort, categoryId: category, limit, offset }),
    searchExpertsDB(query),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      services: serviceResults,
      experts: expertResults,
      total,
      page,
      limit,
    },
  });
}
