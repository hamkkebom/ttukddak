export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  serviceCount: number;
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
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}
