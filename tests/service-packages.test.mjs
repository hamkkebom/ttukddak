import assert from "node:assert/strict";
import test from "node:test";
import { PACKAGE_TIERS, parsePackages, lowestPrice } from "../src/lib/service-packages.ts";

const tier = (name, overrides = {}) => ({
  name,
  price: "",
  deliveryDays: "",
  revisions: "1",
  features: [""],
  ...overrides,
});

test("화면이 들고 있는 문자열 숫자를 정수로 바꾼다", () => {
  const result = parsePackages(
    [
      tier("베이직", { price: "50000", deliveryDays: "3", revisions: "1", features: ["4K 화질"] }),
      tier("스탠다드", { price: 90000, deliveryDays: 5, revisions: 2 }),
    ],
    { requireOne: true }
  );
  assert.deepEqual(result, {
    ok: true,
    packages: [
      { name: "베이직", price: 50000, deliveryDays: 3, revisions: 1, features: ["4K 화질"] },
      { name: "스탠다드", price: 90000, deliveryDays: 5, revisions: 2, features: [] },
    ],
  });
});

test("가격·작업 기간·포함 사항이 모두 비어 있는 등급은 건너뛴다", () => {
  const result = parsePackages(
    [tier("베이직", { price: "50000", deliveryDays: "3" }), tier("스탠다드"), tier("프리미엄", { revisions: "3" })],
    { requireOne: true }
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.packages.map((p) => p.name), ["베이직"]);
});

test("일부만 채운 등급은 오류다", () => {
  assert.deepEqual(parsePackages([tier("스탠다드", { price: "50000" })], { requireOne: false }), {
    ok: false,
    error: "스탠다드: 작업 기간을 입력해 주세요",
  });
  assert.deepEqual(parsePackages([tier("스탠다드", { deliveryDays: "3" })], { requireOne: false }), {
    ok: false,
    error: "스탠다드: 가격을 입력해 주세요",
  });
  assert.deepEqual(parsePackages([tier("프리미엄", { features: ["자막"] })], { requireOne: false }), {
    ok: false,
    error: "프리미엄: 가격을 입력해 주세요",
  });
  assert.deepEqual(
    parsePackages([tier("베이직", { price: "50000", deliveryDays: "3", revisions: "" })], { requireOne: false }),
    { ok: false, error: "베이직: 수정 횟수를 입력해 주세요" }
  );
});

test("가격 범위와 정수 여부를 검사한다", () => {
  for (const price of ["999", "100000001", "1500.5", 1500.5, "abc", Number.NaN, "-1000", "1e4"]) {
    const result = parsePackages([tier("베이직", { price, deliveryDays: "3" })], { requireOne: false });
    assert.deepEqual(
      result,
      { ok: false, error: "베이직: 가격은 1,000~100,000,000원 사이의 정수로 입력해 주세요" },
      `price=${String(price)}`
    );
  }
  for (const price of ["1000", "100000000"]) {
    assert.equal(parsePackages([tier("베이직", { price, deliveryDays: "3" })], { requireOne: false }).ok, true);
  }
});

test("작업 기간 범위를 검사한다", () => {
  for (const deliveryDays of ["0", "366", "2.5"]) {
    assert.deepEqual(
      parsePackages([tier("스탠다드", { price: "50000", deliveryDays })], { requireOne: false }),
      { ok: false, error: "스탠다드: 작업 기간은 1~365일 사이로 입력해 주세요" }
    );
  }
  for (const deliveryDays of ["1", "365"]) {
    assert.equal(parsePackages([tier("스탠다드", { price: "50000", deliveryDays })], { requireOne: false }).ok, true);
  }
});

test("수정 횟수 범위를 검사한다", () => {
  for (const revisions of ["-1", "100", "1.5"]) {
    assert.deepEqual(
      parsePackages([tier("프리미엄", { price: "50000", deliveryDays: "3", revisions })], { requireOne: false }),
      { ok: false, error: "프리미엄: 수정 횟수는 0~99회 사이로 입력해 주세요" }
    );
  }
  for (const revisions of ["0", "99"]) {
    assert.equal(
      parsePackages([tier("프리미엄", { price: "50000", deliveryDays: "3", revisions })], { requireOne: false }).ok,
      true
    );
  }
});

test("포함 사항은 앞뒤 공백을 지우고 빈 항목을 버린다", () => {
  const result = parsePackages(
    [tier("베이직", { price: "50000", deliveryDays: "3", features: ["  자막 포함 ", "", "   ", "4K"] })],
    { requireOne: false }
  );
  assert.deepEqual(result.packages[0].features, ["자막 포함", "4K"]);
});

