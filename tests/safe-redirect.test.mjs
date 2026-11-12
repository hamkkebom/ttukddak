import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath } from "../src/lib/safe-redirect.ts";

test("same-site absolute paths are kept as they are", () => {
  for (const path of ["/", "/mypage", "/order/abc/tracking", "/search?q=영상&sort=rating", "/messages#latest"]) {
    assert.equal(safeRedirectPath(path), path);
  }
});

test("missing values fall back", () => {
  assert.equal(safeRedirectPath(null), "/");
  assert.equal(safeRedirectPath(undefined), "/");
  assert.equal(safeRedirectPath(""), "/");
  assert.equal(safeRedirectPath(null, "/mypage"), "/mypage");
});

test("anything that could leave the site falls back", () => {
  const hostile = [
    "https://evil.example",
    "http://evil.example/path",
    "//evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "\\\\evil.example",
    ".evil.example",
    "@evil.example",
    "evil.example",
    "javascript:alert(1)",
    "/ok\\..\\evil",
    "/line\nbreak",
    "/tab\tinside",
    "/nul\u0000byte",
  ];
  for (const value of hostile) {
    assert.equal(safeRedirectPath(value), "/", `${JSON.stringify(value)} must not be used as a redirect target`);
  }
});

test("the origin prefix used by the auth callback cannot be turned into another host", () => {
  const origin = "https://ttukddak.kr";
  for (const value of [".evil.example", "@evil.example", "//evil.example", "evil.example"]) {
    const target = new URL(`${origin}${safeRedirectPath(value)}`);
    assert.equal(target.origin, origin);
  }
});
