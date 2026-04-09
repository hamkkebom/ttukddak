import { NextRequest, NextResponse } from "next/server";
import { getReviews, createReview, deleteReview } from "@/lib/db-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  const allReviews = await getReviews({ serviceId });
  const total = allReviews.length;
  const start = (page - 1) * limit;
  const paginatedData = allReviews.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ok = await createReview(body);
    if (!ok) return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    const ok = await deleteReview(id);
    if (!ok) return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}
