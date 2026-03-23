import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { APP_NAME } from "@/constants/marketplace";
import { PostCard } from "@/components/PostCard";
import { useStore } from "@/store/useStore";
import type { Post, PostType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS: { label: string; value: PostType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Offers", value: "SALE" },
  { label: "Demands", value: "REQUEST" },
];

type SortOption = "newest" | "oldest" | "price_low" | "price_high";
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
];

function sortPosts(posts: Post[], sort: SortOption): Post[] {
  const sorted = [...posts];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case "price_low":
      return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price_high":
      return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    default:
      return sorted;
  }
}

export default function FeedScreen() {
  const router = useRouter();
  const posts = useStore((s) => s.posts);
  const feedFilter = useStore((s) => s.feedFilter);
  const feedLoading = useStore((s) => s.feedLoading);
  const setFeedFilter = useStore((s) => s.setFeedFilter);
  const fetchPosts = useStore((s) => s.fetchPosts);
  const bannerActive = useStore((s) => s.bannerActive);
  const fetchBannerActive = useStore((s) => s.fetchBannerActive);
  const user = useStore((s) => s.user);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const sortedPosts = React.useMemo(() => sortPosts(posts, sortBy), [posts, sortBy]);

  useEffect(() => {
    fetchPosts();
    fetchBannerActive();
  }, [fetchPosts, fetchBannerActive]);

  const handleRefresh = useCallback(() => {
    fetchPosts();
    fetchBannerActive();
  }, [fetchPosts, fetchBannerActive]);

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
        <Text style={styles.headerTitle}>{APP_NAME}</Text>
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
        data={sortedPosts}
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
            {/* Banner Bid Carousel */}
            {bannerActive?.active && bannerActive.slots.length > 0 ? (
              <AnnouncementBanner
                slots={bannerActive.slots}
                roundId={bannerActive.roundId}
              />
            ) : null}

            {/* Market Feed Header */}
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Market Feed</Text>
              <Pressable
                style={styles.filterLink}
                onPress={() => setShowFilterModal(true)}
              >
                <Text style={styles.filterLinkText}>
                  {sortBy === "newest" ? "Filters" : "Sorted"}
                </Text>
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
        onPress={() => router.push("/(tabs)/create" as never)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Sort / Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.sortOption,
                  sortBy === opt.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(opt.value);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === opt.value && styles.sortOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {sortBy === opt.value ? (
                  <Ionicons name="checkmark" size={18} color="#2563EB" />
                ) : null}
              </Pressable>
            ))}

            <Text style={[styles.modalTitle, { marginTop: 16 }]}>
              Post Type
            </Text>
            {FILTERS.map((f) => (
              <Pressable
                key={f.value}
                style={[
                  styles.sortOption,
                  feedFilter === f.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setFeedFilter(f.value);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    feedFilter === f.value && styles.sortOptionTextActive,
                  ]}
                >
                  {f.label}
                </Text>
                {feedFilter === f.value ? (
                  <Ionicons name="checkmark" size={18} color="#2563EB" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: "#EFF6FF",
  },
  sortOptionText: {
    fontSize: 15,
    color: "#374151",
  },
  sortOptionTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
