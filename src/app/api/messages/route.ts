import { NextRequest, NextResponse } from "next/server";
import { getMessages, sendMessage } from "@/lib/db-server";

export async function GET(req: NextRequest) {
  const conversationId = new URL(req.url).searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  const data = await getMessages(conversationId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { conversationId, senderId, content } = await req.json();
  const msg = await sendMessage(conversationId, senderId, content);
  if (!msg) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}
