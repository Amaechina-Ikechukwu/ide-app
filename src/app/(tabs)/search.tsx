import { PostCard } from "@/components/PostCard";
import { api } from "@/lib/api";
import { handleApiError } from "@/lib/handleApiError";
import { normalizePosts } from "@/lib/posts";
import type { Post } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get("/api/posts");
      const posts = normalizePosts(data.posts ?? data);
      const lowerQ = trimmed.toLowerCase();
      const filtered = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQ) ||
          p.description.toLowerCase().includes(lowerQ) ||
          p.tags?.some((t) => t.toLowerCase().includes(lowerQ)),
      );
      setResults(filtered);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

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
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searched ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try different keywords or browse the feed
              </Text>
            </View>
          }
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </Text>
            ) : null
          }
        />
      ) : (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="search" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Find Listings</Text>
          <Text style={styles.emptySubtitle}>
            Search by name, description, or category
          </Text>

          {/* Quick Suggestions */}
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsLabel}>Popular Searches</Text>
            <View style={styles.chipRow}>
              {["Electronics", "Fashion", "Services", "Vehicles"].map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.chip}
                  onPress={() => {
                    setQuery(tag);
                  }}
                >
                  <Text style={styles.chipText}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  searchBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  searchBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  list: { paddingBottom: 100 },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  suggestions: {
    marginTop: 32,
    alignItems: "center",
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2563EB",
  },
});
