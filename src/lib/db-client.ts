import { createClient } from "@/lib/supabase/client";
import { maskName } from "@/lib/mask-name";
import type { Service, Expert, Category, Order, Review, Conversation, Message, ExpertApplication, QuoteRequest, Profile } from "@/types";
import type { DBService, DBExpert, DBCategory, DBProfile } from "@/types/db";

// ============================================
// Transform DB → App types
// ============================================

const DEFAULT_PACKAGES = (price: number) => [
  { name: "베이직", price, deliveryDays: 7, revisions: 2, features: ["기본 제작"], isPlaceholder: true },
];

function dbServiceToApp(s: DBService, packages?: any[]): Service {
  const pkgs = packages && packages.length > 0
    ? packages.map((p: any) => ({
        name: p.name,
        price: p.price,
        deliveryDays: p.delivery_days,
        revisions: p.revisions,
        features: p.features || [],
      }))
    : DEFAULT_PACKAGES(s.price);

  return {
    id: s.id,
    title: s.title,
    description: s.description || "",
    thumbnail: s.thumbnail_url || "/thumbnails/svc-1.jpg",
    images: s.images || [],
    categoryId: s.category_id,
    expertId: s.expert_id,
    price: s.price,
    rating: s.rating || 0,
    reviewCount: s.review_count || 0,
    salesCount: s.sales_count || 0,
    viewCount: s.view_count || 0,
    tags: s.tags || [],
    isPrime: s.is_prime || false,
    isFastResponse: s.is_fast_response || false,
    packages: pkgs,
    createdAt: s.created_at?.split("T")[0] || "2026-01-01",
    status: (s.status as Service["status"]) || "active",
    rejectionReason: s.rejection_reason || undefined,
  };
}

function dbExpertToApp(e: DBExpert, profile?: DBProfile): Expert {
  const parts = (e.title || "").split(" - ");
  const name = profile?.name || parts[0] || "전문가";
  const title = parts.slice(1).join(" - ") || parts[0] || "";

  return {
    id: e.id,
    name,
    title,
    profileImage: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    categoryId: e.category_id,
    isPrime: e.is_prime || false,
    isMaster: e.is_master || false,
    rating: e.rating || 0,
    reviewCount: e.review_count || 0,
    completionRate: e.completion_rate || 0,
    // 측정한 값이 없으면 비워 둔다 (기본값을 지어내지 않는다).
    responseTime: e.response_time || "",
    skills: e.skills || [],
    tools: e.tools || [],
    introduction: e.introduction || "",
    joinedAt: e.created_at?.split("T")[0] || "2026-01-01",
  };
}

function dbCategoryToApp(c: DBCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    icon: c.icon || "Sparkles",
    serviceCount: c.service_count || 0,
  };
}

// ============================================
// Input sanitization helpers
// ============================================

