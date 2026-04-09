import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - fetch deliveries for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("order_deliveries")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST - submit a delivery (expert only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify user is the expert for this order
  const { data: order } = await sb
    .from("orders")
    .select("expert_id, status")
    .eq("id", id)
    .single();

  if (!order || order.expert_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { message, files } = body;

  const { data, error } = await sb
    .from("order_deliveries")
    .insert({
      order_id: id,
      expert_id: user.id,
      message: message || "",
      files: files || [],
      version: 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update order status to delivered
  await sb
    .from("orders")
    .update({ status: "delivered", updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json(data, { status: 201 });
}
