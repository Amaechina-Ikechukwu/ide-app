import { formatCurrency } from "@/lib/formatters";
import {
    isMessagingConfigured,
    subscribeToUserConversations,
} from "@/lib/messaging";
import { useStore } from "@/store/useStore";
import type { ConversationListItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatConversationTime(timestamp: number | null) {
  if (!timestamp) {
    return "";
  }

  const value = new Date(timestamp);
  const now = new Date();
  if (value.toDateString() === now.toDateString()) {
    return value.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return value.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function MessagesScreen() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const messagingReady = isMessagingConfigured();
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!messagingReady) {
      setError("Chat is not enabled in this app build yet.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToUserConversations(user.uid, (items) => {
        setConversations(items);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load conversations.",
      );
      setLoading(false);
    }
  }, [messagingReady, user]);

  const renderConversation = ({ item }: { item: ConversationListItem }) => {
    const preview =
      item.lastMessageText || "Start the conversation about this listing.";
    const formattedPrice =
      item.postPrice != null ? formatCurrency(item.postPrice) : null;

    return (
      <Pressable
        style={styles.threadCard}
        onPress={() => router.push(`/messages/${item.conversationId}` as never)}
      >
        <View style={styles.threadTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.otherParticipantInitial}
            </Text>
          </View>

          <View style={styles.threadBody}>
            <View style={styles.threadMetaRow}>
              <Text style={styles.threadName} numberOfLines={1}>
                {item.otherParticipantName}
              </Text>
              <Text style={styles.threadTime}>
                {formatConversationTime(item.lastMessageAt ?? item.updatedAt)}
              </Text>
            </View>

            <Text style={styles.threadPreview} numberOfLines={2}>
              {item.lastMessageSenderId === user?.uid && item.lastMessageText
                ? `You: ${preview}`
                : preview}
            </Text>

            <View style={styles.listingRow}>
              {item.postImageUrl ? (
                <Image
                  source={{ uri: item.postImageUrl }}
                  style={styles.listingThumb}
                />
              ) : (
                <View style={styles.listingThumbFallback}>
                  <Ionicons
                    name={
                      item.postType === "SALE"
                        ? "pricetag-outline"
                        : "search-outline"
                    }
                    size={14}
                    color="#2563EB"
                  />
                </View>
              )}

              <View style={styles.listingTextWrap}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {item.postTitle}
                </Text>
                <Text style={styles.listingMeta} numberOfLines={1}>
                  {item.postType === "SALE" ? "Selling" : "Looking for"}
                  {formattedPrice ? `  �  ${formattedPrice}` : ""}
                </Text>
              </View>
            </View>
          </View>

          {item.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {!user ? (
        <View style={styles.center}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.title}>Sign In Required</Text>
          <Text style={styles.subtitle}>
            Create an account or sign in to start messaging buyers and sellers.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.primaryBtnText}>Sign In or Register</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="chatbubbles-outline" size={52} color="#9CA3AF" />
          </View>
          <Text style={styles.title}>Messaging Unavailable</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.secondaryBtnText}>Browse Listings</Text>
            <Ionicons name="arrow-forward" size={16} color="#2563EB" />
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderConversation}
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.infoIconWrap}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={56}
                  color="#D1D5DB"
                />
              </View>
              <Text style={styles.title}>No Messages Yet</Text>
              <Text style={styles.subtitle}>
                When you message buyers and sellers about listings, your
                conversations will appear here.
              </Text>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => router.push("/(tabs)")}
              >
                <Text style={styles.secondaryBtnText}>Browse Listings</Text>
                <Ionicons name="arrow-forward" size={16} color="#2563EB" />
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  lockIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  threadCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  threadTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 18,
  },
  threadBody: {
    flex: 1,
    gap: 8,
  },
  threadMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  threadName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  threadTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  threadPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listingThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  listingThumbFallback: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  listingTextWrap: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  listingMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
