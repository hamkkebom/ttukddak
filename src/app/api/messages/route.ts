import { NextRequest, NextResponse } from "next/server";
import { getMessages, sendMessage } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const conversationId = new URL(req.url).searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  const data = await getMessages(conversationId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, content } = await req.json();

  // Force senderId from authenticated user
  const msg = await sendMessage(conversationId, user.id, content);
  if (!msg) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}
