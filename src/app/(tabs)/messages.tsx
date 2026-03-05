import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.center}>
        {user ? (
          <>
            <View style={styles.iconWrap}>
              <Ionicons
                name="chatbubbles-outline"
                size={56}
                color="#D1D5DB"
              />
            </View>
            <Text style={styles.title}>No Messages Yet</Text>
            <Text style={styles.subtitle}>
              When you connect with other users about listings, your
              conversations will appear here.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>
                  Chat about listings directly
                </Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>
                  Negotiate prices securely
                </Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>
                  Share images and details
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.browseBtn}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.browseBtnText}>Browse Listings</Text>
              <Ionicons name="arrow-forward" size={16} color="#2563EB" />
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.title}>Sign In Required</Text>
            <Text style={styles.subtitle}>
              Create an account or sign in to start messaging other users about
              their listings.
            </Text>
            <Pressable
              style={styles.signInBtn}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.signInBtnText}>Sign In or Register</Text>
            </Pressable>
          </>
        )}
      </View>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  lockIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  featureList: {
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  featureText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  browseBtn: {
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
  browseBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  signInBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
