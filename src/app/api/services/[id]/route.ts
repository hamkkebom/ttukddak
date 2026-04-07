import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/data/services";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = getServiceById(id);

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
