import { NextRequest, NextResponse } from "next/server";
import { getConversations, createConversation } from "@/lib/db-server";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const data = await getConversations(userId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { participant1, participant2 } = await req.json();
  const id = await createConversation(participant1, participant2);
  if (!id) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ id }, { status: 201 });
}
