import { NextResponse } from "next/server";
import { services, getServicesByCategory, searchServices } from "@/data/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  let result = services;
  if (category) result = getServicesByCategory(category);
  if (query) result = searchServices(query);

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
