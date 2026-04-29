import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("preopen quality scripts are registered", () => {
  for (const script of ["type-check", "lint", "build", "test", "test:e2e", "test:flow", "audit", "check:remote", "db:apply:preopen", "db:rehearse:fresh", "verify:preopen", "verify:100"]) {
    assert.ok(pkg.scripts?.[script], `${script} script is missing`);
  }
});

test("public test payment mode does not default to live", () => {
  assert.notEqual(process.env.NEXT_PUBLIC_PAYMENT_MODE, "live");
});
