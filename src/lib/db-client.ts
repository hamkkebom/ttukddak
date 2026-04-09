import { createClient } from "@/lib/supabase/client";
import type { Service, Expert, Category, Order, Review, Conversation, Message, ExpertApplication, QuoteRequest, Profile } from "@/types";

// ============================================
// Types matching Supabase table schema
// ============================================

interface DBService {
  id: string;
  expert_id: string;
  category_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  images: string[];
  price: number;
  tags: string[];
  is_prime: boolean;
  is_fast_response: boolean;
  status: string;
  sales_count: number;
  rating: number;
  review_count: number;
  created_at: string;
  view_count: number;
  video_url: string | null;
}

interface DBExpert {
  id: string;
  title: string;
  category_id: string;
  introduction: string;
  skills: string[];
  tools: string[];
  is_prime: boolean;
  is_master: boolean;
  response_time: string;
  completion_rate: number;
  rating: number;
  review_count: number;
  experience: string;
  portfolio_links: string[];
  created_at: string;
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  service_count: number;
}

interface DBProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
}

// ============================================
// Transform DB → App types
// ============================================

const DEFAULT_PACKAGES = (price: number) => [
  { name: "베이직", price, deliveryDays: 7, revisions: 2, features: ["30초 영상", "HD 화질", "배경음악 포함", "자막 포함"] },
  { name: "스탠다드", price: price * 2, deliveryDays: 10, revisions: 3, features: ["1분 영상", "4K 화질", "배경음악 포함", "자막+효과음"] },
  { name: "프리미엄", price: price * 3, deliveryDays: 14, revisions: 5, features: ["2분 영상", "4K 화질", "맞춤 음악", "소스파일 제공"] },
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
    tags: s.tags || [],
    isPrime: s.is_prime || false,
    isFastResponse: s.is_fast_response || false,
    packages: pkgs,
    createdAt: s.created_at?.split("T")[0] || "2026-01-01",
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
  const lower = `%${query}%`;
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
  if (filters?.expertId) query = query.eq("expert_id", filters.expertId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  if (!data) return [];
  return data.map((o: any) => ({
    id: o.id, buyerId: o.buyer_id, serviceId: o.service_id, expertId: o.expert_id,
    packageName: o.package_name, price: o.price, status: o.status, paymentId: o.payment_id,
    requirements: o.requirements, createdAt: o.created_at, updatedAt: o.updated_at,
    serviceName: o.services?.title, buyerName: o.profiles?.name, buyerAvatar: o.profiles?.avatar_url,
  }));
}

export async function getOrderByIdClient(id: string): Promise<Order | null> {
  const sb = createClient();
  const { data } = await sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id, buyerId: data.buyer_id, serviceId: data.service_id, expertId: data.expert_id,
    packageName: data.package_name, price: data.price, status: data.status, paymentId: data.payment_id,
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
  const sb = createClient();
  const { data } = await sb.from("conversations")
    .select("*")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (!data) return [];
  return data.map((c: any) => ({
    id: c.id, participant1: c.participant_1, participant2: c.participant_2,
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

export async function sendMessageClient(conversationId: string, senderId: string, content: string): Promise<Message | null> {
  const sb = createClient();
  const { data, error } = await sb.from("messages").insert({
    conversation_id: conversationId, sender_id: senderId, content,
  }).select().single();

  if (error || !data) return null;
  await sb.from("conversations").update({ last_message: content, last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, content: data.content, isRead: data.is_read, createdAt: data.created_at };
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
    id: q.id, userId: q.user_id, title: q.title, category: q.category,
    budgetMin: q.budget_min, budgetMax: q.budget_max, deadline: q.deadline,
    description: q.description, status: q.status, createdAt: q.created_at,
  }));
}

export async function createQuoteRequestClient(req: { userId: string; title: string; category?: string; budgetMin?: number; budgetMax?: number; deadline?: string; description?: string }): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("quote_requests").insert({
    user_id: req.userId, title: req.title, category: req.category,
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
