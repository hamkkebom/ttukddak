import { NextRequest, NextResponse } from "next/server";
import { getExpertByIdDB } from "@/lib/db-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const expert = await getExpertByIdDB(id);

  if (!expert) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Expert not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: expert,
  });
}
