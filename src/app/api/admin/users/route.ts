import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { getProfiles } from "@/lib/db-server";

// 관리자 화면의 회원 목록.
// 이메일이 들어 있어 브라우저가 회원 표를 직접 읽지 않고, 관리자인지 확인한 뒤 서버에서 읽어 준다.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const profiles = await getProfiles();
  return NextResponse.json(profiles, { headers: { "Cache-Control": "no-store" } });
}
