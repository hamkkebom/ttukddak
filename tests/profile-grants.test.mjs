import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

// v16 부터 회원 표(profiles)는 칸 단위로만 읽기 권한을 준다 (anon: id·name·avatar_url, authenticated: +role).
// 그 뒤의 마이그레이션이 표 전체 권한을 다시 주면 오류 없이 이메일 같은 칸이 전부 다시 열린다.
// 그런 문장이 들어오면 여기서 막는다.
const MIGRATIONS = new URL("../supabase/migrations/", import.meta.url);
const V16 = "20261114090000";

function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}

// 표 전체(또는 스키마 전체)에 대한 읽기 권한을 anon·authenticated·PUBLIC 에 주는 GRANT 인지 본다.
// 칸을 적은 GRANT (GRANT SELECT (id, name) ON ...) 는 해당하지 않는다.
export function reopensProfiles(statement) {
  const s = statement.replace(/\s+/g, " ").trim();
  const match = s.match(/^grant (.+?) on (.+?) to (.+)$/i);
  if (!match) return false;

  const [, privileges, target, grantees] = match;
  if (!/\b(anon|authenticated|public)\b/i.test(grantees)) return false;
  if (privileges.includes("(")) return false;
  if (!/\b(all|select)\b/i.test(privileges)) return false;

  return (
    /^all tables in schema public\b/i.test(target) ||
    /^(table )?(public\.)?"?profiles"?(\s*,|$)/i.test(target) ||
    /,\s*(public\.)?"?profiles"?(\s*,|$)/i.test(target)
  );
}

test("권한을 다시 여는 문장을 알아본다", () => {
  assert.equal(reopensProfiles("GRANT SELECT ON TABLE public.profiles TO anon, authenticated"), true);
  assert.equal(reopensProfiles("grant all on profiles to authenticated"), true);
  assert.equal(reopensProfiles("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon"), true);
  assert.equal(reopensProfiles("GRANT SELECT, INSERT ON public.orders, public.profiles TO authenticated"), true);

  assert.equal(reopensProfiles("GRANT SELECT (id, name, avatar_url) ON TABLE public.profiles TO anon"), false);
  assert.equal(reopensProfiles("GRANT SELECT ON TABLE public.profiles TO service_role"), false);
  assert.equal(reopensProfiles("GRANT UPDATE ON TABLE public.profiles TO authenticated"), false);
  assert.equal(reopensProfiles("GRANT SELECT ON TABLE public.services TO anon"), false);
});

test("v16 이후 마이그레이션은 profiles 의 표 전체 읽기 권한을 다시 주지 않는다", async () => {
  const files = (await readdir(MIGRATIONS)).filter((name) => name.endsWith(".sql")).sort();
  assert.ok(
    files.some((name) => name.startsWith(V16)),
    "v16 마이그레이션 파일이 있어야 한다"
  );

  for (const file of files.filter((name) => name.slice(0, V16.length) > V16)) {
    const sql = stripComments(await readFile(new URL(file, MIGRATIONS), "utf8"));
    for (const statement of sql.split(";")) {
      assert.equal(reopensProfiles(statement), false, `${file}: ${statement.replace(/\s+/g, " ").trim()}`);
    }
  }
});

test("v16 은 표 전체 권한을 거둔 뒤 칸 단위로만 다시 준다", async () => {
  const files = await readdir(MIGRATIONS);
  const v16 = files.find((name) => name.startsWith(V16));
  const sql = stripComments(await readFile(new URL(v16, MIGRATIONS), "utf8"));
  const statements = sql.split(";").map((statement) => statement.replace(/\s+/g, " ").trim());

  assert.ok(statements.some((s) => /^revoke all on table public\.profiles from anon$/i.test(s)));
  assert.ok(statements.some((s) => /^revoke select\b.* on table public\.profiles from authenticated$/i.test(s)));
  assert.ok(statements.every((s) => !reopensProfiles(s)));
});
