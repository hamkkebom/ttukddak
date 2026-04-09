import { NextRequest, NextResponse } from "next/server";
import { getServices, getServicesByCategory, searchServicesDB, createService } from "@/lib/db-server";

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
  const body = await req.json();
  const id = await createService(body);
  if (!id) return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  return NextResponse.json({ success: true, id }, { status: 201 });
}
