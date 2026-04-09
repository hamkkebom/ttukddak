import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE() {
  try {
    const sb = await createServerSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to delete user data and auth account
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const adminSb = createAdminSupabaseClient();

    // Delete user's data (cascade should handle most, but be explicit)
    await adminSb.from("messages").delete().eq("sender_id", user.id);
    await adminSb.from("reviews").delete().eq("reviewer_id", user.id);
    await adminSb.from("favorites").delete().eq("user_id", user.id);
    await adminSb.from("notifications").delete().eq("user_id", user.id);

    // Anonymize profile instead of deleting (keep order history intact)
    await adminSb.from("profiles").update({
      name: "탈퇴한 회원",
      email: "",
      avatar_url: null,
      phone: null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    // Delete auth user
    const { error } = await adminSb.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("Failed to delete auth user:", error);
      return NextResponse.json({ error: "계정 삭제에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "계정이 삭제되었습니다" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
