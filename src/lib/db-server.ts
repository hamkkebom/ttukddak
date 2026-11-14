import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { maskName } from "@/lib/mask-name";
import { lowestPrice, type PackageInput } from "@/lib/service-packages";
import type { Service, Expert, Category, Order, Review, Conversation, Message, ExpertApplication, QuoteRequest, Profile, MessageType } from "@/types";
import type { DBService, DBExpert, DBCategory, DBProfile } from "@/types/db";

// ============================================
// Transform DB → App types
// ============================================

const DEFAULT_PACKAGES = (price: number) => [
  { name: "베이직", price, deliveryDays: 7, revisions: 2, features: ["기본 제작"], isPlaceholder: true },
];

export function dbServiceToApp(s: DBService, packages?: any[]): Service {
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

export function dbExpertToApp(e: DBExpert, profile?: DBProfile): Expert {
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

export function dbCategoryToApp(c: DBCategory): Category {
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
// Server-side queries (for Server Components & API routes)
// ============================================

export async function getCategories(): Promise<Category[]> {
  const sb = await createServerSupabaseClient();
  const { data, error } = await sb
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error || !data) return [];
  return data.map(dbCategoryToApp);
}

export async function getCategoryBySlugDB(slug: string): Promise<Category | null> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data ? dbCategoryToApp(data) : null;
}

export async function getCategoryByIdDB(id: string): Promise<Category | null> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? dbCategoryToApp(data) : null;
}

export async function getServices(limit?: number): Promise<Service[]> {
  const sb = await createServerSupabaseClient();
  let query = sb
    .from("services")
    .select("*")
    .eq("status", "active")
    .order("sales_count", { ascending: false }).order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((s: any) => dbServiceToApp(s));
}

export async function getServiceByIdDB(id: string): Promise<Service | null> {
  const sb = await createServerSupabaseClient();
  const [{ data }, { data: packages }] = await Promise.all([
    sb.from("services").select("*").eq("id", id).maybeSingle(),
    sb.from("service_packages").select("*").eq("service_id", id).order("price").order("sort_order"),
  ]);

  return data ? dbServiceToApp(data, packages || undefined) : null;
}

export async function getServicesByCategory(categoryId: string): Promise<Service[]> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb
    .from("services")
    .select("*")
    .eq("category_id", categoryId)
    .eq("status", "active")
    .order("sales_count", { ascending: false }).order("created_at", { ascending: false });

  return (data || []).map((s: any) => dbServiceToApp(s));
}

export async function getServicesByExpertDB(expertId: string): Promise<Service[]> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb
    .from("services")
    .select("*")
    .eq("expert_id", expertId)
    .eq("status", "active");

  return (data || []).map((s: any) => dbServiceToApp(s));
}

export async function searchServicesDB(
  query: string,
  options?: {
    sort?: "popular" | "rating" | "price_low" | "price_high" | "relevance";
    categoryId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ services: Service[]; total: number }> {
  const sb = await createServerSupabaseClient();
  const lower = `%${sanitizeFilterValue(query)}%`;
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  // Count query
  let countQuery = sb
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .or(`title.ilike.${lower},description.ilike.${lower}`);

  if (options?.categoryId) {
    countQuery = countQuery.eq("category_id", options.categoryId);
  }

  // Data query
  let dataQuery = sb
    .from("services")
    .select("*")
    .eq("status", "active")
    .or(`title.ilike.${lower},description.ilike.${lower}`);

  if (options?.categoryId) {
    dataQuery = dataQuery.eq("category_id", options.categoryId);
  }

  const sort = options?.sort ?? "popular";
  switch (sort) {
    case "rating":
      dataQuery = dataQuery.order("rating", { ascending: false });
      break;
    case "price_low":
      dataQuery = dataQuery.order("price", { ascending: true });
      break;
    case "price_high":
      dataQuery = dataQuery.order("price", { ascending: false });
      break;
    default:
      dataQuery = dataQuery.order("sales_count", { ascending: false }).order("created_at", { ascending: false });
      break;
  }

  dataQuery = dataQuery.range(offset, offset + limit - 1);

  const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);

  return {
    services: (data || []).map((s: any) => dbServiceToApp(s)),
    total: count ?? 0,
  };
}

