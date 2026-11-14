import assert from "node:assert/strict";
import test from "node:test";
import { maskName } from "../src/lib/mask-name.ts";

test("이름은 첫 글자만 남긴다", () => {
  assert.equal(maskName("홍길동"), "홍**");
  assert.equal(maskName("Kim"), "K**");
  assert.equal(maskName("  남궁민수  "), "남**");
});

test("글자 수가 드러나지 않게 가린 부분의 길이는 항상 같다", () => {
  assert.equal(maskName("이"), "이**");
  assert.equal(maskName("제갈공명선생"), "제**");
});

test("이름이 없으면 구매자로 적는다", () => {
  assert.equal(maskName(null), "구매자");
  assert.equal(maskName(undefined), "구매자");
  assert.equal(maskName(""), "구매자");
  assert.equal(maskName("   "), "구매자");
});

test("이미 가린 값을 다시 넣어도 같다", () => {
  assert.equal(maskName(maskName("홍길동")), "홍**");
});

test("한 글자로 세는 문자를 반으로 자르지 않는다", () => {
  assert.equal(maskName("😀스마일"), "😀**");
});
