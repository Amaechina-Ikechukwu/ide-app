export type PostType = "SALE" | "REQUEST";

export interface Post {
  id: string;
  deviceId: string;
  userId?: string;
  type: PostType;
  title: string;
  description: string;
  imageUrls: string[];
  price?: number;
  currency?: string;
  tags: string[];
  isPremium: boolean;
  tokenCost: number;
  createdAt: number; // Unix ms
  expiresAt: number; // Unix ms
  deleted: boolean;
}

export interface TokenBundle {
  id: "BUNDLE_100" | "BUNDLE_350" | "BUNDLE_1000";
  units: number;
  price: number;
  currency: string;
}

export interface LandingContent {
  headline: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  updatedAt: number;
}

export interface Contact {
  email: string;
  phone: string;
  whatsapp: string;
}