export async function getExperts(limit?: number, offset?: number): Promise<{ experts: Expert[]; total: number }> {
  const sb = await createServerSupabaseClient();
  let query = sb
    .from("experts")
    .select("*, profiles(name, avatar_url)", { count: "exact" })
    .order("rating", { ascending: false });

  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit || 20) - 1);

  const { data, count } = await query;
  if (!data) return { experts: [], total: 0 };

  const experts = data.map((row: any) => {
    const profile = row.profiles;
    delete row.profiles;
    return dbExpertToApp(row, profile);
  });
  return { experts, total: count || 0 };
}

export async function getExpertByIdDB(id: string): Promise<Expert | null> {
  const sb = await createServerSupabaseClient();
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

export async function searchExpertsDB(query: string): Promise<Expert[]> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb
    .from("experts")
    .select("*, profiles(name, avatar_url)")
    .or(
      `title.ilike.%${sanitizeFilterValue(query)}%,introduction.ilike.%${sanitizeFilterValue(query)}%`
    )
    .order("rating", { ascending: false })
    .limit(20);

  if (!data) return [];
  return data.map((row: any) => {
    const profile = row.profiles;
    delete row.profiles;
    return dbExpertToApp(row, profile);
  });
}

export async function getExpertsByCategory(categoryId: string, limit?: number, offset?: number): Promise<{ experts: Expert[]; total: number }> {
  const sb = await createServerSupabaseClient();
  let query = sb
    .from("experts")
    .select("*, profiles(name, avatar_url)", { count: "exact" })
    .eq("category_id", categoryId)
    .order("rating", { ascending: false });

  if (limit) query = query.limit(limit);
  if (offset) query = query.range(offset, offset + (limit || 20) - 1);

  const { data, count } = await query;
  if (!data) return { experts: [], total: 0 };
  const experts = data.map((row: any) => {
    const profile = row.profiles;
    delete row.profiles;
    return dbExpertToApp(row, profile);
  });
  return { experts, total: count || 0 };
}

// ============================================
// Orders
// ============================================

export async function getOrders(filters?: { buyerId?: string; expertId?: string; status?: string }): Promise<Order[]> {
  const sb = await createServerSupabaseClient();
  let query = sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").order("created_at", { ascending: false });

  if (filters?.buyerId) query = query.eq("buyer_id", filters.buyerId);
  if (filters?.expertId) query = query.eq("seller_id", filters.expertId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  if (!data) return [];
  return data.map((o: any) => ({
    id: o.id,
    buyerId: o.buyer_id,
    serviceId: o.service_id,
    expertId: o.seller_id,
    packageName: o.package_id,
    price: o.amount,
    status: o.status,
    paymentId: o.payment_id,
    requirements: o.requirements,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    serviceName: o.services?.title,
    buyerName: o.profiles?.name,
    buyerAvatar: o.profiles?.avatar_url,
  }));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    buyerId: data.buyer_id,
    serviceId: data.service_id,
    expertId: data.seller_id,
    packageName: data.package_id,
    price: data.amount,
    status: data.status,
    paymentId: data.payment_id,
    requirements: data.requirements,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    serviceName: (data as any).services?.title,
    buyerName: (data as any).profiles?.name,
    buyerAvatar: (data as any).profiles?.avatar_url,
  };
}

export async function createOrder(order: { buyerId: string; serviceId: string; expertId: string; packageId?: string | null; packageName?: string | null; price: number; requirements?: string; couponId?: string | null; dealOfferId?: string | null }): Promise<Order | null> {
  const sb = await createServerSupabaseClient();
  const { data, error } = await sb.from("orders").insert({
    buyer_id: order.buyerId,
    service_id: order.serviceId,
    seller_id: order.expertId,
    package_id: order.packageId || null,
    amount: order.price,
    requirements: order.requirements,
    coupon_id: order.couponId ?? null,
    deal_offer_id: order.dealOfferId ?? null,
    status: "pending",
  }).select().single();

  if (error || !data) return null;
  return { id: data.id, buyerId: data.buyer_id, serviceId: data.service_id, expertId: data.seller_id, packageName: order.packageName || data.package_id || "협의견적", price: data.amount, status: data.status, paymentId: data.payment_id, requirements: data.requirements, createdAt: data.created_at, updatedAt: data.updated_at, dealOfferId: data.deal_offer_id };
}

/**
 * 주문 상태를 바꾼다. 호출 전에 반드시 권한과 전이 규칙(canTransitionOrderStatus)을 확인해야 한다.
 *
 * orders 테이블에는 사용자 UPDATE 정책이 없으므로 service_role 로 쓴다.
 * `expectedStatus` 일 때만 갱신하며, 실제로 바뀐 행이 있을 때만 true 를 돌려준다.
 */
