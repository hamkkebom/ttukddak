export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  serviceCount: number;
  parentId?: string;
  children?: Category[];
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  profileImage: string;
  categoryId: string;
  isPrime: boolean;
  isMaster: boolean;
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTime: string;
  skills: string[];
  tools: string[];
  introduction: string;
  joinedAt: string;
}

export interface ServicePackage {
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
  // 전문가가 패키지를 등록하지 않아 코드가 대신 채운 기본 패키지.
  // 이때의 작업 기간·수정 횟수·구성은 전문가가 정한 값이 아니므로 화면에 사실처럼 적지 않는다.
  isPlaceholder?: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  categoryId: string;
  expertId: string;
  price: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  tags: string[];
  isPrime: boolean;
  isFastResponse: boolean;
  packages: ServicePackage[];
  createdAt: string;
  viewCount?: number;
  status?: "draft" | "pending_review" | "active" | "rejected" | "suspended" | "deleted";
  rejectionReason?: string;
}

export interface Review {
  id: string;
  serviceId: string;
  orderId?: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  helpfulCount?: number;
  createdAt: string;
}

// 서비스 상세 화면에 공개하는 리뷰. 작성자 이름은 서버에서 가린 상태로만 내려보낸다.
export interface PublicReview {
  id: string;
  name: string;
  rating: number;
  content: string;
  createdAt: string;
  reply?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  serviceId: string;
  expertId: string;
  packageName: string;
  price: number;
  status: "pending" | "virtual_account_issued" | "paid" | "in_progress" | "delivered" | "review" | "review_pending" | "revision_requested" | "completed" | "cancelled" | "failed" | "refund_requested" | "refunded";
  paymentId?: string;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  serviceName?: string;
  expertName?: string;
  buyerName?: string;
  buyerAvatar?: string;
  dealOfferId?: string;
}

export type ConversationContext = {
  serviceId?: string;
  serviceTitle?: string;
  quoteRequestId?: string;
  quoteRequestTitle?: string;
  orderId?: string;
  orderStatus?: Order["status"];
};

export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  serviceId?: string;
  quoteRequestId?: string;
  orderId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  context?: ConversationContext;
  // Joined fields
  otherName?: string;
  otherAvatar?: string;
  unreadCount?: number;
}

export type MessageType = "text" | "file" | "image" | "quote" | "delivery" | "deal_offer" | "system";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  messageType?: MessageType;
  fileUrl?: string;
}

export type DealOfferStatus = "pending" | "accepted" | "rejected" | "expired" | "cancelled";

export interface DealOffer {
  id: string;
  conversationId: string;
  serviceId: string;
  quoteRequestId?: string;
  orderId?: string;
  buyerId: string;
  expertId: string;
  title: string;
  scope: string;
  amount: number;
  deliveryDays: number;
  revisions: number;
  memo?: string;
  status: DealOfferStatus;
  expiresAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  serviceTitle?: string;
  expertName?: string;
  buyerName?: string;
}

export interface CreateDealOfferInput {
  conversationId: string;
  serviceId: string;
  quoteRequestId?: string;
  title: string;
  scope: string;
  amount: number;
  deliveryDays: number;
  revisions: number;
  memo?: string;
  expiresAt?: string;
}

export interface ExpertApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  skills: string[];
  portfolioUrls: string[];
  introduction?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface QuoteRequest {
  id: string;
  userId: string;
  title: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: string;
  description?: string;
  status: "open" | "matched" | "quoted" | "in_discussion" | "closed";
  createdAt: string;
  // Joined
  userName?: string;
  userAvatar?: string;
}

export interface QuoteResponse {
  id: string;
  quoteRequestId: string;
  expertId: string;
  serviceId?: string;
  serviceTitle?: string;
  expertName?: string;
  expertAvatar?: string;
  price: number;
  message: string;
  estimatedDays: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "user" | "expert" | "admin";
  createdAt?: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  expertId: string;
  expertName?: string;
  orderId: string;
  serviceName?: string;
  orderAmount: number;
  feeRate: number;
  feeAmount: number;
  settlementAmount: number;
  status: "pending" | "scheduled" | "completed" | "held";
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
}

export interface ExpertBankAccount {
  expertId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number; // percent: 10 = 10%, fixed: 10000 = 10,000원
  minOrderAmount: number;
  maxDiscountAmount?: number; // for percent coupons
  totalIssued: number;
  totalUsed: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  coupon?: Coupon;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}
