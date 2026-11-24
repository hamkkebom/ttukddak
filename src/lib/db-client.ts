import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  Conversation,
  Expert,
  ExpertApplication,
  Message,
  Order,
  Profile,
  QuoteRequest,
  Review,
  Service,
} from "@/types";
import {
  dbCategoryToApp,
  dbServiceToApp,
  mapExpertApplicationRow,
  mapExpertWithProfile,
  mapOrderRow,
  mapProfileRow,
  mapReviewRow,
  type DBAppProfileRow,
  type DBExpertApplicationRow,
  type DBExpertWithProfileRow,
  type DBOrderRow,
  type DBReviewRow,
  type DBServicePackageRow,
} from "@/lib/db-mappers";

// ============================================
// Input sanitization helpers
// ============================================

function sanitizeFilterValue(value: string): string {
  return value.replace(/[(),.*]/g, "");
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
  return (data || []).map((service) => dbServiceToApp(service));
}

export async function getAllServicesAdminClient(): Promise<Service[]> {
  const sb = createClient();
  const { data } = await sb
    .from("services")
    .select("*")
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  return (data || []).map((service) => dbServiceToApp(service));
}

export async function getServiceByIdClient(id: string): Promise<Service | null> {
  const sb = createClient();
  const [{ data }, { data: packages }] = await Promise.all([
    sb.from("services").select("*").eq("id", id).maybeSingle(),
    sb.from("service_packages").select("*").eq("service_id", id).order("price"),
  ]);

  return data ? dbServiceToApp(data, (packages as DBServicePackageRow[] | null) || undefined) : null;
}

export async function getExpertByIdClient(id: string): Promise<Expert | null> {
  const sb = createClient();
  const { data } = await sb
    .from("experts")
    .select("*, profiles(name, email, avatar_url, role)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return mapExpertWithProfile(data as DBExpertWithProfileRow);
}

export async function getServicesByExpertClient(expertId: string): Promise<Service[]> {
  const sb = createClient();
  const { data } = await sb
    .from("services")
    .select("*")
    .eq("expert_id", expertId)
    .eq("status", "active");

  return (data || []).map((service) => dbServiceToApp(service));
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

  return (data || []).map((service) => dbServiceToApp(service));
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
  return data.map((order) => mapOrderRow(order as DBOrderRow));
}

export async function getOrderByIdClient(id: string): Promise<Order | null> {
  const sb = createClient();
  const { data } = await sb.from("orders").select("*, services(title), profiles!orders_buyer_id_fkey(name, avatar_url)").eq("id", id).maybeSingle();
  if (!data) return null;
  return mapOrderRow(data as DBOrderRow);
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
  return data.map((review) => mapReviewRow(review as DBReviewRow));
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
  return mapExpertApplicationRow(data as DBExpertApplicationRow);
}

export async function createExpertApplicationClient(app: { userId: string; name: string; email: string; phone?: string; category: string; skills: string[]; portfolioUrls: string[]; introduction?: string; idVerificationUrl?: string; businessRegistrationUrl?: string }): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("expert_applications").insert({
    user_id: app.userId,
    name: app.name,
    email: app.email,
    phone: app.phone,
    category: app.category,
    skills: app.skills,
    portfolio_urls: app.portfolioUrls,
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
  const dbUpdates: { updated_at: string; name?: string; phone?: string; bio?: string } = {
    updated_at: new Date().toISOString(),
  };
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
  return data.map((profile) => mapProfileRow(profile as DBAppProfileRow));
}
