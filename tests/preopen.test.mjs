import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const webhookModule = await import(new URL("../src/app/api/payment/webhook/transition.ts", import.meta.url));
const preopenFlowScript = await readFile(new URL("../scripts/preopen-flow-smoke.mjs", import.meta.url), "utf8");

test("preopen quality scripts are registered", () => {
  for (const script of ["type-check", "lint", "build", "test", "test:e2e", "test:flow", "audit", "check:remote", "db:apply:preopen", "db:rehearse:fresh", "verify:preopen", "verify:100"]) {
    assert.ok(pkg.scripts?.[script], `${script} script is missing`);
  }
});

test("public test payment mode does not default to live", () => {
  assert.notEqual(process.env.NEXT_PUBLIC_PAYMENT_MODE, "live");
});

test("payment webhook blocks rollback from terminal states", () => {
  const { canTransition } = webhookModule;
  assert.equal(canTransition("completed", "paid"), false);
  assert.equal(canTransition("refunded", "paid"), false);
  assert.equal(canTransition("cancelled", "paid"), false);
});

test("payment webhook allows only safe follow-up states after paid", () => {
  const { canTransition, PAID_ALLOWED_NEXT } = webhookModule;
  for (const next of PAID_ALLOWED_NEXT) {
    assert.equal(canTransition("paid", next), true, `paid -> ${next} should be allowed`);
  }
  assert.equal(canTransition("paid", "failed"), false);
  assert.equal(canTransition("paid", "pending"), false);
});

test("preopen flow smoke covers buyer confirmation after delivery", () => {
  assert.match(preopenFlowScript, /buyer confirms order/i);
  assert.match(preopenFlowScript, /\/api\/orders\/\$\{ids\.order\}\/confirm/);
});
