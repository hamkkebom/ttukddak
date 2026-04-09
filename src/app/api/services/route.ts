import { NextRequest, NextResponse } from "next/server";
import { getServices, getServicesByCategory, searchServicesDB, createService } from "@/lib/db-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  let result;
  if (category) {
    result = await getServicesByCategory(category);
  } else if (query) {
    result = await searchServicesDB(query);
  } else {
    result = await getServices();
  }

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = await createService(body);
  if (!id) return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  return NextResponse.json({ success: true, id }, { status: 201 });
}
