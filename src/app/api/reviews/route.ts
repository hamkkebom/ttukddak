import { NextResponse } from "next/server";
import { getServiceById } from "@/data/services";
import { Review } from "@/types";

const reviewContents = [
  "Excellent communication and fast delivery.",
  "Great quality work, exceeded expectations.",
  "Very professional and easy to work with.",
  "Quick turnaround and high-quality output.",
  "Would definitely order again.",
  "Clear updates throughout the project.",
  "Fantastic attention to detail.",
  "The final result matched the brief perfectly.",
];

const reviewerNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Avery",
  "Cameron",
];

function buildMockReviews(serviceId: string, count: number): Review[] {
  return Array.from({ length: count }, (_, index) => {
    const content = reviewContents[index % reviewContents.length];
    const userName = reviewerNames[index % reviewerNames.length];
    const rating = 4 + ((index + 1) % 2);
    const createdAt = new Date(
      Date.now() - (index + 1) * 24 * 60 * 60 * 1000
    ).toISOString();

    return {
      id: `review-${serviceId}-${index + 1}`,
      serviceId,
      userId: `user-${index + 1}`,
      userName,
      rating,
      content,
      createdAt,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: "serviceId is required",
      },
      { status: 400 }
    );
  }

  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: "Service not found",
      },
      { status: 404 }
    );
  }

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const total = Math.min(service.reviewCount || 0, 24);
  const allReviews = buildMockReviews(serviceId, total);

  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = allReviews.slice(start, end);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Mock review submitted", payload);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Invalid JSON body",
      },
      { status: 400 }
    );
  }
}
