import { formatCurrency } from "@/lib/formatters";
import {
  markConversationAsRead,
  sendConversationMessage,
  subscribeToConversationMessages,
  subscribeToConversationSummary,
} from "@/lib/messaging";
import { useStore } from "@/store/useStore";
import type { ChatMessage, ConversationListItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ConversationScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const user = useStore((state) => state.user);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [summary, setSummary] = useState<ConversationListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof conversationId !== "string") {
      setLoadingSummary(false);
      setLoadingMessages(false);
      return;
    }

    setLoadingSummary(true);
    setLoadingMessages(true);
    setError(null);

    try {
      const unsubscribeSummary = subscribeToConversationSummary(
        user.uid,
        conversationId,
        (nextSummary) => {
          setSummary(nextSummary);
          setLoadingSummary(false);
        },
      );
      const unsubscribeMessages = subscribeToConversationMessages(
        conversationId,
        (nextMessages) => {
          setMessages(nextMessages);
          setLoadingMessages(false);
        },
      );

      return () => {
        unsubscribeSummary();
        unsubscribeMessages();
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load this conversation.",
      );
      setLoadingSummary(false);
      setLoadingMessages(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (!user || typeof conversationId !== "string") {
      return;
    }

    void markConversationAsRead(user.uid, conversationId).catch(() => {
      // Ignore read-state sync issues for now.
    });
  }, [conversationId, messages.length, user]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(timeout);
  }, [messages]);

  const handleSend = async () => {
    if (!user || typeof conversationId !== "string" || !composerText.trim()) {
      return;
    }

    setSending(true);
    try {
      await sendConversationMessage({
        conversationId,
        currentUser: user,
        text: composerText,
      });
      setComposerText("");
    } catch (err) {
      Alert.alert(
        "Message failed",
        err instanceof Error ? err.message : "Unable to send your message.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sign in to view messages</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (typeof conversationId !== "string") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Conversation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const loading = loadingSummary || loadingMessages;
  const title = summary?.otherParticipantName ?? "Conversation";
  const formattedPrice =
    summary?.postPrice != null ? formatCurrency(summary.postPrice) : null;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </Pressable>

          <View style={styles.headerBody}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {summary?.postTitle ?? "Loading conversation..."}
            </Text>
          </View>
        </View>

        {summary ? (
          <View style={styles.listingBanner}>
            <View style={styles.listingBadge}>
              <Text style={styles.listingBadgeText}>
                {summary.postType === "SALE" ? "SELLING" : "BUYING"}
              </Text>
            </View>
            <View style={styles.listingBannerBody}>
              <Text style={styles.listingBannerTitle} numberOfLines={1}>
                {summary.postTitle}
              </Text>
              {formattedPrice ? (
                <Text style={styles.listingBannerMeta}>{formattedPrice}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Unable to load conversation</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isMine = item.senderId === user.uid;
              return (
                <View
                  style={[
                    styles.messageRow,
                    isMine ? styles.messageRowMine : styles.messageRowOther,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                    ]}
                  >
                    {!isMine ? (
                      <Text style={styles.messageSender}>{item.senderName}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.messageText,
                        isMine && styles.messageTextMine,
                      ]}
                    >
                      {item.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageMeta,
                        isMine && styles.messageMetaMine,
                      ]}
                    >
                      {formatMessageTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={
              messages.length === 0 ? styles.emptyMessages : styles.messageList
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={54}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Send the first message to start the conversation.
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.composerWrap}>
          <TextInput
            style={styles.composerInput}
            placeholder="Write a message..."
            placeholderTextColor="#9CA3AF"
            value={composerText}
            onChangeText={setComposerText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!composerText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!composerText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerBody: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },
  listingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  listingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  listingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  listingBannerBody: {
    flex: 1,
  },
  listingBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  listingBannerMeta: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  emptyMessages: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 6,
  },
  messageBubbleOther: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageSender: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#111827",
  },
  messageTextMine: {
    color: "#fff",
  },
  messageMeta: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
    alignSelf: "flex-end",
  },
  messageMetaMine: {
    color: "#DBEAFE",
  },
  composerWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    fontSize: 15,
    color: "#111827",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