export async function updateOrderStatus(id: string, status: string, expectedStatus: string): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, updated_at: now };
  if (status === "completed") update.completed_at = now;

  const { data, error } = await sb
    .from("orders")
    .update(update)
    .eq("id", id)
    .eq("status", expectedStatus)
    .select("id");

  if (error) {
    console.error("[updateOrderStatus] failed:", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ============================================
// Reviews
// ============================================

export async function getReviews(filters?: { serviceId?: string; reviewerId?: string; limit?: number; offset?: number }): Promise<{ data: Review[]; total: number }> {
  const sb = await createServerSupabaseClient();
  let query = sb.from("reviews").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (filters?.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters?.reviewerId) query = query.eq("reviewer_id", filters.reviewerId);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, (filters.offset + (filters.limit ?? 20)) - 1);

  const { data, count } = await query;
  if (!data) return { data: [], total: 0 };
  return {
    data: data.map((r: any) => ({
      id: r.id,
      serviceId: r.service_id,
      orderId: r.order_id,
      userId: r.reviewer_id,
      userName: maskName(r.reviewer_name),
      rating: r.rating,
      content: r.content || "",
      helpfulCount: r.helpful_count || 0,
      createdAt: r.created_at,
    })),
    total: count ?? 0,
  };
}

export type CreateReviewResult = { ok: true } | { ok: false; status: number; error: string };

// 납품을 받았거나 구매가 확정된 주문만 리뷰를 쓸 수 있다.
const REVIEWABLE_ORDER_STATUSES = ["delivered", "review_pending", "completed"];

function normalizeRating(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  // 1~5 의 정수만 허용한다 (반올림으로 값을 바꾸지 않는다).
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

/**
 * 리뷰를 작성한다.
 *
 * 서비스·전문가는 클라이언트 입력이 아니라 주문에서 가져온다 (리뷰 대상은 주문의 서비스와 판매자).
 * 작성자 이름도 프로필에서 가져온다. INSERT 는 세션 클라이언트로 수행해 RLS 가 한 번 더 검증한다.
 */
export async function createReview(review: { orderId: string; reviewerId: string; rating: unknown; qualityRating?: unknown; communicationRating?: unknown; deliveryRating?: unknown; content?: unknown }): Promise<CreateReviewResult> {
  if (!review.orderId || typeof review.orderId !== "string") {
    return { ok: false, status: 400, error: "주문 정보가 필요합니다" };
  }

  const rating = normalizeRating(review.rating);
  if (rating === null) {
    return { ok: false, status: 400, error: "별점은 1~5 사이여야 합니다" };
  }
  const qualityRating = normalizeRating(review.qualityRating) ?? rating;
  const communicationRating = normalizeRating(review.communicationRating) ?? rating;
  const deliveryRating = normalizeRating(review.deliveryRating) ?? rating;
  const content = typeof review.content === "string" ? review.content.trim().slice(0, 5000) : "";

  const admin = createAdminSupabaseClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, service_id, status")
    .eq("id", review.orderId)
    .maybeSingle();

  if (!order) return { ok: false, status: 404, error: "주문을 찾을 수 없습니다" };
  if (order.buyer_id !== review.reviewerId) {
    return { ok: false, status: 403, error: "본인 주문에만 리뷰를 작성할 수 있습니다" };
  }
  if (!REVIEWABLE_ORDER_STATUSES.includes(order.status as string)) {
    return { ok: false, status: 409, error: "납품이 완료된 주문만 리뷰를 작성할 수 있습니다" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", review.reviewerId)
    .maybeSingle();
  const reviewerName = typeof profile?.name === "string" ? profile.name.trim() : "";

  const sb = await createServerSupabaseClient();
  const { error } = await sb.from("reviews").insert({
    order_id: order.id,
    service_id: order.service_id,
    reviewer_id: review.reviewerId,
    expert_id: order.seller_id,
    // 이름 전체를 저장하지 않는다. 첫 글자만 남긴 표시 이름을 넣는다 (DB 도 같은 규칙으로 다시 정한다).
    reviewer_name: reviewerName ? maskName(reviewerName) : null,
    rating,
    rating_overall: rating,
    quality_rating: qualityRating,
    communication_rating: communicationRating,
    delivery_rating: deliveryRating,
    content,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, status: 409, error: "이미 이 주문에 리뷰를 작성했습니다" };
    }
    console.error("[createReview] insert failed:", error);
    return { ok: false, status: 500, error: "리뷰 등록에 실패했습니다" };
  }

  // 서비스 평점·리뷰 수 집계 갱신 (작성자는 서비스 소유자가 아니므로 service_role 로 쓴다)
  const { data: allReviews } = await admin
    .from("reviews")
    .select("rating")
    .eq("service_id", order.service_id);
  const ratings = (allReviews ?? [])
    .map((r: { rating: number | null }) => r.rating)
    .filter((r): r is number => typeof r === "number");
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
  const { error: aggregateError } = await admin.from("services").update({
    rating: Math.round(avgRating * 10) / 10,
    review_count: ratings.length,
  }).eq("id", order.service_id);
  if (aggregateError) console.error("[createReview] aggregate update failed:", aggregateError);

  return { ok: true };
}

// ============================================
// Conversations & Messages
// ============================================

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!uuidRegex.test(userId)) return [];
  const sb = await createServerSupabaseClient();
  const { data } = await sb.from("conversations")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (!data) return [];
  return data.map((c: any) => ({
    id: c.id,
    participant1: c.buyer_id,
    participant2: c.seller_id,
    serviceId: c.service_id,
    quoteRequestId: c.quote_request_id,
    orderId: c.order_id,
    lastMessage: c.last_message,
    lastMessageAt: c.last_message_at,
    createdAt: c.created_at,
  }));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb.from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!data) return [];
  return data.map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    isRead: m.is_read,
    createdAt: m.created_at,
    messageType: m.message_type,
    fileUrl: m.file_url,
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  options?: { messageType?: MessageType; fileUrl?: string | null }
): Promise<Message | null> {
  const sb = await createServerSupabaseClient();
  const { data, error } = await sb.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    message_type: options?.messageType || "text",
    file_url: options?.fileUrl || null,
  }).select().single();

  if (error || !data) return null;

  // Update conversation last message
  await sb.from("conversations").update({ last_message: content, last_message_at: new Date().toISOString() }).eq("id", conversationId);

  return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, content: data.content, isRead: data.is_read, createdAt: data.created_at, messageType: data.message_type, fileUrl: data.file_url };
}