function sanitizeFilterValue(v: string): string {
  return v.replace(/[(),.*]/g, "");
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// Client-side queries (for Client Components)
// ============================================

export async function getServicesClient(limit?: number): Promise<Service[]> {
  const sb = createClient();
  let query = sb
    .from("services")
    .select("*")
    .eq("status", "active")
    .order("sales_count", { ascending: false }).order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return (data || []).map((s: any) => dbServiceToApp(s));
}

export async function getAllServicesAdminClient(): Promise<Service[]> {
  const sb = createClient();
  const { data } = await sb
    .from("services")
    .select("*")
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  return (data || []).map((s: any) => dbServiceToApp(s));
}

export async function getServiceByIdClient(id: string): Promise<Service | null> {
  const sb = createClient();
  const [{ data }, { data: packages }] = await Promise.all([
    sb.from("services").select("*").eq("id", id).maybeSingle(),
    sb.from("service_packages").select("*").eq("service_id", id).order("price").order("sort_order"),
  ]);

  return data ? dbServiceToApp(data, packages || undefined) : null;
}

export async function getExpertByIdClient(id: string): Promise<Expert | null> {
  const sb = createClient();
  const { data } = await sb
    .from("experts")
    .select("*, profiles(name, avatar_url)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const profile = (data as any).profiles;
  delete (data as any).profiles;
  return dbExpertToApp(data as any, profile);
}

// 전문가 여러 명을 한 번의 요청으로 읽는다. 목록 화면에서 카드마다 따로 요청하지 않기 위해서다.
// 카드에 필요한 프로필 항목(이름·사진)만 가져온다.
// 이 파일의 다른 조회와 달리 실패하면 예외를 던진다. 부르는 쪽이 "없는 전문가"와 "읽기 실패"를
// 구분해서, 실패한 묶음을 다음에 다시 요청할 수 있어야 하기 때문이다.
export async function getExpertsByIdsClient(ids: string[]): Promise<Expert[]> {
  const validIds = [...new Set(ids)].filter((id) => uuidRegex.test(id));
  if (validIds.length === 0) return [];

  // id 목록이 주소에 실리므로, 너무 길어지지 않게 100명씩 나눠 읽는다.
  const chunks: string[][] = [];
  for (let i = 0; i < validIds.length; i += 100) chunks.push(validIds.slice(i, i + 100));

  const sb = createClient();
  const results = await Promise.all(
    chunks.map((chunk) => sb.from("experts").select("*, profiles(name, avatar_url)").in("id", chunk))
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`전문가 조회 실패: ${failed.error.message}`);

  return results.flatMap(({ data }) =>
    (data || []).map((row: any) => {
      const { profiles, ...expert } = row;
      return dbExpertToApp(expert, profiles ?? undefined);
    })
  );
}

export async function getServicesByExpertClient(expertId: string): Promise<Service[]> {
  const sb = createClient();
  const { data } = await sb
    .from("services")
    .select("*")
    .eq("expert_id", expertId)
    .eq("status", "active");

  return (data || []).map((s: any) => dbServiceToApp(s));
}

export async function searchServicesClient(query: string): Promise<Service[]> {
  const sb = createClient();
  const lower = `%${sanitizeFilterValue(query)}%`;
  const { data } = await sb
    .from("services")
    .select("*")
    .eq("status", "active")
    .or(`title.ilike.${lower},description.ilike.${lower}`)
    // 개수를 따로 자르지 않는다. 영상 종류 버튼의 개수(전체에서 셈)와 결과 수가 같아야 하고,
    // 검색어가 없을 때의 전체 목록(getServicesClient)도 자르지 않는다.
    .order("sales_count", { ascending: false }).order("created_at", { ascending: false });

  return (data || []).map((s: any) => dbServiceToApp(s));
}

export async function getCategoriesClient(): Promise<Category[]> {
  const sb = createClient();
  const { data } = await sb
    .from("categories")
    .select("*")
    .order("sort_order");

  return (data || []).map(dbCategoryToApp);
}

export async function getCategoryByIdClient(id: string): Promise<Category | null> {
  const sb = createClient();
  const { data } = await sb
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? dbCategoryToApp(data) : null;
}

// ============================================
// Orders (Client)
// ============================================

export async function getOrdersClient(filters?: { buyerId?: string; expertId?: string; status?: string }): Promise<Order[]> {
  const sb = createClient();
  let query = sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").order("created_at", { ascending: false });
  if (filters?.buyerId) query = query.eq("buyer_id", filters.buyerId);
  if (filters?.expertId) query = query.eq("seller_id", filters.expertId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  if (!data) return [];
  return data.map((o: any) => ({
    id: o.id, buyerId: o.buyer_id, serviceId: o.service_id, expertId: o.seller_id,
    packageName: o.package_id, price: o.amount, status: o.status, paymentId: o.payment_id,
    requirements: o.requirements, createdAt: o.created_at, updatedAt: o.updated_at,
    serviceName: o.services?.title, buyerName: o.profiles?.name, buyerAvatar: o.profiles?.avatar_url,
  }));
}

export async function getOrderByIdClient(id: string): Promise<Order | null> {
  const sb = createClient();
  const { data } = await sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id, buyerId: data.buyer_id, serviceId: data.service_id, expertId: data.seller_id,
    packageName: data.package_id, price: data.amount, status: data.status, paymentId: data.payment_id,
    requirements: data.requirements, createdAt: data.created_at, updatedAt: data.updated_at,
    serviceName: (data as any).services?.title, buyerName: (data as any).profiles?.name,
    buyerAvatar: (data as any).profiles?.avatar_url,
  };
}

// ============================================
// Reviews (Client)
// ============================================

export async function getReviewsClient(filters?: { serviceId?: string }): Promise<Review[]> {
  const sb = createClient();
  let query = sb.from("reviews").select("*").order("created_at", { ascending: false });
  if (filters?.serviceId) query = query.eq("service_id", filters.serviceId);

  const { data } = await query;
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id, serviceId: r.service_id, orderId: r.order_id, userId: r.reviewer_id,
    userName: maskName(r.reviewer_name), rating: r.rating, content: r.content || "",
    helpfulCount: r.helpful_count || 0, createdAt: r.created_at,
  }));
}

