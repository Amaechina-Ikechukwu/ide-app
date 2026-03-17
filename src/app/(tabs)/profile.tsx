import { APP_NAME } from "@/constants/marketplace";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const balance = useStore((s) => s.balance);
  const logout = useStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Card */}
        {user ? (
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user.displayName || user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              {user.displayName ? (
                <Text style={styles.userName}>{user.displayName}</Text>
              ) : null}
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#16A34A"
                />
                <Text style={styles.verifiedText}>Verified Account</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconWrap}>
              <Ionicons name="person-outline" size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.guestTitle}>Welcome, Guest!</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to access premium features and manage your listings
            </Text>
            <Pressable
              style={styles.signInBtn}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.signInBtnText}>Sign In or Register</Text>
            </Pressable>
          </View>
        )}

        {/* Balance Card */}
        {user && (
          <Pressable
            style={styles.balanceCard}
            onPress={() => router.push("/(tabs)/tokens" as any)}
          >
            <View style={styles.balanceLeft}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="diamond" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.balanceLabel}>Token Balance</Text>
                <Text style={styles.balanceValue}>
                  {balance !== null ? `${balance} tokens` : "Loading..."}
                </Text>
              </View>
            </View>
            <View style={styles.balanceAction}>
              <Text style={styles.balanceActionText}>Buy Tokens</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </View>
          </Pressable>
        )}

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>General</Text>
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/(tabs)/tokens" as any)}
            >
              <View
                style={[styles.menuIcon, { backgroundColor: "#EFF6FF" }]}
              >
                <Ionicons name="diamond-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Token Store</Text>
                <Text style={styles.menuDesc}>
                  Buy tokens for premium features
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </Pressable>

            <View style={styles.menuDivider} />

            {user && (
              <>
                <Pressable
                  style={styles.menuRow}
                  onPress={() => router.push("/transactions")}
                >
                  <View
                    style={[styles.menuIcon, { backgroundColor: "#EEF2FF" }]}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color="#4F46E5"
                    />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuLabel}>Transaction History</Text>
                    <Text style={styles.menuDesc}>
                      View token purchases and references
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#D1D5DB"
                  />
                </Pressable>

                <View style={styles.menuDivider} />
              </>
            )}

            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/(tabs)/more" as any)}
            >
              <View
                style={[styles.menuIcon, { backgroundColor: "#FEF3C7" }]}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={20}
                  color="#D97706"
                />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Announcements</Text>
                <Text style={styles.menuDesc}>
                  Latest news and updates
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/(tabs)/more" as any)}
            >
              <View
                style={[styles.menuIcon, { backgroundColor: "#D1FAE5" }]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#16A34A"
                />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Contact & Support</Text>
                <Text style={styles.menuDesc}>Get help or reach out</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        {user && (
          <View style={styles.menuSection}>
            <View style={styles.menuCard}>
              <Pressable style={styles.menuRow} onPress={handleLogout}>
                <View
                  style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color="#DC2626"
                  />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={[styles.menuLabel, { color: "#DC2626" }]}>
                    Sign Out
                  </Text>
                  <Text style={styles.menuDesc}>{user.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </Pressable>
            </View>
          </View>
        )}

        {/* About */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutText}>{APP_NAME}</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "500",
  },
  guestCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  guestIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
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
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
  },
  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  balanceValue: { fontSize: 17, fontWeight: "700", color: "#2563EB" },
  balanceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  menuSection: { paddingHorizontal: 16, marginTop: 16 },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  menuDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  aboutSection: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 4,
  },
  aboutText: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  versionText: { fontSize: 12, color: "#D1D5DB" },
});
