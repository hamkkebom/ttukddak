import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/db-server";

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json({
    success: true,
    data: categories,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = await createCategory(body);
    if (!id) return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    const ok = await updateCategory(id, updates);
    if (!ok) return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    const ok = await deleteCategory(id);
    if (!ok) return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
}
