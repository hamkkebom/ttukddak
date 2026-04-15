/**
 * Seed Supabase with data. Creates auth users for experts.
 * Usage: node scripts/seed-data.cjs
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const expertUUIDs = {};
const serviceUUIDs = {};

function parseTS(filePath) {
  let content = fs.readFileSync(path.resolve(__dirname, "..", filePath), "utf-8");
  content = content.replace(/^import\s+.*$/gm, "");
  content = content.replace(/export const (\w+):\s*\w+(?:\[\])?\s*=\s*/g, "module.exports = ");
  content = content.replace(/\nexport\s+(?:function|const)[\s\S]*$/g, "");
  const tmpPath = path.resolve(__dirname, "_tmp_seed.cjs");
  fs.writeFileSync(tmpPath, content);
  try {
    delete require.cache[tmpPath];
    return require(tmpPath);
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

async function seedCategories() {
  console.log("\n=== Seeding categories ===");
  const allCats = [
    { id: "video", name: "영상", slug: "video", description: "광고, 숏폼, 유튜브, 교육 등 모든 종류의 영상 제작", icon: "Play", sort_order: 1, service_count: 0 },
    { id: "cg", name: "컴퓨터 그래픽(CG)", slug: "cg", description: "모션그래픽, 인포그래픽, 3D 모델링, AR/VR", icon: "Zap", sort_order: 2, service_count: 0 },
    { id: "animation", name: "애니메이션", slug: "animation", description: "2D, 3D, 화이트보드, 로티/웹 애니메이션", icon: "Layers", sort_order: 3, service_count: 0 },
    { id: "ai-content", name: "AI 콘텐츠", slug: "ai-content", description: "AI 영상, AI 이미지, AI 음향 생성", icon: "Sparkles", sort_order: 4, service_count: 0 },
    { id: "photo", name: "사진", slug: "photo", description: "제품, 프로필, 이벤트 촬영 및 보정", icon: "ImageIcon", sort_order: 5, service_count: 0 },
    { id: "audio", name: "음향", slug: "audio", description: "성우, 음악, 오디오 콘텐츠, 엔지니어링", icon: "Volume2", sort_order: 6, service_count: 0 },
    { id: "entertainer", name: "엔터테이너", slug: "entertainer", description: "모델, 배우, 쇼호스트, MC, 공연", icon: "UserCircle", sort_order: 7, service_count: 0 },
    { id: "etc", name: "기타", slug: "etc", description: "콘티, 헤어메이크업, 스튜디오 렌탈 등", icon: "LayoutGrid", sort_order: 8, service_count: 0 },
    { id: "ai-video", name: "AI 영상", slug: "ai-video", description: "Sora, Runway 등 AI 영상 생성, 아바타, 립싱크", icon: "Sparkles", sort_order: 41, service_count: 0 },
    { id: "ai-image", name: "AI 이미지", slug: "ai-image", description: "AI 이미지 생성, 편집, 스타일 변환", icon: "Wand2", sort_order: 42, service_count: 0 },
    { id: "ai-audio", name: "AI 음향", slug: "ai-audio", description: "AI 음성 합성, AI 배경음악 생성", icon: "Mic", sort_order: 43, service_count: 0 },
    { id: "ad-video", name: "광고·홍보 영상", slug: "ad-video", description: "기업 광고, 바이럴, 홍보 영상", icon: "ShoppingBag", sort_order: 11, service_count: 0 },
    { id: "short-form", name: "숏폼 영상", slug: "short-form", description: "쇼츠, 릴스, 틱톡 세로형 영상", icon: "Smartphone", sort_order: 12, service_count: 0 },
    { id: "youtube", name: "유튜브 영상", slug: "youtube", description: "유튜브 편집, 인트로, 채널 브랜딩", icon: "Play", sort_order: 13, service_count: 0 },
    { id: "product-video", name: "제품 영상", slug: "product-video", description: "제품 소개, 언박싱, 상세페이지 영상", icon: "Box", sort_order: 14, service_count: 0 },
    { id: "motion-graphics", name: "모션그래픽", slug: "motion-graphics", description: "로고 모션, 타이틀, 인포그래픽 애니메이션", icon: "Zap", sort_order: 21, service_count: 0 },
    { id: "3d-modeling", name: "3D 모델링", slug: "3d-modeling", description: "3D 모델링, 렌더링, 건축 시각화", icon: "Box", sort_order: 22, service_count: 0 },
  ];

  const { error } = await sb.from("categories").upsert(allCats, { onConflict: "id" });
  if (error) console.error("  Error:", error.message);
  else console.log(`  ✅ ${allCats.length} categories`);
}

async function seedExperts() {
  console.log("\n=== Seeding experts (creating auth users) ===");
  const experts = parseTS("src/data/experts.ts");
  console.log(`  Parsed ${experts.length} experts`);

  for (const e of experts) {
    const email = `${e.id}@ttukddak.expert`;

    // Check if user already exists
    const { data: existingUsers } = await sb.auth.admin.listUsers({ perPage: 1 });

    // Create auth user → triggers profile creation
    const { data, error } = await sb.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: e.name, avatar_url: e.profileImage },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        // Find existing user
        const { data: { users } } = await sb.auth.admin.listUsers();
        const existing = users.find(u => u.email === email);
        if (existing) {
          expertUUIDs[e.id] = existing.id;
          continue;
        }
      }
      console.error(`  ❌ ${e.id} (${e.name}): ${error.message}`);
      continue;
    }

    expertUUIDs[e.id] = data.user.id;
    process.stdout.write(".");
  }

  console.log(`\n  Created ${Object.keys(expertUUIDs).length} auth users`);

  // Update profiles with expert role
  for (const [oldId, uuid] of Object.entries(expertUUIDs)) {
    await sb.from("profiles").update({ role: "expert", is_expert_verified: true }).eq("id", uuid);
  }

  // Insert expert records
  const rows = experts.filter(e => expertUUIDs[e.id]).map((e) => ({
    id: expertUUIDs[e.id],
    title: `${e.name} - ${e.title}`,
    category_id: e.categoryId,
    introduction: e.introduction,
    skills: e.skills,
    tools: e.tools,
    is_prime: e.isPrime,
    is_master: e.isMaster,
    response_time: e.responseTime,
    completion_rate: e.completionRate,
    rating: e.rating,
    review_count: e.reviewCount,
    experience: `${e.name} 크리에이터`,
    portfolio_links: [],
    created_at: e.joinedAt + "T00:00:00Z",
  }));

  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);
    const { error } = await sb.from("experts").upsert(batch, { onConflict: "id" });
    if (error) console.error(`  Experts batch ${i}: ${error.message}`);
  }
  console.log(`  ✅ ${rows.length} experts`);
}

