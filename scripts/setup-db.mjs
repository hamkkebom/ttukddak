/**
 * Supabase 테이블 생성 + 기존 데이터 시딩
 * Usage: node scripts/setup-db.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aegupcyteqgehjmsncnn.supabase.co";
const SERVICE_ROLE_KEY = "***SUPABASE_SERVICE_ROLE_KEY_REMOVED***";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ============================================
// Step 1: Run SQL to create tables
// ============================================
async function runSQL() {
  const sql = readFileSync("scripts/supabase-setup.sql", "utf-8");

  // Split by semicolons and execute each statement
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.split("\n")[0].substring(0, 60);

    const { error } = await supabase.rpc("exec_sql", { query: stmt + ";" }).maybeSingle();

    if (error) {
      // Try direct REST API
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: stmt + ";" }),
      });

      if (!res.ok) {
        console.log(`  [${i+1}] Skipping (may need manual execution): ${firstLine}...`);
      } else {
        console.log(`  [${i+1}] OK: ${firstLine}...`);
      }
    } else {
      console.log(`  [${i+1}] OK: ${firstLine}...`);
    }
  }
}

// ============================================
// Step 2: Seed categories
// ============================================
async function seedCategories() {
  console.log("\n=== Seeding categories ===");

  const mainCategories = [
    { id: "video", name: "영상", slug: "video", description: "광고, 숏폼, 유튜브, 교육 등 모든 종류의 영상 제작", icon: "Play", parent_id: null, sort_order: 1 },
    { id: "cg", name: "컴퓨터 그래픽(CG)", slug: "cg", description: "모션그래픽, 인포그래픽, 3D 모델링, AR/VR", icon: "Zap", parent_id: null, sort_order: 2 },
    { id: "animation", name: "애니메이션", slug: "animation", description: "2D, 3D, 화이트보드, 로티/웹 애니메이션", icon: "Layers", parent_id: null, sort_order: 3 },
    { id: "ai-content", name: "AI 콘텐츠", slug: "ai-content", description: "AI 영상, AI 이미지, AI 음향 생성", icon: "Sparkles", parent_id: null, sort_order: 4 },
    { id: "photo", name: "사진", slug: "photo", description: "제품, 프로필, 이벤트 촬영 및 보정", icon: "ImageIcon", parent_id: null, sort_order: 5 },
    { id: "audio", name: "음향", slug: "audio", description: "성우, 음악, 오디오 콘텐츠, 엔지니어링", icon: "Volume2", parent_id: null, sort_order: 6 },
    { id: "entertainer", name: "엔터테이너", slug: "entertainer", description: "모델, 배우, 쇼호스트, MC, 공연", icon: "UserCircle", parent_id: null, sort_order: 7 },
    { id: "etc", name: "기타", slug: "etc", description: "콘티, 헤어메이크업, 스튜디오 렌탈 등", icon: "LayoutGrid", parent_id: null, sort_order: 8 },
  ];

  // Insert main categories first
  const { error: mainErr } = await supabase.from("categories").upsert(mainCategories, { onConflict: "id" });
  if (mainErr) console.error("Main categories error:", mainErr.message);
  else console.log(`  Main categories: ${mainCategories.length} upserted`);

  const subCategories = [
    // 영상
    { id: "ad-video", name: "광고·홍보 영상", slug: "ad-video", description: "기업 광고, 바이럴, 홍보 영상", icon: "ShoppingBag", parent_id: "video", sort_order: 1 },
    { id: "short-form", name: "숏폼 영상", slug: "short-form", description: "쇼츠, 릴스, 틱톡 세로형 영상", icon: "Smartphone", parent_id: "video", sort_order: 2 },
    { id: "youtube", name: "유튜브 영상", slug: "youtube", description: "유튜브 편집, 인트로, 채널 브랜딩", icon: "Play", parent_id: "video", sort_order: 3 },
    { id: "product-video", name: "제품 영상", slug: "product-video", description: "제품 소개, 언박싱, 상세페이지 영상", icon: "Box", parent_id: "video", sort_order: 4 },
    { id: "edu-video", name: "교육 영상", slug: "edu-video", description: "온라인 강의, 튜토리얼, e-러닝", icon: "GraduationCap", parent_id: "video", sort_order: 5 },
    { id: "event-video", name: "행사 영상", slug: "event-video", description: "세미나, 컨퍼런스, 웨딩, 돌잔치", icon: "Heart", parent_id: "video", sort_order: 6 },
    { id: "industry-video", name: "업종별 영상", slug: "industry-video", description: "부동산, 의료, 법률 등 업종 특화 영상", icon: "Building", parent_id: "video", sort_order: 7 },
    { id: "live-stream", name: "온라인 중계", slug: "live-stream", description: "라이브 방송, 웨비나, 스트리밍", icon: "Share2", parent_id: "video", sort_order: 8 },
    { id: "drone", name: "드론 촬영", slug: "drone", description: "항공 촬영, 드론 영상", icon: "Film", parent_id: "video", sort_order: 9 },
    { id: "post-production", name: "영상 후반작업", slug: "post-production", description: "색보정, 자막, 더빙, 음향 믹싱", icon: "Palette", parent_id: "video", sort_order: 10 },
    { id: "field-staff", name: "현장 스탭", slug: "field-staff", description: "촬영감독, 조명, 음향 스탭", icon: "UserCircle", parent_id: "video", sort_order: 11 },
    { id: "video-etc", name: "영상 기타", slug: "video-etc", description: "기타 영상 관련 서비스", icon: "LayoutGrid", parent_id: "video", sort_order: 12 },
    // CG
    { id: "motion-graphics", name: "모션그래픽", slug: "motion-graphics", description: "로고 모션, 타이틀, 인포그래픽 애니메이션", icon: "Zap", parent_id: "cg", sort_order: 1 },
    { id: "3d-modeling", name: "3D 모델링", slug: "3d-modeling", description: "3D 모델링, 렌더링, 건축 시각화", icon: "Box", parent_id: "cg", sort_order: 2 },
    { id: "intro-logo", name: "인트로·로고", slug: "intro-logo", description: "브랜드 인트로, 로고 애니메이션", icon: "Sparkle", parent_id: "cg", sort_order: 3 },
    { id: "infographic", name: "인포그래픽", slug: "infographic", description: "데이터 시각화, 인포그래픽 영상", icon: "Layers", parent_id: "cg", sort_order: 4 },
    { id: "typography", name: "타이포그래피", slug: "typography", description: "키네틱 타이포, 텍스트 애니메이션", icon: "Captions", parent_id: "cg", sort_order: 5 },
    { id: "media-art", name: "미디어 아트", slug: "media-art", description: "미디어 아트, 실험적 비주얼", icon: "Brush", parent_id: "cg", sort_order: 6 },
    { id: "ar-vr-xr", name: "AR·VR·XR", slug: "ar-vr-xr", description: "증강현실, 가상현실, 확장현실 콘텐츠", icon: "Gamepad2", parent_id: "cg", sort_order: 7 },
    // 애니메이션
    { id: "2d-animation", name: "2D 애니메이션", slug: "2d-animation", description: "캐릭터 애니메이션, 설명 애니메이션", icon: "Layers", parent_id: "animation", sort_order: 1 },
    { id: "3d-animation", name: "3D 애니메이션", slug: "3d-animation", description: "3D 캐릭터, 시네마틱, 제품 3D", icon: "Box", parent_id: "animation", sort_order: 2 },
    { id: "whiteboard", name: "화이트보드 애니메이션", slug: "whiteboard", description: "화이트보드 드로잉 스타일 애니메이션", icon: "FileText", parent_id: "animation", sort_order: 3 },
    { id: "lottie-web", name: "로티·web 애니메이션", slug: "lottie-web", description: "Lottie, CSS, SVG 웹 애니메이션", icon: "Flame", parent_id: "animation", sort_order: 4 },
    // AI 콘텐츠
    { id: "ai-video", name: "AI 영상", slug: "ai-video", description: "Sora, Runway 등 AI 영상 생성, 아바타, 립싱크", icon: "Sparkles", parent_id: "ai-content", sort_order: 1 },
    { id: "ai-image", name: "AI 이미지", slug: "ai-image", description: "AI 이미지 생성, 편집, 스타일 변환", icon: "Wand2", parent_id: "ai-content", sort_order: 2 },
    { id: "ai-audio", name: "AI 음향", slug: "ai-audio", description: "AI 음성 합성, AI 배경음악 생성", icon: "Mic", parent_id: "ai-content", sort_order: 3 },
    // 사진
    { id: "product-photo", name: "제품·홍보 사진", slug: "product-photo", description: "제품 촬영, 홍보 사진, 음식 사진", icon: "ShoppingBag", parent_id: "photo", sort_order: 1 },
    { id: "profile-photo", name: "개인·프로필 사진", slug: "profile-photo", description: "프로필, 증명사진, 스냅 포트레이트", icon: "UserCircle", parent_id: "photo", sort_order: 2 },
    { id: "event-snap", name: "이벤트 스냅", slug: "event-snap", description: "행사, 웨딩, 돌잔치 스냅 촬영", icon: "Heart", parent_id: "photo", sort_order: 3 },
    { id: "photo-edit", name: "사진 보정", slug: "photo-edit", description: "색보정, 리터칭, 합성, 복원", icon: "Palette", parent_id: "photo", sort_order: 4 },
    // 음향
    { id: "voice-actor", name: "성우", slug: "voice-actor", description: "내레이션, 더빙, 광고 성우", icon: "Mic", parent_id: "audio", sort_order: 1 },
    { id: "music", name: "음악·음원", slug: "music", description: "작곡, 편곡, BGM, 음원 제작", icon: "Music", parent_id: "audio", sort_order: 2 },
    { id: "audio-content", name: "오디오 콘텐츠", slug: "audio-content", description: "팟캐스트, ASMR, 오디오북", icon: "Volume2", parent_id: "audio", sort_order: 3 },
    { id: "audio-engineering", name: "오디오 엔지니어링", slug: "audio-engineering", description: "믹싱, 마스터링, 사운드 디자인", icon: "Volume2", parent_id: "audio", sort_order: 4 },
    { id: "audio-etc", name: "기타 음향·음악", slug: "audio-etc", description: "효과음, 징글, 기타 음향", icon: "Music", parent_id: "audio", sort_order: 5 },
    // 엔터테이너
    { id: "model", name: "모델", slug: "model", description: "광고 모델, 피팅 모델, 핸드 모델", icon: "UserCircle", parent_id: "entertainer", sort_order: 1 },
    { id: "actor", name: "배우", slug: "actor", description: "광고 배우, 단역, 엑스트라", icon: "Film", parent_id: "entertainer", sort_order: 2 },
    { id: "show-host", name: "쇼호스트", slug: "show-host", description: "라이브커머스, 홈쇼핑 호스트", icon: "ShoppingCart", parent_id: "entertainer", sort_order: 3 },
    { id: "mc", name: "MC", slug: "mc", description: "행사 MC, 사회자, 진행자", icon: "Mic", parent_id: "entertainer", sort_order: 4 },
    { id: "performance", name: "공연", slug: "performance", description: "공연 기획, 무대 연출", icon: "Music", parent_id: "entertainer", sort_order: 5 },
    // 기타
    { id: "storyboard", name: "콘티·스토리보드", slug: "storyboard", description: "영상 기획, 콘티, 스토리보드, 대본", icon: "FileText", parent_id: "etc", sort_order: 1 },
    { id: "hair-makeup", name: "헤어메이크업", slug: "hair-makeup", description: "촬영용 헤어, 메이크업, 스타일링", icon: "Sparkle", parent_id: "etc", sort_order: 2 },
    { id: "studio-rental", name: "스튜디오 렌탈", slug: "studio-rental", description: "촬영 스튜디오, 장비 렌탈", icon: "Building", parent_id: "etc", sort_order: 3 },
    { id: "other", name: "기타 영상·사진·음향", slug: "other", description: "기타 영상/사진/음향 관련 서비스", icon: "LayoutGrid", parent_id: "etc", sort_order: 4 },
  ];

  const { error: subErr } = await supabase.from("categories").upsert(subCategories, { onConflict: "id" });
  if (subErr) console.error("Sub categories error:", subErr.message);
  else console.log(`  Sub categories: ${subCategories.length} upserted`);
}

// ============================================
// Step 3: Seed experts
// ============================================
async function seedExperts() {
  console.log("\n=== Seeding experts ===");

  // Dynamically import the experts data
  const { experts } = await import("../src/data/experts.ts");

  const rows = experts.map((e) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    profile_image: e.profileImage,
    category_id: e.categoryId,
    is_prime: e.isPrime,
    is_master: e.isMaster,
    rating: e.rating,
    review_count: e.reviewCount,
    completion_rate: e.completionRate,
    response_time: e.responseTime,
    skills: e.skills,
    tools: e.tools,
    introduction: e.introduction,
    joined_at: e.joinedAt,
  }));

  const { error } = await supabase.from("experts").upsert(rows, { onConflict: "id" });
  if (error) console.error("Experts error:", error.message);
  else console.log(`  Experts: ${rows.length} upserted`);
}

// ============================================
// Step 4: Seed services
// ============================================
async function seedServices() {
  console.log("\n=== Seeding services ===");

  const { services } = await import("../src/data/services.ts");

  const rows = services.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    thumbnail: s.thumbnail,
    images: s.images,
    category_id: s.categoryId,
    expert_id: s.expertId,
    price: s.price,
    rating: s.rating,
    review_count: s.reviewCount,
    sales_count: s.salesCount,
    tags: s.tags,
    is_prime: s.isPrime,
    is_fast_response: s.isFastResponse,
    packages: JSON.stringify(s.packages),
    created_at: s.createdAt,
  }));

  const { error } = await supabase.from("services").upsert(rows, { onConflict: "id" });
  if (error) console.error("Services error:", error.message);
  else console.log(`  Services: ${rows.length} upserted`);
}

// ============================================
// Main
// ============================================
async function main() {
  console.log("=== Supabase Setup ===\n");

  // Test connection
  const { count, error } = await supabase.from("categories").select("*", { count: "exact", head: true });
  if (error && !error.message.includes("does not exist") && !error.message.includes("schema cache")) {
    console.error("Connection failed:", error.message);
    return;
  }
  console.log(`Connected to Supabase! (categories: ${count ?? 0} rows)\n`);

  console.log("NOTE: Please run scripts/supabase-setup.sql manually in Supabase SQL Editor first.");
  console.log("      (Dashboard → SQL Editor → Paste & Run)\n");

  // Seed data (assumes tables already created via SQL Editor)
  await seedCategories();
  await seedExperts();
  await seedServices();

  console.log("\n=== Done! ===");
}

main().catch(console.error);
