import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isValidVerificationId, isVerificationForUser } from "@/lib/portone/identity-binding";

/**
 * 클라이언트에서 본인인증 완료 후 서버에서 PortOne API로 결과를 조회·검증합니다.
 * 본인인증 결과(이름/생년월일/CI 등)를 profiles 테이블에 저장합니다.
 *
 * 인증 결과는 그 인증을 시작한 회원의 계정에만 저장한다 (identity-binding 참고).
 * 응답에는 이름·전화번호 같은 인증 값을 싣지 않는다.
 */
export async function POST(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const identityVerificationId: unknown = body?.identityVerificationId;
  if (!isValidVerificationId(identityVerificationId)) {
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
    // 결제사 응답 내용은 기록에만 남기고 사용자에게는 돌려주지 않는다.
    console.error("[identity/verify] lookup failed:", portoneRes.status, await portoneRes.text().catch(() => ""));
    return NextResponse.json({ error: "본인인증 조회 실패" }, { status: 502 });
  }

  const verification = await portoneRes.json();

  if (verification.status !== "VERIFIED") {
    return NextResponse.json({ error: "본인인증이 완료되지 않았습니다." }, { status: 400 });
  }

  // 이 계정에서 시작한 인증인지 확인한다.
  if (!isVerificationForUser(verification.customData, user.id)) {
    return NextResponse.json({ error: "이 계정에서 시작한 본인인증이 아닙니다." }, { status: 403 });
  }

  const ci: unknown = verification.verifiedCustomer?.ci;
  if (typeof ci !== "string" || !ci) {
    console.error("[identity/verify] verified result has no CI");
    return NextResponse.json({ error: "본인인증 결과를 확인할 수 없습니다." }, { status: 502 });
  }

  // CI 중복 가입 체크
  const adminSb = createAdminSupabaseClient();
  const { data: existing, error: lookupError } = await adminSb
    .from("profiles")
    .select("id")
    .eq("verified_ci", ci)
    .neq("id", user.id)
    .limit(1);

  if (lookupError) {
    console.error("[identity/verify] duplicate check failed:", lookupError);
    return NextResponse.json({ error: "본인인증 정보를 저장하지 못했습니다." }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "이미 가입된 본인인증 정보입니다." }, { status: 409 });
  }

  // profiles 테이블에 본인인증 정보 저장
  const { error: updateError } = await adminSb
    .from("profiles")
    .update({
      verified_name: verification.verifiedCustomer?.name,
      verified_birth_date: verification.verifiedCustomer?.birthDate,
      verified_phone: verification.verifiedCustomer?.phoneNumber,
      verified_ci: ci,
      verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    // 같은 CI 는 한 계정에만 저장된다 (DB 의 고유 색인). 위의 확인과 저장 사이에 다른 계정이 먼저 저장한 경우다.
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "이미 가입된 본인인증 정보입니다." }, { status: 409 });
    }
    console.error("[identity/verify] save failed:", updateError);
    return NextResponse.json({ error: "본인인증 정보를 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
