import assert from "node:assert/strict";
import test from "node:test";

const mapperModule = await import(new URL("../src/lib/db-mappers.ts", import.meta.url));

test("mapServicePackages normalizes DB package rows", () => {
  const { mapServicePackages } = mapperModule;
  const mapped = mapServicePackages([
    {
      name: "스탠다드",
      price: 25000,
      delivery_days: 5,
      revisions: 2,
      features: ["썸네일", "자막"],
    },
  ]);

  assert.deepEqual(mapped, [
    {
      name: "스탠다드",
      price: 25000,
      deliveryDays: 5,
      revisions: 2,
      features: ["썸네일", "자막"],
    },
  ]);
});

test("mapOrderRow normalizes joined order rows", () => {
  const { mapOrderRow } = mapperModule;
  const mapped = mapOrderRow({
    id: "order-1",
    buyer_id: "buyer-1",
    service_id: "service-1",
    seller_id: "seller-1",
    package_id: "베이직",
    amount: 33000,
    status: "paid",
    payment_id: "payment-1",
    requirements: "빠른 납기",
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-01T12:30:00.000Z",
    services: { title: "AI 쇼츠 편집" },
    profiles: { name: "홍길동", avatar_url: "https://example.test/avatar.png" },
  });

  assert.equal(mapped.serviceName, "AI 쇼츠 편집");
  assert.equal(mapped.buyerName, "홍길동");
  assert.equal(mapped.buyerAvatar, "https://example.test/avatar.png");
  assert.equal(mapped.status, "paid");
});

test("mapServicePackages falls back to a placeholder package when none are saved", () => {
  const { mapServicePackages } = mapperModule;
  const mapped = mapServicePackages([], 30000);

  assert.equal(mapped.length, 1);
  assert.equal(mapped[0].price, 30000);
  assert.equal(mapped[0].isPlaceholder, true);
});

test("mapReviewRow always passes the reviewer name through the given mask", () => {
  const { mapReviewRow } = mapperModule;
  const mapped = mapReviewRow(
    {
      id: "review-1",
      service_id: "service-1",
      order_id: null,
      reviewer_id: "buyer-1",
      reviewer_name: "홍길동",
      rating: 5,
      content: null,
      helpful_count: null,
      created_at: "2026-08-01T12:00:00.000Z",
    },
    (name) => `${Array.from(name ?? "")[0] ?? ""}**`,
  );

  assert.equal(mapped.userName, "홍**");
  assert.equal(mapped.content, "");
  assert.equal(mapped.helpfulCount, 0);
});
