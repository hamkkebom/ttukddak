import { createClient } from "@/lib/supabase/client";
import type { Service, Expert, Category, Order, Review, Conversation, Message, ExpertApplication, QuoteRequest, Profile } from "@/types";
import type { DBService, DBExpert, DBCategory, DBProfile } from "@/types/db";

// ============================================
// Transform DB → App types
// ============================================

const DEFAULT_PACKAGES = (price: number) => [
  { name: "베이직", price, deliveryDays: 7, revisions: 2, features: ["기본 제작"] },
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
    responseTime: e.response_time || "1시간 이내",
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
    .order("sales_count", { ascending: false });

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
    sb.from("service_packages").select("*").eq("service_id", id).order("price"),
  ]);

  return data ? dbServiceToApp(data, packages || undefined) : null;
}

export async function getExpertByIdClient(id: string): Promise<Expert | null> {
  const sb = createClient();
  const { data } = await sb
    .from("experts")
    .select("*, profiles(name, email, avatar_url, role)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const profile = (data as any).profiles;
  delete (data as any).profiles;
  return dbExpertToApp(data as any, profile);
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
    .order("sales_count", { ascending: false })
    .limit(50);

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
    userName: r.reviewer_name || "사용자", rating: r.rating, content: r.content || "",
    helpfulCount: r.helpful_count || 0, createdAt: r.created_at,
  }));
}

// ============================================
// Conversations & Messages (Client)
// ============================================

export async function getConversationsClient(userId: string): Promise<Conversation[]> {
  if (!uuidRegex.test(userId)) return [];
  const sb = createClient();
  const { data } = await sb.from("conversations")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (!data) return [];
  return data.map((c: any) => ({
    id: c.id, participant1: c.buyer_id, participant2: c.seller_id,
    lastMessage: c.last_message, lastMessageAt: c.last_message_at, createdAt: c.created_at,
  }));
}

export async function getMessagesClient(conversationId: string): Promise<Message[]> {
  const sb = createClient();
  const { data } = await sb.from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!data) return [];
  return data.map((m: any) => ({
    id: m.id, conversationId: m.conversation_id, senderId: m.sender_id,
    content: m.content, isRead: m.is_read, createdAt: m.created_at,
  }));
}

export async function sendMessageClient(
  conversationId: string,
  senderId: string,
  content: string,
  options?: { messageType?: string; fileUrl?: string }
): Promise<Message | null> {
  const sb = createClient();
  const { data, error } = await sb.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    message_type: options?.messageType || "text",
    file_url: options?.fileUrl || null,
  }).select().single();

  if (error || !data) return null;
  const displayContent = options?.messageType === "image" ? "📷 이미지" : options?.messageType === "file" ? "📎 파일" : content;
  await sb.from("conversations").update({ last_message: displayContent, last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, content: data.content, isRead: data.is_read, createdAt: data.created_at, messageType: data.message_type, fileUrl: data.file_url };
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

export async function createExpertApplicationClient(app: { userId: string; name: string; email: string; phone?: string; category: string; skills: string[]; portfolioUrls: string[]; introduction?: string }): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("expert_applications").insert({
    user_id: app.userId, name: app.name, email: app.email, phone: app.phone,
    category: app.category, skills: app.skills, portfolio_urls: app.portfolioUrls,
    introduction: app.introduction, status: "pending",
  });
  return !error;
}

// ============================================
// Quote Requests (Client)
// ============================================

export async function getQuoteRequestsClient(): Promise<QuoteRequest[]> {
  const sb = createClient();
  const { data } = await sb.from("quote_requests").select("*").order("created_at", { ascending: false });
  if (!data) return [];
  return data.map((q: any) => ({
    id: q.id, userId: q.requester_id, title: q.title, category: q.category,
    budgetMin: q.budget_min, budgetMax: q.budget_max, deadline: q.deadline,
    description: q.description, status: q.status, createdAt: q.created_at,
  }));
}

export async function createQuoteRequestClient(req: { userId: string; title: string; category?: string; budgetMin?: number; budgetMax?: number; deadline?: string; description?: string }): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("quote_requests").insert({
    requester_id: req.userId, title: req.title, category: req.category,
    budget_min: req.budgetMin, budget_max: req.budgetMax,
    deadline: req.deadline, description: req.description, status: "open",
  });
  return !error;
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
  const sb = createClient();
  const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
  if (!data) return [];
  return data.map((p: any) => ({
    id: p.id, email: p.email || "", name: p.name || "", avatarUrl: p.avatar_url,
    role: p.role || "user", createdAt: p.created_at, updatedAt: p.updated_at,
  }));
}
