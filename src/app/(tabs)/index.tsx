import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { PostCard } from "@/components/PostCard";
import { useStore } from "@/store/useStore";
import type { Post, PostType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS: Array<{ label: string; value: PostType | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Offers", value: "SALE" },
  { label: "Demands", value: "REQUEST" },
];

export default function FeedScreen() {
  const router = useRouter();
  const posts = useStore((s) => s.posts);
  const feedFilter = useStore((s) => s.feedFilter);
  const feedLoading = useStore((s) => s.feedLoading);
  const setFeedFilter = useStore((s) => s.setFeedFilter);
  const fetchPosts = useStore((s) => s.fetchPosts);
  const landings = useStore((s) => s.landings);
  const user = useStore((s) => s.user);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onPress={() => router.push(`/post/${item.id}`)} />
    ),
    [router],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Idemili Market</Text>
        {user ? (
          <Pressable
            style={styles.avatarBtn}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.avatarText}>
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginText}>Login</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={feedLoading}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
        ListHeaderComponent={
          <>
            {/* Announcement Banner */}
            {landings.length > 0 ? (
              <AnnouncementBanner landings={landings} />
            ) : null}

            {/* Market Feed Header */}
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Market Feed</Text>
              <Pressable style={styles.filterLink}>
                <Text style={styles.filterLinkText}>Filters</Text>
                <Ionicons name="options-outline" size={16} color="#2563EB" />
              </Pressable>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.value}
                  style={[
                    styles.filterTab,
                    feedFilter === f.value && styles.filterTabActive,
                  ]}
                  onPress={() => setFeedFilter(f.value)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      feedFilter === f.value && styles.filterTabTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          !feedLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No listings yet</Text>
              <Text style={styles.emptySubtext}>
                Pull down to refresh or create a new listing
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/create" as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  loginBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  list: {
    paddingBottom: 100,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterLinkText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterTabActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#2563EB",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
