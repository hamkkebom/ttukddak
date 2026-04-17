// Server-side helper to create notifications + send emails
import { sendEmail } from "@/lib/email/client";
import * as Templates from "@/lib/email/templates";

export async function createNotification(params: {
  userId: string;
  type: "order" | "message" | "review" | "payment" | "system";
  title: string;
  message?: string;
  link?: string;
}) {
  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
  const adminSb = createAdminSupabaseClient();

  const { error } = await adminSb.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    description: params.message || "",
    link: params.link || null,
    is_read: false,
  });

  if (error) console.error("Failed to create notification:", error);
}

/**
 * Resolve email + name for a user, respecting their notification preference.
 * Returns null if email notifications are disabled.
 */
async function resolveRecipient(userId: string): Promise<{ email: string; name: string } | null> {
  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
  const sb = createAdminSupabaseClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("email, name")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.email) return null;

  // Optionally check user's notif preference (stored in user_metadata)
  const { data: { user } } = await sb.auth.admin.getUserById(userId);
  const notifSettings = user?.user_metadata?.notif_settings as Record<string, Record<string, boolean>> | undefined;
  // If user explicitly disabled all email channels for relevant categories, skip.
  // Default: send.
  if (notifSettings) {
    const allEmailDisabled = Object.values(notifSettings).every(
      (group) => group["이메일"] === false
    );
    if (allEmailDisabled) return null;
  }

  return { email: profile.email, name: profile.name || "고객" };
}

// === High-level helpers: notification + email together ===

export async function notifyNewOrder(params: {
  expertUserId: string;
  buyerName: string;
  serviceName: string;
  orderId: string;
  amount: number;
}) {
  await createNotification({
    userId: params.expertUserId,
    type: "order",
    title: "새 주문이 도착했습니다",
    message: `${params.serviceName} (${params.amount.toLocaleString()}원)`,
    link: `/dashboard/orders`,
  });

  const recipient = await resolveRecipient(params.expertUserId);
  if (recipient) {
    const tpl = Templates.newOrderEmail({
      expertName: recipient.name,
      serviceName: params.serviceName,
      orderId: params.orderId,
      amount: params.amount,
      buyerName: params.buyerName,
    });
    await sendEmail({ to: recipient.email, ...tpl });
  }
}

export async function notifyDelivery(params: {
  buyerUserId: string;
  expertName: string;
  serviceName: string;
  orderId: string;
}) {
  await createNotification({
    userId: params.buyerUserId,
    type: "order",
    title: "작업이 납품되었습니다",
    message: `${params.serviceName} 납품 완료. 검수 후 구매확정해주세요.`,
    link: `/order/${params.orderId}/tracking`,
  });

  const recipient = await resolveRecipient(params.buyerUserId);
  if (recipient) {
    const tpl = Templates.deliveryEmail({
      buyerName: recipient.name,
      serviceName: params.serviceName,
      orderId: params.orderId,
      expertName: params.expertName,
    });
    await sendEmail({ to: recipient.email, ...tpl });
  }
}

export async function notifyReviewRequest(params: {
  buyerUserId: string;
  serviceName: string;
  orderId: string;
}) {
  await createNotification({
    userId: params.buyerUserId,
    type: "review",
    title: "리뷰를 남겨주세요",
    message: `${params.serviceName} 거래 리뷰 부탁드려요.`,
    link: `/order/${params.orderId}/review`,
  });

  const recipient = await resolveRecipient(params.buyerUserId);
  if (recipient) {
    const tpl = Templates.reviewRequestEmail({
      buyerName: recipient.name,
      serviceName: params.serviceName,
      orderId: params.orderId,
    });
    await sendEmail({ to: recipient.email, ...tpl });
  }
}

export async function notifySettlement(params: {
  expertUserId: string;
  amount: number;
  period: string;
}) {
  await createNotification({
    userId: params.expertUserId,
    type: "payment",
    title: `${params.amount.toLocaleString()}원 정산 완료`,
    message: `${params.period} 정산이 등록 계좌로 입금됩니다.`,
    link: `/dashboard/earnings`,
  });

  const recipient = await resolveRecipient(params.expertUserId);
  if (recipient) {
    const tpl = Templates.settlementEmail({
      expertName: recipient.name,
      amount: params.amount,
      period: params.period,
    });
    await sendEmail({ to: recipient.email, ...tpl });
  }
}
