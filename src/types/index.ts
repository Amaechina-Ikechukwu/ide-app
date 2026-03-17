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

export interface PaymentTransaction {
  id: string;
  userId: string;
  bundle: TokenBundle["id"] | string;
  units: number;
  amountPaid: number;
  currency: string;
  paymentRef: string;
  createdAt: number;
  completedAt?: number | null;
  status: string;
  channel?: string | null;
  paystackTransactionId?: number | null;
}

export interface LandingContent {
  headline: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  tokenCost: number;
  durationHours: number;
  updatedAt: number;
}

export interface Contact {
  email: string;
  phone: string;
  whatsapp: string;
}

export interface MessagingProfile {
  uid: string;
  displayName: string;
  email: string | null;
  avatarInitial: string;
  updatedAt: number;
}

export interface ConversationParticipantSummary extends MessagingProfile {
  lastReadAt?: number | null;
}

export interface ConversationRecord {
  id: string;
  postId: string;
  postTitle: string;
  postType: PostType;
  postImageUrl: string | null;
  postPrice: number | null;
  createdAt: number;
  updatedAt: number;
  lastMessageText: string;
  lastMessageAt: number | null;
  lastMessageSenderId: string | null;
  participantIds: string[];
  participants: Record<string, ConversationParticipantSummary>;
}

export interface ConversationListItem {
  conversationId: string;
  postId: string;
  postTitle: string;
  postType: PostType;
  postImageUrl: string | null;
  postPrice: number | null;
  createdAt: number;
  updatedAt: number;
  lastMessageText: string;
  lastMessageAt: number | null;
  lastMessageSenderId: string | null;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantEmail: string | null;
  otherParticipantInitial: string;
  unreadCount: number;
  lastReadAt?: number | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: number;
}
