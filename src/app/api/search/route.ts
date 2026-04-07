import { NextResponse } from "next/server";
import { searchServices } from "@/data/services";
import { experts } from "@/data/experts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({
      success: true,
      data: {
        services: [],
        experts: [],
      },
    });
  }

  const lowerQuery = query.toLowerCase();
  const serviceResults = searchServices(query);
  const expertResults = experts.filter(
    (expert) =>
      expert.name.toLowerCase().includes(lowerQuery) ||
      expert.title.toLowerCase().includes(lowerQuery) ||
      expert.skills.some((skill) => skill.toLowerCase().includes(lowerQuery)) ||
      expert.tools.some((tool) => tool.toLowerCase().includes(lowerQuery))
  );

  return NextResponse.json({
    success: true,
    data: {
      services: serviceResults,
      experts: expertResults,
    },
  });
}
