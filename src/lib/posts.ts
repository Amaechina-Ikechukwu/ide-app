import type { Post, PostType } from "@/types";

type NormalizedPost = Post & { hasMessages: boolean };
type PostWithMessages = Partial<Post> & { hasMessages?: boolean };

function normalizePostType(value: unknown): PostType {
  return value === "REQUEST" ? "REQUEST" : "SALE";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizePost(
  value: PostWithMessages | null | undefined,
): NormalizedPost {
  const now = Date.now();

  return {
    id: typeof value?.id === "string" ? value.id : "",
    deviceId: typeof value?.deviceId === "string" ? value.deviceId : "",
    userId: typeof value?.userId === "string" ? value.userId : undefined,
    type: normalizePostType(value?.type),
    title: typeof value?.title === "string" ? value.title : "",
    description:
      typeof value?.description === "string" ? value.description : "",
    imageUrls: normalizeStringArray(value?.imageUrls),
    price:
      typeof value?.price === "number" && Number.isFinite(value.price)
        ? value.price
        : undefined,
    currency: typeof value?.currency === "string" ? value.currency : undefined,
    tags: normalizeStringArray(value?.tags),
    isPremium: Boolean(value?.isPremium),
    tokenCost: normalizeNumber(value?.tokenCost, 0),
    createdAt: normalizeNumber(value?.createdAt, now),
    expiresAt: normalizeNumber(value?.expiresAt, now),
    deleted: Boolean(value?.deleted),
    hasMessages: Boolean(value?.hasMessages),
  };
}

export function normalizePosts(
  values: PostWithMessages[] | null | undefined,
): NormalizedPost[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map(normalizePost);
}
