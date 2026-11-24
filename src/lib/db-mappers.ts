// DB 행 → 앱 타입 변환. db-client / db-server / db-public 이 함께 쓴다.
// 이 파일은 런타임 import 가 없어야 한다 (tests/db-mappers.test.mjs 가 Node 로 직접 읽는다).
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
  ServicePackage,
} from "@/types";
import type { DBCategory, DBExpert, DBService } from "@/types/db";

export type DBServicePackageRow = {
  name: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[] | null;
};

// 전문가 카드에는 프로필의 이름·사진만 읽는다 (profiles(name, avatar_url)).
export type DBExpertProfileRelation = { name?: string | null; avatar_url?: string | null };

export type DBExpertWithProfileRow = DBExpert & {
  profiles?: DBExpertProfileRelation | DBExpertProfileRelation[] | null;
};

export type DBServiceTitleRelation = { title?: string | null } | { title?: string | null }[] | null;
export type DBProfileRelation = { name?: string | null; avatar_url?: string | null } | { name?: string | null; avatar_url?: string | null }[] | null;

export type DBOrderRow = {
  id: string;
  buyer_id: string;
  service_id: string;
  seller_id: string;
  package_id: string | null;
  amount: number;
  status: Order["status"];
  payment_id: string | null;
  requirements: string | null;
  created_at: string;
  updated_at: string;
  deal_offer_id?: string | null;
  services?: DBServiceTitleRelation;
  profiles?: DBProfileRelation;
};

export type DBReviewRow = {
  id: string;
  service_id: string;
  order_id: string | null;
  reviewer_id: string;
  reviewer_name: string | null;
  rating: number;
  content: string | null;
  helpful_count: number | null;
  created_at: string;
};

export type DBConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string | null;
  quote_request_id: string | null;
  order_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
};

export type DBMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type: Message["messageType"];
  file_url: string | null;
};

export type DBExpertApplicationRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  skills: string[] | null;
  portfolio_urls: string[] | null;
  introduction: string | null;
  status: ExpertApplication["status"];
  created_at: string;
};

export type DBQuoteRequestRow = {
  id: string;
  requester_id: string;
  title: string;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  description: string | null;
  status: QuoteRequest["status"];
  created_at: string;
  profiles?: DBProfileRelation;
};

// 관리자 회원 목록에 쓰는 칸만 (전화번호·본인인증 값은 읽지 않는다).
export type DBAppProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: Profile["role"] | null;
  created_at: string | null;
  updated_at: string | null;
};

// 저장된 패키지가 없는 서비스에 보여 주는 자리표시 패키지. 화면은 isPlaceholder 로 구분한다.
const DEFAULT_PACKAGES = (price: number): ServicePackage[] => [
  { name: "베이직", price, deliveryDays: 7, revisions: 2, features: ["기본 제작"], isPlaceholder: true },
];

function firstRelation<T>(relation?: T | T[] | null): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export function mapServicePackages(packages?: DBServicePackageRow[] | null, fallbackPrice?: number): ServicePackage[] {
  if (packages && packages.length > 0) {
    return packages.map((pkg) => ({
      name: pkg.name,
      price: pkg.price,
      deliveryDays: pkg.delivery_days,
      revisions: pkg.revisions,
      features: pkg.features || [],
    }));
  }

  return typeof fallbackPrice === "number" ? DEFAULT_PACKAGES(fallbackPrice) : [];
}

export function dbServiceToApp(service: DBService, packages?: DBServicePackageRow[] | null): Service {
  return {
    id: service.id,
    title: service.title,
    description: service.description || "",
    thumbnail: service.thumbnail_url || "/thumbnails/svc-1.jpg",
    images: service.images || [],
    categoryId: service.category_id,
    expertId: service.expert_id,
    price: service.price,
    rating: service.rating || 0,
    reviewCount: service.review_count || 0,
    salesCount: service.sales_count || 0,
    viewCount: service.view_count || 0,
    tags: service.tags || [],
    isPrime: service.is_prime || false,
    isFastResponse: service.is_fast_response || false,
    packages: mapServicePackages(packages, service.price),
    createdAt: service.created_at?.split("T")[0] || "2026-01-01",
    status: (service.status as Service["status"]) || "active",
    rejectionReason: service.rejection_reason || undefined,
  };
}