export async function createConversation(
  participant1: string,
  participant2: string,
  options?: { serviceId?: string | null; quoteRequestId?: string | null; orderId?: string | null }
): Promise<string | null> {
  if (!uuidRegex.test(participant1) || !uuidRegex.test(participant2)) return null;
  const sb = await createServerSupabaseClient();
  // Check existing
  let existingQuery = sb.from("conversations")
    .select("id")
    .or(`and(buyer_id.eq.${participant1},seller_id.eq.${participant2}),and(buyer_id.eq.${participant2},seller_id.eq.${participant1})`);

  if (options?.serviceId) existingQuery = existingQuery.eq("service_id", options.serviceId);
  if (options?.quoteRequestId) existingQuery = existingQuery.eq("quote_request_id", options.quoteRequestId);
  if (options?.orderId) existingQuery = existingQuery.eq("order_id", options.orderId);

  const { data: existing } = await existingQuery.limit(1).maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await sb.from("conversations").insert({
    buyer_id: participant1,
    seller_id: participant2,
    service_id: options?.serviceId || null,
    quote_request_id: options?.quoteRequestId || null,
    order_id: options?.orderId || null,
  }).select("id").single();
  if (error || !data) return null;
  return data.id;
}

// ============================================
// Expert Applications
// ============================================

export async function getExpertApplications(userId?: string): Promise<ExpertApplication[]> {
  const sb = await createServerSupabaseClient();
  let query = sb.from("expert_applications").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query;
  if (!data) return [];
  return data.map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    category: a.category,
    skills: a.skills || [],
    portfolioUrls: a.portfolio_urls || [],
    introduction: a.introduction,
    status: a.status,
    createdAt: a.created_at,
  }));
}

export async function createExpertApplication(app: { userId: string; name: string; email: string; phone?: string; category: string; skills: string[]; portfolioUrls: string[]; introduction?: string }): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const { error } = await sb.from("expert_applications").insert({
    user_id: app.userId,
    name: app.name,
    email: app.email,
    phone: app.phone,
    category: app.category,
    skills: app.skills,
    portfolio_urls: app.portfolioUrls,
    introduction: app.introduction,
    status: "pending",
  });
  return !error;
}

export async function updateApplicationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const { error } = await sb.from("expert_applications").update({ status }).eq("id", id);
  return !error;
}

// ============================================
// Quote Requests
// ============================================

