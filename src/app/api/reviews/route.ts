import { NextRequest, NextResponse } from "next/server";
import { getReviews, createReview, deleteReview } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  const offset = (page - 1) * limit;
  const { data: paginatedData, total } = await getReviews({ serviceId, limit, offset });

  return NextResponse.json({
    success: true,
    data: paginatedData,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const sb = await createServerSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Force reviewerId from authenticated user
    body.reviewerId = user.id;

    const ok = await createReview(body);
    if (!ok) return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = await createServerSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    // Verify user is the reviewer
    const { data: review } = await sb
      .from("reviews")
      .select("reviewer_id")
      .eq("id", id)
      .single();

    if (!review) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (review.reviewer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ok = await deleteReview(id);
    if (!ok) return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}
