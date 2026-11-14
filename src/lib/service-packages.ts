// 서비스 패키지(베이직·스탠다드·프리미엄) 입력을 검사하고 저장할 모양으로 바꾼다.
// 등록·수정 화면(브라우저)과 서버 API가 같은 규칙을 쓰도록 한 곳에 둔다.
// 테스트가 이 파일을 바로 불러오므로 다른 프로젝트 파일이나 "@/" 경로를 불러오지 않는다.

export const PACKAGE_TIERS = ["베이직", "스탠다드", "프리미엄"] as const;

export const PACKAGE_PRICE_MIN = 1_000;
export const PACKAGE_PRICE_MAX = 100_000_000;
export const PACKAGE_DELIVERY_DAYS_MIN = 1;
export const PACKAGE_DELIVERY_DAYS_MAX = 365;
export const PACKAGE_REVISIONS_MIN = 0;
export const PACKAGE_REVISIONS_MAX = 99;
export const PACKAGE_FEATURES_MAX = 10;
export const PACKAGE_FEATURE_LENGTH_MAX = 100;
export const PACKAGE_NAME_LENGTH_MAX = 20;
export const PACKAGES_MAX = 3;
// 받는 목록의 최대 길이 (팔지 않는 빈 등급 포함). 이보다 길면 검사하지 않고 거절한다.
export const PACKAGE_ENTRIES_MAX = 10;

export type PackageInput = {
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
};

export type ParsePackagesResult =
  | { ok: true; packages: PackageInput[] }
  | { ok: false; error: string };

const formatNumber = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

// 화면의 입력칸은 문자열을 들고 있으므로, 비어 있는 문자열도 "입력하지 않음"으로 본다.
function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

// 정수만 받는다. 숫자 또는 숫자로만 된 문자열("15000")을 받고, 소수·지수 표기·NaN 은 받지 않는다.
function toInteger(value: unknown): number | null {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    return Number.isSafeInteger(n) ? n : null;
  }
  return null;
}

const charLength = (s: string) => Array.from(s).length;

