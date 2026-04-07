export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "user" | "expert" | "admin";
  is_expert_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type Expert = {
  id: string;
  title: string;
  category_id: string;
  introduction: string | null;
  skills: string[];
  tools: string[];
  is_prime: boolean;
  is_master: boolean;
  response_time: string;
  completion_rate: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
};

export type Service = {
  id: string;
  expert_id: string;
  category_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  images: string[];
  price: number;
  tags: string[];
  is_prime: boolean;
  is_fast_response: boolean;
  status: "pending" | "active" | "inactive" | "reported";
  sales_count: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  // joined
  expert?: Expert;
  packages?: ServicePackage[];
};

export type ServicePackage = {
  id: string;
  service_id: string;
  name: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  sort_order: number;
};

export type Order = {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  service_id: string;
  package_id: string | null;
  amount: number;
  fee: number;
  status: "paid" | "in_progress" | "review_pending" | "revision_requested" | "completed" | "cancelled" | "refund_requested" | "refunded";
  requirements: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  order_id: string;
  service_id: string;
  reviewer_id: string;
  expert_id: string;
  rating_overall: number;
  rating_quality: number | null;
  rating_communication: number | null;
  rating_delivery: number | null;
  content: string | null;
  images: string[];
  is_public: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string | null;
  order_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "file" | "image" | "quote" | "delivery";
  file_url: string | null;
  is_read: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: "order" | "message" | "review" | "payment" | "promo" | "system";
  title: string;
  description: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};