async function seedServices() {
  console.log("\n=== Seeding services ===");
  const services = parseTS("src/data/services.ts");
  console.log(`  Parsed ${services.length} services`);

  const rows = services.filter(s => expertUUIDs[s.expertId]).map((s) => ({
    // Let DB generate UUID for services (no FK issue since id is auto-gen)
    expert_id: expertUUIDs[s.expertId],
    category_id: s.categoryId,
    title: s.title,
    description: s.description,
    thumbnail_url: s.thumbnail,
    images: s.images,
    price: s.price,
    tags: s.tags,
    is_prime: s.isPrime,
    is_fast_response: s.isFastResponse,
    status: "active",
    sales_count: s.salesCount,
    rating: s.rating,
    review_count: s.reviewCount,
    view_count: Math.floor(s.salesCount * 8.5),
  }));

  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);
    const { data, error } = await sb.from("services").insert(batch).select("id, title");
    if (error) console.error(`  Services batch ${i}: ${error.message}`);
    else {
      data.forEach((d, j) => {
        const originalId = services[i + j]?.id;
        if (originalId) serviceUUIDs[originalId] = d.id;
      });
    }
  }
  console.log(`  ✅ ${rows.length} services`);

  // Update category service counts
  const { data: svcData } = await sb.from("services").select("category_id");
  if (svcData) {
    const counts = {};
    svcData.forEach((s) => { counts[s.category_id] = (counts[s.category_id] || 0) + 1; });
    for (const [catId, count] of Object.entries(counts)) {
      await sb.from("categories").update({ service_count: count }).eq("id", catId);
    }
    console.log("  Category counts:", JSON.stringify(counts));
  }

  // Save mapping
  const mapping = { experts: expertUUIDs, services: serviceUUIDs };
  fs.writeFileSync(path.resolve(__dirname, "id-mapping.json"), JSON.stringify(mapping, null, 2));
  console.log("  ID mapping saved");
}

async function main() {
  console.log("=== Supabase Data Seeding ===");
  await seedCategories();
  await seedExperts();
  await seedServices();

  console.log("\n=== Verification ===");
  const { count: catCount } = await sb.from("categories").select("*", { count: "exact", head: true });
  const { count: proCount } = await sb.from("profiles").select("*", { count: "exact", head: true });
  const { count: expCount } = await sb.from("experts").select("*", { count: "exact", head: true });
  const { count: svcCount } = await sb.from("services").select("*", { count: "exact", head: true });
  console.log(`  Categories: ${catCount}`);
  console.log(`  Profiles: ${proCount}`);
  console.log(`  Experts: ${expCount}`);
  console.log(`  Services: ${svcCount}`);
}

main().catch(console.error);
