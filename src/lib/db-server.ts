import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
    .order("sales_count", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((s: any) => dbServiceToApp(s));
}

export async function getServiceByIdDB(id: string): Promise<Service | null> {
  const sb = await createServerSupabaseClient();
  const [{ data }, { data: packages }] = await Promise.all([
    sb.from("services").select("*").eq("id", id).maybeSingle(),
    sb.from("service_packages").select("*").eq("service_id", id).order("price"),
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
    .order("sales_count", { ascending: false });

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
  const lower = `%${query}%`;
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
      dataQuery = dataQuery.order("sales_count", { ascending: false });
      break;
  }

  dataQuery = dataQuery.range(offset, offset + limit - 1);

  const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);

  return {
    services: (data || []).map((s: any) => dbServiceToApp(s)),
    total: count ?? 0,
  };
}

export async function getExperts(limit?: number): Promise<Expert[]> {
  const sb = await createServerSupabaseClient();
  let query = sb
    .from("experts")
    .select("*, profiles(name, email, avatar_url, role)")
    .order("rating", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  if (!data) return [];

  return data.map((row: any) => {
    const profile = row.profiles;
    delete row.profiles;
    return dbExpertToApp(row, profile);
  });
}

export async function getExpertByIdDB(id: string): Promise<Expert | null> {
  const sb = await createServerSupabaseClient();
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

export async function getExpertsByCategory(categoryId: string): Promise<Expert[]> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb
    .from("experts")
    .select("*, profiles(name, email, avatar_url, role)")
    .eq("category_id", categoryId);

  if (!data) return [];
  return data.map((row: any) => {
    const profile = row.profiles;
    delete row.profiles;
    return dbExpertToApp(row, profile);
  });
}

// ============================================
// Orders
// ============================================

export async function getOrders(filters?: { buyerId?: string; expertId?: string; status?: string }): Promise<Order[]> {
  const sb = await createServerSupabaseClient();
  let query = sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").order("created_at", { ascending: false });

  if (filters?.buyerId) query = query.eq("buyer_id", filters.buyerId);
  if (filters?.expertId) query = query.eq("expert_id", filters.expertId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  if (!data) return [];
  return data.map((o: any) => ({
    id: o.id,
    buyerId: o.buyer_id,
    serviceId: o.service_id,
    expertId: o.expert_id,
    packageName: o.package_name,
    price: o.price,
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
    expertId: data.expert_id,
    packageName: data.package_name,
    price: data.price,
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

export async function createOrder(order: { buyerId: string; serviceId: string; expertId: string; packageName: string; price: number; requirements?: string }): Promise<Order | null> {
  const sb = await createServerSupabaseClient();
  const { data, error } = await sb.from("orders").insert({
    buyer_id: order.buyerId,
    service_id: order.serviceId,
    expert_id: order.expertId,
    package_name: order.packageName,
    price: order.price,
    requirements: order.requirements,
    status: "pending",
  }).select().single();

  if (error || !data) return null;
  return { id: data.id, buyerId: data.buyer_id, serviceId: data.service_id, expertId: data.expert_id, packageName: data.package_name, price: data.price, status: data.status, paymentId: data.payment_id, requirements: data.requirements, createdAt: data.created_at, updatedAt: data.updated_at };
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const { error } = await sb.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}

// ============================================
// Reviews
// ============================================

export async function getReviews(filters?: { serviceId?: string; reviewerId?: string }): Promise<Review[]> {
  const sb = await createServerSupabaseClient();
  let query = sb.from("reviews").select("*").order("created_at", { ascending: false });
  if (filters?.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters?.reviewerId) query = query.eq("reviewer_id", filters.reviewerId);

  const { data } = await query;
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    serviceId: r.service_id,
    orderId: r.order_id,
    userId: r.reviewer_id,
    userName: r.reviewer_name || "사용자",
    rating: r.rating,
    content: r.content || "",
    helpfulCount: r.helpful_count || 0,
    createdAt: r.created_at,
  }));
}

export async function createReview(review: { orderId: string; serviceId: string; reviewerId: string; reviewerName: string; rating: number; qualityRating?: number; communicationRating?: number; deliveryRating?: number; content: string }): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const { error } = await sb.from("reviews").insert({
    order_id: review.orderId,
    service_id: review.serviceId,
    reviewer_id: review.reviewerId,
    reviewer_name: review.reviewerName,
    rating: review.rating,
    quality_rating: review.qualityRating || review.rating,
    communication_rating: review.communicationRating || review.rating,
    delivery_rating: review.deliveryRating || review.rating,
    content: review.content,
  });
  return !error;
}

// ============================================
// Conversations & Messages
// ============================================

export async function getConversations(userId: string): Promise<Conversation[]> {
  const sb = await createServerSupabaseClient();
  const { data } = await sb.from("conversations")
    .select("*")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (!data) return [];
  return data.map((c: any) => ({
    id: c.id,
    participant1: c.participant_1,
    participant2: c.participant_2,
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
  }));
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<Message | null> {
  const sb = await createServerSupabaseClient();
  const { data, error } = await sb.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
  }).select().single();

  if (error || !data) return null;

  // Update conversation last message
  await sb.from("conversations").update({ last_message: content, last_message_at: new Date().toISOString() }).eq("id", conversationId);

  return { id: data.id, conversationId: data.conversation_id, senderId: data.sender_id, content: data.content, isRead: data.is_read, createdAt: data.created_at };
}

export async function createConversation(participant1: string, participant2: string): Promise<string | null> {
  const sb = await createServerSupabaseClient();
  // Check existing
  const { data: existing } = await sb.from("conversations")
    .select("id")
    .or(`and(participant_1.eq.${participant1},participant_2.eq.${participant2}),and(participant_1.eq.${participant2},participant_2.eq.${participant1})`)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await sb.from("conversations").insert({ participant_1: participant1, participant_2: participant2 }).select("id").single();
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
  const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
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

export async function createService(svc: { expertId: string; categoryId: string; title: string; description: string; price: number; tags?: string[]; images?: string[]; status?: string }): Promise<string | null> {
  const sb = await createServerSupabaseClient();
  const { data, error } = await sb.from("services").insert({
    expert_id: svc.expertId,
    category_id: svc.categoryId,
    title: svc.title,
    description: svc.description,
    price: svc.price,
    tags: svc.tags || [],
    images: svc.images || [],
    status: svc.status || "pending_review",
  }).select("id").single();
  if (error || !data) return null;
  return data.id;
}

export async function updateService(id: string, updates: { title?: string; description?: string; price?: number; tags?: string[]; categoryId?: string; status?: string; rejectionReason?: string | null }): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;
  const { error } = await sb.from("services").update(dbUpdates).eq("id", id);
  return !error;
}

// ============================================
// Service Delete
// ============================================

export async function deleteService(id: string): Promise<boolean> {
  const sb = await createServerSupabaseClient();
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

  const [u, e, s, o, pendingSvc, pendingExp, refundReq] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("experts").select("*", { count: "exact", head: true }),
    sb.from("services").select("*", { count: "exact", head: true }),
    sb.from("orders").select("*", { count: "exact", head: true }),
    sb.from("services").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    sb.from("expert_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("orders").select("*", { count: "exact", head: true }).in("status", ["refunded", "cancelled"]),
  ]);

  // Revenue from completed orders
  const { data: revenueData } = await sb.from("orders").select("price").eq("status", "completed");
  const totalRevenue = (revenueData || []).reduce((sum: number, r: any) => sum + (r.price || 0), 0);

  // Monthly revenue for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { data: monthlyData } = await sb
    .from("orders")
    .select("price, created_at")
    .eq("status", "completed")
    .gte("created_at", sixMonthsAgo.toISOString());

  const revenueByMonth: Record<string, number> = {};
  for (const row of monthlyData || []) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + (row.price || 0);
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
    pendingReports: 0,
    refundRequests: refundReq.count || 0,
    pendingSupport: 0,
    monthlyRevenue,
  };
}