// ============================================
// Conversations & Messages (Client)
// ============================================

export async function getConversationsClient(userId: string): Promise<Conversation[]> {
  if (!uuidRegex.test(userId)) return [];
  const res = await fetch(`/api/conversations?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getMessagesClient(conversationId: string): Promise<Message[]> {
  const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function sendMessageClient(
  conversationId: string,
  senderId: string,
  content: string,
  options?: { messageType?: string; fileUrl?: string }
): Promise<Message | null> {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      senderId,
      content,
      messageType: options?.messageType || "text",
      fileUrl: options?.fileUrl || null,
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

// ============================================
// Expert Applications (Client)
// ============================================

export async function getExpertApplicationByUserClient(userId: string): Promise<ExpertApplication | null> {
  const sb = createClient();
  const { data } = await sb.from("expert_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id, userId: data.user_id, name: data.name, email: data.email,
    phone: data.phone, category: data.category, skills: data.skills || [],
    portfolioUrls: data.portfolio_urls || [], introduction: data.introduction,
    status: data.status, createdAt: data.created_at,
  };
}

export async function createExpertApplicationClient(app: { userId: string; name: string; email: string; phone?: string; category: string; skills: string[]; portfolioUrls: string[]; introduction?: string; idVerificationUrl?: string; businessRegistrationUrl?: string }): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("expert_applications").insert({
    user_id: app.userId, name: app.name, email: app.email, phone: app.phone,
    category: app.category, skills: app.skills, portfolio_urls: app.portfolioUrls,
    introduction: app.introduction,
    id_verification_url: app.idVerificationUrl,
    business_registration_url: app.businessRegistrationUrl,
    status: "pending",
  });
  return !error;
}

// ============================================
// Quote Requests (Client)
// ============================================

export async function getQuoteRequestsClient(): Promise<QuoteRequest[]> {
  const res = await fetch("/api/quote-requests");
  if (!res.ok) return [];
  return res.json();
}

export async function createQuoteRequestClient(req: { userId: string; title: string; category?: string; budgetMin?: number; budgetMax?: number; deadline?: string; description?: string }): Promise<boolean> {
  const res = await fetch("/api/quote-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.ok;
}

// ============================================
// Profile (Client)
// ============================================

export async function updateProfileClient(id: string, updates: { name?: string; phone?: string; bio?: string }): Promise<boolean> {
  const sb = createClient();
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  const { error } = await sb.from("profiles").update(dbUpdates).eq("id", id);
  return !error;
}

export async function getProfilesClient(): Promise<Profile[]> {
  // 회원 목록에는 이메일이 들어 있다. 브라우저에서 회원 표를 직접 읽지 않고(DB 가 막는다)
  // 관리자만 쓸 수 있는 API 로 받는다.
  const res = await fetch("/api/admin/users");
  if (!res.ok) return [];
  return res.json();
}
