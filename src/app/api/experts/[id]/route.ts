import { NextRequest, NextResponse } from "next/server";
import { getExpertById } from "@/data/experts";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const expert = getExpertById(id);

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