test("포함 사항의 개수와 길이를 제한한다", () => {
  const many = Array.from({ length: 11 }, (_, i) => `항목 ${i}`);
  assert.deepEqual(
    parsePackages([tier("베이직", { price: "50000", deliveryDays: "3", features: many })], { requireOne: false }),
    { ok: false, error: "베이직: 포함 사항은 10개까지 입력할 수 있습니다" }
  );
  assert.equal(
    parsePackages([tier("베이직", { price: "50000", deliveryDays: "3", features: many.slice(0, 10) })], {
      requireOne: false,
    }).ok,
    true
  );
  assert.deepEqual(
    parsePackages([tier("베이직", { price: "50000", deliveryDays: "3", features: ["가".repeat(101)] })], {
      requireOne: false,
    }),
    { ok: false, error: "베이직: 포함 사항은 한 항목에 100자까지 입력할 수 있습니다" }
  );
  assert.deepEqual(
    parsePackages([tier("베이직", { price: "50000", deliveryDays: "3", features: [42] })], { requireOne: false }),
    { ok: false, error: "베이직: 포함 사항 형식이 올바르지 않습니다" }
  );
});

test("이름은 비어 있으면 안 되고, 길이 제한이 있고, 겹치면 안 된다", () => {
  assert.deepEqual(parsePackages([tier("  ", { price: "50000", deliveryDays: "3" })], { requireOne: false }), {
    ok: false,
    error: "1번째 패키지: 패키지 이름을 입력해 주세요",
  });
  assert.deepEqual(
    parsePackages([tier("가".repeat(21), { price: "50000", deliveryDays: "3" })], { requireOne: false }).ok,
    false
  );
  assert.deepEqual(
    parsePackages(
      [tier("베이직", { price: "50000", deliveryDays: "3" }), tier(" 베이직 ", { price: "60000", deliveryDays: "3" })],
      { requireOne: false }
    ),
    { ok: false, error: "베이직: 같은 이름의 패키지가 이미 있습니다" }
  );
});

test("패키지는 3개까지다", () => {
  const four = ["A", "B", "C", "D"].map((name) => tier(name, { price: "50000", deliveryDays: "3" }));
  assert.deepEqual(parsePackages(four, { requireOne: false }), {
    ok: false,
    error: "패키지는 3개까지 등록할 수 있습니다",
  });
});

test("항목이 10개를 넘는 목록은 빈 등급뿐이어도 거절한다", () => {
  const eleven = Array.from({ length: 11 }, (_, i) => tier(`등급${i}`));
  assert.deepEqual(parsePackages(eleven, { requireOne: false }), {
    ok: false,
    error: "패키지는 3개까지 등록할 수 있습니다",
  });
  assert.equal(parsePackages(eleven.slice(0, 10), { requireOne: false }).ok, true);
});

test("배열이 아니거나 항목이 객체가 아니면 오류다", () => {
  for (const input of [undefined, null, "베이직", 3, { name: "베이직" }]) {
    assert.deepEqual(parsePackages(input, { requireOne: false }), { ok: false, error: "패키지 형식이 올바르지 않습니다" });
  }
  assert.deepEqual(parsePackages([null], { requireOne: false }), {
    ok: false,
    error: "1번째 패키지: 형식이 올바르지 않습니다",
  });
});

test("requireOne 이면 패키지가 없을 때 오류다", () => {
  const empty = PACKAGE_TIERS.map((name) => tier(name));
  assert.deepEqual(parsePackages(empty, { requireOne: true }), { ok: false, error: "패키지를 하나 이상 입력해 주세요" });
  assert.deepEqual(parsePackages(empty, { requireOne: false }), { ok: true, packages: [] });
  assert.deepEqual(parsePackages([], { requireOne: false }), { ok: true, packages: [] });
});

test("가격이 낮은 순서로 정렬하고, 같은 가격은 입력 순서를 지킨다", () => {
  const result = parsePackages(
    [
      tier("프리미엄", { price: "300000", deliveryDays: "10" }),
      tier("스탠다드", { price: "100000", deliveryDays: "5" }),
      tier("베이직", { price: "100000", deliveryDays: "3" }),
    ],
    { requireOne: true }
  );
  assert.deepEqual(result.packages.map((p) => p.name), ["스탠다드", "베이직", "프리미엄"]);
});

test("lowestPrice 는 가장 낮은 가격을, 없으면 null 을 준다", () => {
  assert.equal(lowestPrice([]), null);
  assert.equal(
    lowestPrice([
      { name: "A", price: 30000, deliveryDays: 1, revisions: 0, features: [] },
      { name: "B", price: 10000, deliveryDays: 1, revisions: 0, features: [] },
    ]),
    10000
  );
});
