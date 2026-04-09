import { NextRequest, NextResponse } from "next/server";
import { getConversations, createConversation } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const data = await getConversations(userId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { participant2 } = await req.json();

  // Force one participant to authenticated user
  const id = await createConversation(user.id, participant2);
  if (!id) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ id }, { status: 201 });
}
