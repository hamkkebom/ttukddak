import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") return { error: "Forbidden", status: 403, user: null };

  return { error: null, status: 200, user };
}

export async function GET() {
  const auth = await checkAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("events fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await checkAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { title, description, type, startDate, endDate, isActive, imageUrl } = body as {
    title: string;
    description?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    imageUrl?: string;
  };

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("events")
    .insert({
      title,
      description: description ?? null,
      type: type ?? "general",
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      is_active: isActive ?? true,
      image_url: imageUrl ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("event create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { id, ...updates } = body as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("event update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("events").delete().eq("id", id);

  if (error) {
    console.error("event delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
