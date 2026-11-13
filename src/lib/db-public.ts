import "server-only";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { dbCategoryToApp, dbExpertToApp, dbServiceToApp } from "@/lib/db-server";
import type { Category, Expert, Service } from "@/types";
import type { DBCategory, DBExpert, DBProfile, DBService } from "@/types/db";

/**
 * 캐시되는 공개 페이지(홈, 카테고리, 서비스 상세, 전문가 상세) 전용 조회.
 *
 * db-server 의 조회와 두 가지가 다르다.
 *
 * 1. 로그인 쿠키를 읽지 않는다. 쿠키를 읽으면 페이지가 요청마다 새로 렌더링되어 캐시할 수 없다.
 *    누가 보든 같은 공개 데이터만 돌려준다 (RLS 의 anon 역할). 승인 전 서비스처럼
 *    소유자·관리자에게만 보이는 데이터는 여기서 읽히지 않는다.
 * 2. 조회가 실패하면 빈 값 대신 예외를 던진다. 캐시를 다시 만드는 도중 DB 가 응답하지 않을 때
 *    "데이터 없음" 화면이 캐시에 덮어써지는 것을 막기 위해서다. 예외가 나면 Next.js 는
 *    직전에 만들어 둔 페이지를 계속 내보내고 다음 요청에서 다시 시도한다.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// 카테고리 슬러그는 영문 소문자·숫자·하이픈만 쓴다. 그 밖의 값은 조회하지 않고 "없음"으로 처리한다.
const SLUG = /^[a-z0-9-]{1,64}$/;

type QueryResult<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(result: QueryResult<T>, what: string): T | null {
  if (result.error) {
    throw new Error(`공개 데이터 조회 실패 (${what}): ${result.error.message}`);
  }
  return result.data;
}

type ExpertRow = DBExpert & { profiles?: Pick<DBProfile, "name" | "avatar_url"> | null };

// 공개 화면에 필요한 프로필 항목만 읽는다 (이메일 등은 가져오지 않는다).
const EXPERT_SELECT = "*, profiles(name, avatar_url)";

function toExpert(row: ExpertRow): Expert {
  const { profiles, ...expert } = row;
  return dbExpertToApp(expert as DBExpert, (profiles ?? undefined) as DBProfile | undefined);
}

export async function getPublicCategories(): Promise<Category[]> {
  const sb = createPublicSupabaseClient();
  const rows = unwrap<DBCategory[]>(
    await sb.from("categories").select("*").order("sort_order"),
    "categories"
  );
  return (rows ?? []).map(dbCategoryToApp);
}

export async function getPublicCategoryBySlug(slug: string): Promise<Category | null> {
  if (!SLUG.test(slug)) return null;

  const sb = createPublicSupabaseClient();
  const row = unwrap<DBCategory>(
    await sb.from("categories").select("*").eq("slug", slug).maybeSingle(),
    "category by slug"
  );
  return row ? dbCategoryToApp(row) : null;
}

export async function getPublicCategoryById(id: string): Promise<Category | null> {
  const sb = createPublicSupabaseClient();
  const row = unwrap<DBCategory>(
    await sb.from("categories").select("*").eq("id", id).maybeSingle(),
    "category by id"
  );
  return row ? dbCategoryToApp(row) : null;
}

export async function getPublicServices(limit?: number): Promise<Service[]> {
  const sb = createPublicSupabaseClient();
  let query = sb
    .from("services")
    .select("*")
    .eq("status", "active")
    .order("sales_count", { ascending: false });
  if (limit) query = query.limit(limit);

  const rows = unwrap<DBService[]>(await query, "services");
  return (rows ?? []).map((s) => dbServiceToApp(s));
}

export async function getPublicServiceById(id: string): Promise<Service | null> {
  // uuid 가 아닌 값을 그대로 조회하면 DB 가 형식 오류를 내고, 그 오류는 404 가 아니라 500 이 된다.
  if (!UUID.test(id)) return null;

  const sb = createPublicSupabaseClient();
  const [serviceResult, packagesResult] = await Promise.all([
    sb.from("services").select("*").eq("id", id).eq("status", "active").maybeSingle(),
    sb.from("service_packages").select("*").eq("service_id", id).order("price"),
  ]);

  const service = unwrap<DBService>(serviceResult, "service by id");
  if (!service) return null;
  const packages = unwrap<Record<string, unknown>[]>(packagesResult, "service packages");
  return dbServiceToApp(service, packages ?? undefined);
}

export async function getPublicServicesByCategory(categoryId: string): Promise<Service[]> {
  const sb = createPublicSupabaseClient();
  const rows = unwrap<DBService[]>(
    await sb
      .from("services")
      .select("*")
      .eq("category_id", categoryId)
      .eq("status", "active")
      .order("sales_count", { ascending: false }),
    "services by category"
  );
  return (rows ?? []).map((s) => dbServiceToApp(s));
}

export async function getPublicServicesByExpert(expertId: string): Promise<Service[]> {
  if (!UUID.test(expertId)) return [];

  const sb = createPublicSupabaseClient();
  const rows = unwrap<DBService[]>(
    await sb.from("services").select("*").eq("expert_id", expertId).eq("status", "active"),
    "services by expert"
  );
  return (rows ?? []).map((s) => dbServiceToApp(s));
}

export async function getPublicExperts(limit?: number): Promise<Expert[]> {
  const sb = createPublicSupabaseClient();
  let query = sb.from("experts").select(EXPERT_SELECT).order("rating", { ascending: false });
  if (limit) query = query.limit(limit);

  const rows = unwrap<ExpertRow[]>(await query, "experts");
  return (rows ?? []).map(toExpert);
}

export async function getPublicExpertById(id: string): Promise<Expert | null> {
  if (!UUID.test(id)) return null;

  const sb = createPublicSupabaseClient();
  const row = unwrap<ExpertRow>(
    await sb.from("experts").select(EXPERT_SELECT).eq("id", id).maybeSingle(),
    "expert by id"
  );
  return row ? toExpert(row) : null;
}

// 공개 서비스 수. keyword 를 주면 검색(searchServicesClient)과 같은 조건(제목·설명)으로 센다.
// 홈의 영상 종류 버튼에 쓰는 숫자라서, 눌렀을 때 나오는 검색 결과 수와 같아야 한다.
export async function countPublicServices(keyword?: string): Promise<number> {
  const sb = createPublicSupabaseClient();
  let query = sb.from("services").select("id", { count: "exact", head: true }).eq("status", "active");
  if (keyword) {
    const like = `%${keyword.replace(/[(),.*]/g, "")}%`;
    query = query.or(`title.ilike.${like},description.ilike.${like}`);
  }

  const { count, error } = await query;
  if (error) throw new Error(`공개 데이터 조회 실패 (service count): ${error.message}`);
  return count ?? 0;
}

export async function countPublicExperts(): Promise<number> {
  const sb = createPublicSupabaseClient();
  const { count, error } = await sb.from("experts").select("id", { count: "exact", head: true });
  if (error) throw new Error(`공개 데이터 조회 실패 (expert count): ${error.message}`);
  return count ?? 0;
}
