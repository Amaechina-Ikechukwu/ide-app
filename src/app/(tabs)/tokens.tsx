import { PaymentWebView } from "@/components/PaymentWebView";
import { api } from "@/lib/api";
import { auth, getIdToken } from "@/lib/auth";
import { handleApiError } from "@/lib/handleApiError";
import { formatCurrency } from "@/lib/formatters";
import {
  normalizePaystackCheckoutSession,
  type PaystackCheckoutSession,
} from "@/lib/payments";
import { useStore } from "@/store/useStore";
import type { TokenBundle } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BUNDLE_META: Record<
  string,
  {
    name: string;
    subtitle: string;
    features: string[];
    highlight?: boolean;
    icon: string;
    save?: string;
  }
> = {
  BUNDLE_100: {
    name: "Starter",
    subtitle: "Casual sellers",
    icon: "cube-outline",
    features: ["Post ~10 items", "Basic visibility"],
  },
  BUNDLE_350: {
    name: "Growth",
    subtitle: "Regular traders",
    icon: "trending-up-outline",
    highlight: true,
    save: "Save 15%",
    features: ["Post ~35 items", "High priority queue", "Smart pricing tools"],
  },
  BUNDLE_1000: {
    name: "Professional",
    subtitle: "Power sellers",
    icon: "diamond-outline",
    save: "Save 20%",
    features: ["Post ~100 items", "Top search results", "Dedicated support"],
  },
};

export default function TokenStoreScreen() {
  const router = useRouter();
  const bundles = useStore((s) => s.bundles);
  const balance = useStore((s) => s.balance);
  const fetchBundles = useStore((s) => s.fetchBundles);
  const fetchBalance = useStore((s) => s.fetchBalance);

  const [paymentSession, setPaymentSession] =
    useState<PaystackCheckoutSession | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchBundles();
    fetchBalance();
  }, []);

  const refreshBalanceAfterPayment = async () => {
    const previousBalance = useStore.getState().balance;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await fetchBalance();

      const nextBalance = useStore.getState().balance;
      if (
        previousBalance === null ||
        nextBalance === null ||
        nextBalance !== previousBalance ||
        attempt === 3
      ) {
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1200 * (attempt + 1));
      });
    }
  };

  const handleBuy = async (bundle: TokenBundle) => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setPurchasing(bundle.id);
    try {
      const token = await getIdToken();
      const { data } = await api.post(
        "/api/payments/initiate",
        { bundle: bundle.id, email: user.email },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const session = normalizePaystackCheckoutSession(data);

      if (!session) {
        Alert.alert(
          "Payment unavailable",
          "The server did not return a valid Paystack checkout session.",
        );
        return;
      }

      setPaymentSession(session);
    } catch (err) {
      handleApiError(err);
    } finally {
      setPurchasing(null);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSession(null);
    void refreshBalanceAfterPayment();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Buy Tokens</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={36} color="#2563EB" />
          </View>
          <Text style={styles.heroTitle}>Boost Your Sales</Text>
          <Text style={styles.heroSubtitle}>
            Unlock premium features. List more items and{"\n"}reach buyers
            instantly with premium tokens.
          </Text>
        </View>

        {/* Membership Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsLabel}>MEMBERSHIP BENEFITS</Text>
          <View style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="person-outline" size={18} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.benefitTitle}>Free Tier</Text>
              <Text style={styles.benefitDesc}>
                Limited to 1 post every 24 hours.
              </Text>
            </View>
          </View>
          <View style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="flash" size={18} color="#2563EB" />
            </View>
            <View>
              <Text style={[styles.benefitTitle, { color: "#2563EB" }]}>
                Premium Access
              </Text>
              <Text style={styles.benefitDesc}>
                Post unlimited listings anytime. Instant visibility.
              </Text>
            </View>
          </View>
        </View>

        {/* Balance */}
        {balance !== null && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>{balance} tokens</Text>
          </View>
        )}

        {/* Bundle Cards */}
        {bundles.map((bundle) => {
          const meta = BUNDLE_META[bundle.id] ?? {
            name: bundle.id,
            subtitle: "",
            icon: "cube-outline",
            features: [],
          };
          const isHighlight = meta.highlight;

          return (
            <View
              key={bundle.id}
              style={[styles.bundleCard, isHighlight && styles.bundleHighlight]}
            >
              {isHighlight && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.bundleHeader}>
                <View>
                  <Text
                    style={[
                      styles.bundleName,
                      isHighlight && { color: "#2563EB" },
                    ]}
                  >
                    {meta.name}
                  </Text>
                  <Text style={styles.bundleSubtitle}>{meta.subtitle}</Text>
                </View>
                <Ionicons
                  name={meta.icon as any}
                  size={28}
                  color={isHighlight ? "#2563EB" : "#9CA3AF"}
                />
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.bundlePrice}>
                  {formatCurrency(bundle.price, bundle.currency, bundle.currency === "USD" ? 2 : 0)}
                </Text>
                <Text style={styles.bundleUnits}>/ {bundle.units}</Text>
              </View>
              {meta.save && <Text style={styles.saveBadge}>{meta.save}</Text>}

              <View style={styles.featureList}>
                {meta.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#2563EB"
                    />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.buyBtn,
                  isHighlight ? styles.buyBtnPrimary : styles.buyBtnOutline,
                ]}
                onPress={() => handleBuy(bundle)}
                disabled={purchasing === bundle.id}
              >
                {purchasing === bundle.id ? (
                  <ActivityIndicator color={isHighlight ? "#fff" : "#2563EB"} />
                ) : (
                  <Text
                    style={[
                      styles.buyBtnText,
                      isHighlight
                        ? styles.buyBtnTextPrimary
                        : styles.buyBtnTextOutline,
                    ]}
                  >
                    Buy {meta.name}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Secure checkout is powered by Paystack. Tokens do not expire.
          Purchases are final. By{"\n"}continuing, you agree to our Terms of
          Service.
        </Text>
      </ScrollView>

      {/* Payment WebView Modal */}
      <Modal visible={!!paymentSession} animationType="slide">
        {paymentSession && (
          <PaymentWebView
            session={paymentSession}
            onSuccess={handlePaymentSuccess}
            onFail={() => setPaymentSession(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  hero: { alignItems: "center", paddingVertical: 32, backgroundColor: "#fff" },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  benefitsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  benefitsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  benefitDesc: { fontSize: 12, color: "#9CA3AF" },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  balanceAmount: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  bundleCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bundleHighlight: { borderColor: "#2563EB", borderWidth: 2 },
  bestValueBadge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bundleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bundleName: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  bundleSubtitle: { fontSize: 13, color: "#9CA3AF" },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginBottom: 4,
  },
  bundlePrice: { fontSize: 28, fontWeight: "700", color: "#1F2937" },
  bundleUnits: { fontSize: 15, color: "#9CA3AF" },
  saveBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
    marginBottom: 12,
  },
  featureList: { gap: 8, marginBottom: 16, marginTop: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 14, color: "#374151" },
  buyBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  buyBtnPrimary: { backgroundColor: "#2563EB" },
  buyBtnOutline: { borderWidth: 1, borderColor: "#E5E7EB" },
  buyBtnText: { fontWeight: "700", fontSize: 15 },
  buyBtnTextPrimary: { color: "#fff" },
  buyBtnTextOutline: { color: "#1F2937" },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
});

