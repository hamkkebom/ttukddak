// Supabase table schema types (shared between db-client.ts and db-server.ts)

export interface DBService {
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
  rejection_reason?: string | null;
  sales_count: number;
  rating: number;
  review_count: number;
  created_at: string;
  view_count: number;
  video_url: string | null;
}

export interface DBExpert {
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

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  service_count: number;
}

export interface DBProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
}
