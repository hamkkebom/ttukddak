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

export interface Order {
  id: string;
  buyerId: string;
  serviceId: string;
  expertId: string;
  packageName: string;
  price: number;
  status: "pending" | "paid" | "in_progress" | "review" | "delivered" | "completed" | "cancelled" | "refunded";
  paymentId?: string;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  serviceName?: string;
  expertName?: string;
  buyerName?: string;
  buyerAvatar?: string;
}

export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  // Joined fields
  otherName?: string;
  otherAvatar?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
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
  status: "open" | "matched" | "closed";
  createdAt: string;
  // Joined
  userName?: string;
  userAvatar?: string;
}

export interface QuoteResponse {
  id: string;
  quoteRequestId: string;
  expertId: string;
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
