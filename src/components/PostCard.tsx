import { ExpiryBadge } from "@/components/ExpiryBadge";
import { formatCurrency } from "@/lib/formatters";
import type { Post } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  if (post.type === "SALE") {
    return <SaleCard post={post} onPress={onPress} />;
  }

  return <RequestCard post={post} onPress={onPress} />;
}

function SaleCard({ post, onPress }: PostCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.saleInner}>
        <View style={styles.saleImageWrap}>
          {post.imageUrls.length > 0 ? (
            <Image
              source={{ uri: post.imageUrls[0] }}
              style={styles.saleImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.saleImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
          <View style={styles.sellingBadge}>
            <Text style={styles.sellingBadgeText}>SELLING</Text>
          </View>
        </View>

        <View style={styles.saleContent}>
          <View style={styles.saleTitleRow}>
            <Text style={styles.saleTitle} numberOfLines={2}>
              {post.title}
            </Text>
            {post.price != null ? (
              <Text style={styles.salePrice}>
                {formatCurrency(post.price, post.currency)}
              </Text>
            ) : null}
          </View>

          <Text style={styles.saleDescription} numberOfLines={2}>
            {post.description}
          </Text>

          <View style={styles.saleFooter}>
            <ExpiryBadge expiresAt={post.expiresAt} />
            <Ionicons name="arrow-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function RequestCard({ post, onPress }: PostCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.requestInner}>
        <View style={styles.requestContent}>
          <Text style={styles.requestTitle} numberOfLines={2}>
            {post.title}
          </Text>

          {post.price != null ? (
            <Text style={styles.requestBudget}>
              Budget: {formatCurrency(post.price, post.currency)}
            </Text>
          ) : null}

          {post.tags.length > 0 ? (
            <Text style={styles.requestTags}>{post.tags.join("/")}</Text>
          ) : null}

          <Text style={styles.requestDescription} numberOfLines={2}>
            {post.description}
          </Text>

          <View style={styles.requestFooter}>
            <ExpiryBadge expiresAt={post.expiresAt} />
            <View style={styles.chatBtn}>
              <Text style={styles.chatText}>Chat</Text>
              <Ionicons name="chatbubble" size={14} color="#6B7280" />
            </View>
          </View>
        </View>

        <View style={styles.requestRight}>
          <View style={styles.buyingBadge}>
            <Text style={styles.buyingBadgeText}>BUYING</Text>
          </View>
          {post.imageUrls.length > 0 ? (
            <Image
              source={{ uri: post.imageUrls[0] }}
              style={styles.requestImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.requestIconWrap}>
              <Ionicons name="bag-handle" size={28} color="#93C5FD" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  saleInner: {
    flexDirection: "row",
  },
  saleImageWrap: {
    width: 120,
    minHeight: 150,
    position: "relative",
  },
  saleImage: {
    width: "100%",
    height: "100%",
  },
  saleImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sellingBadge: {
    position: "absolute",
    top: 10,
    left: 8,
    backgroundColor: "#16A34A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sellingBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  saleContent: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  saleTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  saleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  salePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
  },
  saleDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 10,
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestInner: {
    flexDirection: "row",
    padding: 14,
  },
  requestContent: {
    flex: 1,
    paddingRight: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  requestBudget: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
    marginBottom: 2,
  },
  requestTags: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2563EB",
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 10,
  },
  requestFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  requestRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minWidth: 80,
  },
  buyingBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buyingBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  requestIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  requestImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginTop: 8,
  },
});
