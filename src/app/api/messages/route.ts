import { NextRequest, NextResponse } from "next/server";
import { getMessages, sendMessage } from "@/lib/db-server";
import type { MessageType } from "@/types";
import { assertConversationParticipant, jsonError, requireUser } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const conversationId = new URL(req.url).searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const participant = await assertConversationParticipant(conversationId, auth.user.id);
  if (!participant.ok) return participant.response;

  const data = await getMessages(conversationId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { conversationId, content, messageType, fileUrl } = await req.json().catch(() => ({}));
  if (!conversationId || !content?.trim()) {
    return jsonError("conversationId와 content가 필요합니다");
  }

  const participant = await assertConversationParticipant(conversationId, auth.user.id);
  if (!participant.ok) return participant.response;

  // Force senderId from authenticated user
  const msg = await sendMessage(conversationId, auth.user.id, content.trim(), {
    messageType: (messageType as MessageType | undefined) || "text",
    fileUrl: fileUrl || null,
  });
  if (!msg) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}
