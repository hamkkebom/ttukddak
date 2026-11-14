"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { EmptyNotice, ServiceBrowser, type SortOption } from "@/components/ServiceBrowser";
import {
  getCategoriesClient,
  getExpertsByIdsClient,
  getServicesClient,
  searchServicesClient,
} from "@/lib/db-client";
import { VIDEO_TYPES, matchesKeyword } from "@/lib/video-types";
import { cn } from "@/lib/utils";
import type { Category, Expert, Service } from "@/types";

// 검색 결과는 넘겨받은 순서(관련도순)를 처음 정렬로 쓴다.
const SORT_OPTIONS: SortOption[] = ["relevance", "popular", "rating", "price-low", "price-high"];

/* ───────────────────────────── 최근 검색어 (이 기기에만 저장) ───────────────────────────── */

const RECENT_KEY = "recentSearches";

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 10) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    if (list.length > 0) localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    else localStorage.removeItem(RECENT_KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 최근 검색어 없이 동작한다.
  }
}

function rememberSearch(term: string) {
  writeRecent([term, ...readRecent().filter((s) => s !== term)].slice(0, 10));
}

/* ───────────────────────────────────── 검색창 ───────────────────────────────────── */

function SearchBox({ query, onSubmit }: { query: string; onSubmit: (term: string) => void }) {
  const [value, setValue] = useState(query);
  // 주소의 검색어가 바뀌면(종류 버튼, 뒤로 가기 등) 입력란도 그 값으로 맞춘다.
  // 검색창을 통째로 다시 만들지 않는 것은, 다시 만들면 입력란에 있던 초점이 사라지기 때문이다.
  const [seenQuery, setSeenQuery] = useState(query);
  if (query !== seenQuery) {
    setSeenQuery(query);
    setValue(query);
  }
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showRecent = open && value === "" && recent.length > 0;

  const openRecent = () => {
    setRecent(readRecent());
    setOpen(true);
  };

  // 목록이 비어 사라질 때는 초점을 입력란으로 돌려놓는다 (누른 버튼이 함께 사라지기 때문이다).
  const saveRecent = (next: string[]) => {
    setRecent(next);
    writeRecent(next);
    if (next.length === 0) inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      className="relative max-w-[640px]"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        onSubmit(value.trim());
      }}
      // 검색창 묶음 밖으로 초점이 나가면 최근 검색어를 닫는다.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-[1_1_180px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#56606B]"
            aria-hidden="true"
          />
          <label htmlFor="search-q" className="sr-only">
            서비스 검색
          </label>
          <input
            id="search-q"
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="어떤 영상이 필요하세요?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={openRecent}
            className="h-14 w-full rounded-[10px] border border-[#7B838D] bg-white pl-12 pr-12 text-base placeholder:text-[#6B7480] focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          />
          {value && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#56606B] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-14 rounded-[10px] bg-ink px-7 text-base font-black text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          찾아보기
        </button>
      </div>

      {showRecent && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-[10px] border border-ink bg-white"
          // 목록을 누를 때 검색창의 초점이 빠지지 않게 한다 (초점이 빠지면 누르기 전에 목록이 닫힌다).
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between border-b border-[#E2E5E9] py-1 pl-4 pr-2">
            <span className="text-[13px] font-bold text-[#56606B]">최근 검색어</span>
            <button
              type="button"
              onClick={() => saveRecent([])}
              className="h-9 rounded-[10px] px-2 text-[13px] font-medium text-[#56606B] hover:text-ink"
            >
              전체 삭제
            </button>
          </div>
          <ul>
            {recent.map((term) => (
              <li key={term} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSubmit(term);
                  }}
                  className="flex h-11 min-w-0 flex-1 items-center gap-3 pl-4 text-left text-[15px] hover:bg-paper"
                >
                  <Search className="h-4 w-4 shrink-0 text-[#56606B]" aria-hidden="true" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`최근 검색어 ${term} 삭제`}
                  onClick={() => saveRecent(recent.filter((s) => s !== term))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[#56606B] hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

/* ───────────────────────────────────── 화면 ───────────────────────────────────── */

export default function SearchPage() {
  return (
    // useSearchParams 를 쓰는 부분은 Suspense 안에 있어야 한다.
    <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  // 주소의 q 가 검색어의 기준이다. 뒤로 가기, 홈의 종류 버튼, 헤더 검색 모두 주소만 바꾸면 결과가 따라온다.
  const q = (useSearchParams().get("q") ?? "").trim();

  const [allServices, setAllServices] = useState<Service[] | null>(null);
  const [found, setFound] = useState<{ q: string; services: Service[] } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});
  // 이미 요청한 전문가 (같은 사람을 두 번 요청하지 않기 위해)
  const requestedExperts = useRef(new Set<string>());
  // 요청의 응답이 끝난 전문가 (성공이든 실패든). "마스터 전문가" 필터가 응답을 기다릴지 정하는 데 쓴다.
  const [settledExperts, setSettledExperts] = useState<ReadonlySet<string>>(new Set());

  // 전체 서비스와 카테고리는 한 번만 읽는다. 전체 서비스는 검색어가 없을 때의 목록이자 영상 종류 개수의 바탕이다.
  useEffect(() => {
    let cancelled = false;
    getServicesClient().then((services) => {
      if (!cancelled) setAllServices(services);
    });
    getCategoriesClient().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    searchServicesClient(q).then((services) => {
      if (!cancelled) setFound({ q, services });
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const loading = q ? found?.q !== q : allServices === null;
  const base = useMemo(
    () => (q ? (found?.q === q ? found.services : []) : (allServices ?? [])),
    [q, found, allServices]
  );

  // 카드에 보여 줄 전문가 정보. 아직 요청하지 않은 전문가만 한 번에 묶어서 읽는다.
  useEffect(() => {
    const missing = [...new Set(base.map((s) => s.expertId))].filter((id) => !requestedExperts.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => requestedExperts.current.add(id));
    getExpertsByIdsClient(missing)
      .then((experts) => {
        setExpertMap((prev) => {
          const next = { ...prev };
          for (const expert of experts) next[expert.id] = expert;
          return next;
        });
      })
      .catch(() => {
        // 읽지 못한 묶음은 다음에 결과가 바뀔 때 다시 요청한다. 그동안 카드는 전문가 이름 없이 보인다.
        missing.forEach((id) => requestedExperts.current.delete(id));
      })
      .finally(() => {
        setSettledExperts((prev) => new Set([...prev, ...missing]));
      });
  }, [base]);

  // 영상 종류 버튼. 개수는 전체 서비스에서 세고, 하나도 없는 종류는 숨긴다.
  const typeChips = useMemo(
    () =>
      allServices === null
        ? null
        : VIDEO_TYPES.map((type) => ({
            type,
            count: allServices.filter((s) => matchesKeyword(s, type)).length,
          })).filter((chip) => chip.count > 0),
    [allServices]
  );

  // 검색어가 이름·소개·기술에 걸리는 전문가 (지금 결과에 서비스가 있는 전문가 가운데)
  const matchedExperts = useMemo(() => {
    if (!q) return [];
    const needle = q.toLowerCase();
    const seen = new Set<string>();
    const matched: Expert[] = [];
    for (const service of base) {
      const expert = expertMap[service.expertId];
      if (!expert || seen.has(expert.id)) continue;
      seen.add(expert.id);
      if (
        expert.name.toLowerCase().includes(needle) ||
        expert.title.toLowerCase().includes(needle) ||
        expert.skills.some((skill) => skill.toLowerCase().includes(needle))
      ) {
        matched.push(expert);
      }
    }
    return matched;
  }, [q, base, expertMap]);

  const goSearch = (term: string) => {
    if (term) rememberSearch(term);
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  const chipBase = "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px]";
  const chipOn = "bg-ink font-bold text-white hover:bg-black";
  const chipOff = "border border-[#D5D9DE] font-medium hover:border-ink";
  const primaryLink =
    "inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black";
  const secondaryLink =
    "inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper";

  return (
    <div className="min-h-screen bg-white text-ink [word-break:keep-all]">
      {/* ===== 검색어와 검색창 ===== */}
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-6 pt-12 md:px-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em] [overflow-wrap:anywhere]">
              {q ? (
                <>
                  <span className="sr-only">검색 결과: </span>
                  {q}
                </>
              ) : (
                "전체 서비스"
              )}
            </h1>
            <p role="status" className="text-[17px] text-[#3A3A37]">
              {loading
                ? "찾는 중입니다."
                : q
                  ? `검색 결과 ${base.length}개${matchedExperts.length > 0 ? ` · 관련 전문가 ${matchedExperts.length}명` : ""}`
                  : `공개된 서비스 ${base.length}개`}
            </p>
          </div>

          <SearchBox query={q} onSubmit={goSearch} />

          <nav aria-label="영상 종류" className="flex min-h-11 flex-wrap gap-2">
            {typeChips && (
              <>
                <Link
                  href="/search"
                  aria-current={q === "" ? "page" : undefined}
                  className={cn(chipBase, q === "" ? chipOn : chipOff)}
                >
                  전체 <span className={q === "" ? "font-medium" : "text-[#56606B]"}>{allServices?.length ?? 0}</span>
                </Link>
                {typeChips.map(({ type, count }) => {
                  const active = q === type;
                  return (
                    <Link
                      key={type}
                      href={`/search?q=${encodeURIComponent(type)}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(chipBase, active ? chipOn : chipOff)}
                    >
                      {type} <span className={active ? "font-medium" : "text-[#56606B]"}>{count}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 md:px-8">
        {/* ===== 관련 전문가 ===== */}
        {matchedExperts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-[15px] font-black">관련 전문가</h2>
            {/* 다섯 명까지 한 줄로만 보여 준다. 여러 줄이 되면 정작 검색 결과가 화면 아래로 밀린다. */}
            <ul className="-mx-4 flex items-center gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide md:-mx-8 md:px-8">
              {matchedExperts.slice(0, 5).map((expert) => (
                <li key={expert.id} className="shrink-0">
                  <Link
                    href={`/expert/${expert.id}`}
                    className="flex w-52 flex-col gap-0.5 rounded-[20px] border border-[#D5D9DE] px-5 py-3.5 hover:border-ink"
                  >
                    <span className="truncate text-[17px] font-black">{expert.name}</span>
                    <span className="truncate text-sm text-[#56606B]">{expert.title || "전문가"}</span>
                  </Link>
                </li>
              ))}
              {matchedExperts.length > 5 && (
                <li className="shrink-0 px-2 text-[15px] font-medium text-[#56606B]">외 {matchedExperts.length - 5}명</li>
              )}
            </ul>
          </section>
        )}

        {/* ===== 필터 · 정렬 · 목록 ===== */}
        <ServiceBrowser
          services={base}
          expertMap={expertMap}
          sortOptions={SORT_OPTIONS}
          loading={loading}
          expertsReady={base.every((s) => settledExperts.has(s.expertId))}
          categories={categories}
          scopeKey={q}
          empty={
            q ? (
              <EmptyNotice
                title="검색 결과가 없습니다"
                body="다른 낱말로 찾아보세요. 원하는 영상이 목록에 없다면 견적을 요청할 수 있습니다."
              >
                <Link href="/request" className={primaryLink}>
                  견적 요청하기
                </Link>
                <Link href="/search" className={secondaryLink}>
                  전체 서비스 보기
                </Link>
              </EmptyNotice>
            ) : (
              <EmptyNotice title="공개된 서비스가 아직 없습니다" body="필요한 영상을 적어 견적을 요청할 수 있습니다.">
                <Link href="/request" className={primaryLink}>
                  견적 요청하기
                </Link>
              </EmptyNotice>
            )
          }
        />
      </div>
    </div>
  );
}
