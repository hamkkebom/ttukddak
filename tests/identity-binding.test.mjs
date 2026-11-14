import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIdentityCustomData,
  isValidVerificationId,
  isVerificationForUser,
} from "../src/lib/portone/identity-binding.ts";

const ME = "83490bf6-062c-42b0-a182-778f11a84637";
const OTHER = "50714be8-afcd-49c4-8122-d94e0295d773";

test("내가 시작한 본인인증만 내 것으로 인정한다", () => {
  assert.equal(isVerificationForUser(buildIdentityCustomData(ME), ME), true);
});

test("다른 회원이 시작한 본인인증은 거부한다", () => {
  assert.equal(isVerificationForUser(buildIdentityCustomData(OTHER), ME), false);
});

test("회원 표시가 없거나 형식이 다른 값은 거부한다", () => {
  for (const value of [undefined, null, "", "not json", "{}", "[]", "null", `"${ME}"`, 42, { userId: ME }, JSON.stringify({ userId: null })]) {
    assert.equal(isVerificationForUser(value, ME), false, JSON.stringify(value));
  }
  assert.equal(isVerificationForUser(buildIdentityCustomData(ME), ""), false);
});

test("인증 번호는 앱이 만든 형식만 받는다", () => {
  assert.equal(isValidVerificationId("iv-83490bf6-062c-42b0-a182-778f11a84637"), true);
  for (const value of [undefined, null, "", "iv-", "83490bf6-062c-42b0-a182-778f11a84637", "iv-../payments/abc", "iv-83490bf6-062c-42b0-a182-778f11a84637?x=1", 123]) {
    assert.equal(isValidVerificationId(value), false, String(value));
  }
});