export async function getQuoteRequests(filters?: { userId?: string; status?: string }): Promise<QuoteRequest[]> {
  const sb = await createServerSupabaseClient();
  let query = sb.from("quote_requests").select("*, profiles!quote_requests_requester_id_fkey(name, avatar_url)").order("created_at", { ascending: false });
  if (filters?.userId) query = query.eq("requester_id", filters.userId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  if (!data) return [];
  return data.map((q: any) => ({
    id: q.id,
    userId: q.requester_id,
    title: q.title,
    category: q.category,
    budgetMin: q.budget_min,
    budgetMax: q.budget_max,
    deadline: q.deadline,
    description: q.description,
    status: q.status,
    createdAt: q.created_at,
    userName: q.profiles?.name,
    userAvatar: q.profiles?.avatar_url,
  }));
}

export async function createQuoteRequest(req: { userId: string; title: string; category?: string; budgetMin?: number; budgetMax?: number; deadline?: string; description?: string }): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const { error } = await sb.from("quote_requests").insert({
    requester_id: req.userId,
    title: req.title,
    category: req.category,
    budget_min: req.budgetMin,
    budget_max: req.budgetMax,
    deadline: req.deadline,
    description: req.description,
    status: "open",
  });
  return !error;
}

// ============================================
// Profiles (for admin)
// ============================================

export async function getProfiles(): Promise<Profile[]> {
  const sb = createAdminSupabaseClient();
  // 목록에 쓰는 칸만 읽는다 (전화번호·본인인증 값은 가져오지 않는다).
  const { data } = await sb
    .from("profiles")
    .select("id, email, name, avatar_url, role, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map((p: any) => ({
    id: p.id,
    email: p.email || "",
    name: p.name || "",
    avatarUrl: p.avatar_url,
    role: p.role || "user",
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

export async function updateProfile(id: string, updates: { name?: string; avatarUrl?: string }): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  const { error } = await sb.from("profiles").update(dbUpdates).eq("id", id);
  return !error;
}

// ============================================
// Service CRUD (for dashboard)
// ============================================

export async function createService(svc: { expertId: string; categoryId: string; title: string; description: string; price: number; tags?: string[]; images?: string[]; status?: string; packages?: PackageInput[] }): Promise<string | null> {
  const sb = createAdminSupabaseClient();
  // 패키지가 있으면 대표 가격은 가장 싼 패키지 가격이다. 화면이 보낸 price 는 쓰지 않는다.
  const packagePrice = svc.packages ? lowestPrice(svc.packages) : null;
  const { data, error } = await sb.from("services").insert({
    expert_id: svc.expertId,
    category_id: svc.categoryId,
    title: svc.title,
    description: svc.description,
    price: packagePrice ?? svc.price,
    tags: svc.tags || [],
    images: svc.images || [],
    status: svc.status || "pending_review",
  }).select("id").single();
  if (error || !data) return null;

  if (svc.packages && svc.packages.length > 0) {
    const saved = await replaceServicePackages(data.id, svc.packages);
    if (!saved.ok) {
      // 패키지 없이 서비스만 남으면 "심사중"인데 살 수 있는 패키지가 없는 서비스가 된다. 방금 만든 것을 지운다 (패키지 행은 ON DELETE CASCADE 로 함께 지워진다).
      const { error: cleanupError } = await sb.from("services").delete().eq("id", data.id);
      if (cleanupError) console.error("[createService] 패키지 저장 실패 후 서비스 정리 실패", data.id, cleanupError);
      return null;
    }
  }
  return data.id;
}

export type ReplaceServicePackagesResult = { ok: true } | { ok: false; status: number; error: string };

// 서비스의 패키지를 넘겨받은 목록과 같게 맞춘다. DB 함수 replace_service_packages 가 한 트랜잭션으로 처리한다:
// 목록에 없는 이름의 패키지를 지우고, 나머지는 (service_id, name) 으로 고치거나 넣고 (sort_order = 목록 순번),
// 목록이 비어 있지 않으면 services.price 를 가장 싼 패키지 가격으로 맞춘다. 중간에 실패하면 아무것도 바뀌지 않는다.
// 기존 행을 고쳐 쓰는 이유: 주문(orders.package_id)이 가리키는 패키지는 지울 수 없어서, 매번 지우고 새로 넣을 수 없다.
export async function replaceServicePackages(serviceId: string, packages: PackageInput[]): Promise<ReplaceServicePackagesResult> {
  const sb = createAdminSupabaseClient();
  const { error } = await sb.rpc("replace_service_packages", { p_service_id: serviceId, p_packages: packages });
  if (!error) return { ok: true };
  if (error.code === "23503") {
    return { ok: false, status: 409, error: "이미 주문이 있는 패키지는 삭제할 수 없습니다" };
  }
  if (error.code === "23514" || error.code === "23505") {
    return { ok: false, status: 400, error: "패키지 값이 허용 범위를 벗어났거나 같은 이름의 패키지가 겹칩니다" };
  }
  console.error("[replaceServicePackages] 패키지 저장 실패", serviceId, error);
  return { ok: false, status: 500, error: "패키지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요" };
}

export async function updateService(id: string, updates: { title?: string; description?: string; price?: number; tags?: string[]; categoryId?: string; status?: string; rejectionReason?: string | null }): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;
  let query = sb.from("services").update(dbUpdates).eq("id", id);
  // 정지된 서비스의 상태는 여기서 바꾸지 않는다 (삭제는 예외). 정지 해제는 관리자 전용 경로로만 한다.
  if (updates.status !== undefined && updates.status !== "deleted") {
    query = query.neq("status", "suspended");
  }
  const { data, error } = await query.select("id");
  return !error && (data?.length ?? 0) > 0;
}

