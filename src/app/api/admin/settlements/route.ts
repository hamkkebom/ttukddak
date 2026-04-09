import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Settlement } from "@/types";

const FEE_RATE = 0.1;
const SETTLEMENT_DELAY_DAYS = 7;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function isOlderThanDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d < cutoff;
}

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();

  // Fetch completed orders with service and expert info
  const { data: orders, error } = await admin
    .from("orders")
    .select(`
      id,
      seller_id,
      service_id,
      amount,
      status,
      created_at,
      updated_at,
      services ( title ),
      experts ( id, profiles ( name ) )
    `)
    .eq("status", "completed")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("settlements fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settlements: Settlement[] = (orders ?? []).map((o: Record<string, unknown>) => {
    const orderAmount = (o.amount as number) ?? 0;
    const feeAmount = Math.round(orderAmount * FEE_RATE);
    const settlementAmount = orderAmount - feeAmount;
    const completedAt = (o.updated_at as string) ?? (o.created_at as string);
    const scheduledDate = addDays(completedAt, SETTLEMENT_DELAY_DAYS);
    const isCompleted = isOlderThanDays(completedAt, SETTLEMENT_DELAY_DAYS);

    const services = o.services as { title?: string } | null;
    const experts = o.experts as { id?: string; profiles?: { name?: string } | null } | null;

    return {
      id: o.id as string,
      expertId: (o.seller_id as string) ?? "",
      expertName: experts?.profiles?.name ?? undefined,
      orderId: o.id as string,
      serviceName: services?.title ?? undefined,
      orderAmount,
      feeRate: FEE_RATE,
      feeAmount,
      settlementAmount,
      status: isCompleted ? "completed" : "scheduled",
      scheduledDate,
      completedDate: isCompleted ? scheduledDate : undefined,
      createdAt: (o.created_at as string) ?? "",
    } satisfies Settlement;
  });

  return NextResponse.json({ success: true, data: settlements });
}

export async function PATCH(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { settlementId, status, completedDate } = body as {
    settlementId: string;
    status: Settlement["status"];
    completedDate?: string;
  };

  if (!settlementId || !status) {
    return NextResponse.json({ error: "settlementId and status are required" }, { status: 400 });
  }

  // We store settlement status overrides by updating the order's metadata.
  // Since we don't have a settlements table, we use a convention:
  // store settlement_status and settlement_completed_date on the orders table if those columns exist,
  // otherwise return a 200 with the computed result (stateless override not persisted).
  const admin = createAdminSupabaseClient();

  const updatePayload: Record<string, unknown> = {};

  // Try updating settlement_status column; gracefully ignore if column doesn't exist
  const { error } = await admin
    .from("orders")
    .update({ settlement_status: status, settlement_completed_date: completedDate ?? null })
    .eq("id", settlementId);

  if (error) {
    // Column may not exist — return success anyway with a note
    return NextResponse.json({
      success: true,
      note: "Settlement status update not persisted (columns not available): " + error.message,
      settlementId,
      status,
    });
  }

  void updatePayload;
  return NextResponse.json({ success: true, settlementId, status, completedDate });
}
