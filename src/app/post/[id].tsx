import { ExpiryBadge } from "@/components/ExpiryBadge";
import { api } from "@/lib/api";
import { getIdToken } from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";
import { handleApiError } from "@/lib/handleApiError";
import type { Post } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data } = await api.get(`/api/posts/${id}`);
      setPost(data.post ?? data);
    } catch (err) {
      handleApiError(err);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this listing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const deviceId = await getDeviceId();
              const token = await getIdToken();
              await api.delete(`/api/posts/${post.id}`, {
                data: { deviceId },
                ...(token
                  ? { headers: { Authorization: `Bearer ${token}` } }
                  : {}),
              });
              Alert.alert("Deleted", "Your listing has been removed.");
              router.back();
            } catch (err) {
              handleApiError(err);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const accent = post.type === "SALE" ? "#4CAF50" : "#2563EB";
  const badge = post.type === "SALE" ? "SELLING" : "BUYING";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Gallery */}
      {post.imageUrls.length > 0 ? (
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setImageIndex(index);
            }}
          >
            {post.imageUrls.map((url, i) => (
              <Image
                key={i}
                source={{ uri: url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {post.imageUrls.length > 1 && (
            <View style={styles.dots}>
              {post.imageUrls.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noImage}>
          <Ionicons
            name={post.type === "SALE" ? "pricetag-outline" : "cart-outline"}
            size={48}
            color="#D1D5DB"
          />
        </View>
      )}

      {/* Badge & Price */}
      <View style={styles.detailSection}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
          <ExpiryBadge expiresAt={post.expiresAt} />
        </View>

        <Text style={styles.title}>{post.title}</Text>

        {post.price != null && (
          <Text style={[styles.price, { color: accent }]}>
            {post.type === "SALE"
              ? `₦${post.price.toLocaleString()}`
              : `Budget: ₦${post.price.toLocaleString()}`}
          </Text>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <View style={styles.tagRow}>
            {post.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.descText}>{post.description}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text style={styles.metaText}>
              Posted {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {post.isPremium && (
            <View style={styles.metaRow}>
              <Ionicons name="diamond" size={16} color="#2563EB" />
              <Text style={[styles.metaText, { color: "#2563EB" }]}>
                Premium listing
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.contactBtn}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.contactBtnText}>Contact Seller</Text>
          </Pressable>
          <Pressable
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  errorText: { fontSize: 16, color: "#6B7280" },
  imageContainer: { position: "relative" },
  postImage: { width: SCREEN_WIDTH, height: 300 },
  dots: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff" },
  noImage: {
    height: 200,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  detailSection: { padding: 20 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "700", color: "#1F2937", marginBottom: 8 },
  price: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  descSection: { marginBottom: 20 },
  descLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  descText: { fontSize: 15, color: "#4B5563", lineHeight: 22 },
  metaSection: { gap: 8, marginBottom: 24 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#9CA3AF" },
  actions: { flexDirection: "row", gap: 12 },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  contactBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
  },
});