// ============================================
// Service Delete
// ============================================

export async function deleteService(id: string): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const { error } = await sb.from("services").update({ status: "deleted" }).eq("id", id);
  return !error;
}

// ============================================
// Review Delete
// ============================================

export async function deleteReview(id: string): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const { error } = await sb.from("reviews").delete().eq("id", id);
  return !error;
}

// ============================================
// Category CRUD
// ============================================

export async function createCategory(cat: { name: string; slug: string; description?: string; icon?: string }): Promise<string | null> {
  const sb = await createServerSupabaseClient();
  // Get max sort_order
  const { data: maxData } = await sb.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const nextOrder = (maxData?.[0]?.sort_order || 0) + 1;

  const { data, error } = await sb.from("categories").insert({
    name: cat.name,
    slug: cat.slug,
    description: cat.description || "",
    icon: cat.icon || "Sparkles",
    sort_order: nextOrder,
    service_count: 0,
  }).select("id").single();

  if (error || !data) return null;
  return data.id;
}

export async function updateCategory(id: string, updates: { name?: string; slug?: string; description?: string; icon?: string; sortOrder?: number }): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  const { error } = await sb.from("categories").update(dbUpdates).eq("id", id);
  return !error;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const { error } = await sb.from("categories").delete().eq("id", id);
  return !error;
}

// ============================================
// Admin Stats
// ============================================

export interface AdminStats {
  userCount: number;
  expertCount: number;
  serviceCount: number;
  totalOrders: number;
  totalRevenue: number;
  pendingServices: number;
  pendingExperts: number;
  pendingReports: number;
  refundRequests: number;
  pendingSupport: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const sb = createAdminSupabaseClient();

  const [u, e, s, o, pendingSvc, pendingExp, refundReq, pendingSupportRow, pendingReportsRow] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("experts").select("*", { count: "exact", head: true }),
    sb.from("services").select("*", { count: "exact", head: true }),
    sb.from("orders").select("*", { count: "exact", head: true }),
    sb.from("services").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    sb.from("expert_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("orders").select("*", { count: "exact", head: true }).in("status", ["refunded", "cancelled"]),
    sb.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    sb.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Revenue from completed orders
  const { data: revenueData } = await sb.from("orders").select("amount").eq("status", "completed");
  const totalRevenue = (revenueData || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

  // Monthly revenue for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { data: monthlyData } = await sb
    .from("orders")
    .select("amount, created_at")
    .eq("status", "completed")
    .gte("created_at", sixMonthsAgo.toISOString());

  const revenueByMonth: Record<string, number> = {};
  for (const row of monthlyData || []) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + (row.amount || 0);
  }

  // Build last 6 months list in order
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue.push({ month: `${d.getMonth() + 1}월`, revenue: revenueByMonth[key] || 0 });
  }

  return {
    userCount: u.count || 0,
    expertCount: e.count || 0,
    serviceCount: s.count || 0,
    totalOrders: o.count || 0,
    totalRevenue,
    pendingServices: pendingSvc.count || 0,
    pendingExperts: pendingExp.count || 0,
    pendingReports: pendingReportsRow.count || 0,
    refundRequests: refundReq.count || 0,
    pendingSupport: pendingSupportRow.count || 0,
    monthlyRevenue,
  };
}