// 패키지 입력 목록을 검사한다.
// - 가격·작업 기간이 모두 비어 있고 포함 사항도 없는 항목은 "그 등급은 팔지 않음"으로 보고 건너뛴다.
// - 일부만 채운 항목은 오류다.
// - requireOne 이면 남는 패키지가 하나도 없을 때 오류다 (심사 신청 등).
// 결과는 가격이 낮은 순서로 정렬한다 (가격이 같으면 입력 순서를 지킨다).
export function parsePackages(input: unknown, opts: { requireOne: boolean }): ParsePackagesResult {
  if (!Array.isArray(input)) return { ok: false, error: "패키지 형식이 올바르지 않습니다" };
  // 비워 둔 등급까지 쳐도 화면이 보내는 항목은 몇 개뿐이다. 지나치게 긴 목록은 살펴보기 전에 거절한다.
  if (input.length > PACKAGE_ENTRIES_MAX) {
    return { ok: false, error: `패키지는 ${PACKAGES_MAX}개까지 등록할 수 있습니다` };
  }

  const packages: PackageInput[] = [];

  for (let i = 0; i < input.length; i++) {
    const entry: unknown = input[i];
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return { ok: false, error: `${i + 1}번째 패키지: 형식이 올바르지 않습니다` };
    }
    const raw = entry as Record<string, unknown>;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const label = name || `${i + 1}번째 패키지`;

    if (raw.features !== undefined && !Array.isArray(raw.features)) {
      return { ok: false, error: `${label}: 포함 사항 형식이 올바르지 않습니다` };
    }
    const rawFeatures: unknown[] = Array.isArray(raw.features) ? raw.features : [];
    if (rawFeatures.some((f) => typeof f !== "string")) {
      return { ok: false, error: `${label}: 포함 사항 형식이 올바르지 않습니다` };
    }
    const features = (rawFeatures as string[]).map((f) => f.trim()).filter((f) => f !== "");

    // 수정 횟수는 화면이 미리 채워 두므로, 팔지 않는 등급인지는 가격·작업 기간·포함 사항으로만 판단한다.
    if (isBlank(raw.price) && isBlank(raw.deliveryDays) && features.length === 0) continue;

    if (!name) return { ok: false, error: `${label}: 패키지 이름을 입력해 주세요` };
    if (charLength(name) > PACKAGE_NAME_LENGTH_MAX) {
      return { ok: false, error: `${label}: 패키지 이름은 ${PACKAGE_NAME_LENGTH_MAX}자까지 입력할 수 있습니다` };
    }

    if (isBlank(raw.price)) return { ok: false, error: `${label}: 가격을 입력해 주세요` };
    const price = toInteger(raw.price);
    if (price === null || price < PACKAGE_PRICE_MIN || price > PACKAGE_PRICE_MAX) {
      return {
        ok: false,
        error: `${label}: 가격은 ${formatNumber(PACKAGE_PRICE_MIN)}~${formatNumber(PACKAGE_PRICE_MAX)}원 사이의 정수로 입력해 주세요`,
      };
    }

    if (isBlank(raw.deliveryDays)) return { ok: false, error: `${label}: 작업 기간을 입력해 주세요` };
    const deliveryDays = toInteger(raw.deliveryDays);
    if (deliveryDays === null || deliveryDays < PACKAGE_DELIVERY_DAYS_MIN || deliveryDays > PACKAGE_DELIVERY_DAYS_MAX) {
      return {
        ok: false,
        error: `${label}: 작업 기간은 ${PACKAGE_DELIVERY_DAYS_MIN}~${PACKAGE_DELIVERY_DAYS_MAX}일 사이로 입력해 주세요`,
      };
    }

    if (isBlank(raw.revisions)) return { ok: false, error: `${label}: 수정 횟수를 입력해 주세요` };
    const revisions = toInteger(raw.revisions);
    if (revisions === null || revisions < PACKAGE_REVISIONS_MIN || revisions > PACKAGE_REVISIONS_MAX) {
      return {
        ok: false,
        error: `${label}: 수정 횟수는 ${PACKAGE_REVISIONS_MIN}~${PACKAGE_REVISIONS_MAX}회 사이로 입력해 주세요`,
      };
    }

    if (features.length > PACKAGE_FEATURES_MAX) {
      return { ok: false, error: `${label}: 포함 사항은 ${PACKAGE_FEATURES_MAX}개까지 입력할 수 있습니다` };
    }
    if (features.some((f) => charLength(f) > PACKAGE_FEATURE_LENGTH_MAX)) {
      return { ok: false, error: `${label}: 포함 사항은 한 항목에 ${PACKAGE_FEATURE_LENGTH_MAX}자까지 입력할 수 있습니다` };
    }

    if (packages.some((p) => p.name === name)) {
      return { ok: false, error: `${label}: 같은 이름의 패키지가 이미 있습니다` };
    }

    packages.push({ name, price, deliveryDays, revisions, features });
  }

  if (packages.length > PACKAGES_MAX) {
    return { ok: false, error: `패키지는 ${PACKAGES_MAX}개까지 등록할 수 있습니다` };
  }
  if (opts.requireOne && packages.length === 0) {
    return { ok: false, error: "패키지를 하나 이상 입력해 주세요" };
  }

  // Array.prototype.sort 는 안정 정렬이라 가격이 같으면 입력 순서가 남는다.
  packages.sort((a, b) => a.price - b.price);
  return { ok: true, packages };
}

// 패키지 중 가장 낮은 가격. 목록·검색에 보이는 서비스 대표 가격(services.price)으로 쓴다.
export function lowestPrice(packages: PackageInput[]): number | null {
  if (packages.length === 0) return null;
  return Math.min(...packages.map((p) => p.price));
}
