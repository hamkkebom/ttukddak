import { NextRequest, NextResponse } from "next/server";
import { getServiceByIdDB, updateService, deleteService } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = await getServiceByIdDB(id);

  if (!service) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Service not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: service,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify user is the expert who owns the service
  const { data: service } = await sb
    .from("services")
    .select("expert_id")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (service.expert_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const ok = await updateService(id, body);
  if (!ok) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify user is the expert who owns the service
  const { data: service } = await sb
    .from("services")
    .select("expert_id")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (service.expert_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ok = await deleteService(id);
  if (!ok) return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ success: true });
}
