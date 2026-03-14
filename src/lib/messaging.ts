import type {
    ChatMessage,
    ConversationListItem,
    ConversationParticipantSummary,
    ConversationRecord,
    MessagingProfile,
    Post,
    PostType,
} from "@/types";
import type { User } from "firebase/auth";
import {
    get,
    increment,
    limitToLast,
    onValue,
    orderByChild,
    push,
    query,
    ref,
    update,
} from "firebase/database";

import { realtimeDb } from "../../firebaseConfig";

const CONVERSATIONS_PATH = "conversations";
const MESSAGES_PATH = "messages";
const PROFILES_PATH = "messagingProfiles";
const USER_CONVERSATIONS_PATH = "userConversations";

function ensureMessagingConfigured() {
  if (!process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL) {
    throw new Error(
      "Messaging needs EXPO_PUBLIC_FIREBASE_DATABASE_URL before it can connect.",
    );
  }
}

function sanitizeKey(value: string) {
  return value.replace(/[.#$/\[\]]/g, "_");
}

function getFallbackDisplayName(
  email?: string | null,
  fallback = "Marketplace user",
) {
  if (!email) {
    return fallback;
  }

  const [namePart] = email.split("@");
  return namePart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAvatarInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "U";
}

function clampDisplayName(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "Marketplace user";
  }

  return trimmedValue.slice(0, 80);
}

function buildProfileFromUser(user: User): MessagingProfile {
  const displayName = clampDisplayName(
    user.displayName?.trim() || getFallbackDisplayName(user.email),
  );

  return {
    uid: user.uid,
    displayName,
    email: user.email ?? null,
    avatarInitial: getAvatarInitial(displayName),
    updatedAt: Date.now(),
  };
}

function buildFallbackProfile(uid: string, label: string): MessagingProfile {
  const displayName = clampDisplayName(label);

  return {
    uid,
    displayName,
    email: null,
    avatarInitial: getAvatarInitial(displayName),
    updatedAt: Date.now(),
  };
}

function normalizeProfile(
  uid: string,
  value: Partial<MessagingProfile> | null | undefined,
  fallbackLabel = "Marketplace user",
): MessagingProfile {
  const displayName = clampDisplayName(
    value?.displayName?.trim() || fallbackLabel,
  );

  return {
    uid,
    displayName,
    email: value?.email ?? null,
    avatarInitial:
      value?.avatarInitial?.trim() || getAvatarInitial(displayName),
    updatedAt: value?.updatedAt ?? Date.now(),
  };
}

function buildConversationSummary(
  conversationId: string,
  conversation: ConversationRecord,
  otherParticipant: MessagingProfile,
): ConversationListItem {
  return {
    conversationId,
    postId: conversation.postId,
    postTitle: conversation.postTitle,
    postType: conversation.postType,
    postImageUrl: conversation.postImageUrl ?? null,
    postPrice: conversation.postPrice ?? null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    lastMessageText: conversation.lastMessageText,
    lastMessageAt: conversation.lastMessageAt ?? null,
    lastMessageSenderId: conversation.lastMessageSenderId ?? null,
    otherParticipantId: otherParticipant.uid,
    otherParticipantName: otherParticipant.displayName,
    otherParticipantEmail: otherParticipant.email,
    otherParticipantInitial: otherParticipant.avatarInitial,
    unreadCount: 0,
    lastReadAt: null,
  };
}

function normalizeConversationSummary(
  conversationId: string,
  value: Partial<ConversationListItem> | null | undefined,
): ConversationListItem {
  return {
    conversationId,
    postId: value?.postId ?? "",
    postTitle: value?.postTitle ?? "Conversation",
    postType: (value?.postType as PostType | undefined) ?? "SALE",
    postImageUrl: value?.postImageUrl ?? null,
    postPrice: value?.postPrice ?? null,
    createdAt: value?.createdAt ?? 0,
    updatedAt: value?.updatedAt ?? 0,
    lastMessageText: value?.lastMessageText ?? "",
    lastMessageAt: value?.lastMessageAt ?? null,
    lastMessageSenderId: value?.lastMessageSenderId ?? null,
    otherParticipantId: value?.otherParticipantId ?? "",
    otherParticipantName: value?.otherParticipantName ?? "Marketplace user",
    otherParticipantEmail: value?.otherParticipantEmail ?? null,
    otherParticipantInitial: value?.otherParticipantInitial ?? "U",
    unreadCount: value?.unreadCount ?? 0,
    lastReadAt: value?.lastReadAt ?? null,
  };
}

function normalizeConversationRecord(
  conversationId: string,
  value: Partial<ConversationRecord> | null | undefined,
): ConversationRecord {
  const participants = Object.fromEntries(
    Object.entries(value?.participants ?? {}).map(([uid, participant]) => [
      uid,
      normalizeProfile(
        uid,
        participant as Partial<MessagingProfile>,
        "Marketplace user",
      ),
    ]),
  ) as Record<string, ConversationParticipantSummary>;

  const participantIds =
    Array.isArray(value?.participantIds) && value.participantIds.length > 0
      ? value.participantIds
      : Object.keys(participants);

  return {
    id: conversationId,
    postId: value?.postId ?? "",
    postTitle: value?.postTitle ?? "Conversation",
    postType: (value?.postType as PostType | undefined) ?? "SALE",
    postImageUrl: value?.postImageUrl ?? null,
    postPrice: value?.postPrice ?? null,
    createdAt: value?.createdAt ?? Date.now(),
    updatedAt: value?.updatedAt ?? Date.now(),
    lastMessageText: value?.lastMessageText ?? "",
    lastMessageAt: value?.lastMessageAt ?? null,
    lastMessageSenderId: value?.lastMessageSenderId ?? null,
    participantIds,
    participants,
  };
}

function normalizeMessage(
  messageId: string,
  conversationId: string,
  value: Partial<ChatMessage> | null | undefined,
): ChatMessage {
  return {
    id: messageId,
    conversationId,
    text: value?.text?.trim() ?? "",
    senderId: value?.senderId ?? "",
    senderName: value?.senderName ?? "Marketplace user",
    createdAt: value?.createdAt ?? 0,
  };
}

async function getMessagingProfile(uid: string) {
  ensureMessagingConfigured();
  const snapshot = await get(ref(realtimeDb, `${PROFILES_PATH}/${uid}`));
  if (!snapshot.exists()) {
    return null;
  }

  return normalizeProfile(
    uid,
    snapshot.val() as Partial<MessagingProfile>,
    "Marketplace user",
  );
}

function isPermissionDeniedError(error: unknown) {
  return (
    error instanceof Error &&
    /permission[_ ]denied/i.test(error.message)
  );
}

async function getConversationSnapshotIfAccessible(conversationId: string) {
  try {
    return await get(ref(realtimeDb, `${CONVERSATIONS_PATH}/${conversationId}`));
  } catch (error) {
    // New conversations are not readable until the current user is written
    // into the participants list by the bootstrap write.
    if (isPermissionDeniedError(error)) {
      return null;
    }

    throw error;
  }
}

export function isMessagingConfigured() {
  return Boolean(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL);
}

export function getConversationId(
  postId: string,
  firstUserId: string,
  secondUserId: string,
) {
  const [a, b] = [sanitizeKey(firstUserId), sanitizeKey(secondUserId)].sort();
  return `${sanitizeKey(postId)}__${a}__${b}`;
}

export async function syncMessagingProfile(user: User) {
  ensureMessagingConfigured();
  const profile = buildProfileFromUser(user);
  await update(ref(realtimeDb, `${PROFILES_PATH}/${user.uid}`), profile);
  return profile;
}

export async function createOrOpenConversation({
  currentUser,
  post,
}: {
  currentUser: User;
  post: Post;
}) {
  ensureMessagingConfigured();

  if (!post.userId) {
    throw new Error("This listing does not have a messaging-ready owner yet.");
  }

  if (post.userId === currentUser.uid) {
    throw new Error("You cannot message your own listing.");
  }

  const conversationId = getConversationId(
    post.id,
    currentUser.uid,
    post.userId,
  );
  const now = Date.now();
  const senderProfile = await syncMessagingProfile(currentUser);
  const recipientProfile =
    (await getMessagingProfile(post.userId)) ??
    buildFallbackProfile(
      post.userId,
      post.type === "SALE" ? "Seller" : "Buyer",
    );

  const [conversationSnapshot, senderSummarySnapshot] = await Promise.all([
    getConversationSnapshotIfAccessible(conversationId),
    get(
      ref(
        realtimeDb,
        `${USER_CONVERSATIONS_PATH}/${currentUser.uid}/${conversationId}`,
      ),
    ),
  ]);

  const existingConversation = conversationSnapshot?.exists()
    ? normalizeConversationRecord(
        conversationId,
        conversationSnapshot.val() as Partial<ConversationRecord>,
      )
    : null;
  const existingSenderSummary = senderSummarySnapshot.exists()
    ? normalizeConversationSummary(
        conversationId,
        senderSummarySnapshot.val() as Partial<ConversationListItem>,
      )
    : null;

  const conversation: ConversationRecord = {
    id: conversationId,
    postId: post.id,
    postTitle: post.title,
    postType: post.type,
    postImageUrl: post.imageUrls[0] ?? null,
    postPrice: post.price ?? null,
    createdAt: existingConversation?.createdAt ?? now,
    updatedAt: existingConversation?.updatedAt ?? now,
    lastMessageText: existingConversation?.lastMessageText ?? "",
    lastMessageAt: existingConversation?.lastMessageAt ?? null,
    lastMessageSenderId: existingConversation?.lastMessageSenderId ?? null,
    participantIds: [currentUser.uid, post.userId].sort(),
    participants: {
      ...(existingConversation?.participants ?? {}),
      [currentUser.uid]: {
        ...senderProfile,
        lastReadAt:
          existingConversation?.participants?.[currentUser.uid]?.lastReadAt ??
          now,
      },
      [post.userId]: {
        ...recipientProfile,
        lastReadAt:
          existingConversation?.participants?.[post.userId]?.lastReadAt ?? null,
      },
    },
  };

  const senderSummary = {
    ...buildConversationSummary(conversationId, conversation, recipientProfile),
    unreadCount: 0,
    lastReadAt: now,
  };
  const recipientSummary = {
    ...buildConversationSummary(conversationId, conversation, senderProfile),
    unreadCount: 0,
    lastReadAt: null,
  };

  // Persist the conversation shell first so first-contact summary writes
  // are authorized by the current database rules.
  await update(
    ref(realtimeDb, `${CONVERSATIONS_PATH}/${conversationId}`),
    conversation,
  );

  const summaryUpdates: Record<string, ConversationListItem> = {
    [`${USER_CONVERSATIONS_PATH}/${currentUser.uid}/${conversationId}`]: {
      ...(existingSenderSummary ?? {}),
      ...senderSummary,
    },
  };

  if (!existingConversation) {
    // The other participant's inbox summary is private to them, so only
    // create it during the initial conversation bootstrap.
    summaryUpdates[`${USER_CONVERSATIONS_PATH}/${post.userId}/${conversationId}`] =
      recipientSummary;
  }

  await update(ref(realtimeDb), summaryUpdates);

  return conversationId;
}

export function subscribeToUserConversations(
  userId: string,
  onChange: (items: ConversationListItem[]) => void,
) {
  ensureMessagingConfigured();

  return onValue(
    query(
      ref(realtimeDb, `${USER_CONVERSATIONS_PATH}/${userId}`),
      orderByChild("updatedAt"),
      limitToLast(50),
    ),
    (snapshot) => {
      const items = Object.entries(
        (snapshot.val() as Record<string, Partial<ConversationListItem>>) ?? {},
      )
        .map(([conversationId, value]) =>
          normalizeConversationSummary(conversationId, value),
        )
        .sort((left, right) => right.updatedAt - left.updatedAt);

      onChange(items);
    },
  );
}

export function subscribeToPostHasMessages(
  userId: string,
  postId: string,
  onChange: (hasMessages: boolean) => void,
) {
  ensureMessagingConfigured();

  return onValue(
    ref(realtimeDb, `${USER_CONVERSATIONS_PATH}/${userId}`),
    (snapshot) => {
      const hasMessages = Object.values(
        (snapshot.val() as Record<string, Partial<ConversationListItem>>) ?? {},
      ).some(
        (value) =>
          value?.postId === postId &&
          typeof value?.lastMessageAt === "number" &&
          Number.isFinite(value.lastMessageAt),
      );

      onChange(hasMessages);
    },
  );
}

export function subscribeToConversationSummary(
  userId: string,
  conversationId: string,
  onChange: (summary: ConversationListItem | null) => void,
) {
  ensureMessagingConfigured();

  return onValue(
    ref(realtimeDb, `${USER_CONVERSATIONS_PATH}/${userId}/${conversationId}`),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }

      onChange(
        normalizeConversationSummary(
          conversationId,
          snapshot.val() as Partial<ConversationListItem>,
        ),
      );
    },
  );
}

