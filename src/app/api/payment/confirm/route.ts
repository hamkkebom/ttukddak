import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db-server";

export async function POST(request: Request) {
  try {
    const { paymentId, orderId } = await request.json();

    // PortOne V2 결제 확인 API
    const response = await fetch(
      `https://api.portone.io/payments/${paymentId}`,
      {
        headers: {
          Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "결제 정보를 확인할 수 없습니다" },
        { status: 400 }
      );
    }

    const payment = await response.json();

    // 결제 상태 확인
    if (payment.status !== "PAID") {
      return NextResponse.json(
        { success: false, error: "결제가 완료되지 않았습니다" },
        { status: 400 }
      );
    }

    // DB에 주문 상태 업데이트: pending → paid
    const updated = await updateOrderStatus(orderId, "paid");
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "주문 상태 업데이트에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        amount: payment.amount?.total,
        status: payment.status,
        orderId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "결제 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
