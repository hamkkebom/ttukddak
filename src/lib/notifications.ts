// Server-side helper to create notifications
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
    message: params.message || "",
    link: params.link || null,
    is_read: false,
  });

  if (error) console.error("Failed to create notification:", error);
}
