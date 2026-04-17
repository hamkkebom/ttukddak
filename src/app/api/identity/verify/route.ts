import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 클라이언트에서 본인인증 완료 후 서버에서 PortOne API로 결과를 조회·검증합니다.
 * 본인인증 결과(이름/생년월일/CI 등)를 profiles 테이블에 저장합니다.
 */
export async function POST(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { identityVerificationId } = body;
  if (!identityVerificationId) {
    return NextResponse.json({ error: "identityVerificationId is required" }, { status: 400 });
  }

  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ error: "본인인증이 활성화되지 않았습니다." }, { status: 503 });
  }

  // PortOne V2 API로 본인인증 결과 조회
  const portoneRes = await fetch(
    `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
    { headers: { Authorization: `PortOne ${apiSecret}` } }
  );

  if (!portoneRes.ok) {
    const err = await portoneRes.text();
    return NextResponse.json({ error: "본인인증 조회 실패", detail: err }, { status: 502 });
  }

  const verification = await portoneRes.json();

  if (verification.status !== "VERIFIED") {
    return NextResponse.json({ error: "본인인증이 완료되지 않았습니다." }, { status: 400 });
  }

  // CI 중복 가입 체크
  const adminSb = createAdminSupabaseClient();
  const { data: existing } = await adminSb
    .from("profiles")
    .select("id")
    .eq("verified_ci", verification.verifiedCustomer?.ci)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 가입된 본인인증 정보입니다." }, { status: 409 });
  }

  // profiles 테이블에 본인인증 정보 저장
  await adminSb
    .from("profiles")
    .update({
      verified_name: verification.verifiedCustomer?.name,
      verified_birth_date: verification.verifiedCustomer?.birthDate,
      verified_phone: verification.verifiedCustomer?.phoneNumber,
      verified_ci: verification.verifiedCustomer?.ci,
      verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    name: verification.verifiedCustomer?.name,
    phoneNumber: verification.verifiedCustomer?.phoneNumber,
  });
}