export function dbExpertToApp(expert: DBExpert, profile?: DBExpertProfileRelation | null): Expert {
  const parts = (expert.title || "").split(" - ");
  const name = profile?.name || parts[0] || "전문가";
  const title = parts.slice(1).join(" - ") || parts[0] || "";

  return {
    id: expert.id,
    name,
    title,
    profileImage: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    categoryId: expert.category_id,
    isPrime: expert.is_prime || false,
    isMaster: expert.is_master || false,
    rating: expert.rating || 0,
    reviewCount: expert.review_count || 0,
    completionRate: expert.completion_rate || 0,
    // 측정한 값이 없으면 비워 둔다 (기본값을 지어내지 않는다).
    responseTime: expert.response_time || "",
    skills: expert.skills || [],
    tools: expert.tools || [],
    introduction: expert.introduction || "",
    joinedAt: expert.created_at?.split("T")[0] || "2026-01-01",
  };
}

export function dbCategoryToApp(category: DBCategory): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    icon: category.icon || "Sparkles",
    serviceCount: category.service_count || 0,
  };
}

export function mapExpertWithProfile(row: DBExpertWithProfileRow): Expert {
  const { profiles, ...expert } = row;
  return dbExpertToApp(expert, firstRelation(profiles));
}

export function mapOrderRow(row: DBOrderRow): Order {
  const service = firstRelation(row.services);
  const profile = firstRelation(row.profiles);

  return {
    id: row.id,
    buyerId: row.buyer_id,
    serviceId: row.service_id,
    expertId: row.seller_id,
    // 화면이 비어 있으면 각자 "-"·"협의견적" 등으로 채운다. 여기서는 값을 지어내지 않는다.
    packageName: row.package_id ?? "",
    price: row.amount,
    status: row.status,
    paymentId: row.payment_id || undefined,
    requirements: row.requirements || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serviceName: service?.title || undefined,
    buyerName: profile?.name || undefined,
    buyerAvatar: profile?.avatar_url || undefined,
    dealOfferId: row.deal_offer_id || undefined,
  };
}

// 작성자 이름은 반드시 가려서 내보낸다. 가리는 함수(maskName)를 부르는 쪽에서 넘긴다
// (이 파일에 런타임 import 를 두지 않기 위해서다).
export function mapReviewRow(row: DBReviewRow, maskReviewerName: (name: string | null | undefined) => string): Review {
  return {
    id: row.id,
    serviceId: row.service_id,
    orderId: row.order_id || undefined,
    userId: row.reviewer_id,
    userName: maskReviewerName(row.reviewer_name),
    rating: row.rating,
    content: row.content || "",
    helpfulCount: row.helpful_count || 0,
    createdAt: row.created_at,
  };
}

export function mapConversationRow(row: DBConversationRow): Conversation {
  return {
    id: row.id,
    participant1: row.buyer_id,
    participant2: row.seller_id,
    serviceId: row.service_id || undefined,
    quoteRequestId: row.quote_request_id || undefined,
    orderId: row.order_id || undefined,
    lastMessage: row.last_message || undefined,
    lastMessageAt: row.last_message_at || undefined,
    createdAt: row.created_at,
  };
}

export function mapMessageRow(row: DBMessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
    messageType: row.message_type,
    fileUrl: row.file_url || undefined,
  };
}

export function mapExpertApplicationRow(row: DBExpertApplicationRow): ExpertApplication {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    category: row.category,
    skills: row.skills || [],
    portfolioUrls: row.portfolio_urls || [],
    introduction: row.introduction || undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapQuoteRequestRow(row: DBQuoteRequestRow): QuoteRequest {
  const profile = firstRelation(row.profiles);

  return {
    id: row.id,
    userId: row.requester_id,
    title: row.title,
    category: row.category || undefined,
    // 0 원도 유효한 값이므로 || 가 아니라 ?? 로 처리한다.
    budgetMin: row.budget_min ?? undefined,
    budgetMax: row.budget_max ?? undefined,
    deadline: row.deadline || undefined,
    description: row.description || undefined,
    status: row.status,
    createdAt: row.created_at,
    userName: profile?.name || undefined,
    userAvatar: profile?.avatar_url || undefined,
  };
}

export function mapProfileRow(row: DBAppProfileRow): Profile {
  return {
    id: row.id,
    email: row.email || "",
    name: row.name || "",
    avatarUrl: row.avatar_url || undefined,
    role: row.role || "user",
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}