export function subscribeToConversationMessages(
  conversationId: string,
  onChange: (messages: ChatMessage[]) => void,
) {
  ensureMessagingConfigured();

  return onValue(
    query(
      ref(realtimeDb, `${MESSAGES_PATH}/${conversationId}`),
      orderByChild("createdAt"),
      limitToLast(200),
    ),
    (snapshot) => {
      const messages = Object.entries(
        (snapshot.val() as Record<string, Partial<ChatMessage>>) ?? {},
      )
        .map(([messageId, value]) =>
          normalizeMessage(messageId, conversationId, value),
        )
        .filter((message) => Boolean(message.text))
        .sort((left, right) => left.createdAt - right.createdAt);

      onChange(messages);
    },
  );
}

export async function markConversationAsRead(
  userId: string,
  conversationId: string,
) {
  ensureMessagingConfigured();
  const now = Date.now();

  await update(ref(realtimeDb), {
    [`${USER_CONVERSATIONS_PATH}/${userId}/${conversationId}/unreadCount`]: 0,
    [`${USER_CONVERSATIONS_PATH}/${userId}/${conversationId}/lastReadAt`]: now,
    [`${CONVERSATIONS_PATH}/${conversationId}/participants/${userId}/lastReadAt`]:
      now,
  });
}

export async function sendConversationMessage({
  conversationId,
  currentUser,
  text,
}: {
  conversationId: string;
  currentUser: User;
  text: string;
}) {
  ensureMessagingConfigured();

  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }

  const senderProfile = await syncMessagingProfile(currentUser);
  const conversationSnapshot = await get(
    ref(realtimeDb, `${CONVERSATIONS_PATH}/${conversationId}`),
  );

  if (!conversationSnapshot.exists()) {
    throw new Error("Conversation not found.");
  }

  const conversation = normalizeConversationRecord(
    conversationId,
    conversationSnapshot.val() as Partial<ConversationRecord>,
  );
  const now = Date.now();
  const messageRef = push(
    ref(realtimeDb, `${MESSAGES_PATH}/${conversationId}`),
  );

  if (!messageRef.key) {
    throw new Error("Unable to create message.");
  }

  const message: ChatMessage = {
    id: messageRef.key,
    conversationId,
    text: trimmedText,
    senderId: currentUser.uid,
    senderName: senderProfile.displayName,
    createdAt: now,
  };

  const rootUpdates: Record<string, unknown> = {
    [`${MESSAGES_PATH}/${conversationId}/${message.id}`]: message,
    [`${CONVERSATIONS_PATH}/${conversationId}/lastMessageText`]: trimmedText,
    [`${CONVERSATIONS_PATH}/${conversationId}/lastMessageAt`]: now,
    [`${CONVERSATIONS_PATH}/${conversationId}/lastMessageSenderId`]:
      currentUser.uid,
    [`${CONVERSATIONS_PATH}/${conversationId}/updatedAt`]: now,
    [`${CONVERSATIONS_PATH}/${conversationId}/participants/${currentUser.uid}`]:
      {
        ...(conversation.participants[currentUser.uid] ?? {}),
        ...senderProfile,
        lastReadAt: now,
      },
  };

  const participantIds = conversation.participantIds.filter(Boolean);

  for (const participantId of participantIds) {
    const otherParticipantId =
      participantIds.find((value) => value !== participantId) ??
      currentUser.uid;
    const otherParticipant =
      conversation.participants[otherParticipantId] ??
      buildFallbackProfile(otherParticipantId, "Marketplace user");
    const summary = buildConversationSummary(
      conversationId,
      {
        ...conversation,
        lastMessageText: trimmedText,
        lastMessageAt: now,
        lastMessageSenderId: currentUser.uid,
        updatedAt: now,
      },
      otherParticipant,
    );
    const basePath = `${USER_CONVERSATIONS_PATH}/${participantId}/${conversationId}`;

    rootUpdates[`${basePath}/conversationId`] = summary.conversationId;
    rootUpdates[`${basePath}/postId`] = summary.postId;
    rootUpdates[`${basePath}/postTitle`] = summary.postTitle;
    rootUpdates[`${basePath}/postType`] = summary.postType;
    rootUpdates[`${basePath}/postImageUrl`] = summary.postImageUrl;
    rootUpdates[`${basePath}/postPrice`] = summary.postPrice;
    rootUpdates[`${basePath}/createdAt`] = summary.createdAt;
    rootUpdates[`${basePath}/updatedAt`] = now;
    rootUpdates[`${basePath}/lastMessageText`] = trimmedText;
    rootUpdates[`${basePath}/lastMessageAt`] = now;
    rootUpdates[`${basePath}/lastMessageSenderId`] = currentUser.uid;
    rootUpdates[`${basePath}/otherParticipantId`] = otherParticipant.uid;
    rootUpdates[`${basePath}/otherParticipantName`] =
      otherParticipant.displayName;
    rootUpdates[`${basePath}/otherParticipantEmail`] = otherParticipant.email;
    rootUpdates[`${basePath}/otherParticipantInitial`] =
      otherParticipant.avatarInitial;

    if (participantId === currentUser.uid) {
      rootUpdates[`${basePath}/unreadCount`] = 0;
      rootUpdates[`${basePath}/lastReadAt`] = now;
    } else {
      rootUpdates[`${basePath}/unreadCount`] = increment(1);
    }
  }

  await update(ref(realtimeDb), rootUpdates);
}





