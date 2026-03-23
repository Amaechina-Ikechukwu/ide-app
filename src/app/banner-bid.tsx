import { useStore } from "@/store/useStore";
import type { BannerBid, PlaceBidRequest } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Round ended";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m left`;
}

function isValidUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://");
}

export default function BannerBidScreen() {
  const router = useRouter();

  const user = useStore((s) => s.user);
  const balance = useStore((s) => s.balance);
  const bannerRound = useStore((s) => s.bannerRound);
  const bannerMyBids = useStore((s) => s.bannerMyBids);
  const bannerLoading = useStore((s) => s.bannerLoading);
  const fetchBannerRound = useStore((s) => s.fetchBannerRound);
  const fetchMyBids = useStore((s) => s.fetchMyBids);
  const fetchBalance = useStore((s) => s.fetchBalance);
  const placeBid = useStore((s) => s.placeBid);
  const increaseBid = useStore((s) => s.increaseBid);

  // Form state
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [amount, setAmount] = useState("");
  const [increaseAmount, setIncreaseAmount] = useState("");

  // Countdown timer
  const [remainingMs, setRemainingMs] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const existingBid = bannerMyBids.length > 0 ? bannerMyBids[0] : null;

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    fetchBannerRound();
    fetchMyBids();
    fetchBalance({ silent: true });
  }, [user, fetchBannerRound, fetchMyBids, fetchBalance, router]);

  // Poll leaderboard every 30s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchBannerRound();
      fetchMyBids();
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchBannerRound, fetchMyBids]);

  // Countdown timer
  useEffect(() => {
    if (bannerRound?.remainingMs) {
      setRemainingMs(bannerRound.remainingMs);
      const started = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - started;
        setRemainingMs(Math.max(0, bannerRound.remainingMs - elapsed));
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [bannerRound?.remainingMs]);

  const validate = useCallback((): string | null => {
    if (!headline.trim()) return "Headline is required";
    if (headline.length > 120) return "Headline must be 120 characters or less";
    if (!body.trim()) return "Body is required";
    if (body.length > 300) return "Body must be 300 characters or less";
    if (imageUrl && !isValidUrl(imageUrl))
      return "Image URL must start with http:// or https://";
    if (linkUrl && !isValidUrl(linkUrl))
      return "Link URL must start with http:// or https://";
    if (linkText && linkText.length > 40)
      return "Link text must be 40 characters or less";
    const amt = parseInt(amount, 10);
    if (!amt || amt < 1) return "Amount must be a positive number";
    if (bannerRound && amt < bannerRound.minimumBid)
      return `Minimum bid is ${bannerRound.minimumBid} tokens`;
    if (balance !== null && amt > balance) return "Insufficient token balance";
    return null;
  }, [headline, body, imageUrl, linkUrl, linkText, amount, bannerRound, balance]);

  const handlePlaceBid = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }
    const payload: PlaceBidRequest = {
      headline: headline.trim(),
      body: body.trim(),
      amount: parseInt(amount, 10),
    };
    if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();
    if (linkUrl.trim()) payload.linkUrl = linkUrl.trim();
    if (linkText.trim()) payload.linkText = linkText.trim();

    const bid = await placeBid(payload);
    if (bid) {
      Alert.alert("Bid Placed!", "Your bid has been placed successfully.");
      setAmount("");
    }
  }, [validate, headline, body, amount, imageUrl, linkUrl, linkText, placeBid]);

  const handleIncreaseBid = useCallback(async () => {
    if (!existingBid) return;
    const additional = parseInt(increaseAmount, 10);
    if (!additional || additional < 1) {
      Alert.alert("Invalid amount", "Enter a positive number of tokens to add");
      return;
    }
    if (balance !== null && additional > balance) {
      Alert.alert("Insufficient balance", "You don't have enough tokens");
      return;
    }
    const result = await increaseBid(existingBid.id, additional);
    if (result) {
      Alert.alert("Bid Increased!", `Your bid is now ${result.amount} tokens.`);
      setIncreaseAmount("");
    }
  }, [existingBid, increaseAmount, balance, increaseBid]);

  const minimumBid = bannerRound?.minimumBid ?? 1;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Banner Bidding</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Round Info Card */}
          {bannerRound ? (
            <View style={styles.roundCard}>
              <View style={styles.roundHeader}>
                <Text style={styles.roundTitle}>Current Round</Text>
                <View
                  style={[
                    styles.statusBadge,
                    bannerRound.status === "open"
                      ? styles.statusOpen
                      : styles.statusClosed,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {bannerRound.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.roundStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {formatCountdown(remainingMs)}
                  </Text>
                  <Text style={styles.statLabel}>Time Left</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {bannerRound.filledSlots}/{bannerRound.slotCount}
                  </Text>
                  <Text style={styles.statLabel}>Slots Filled</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{minimumBid}</Text>
                  <Text style={styles.statLabel}>Min Bid</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Ionicons name="wallet" size={20} color="#2563EB" />
            <Text style={styles.balanceText}>
              Your Balance:{" "}
              <Text style={styles.balanceAmount}>
                {balance ?? "—"} tokens
              </Text>
            </Text>
          </View>

          {/* Refund Notice */}
          <View style={styles.refundNotice}>
            <Ionicons
              name="information-circle"
              size={18}
              color="#059669"
            />
            <Text style={styles.refundText}>
              Losers are fully refunded — bid with confidence!
            </Text>
          </View>

          {/* Existing Bid — show increase flow */}
          {existingBid ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Current Bid</Text>
              <View
                style={[
                  styles.myBidCard,
                  existingBid.status === "outbid" && styles.myBidOutbid,
                ]}
              >
                <View style={styles.myBidHeader}>
                  <Text style={styles.myBidHeadline} numberOfLines={1}>
                    {existingBid.headline}
                  </Text>
                  {existingBid.status === "outbid" ? (
                    <View style={styles.outbidBadge}>
                      <Text style={styles.outbidText}>OUTBID</Text>
                    </View>
                  ) : (
                    <View style={styles.activeBidBadge}>
                      <Text style={styles.activeBidText}>
                        {existingBid.status === "won" ? "WON" : "ACTIVE"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.myBidAmount}>
                  {existingBid.amount} tokens
                  {existingBid.slotIndex >= 0
                    ? ` · Slot #${existingBid.slotIndex + 1}`
                    : ""}
                </Text>
              </View>

              <Text style={styles.inputLabel}>Add More Tokens</Text>
              <View style={styles.increaseRow}>
                <TextInput
                  style={[styles.input, styles.increaseInput]}
                  placeholder="Amount to add"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={increaseAmount}
                  onChangeText={setIncreaseAmount}
                />
                <Pressable
                  style={[
                    styles.primaryBtn,
                    bannerLoading && styles.btnDisabled,
                  ]}
                  onPress={handleIncreaseBid}
                  disabled={bannerLoading}
                >
                  {bannerLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Increase Bid</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            /* Place New Bid Form */
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Place Your Bid</Text>

              <Text style={styles.inputLabel}>
                Headline <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="E.g. Best Phones in Lagos!"
                placeholderTextColor="#9CA3AF"
                maxLength={120}
                value={headline}
                onChangeText={setHeadline}
              />
              <Text style={styles.charCount}>{headline.length}/120</Text>

              <Text style={styles.inputLabel}>
                Body <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your promotion..."
                placeholderTextColor="#9CA3AF"
                maxLength={300}
                multiline
                numberOfLines={3}
                value={body}
                onChangeText={setBody}
              />
              <Text style={styles.charCount}>{body.length}/300</Text>

              <Text style={styles.inputLabel}>Image URL (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
                value={imageUrl}
                onChangeText={setImageUrl}
              />

              <Text style={styles.inputLabel}>Link URL (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
                value={linkUrl}
                onChangeText={setLinkUrl}
              />

              <Text style={styles.inputLabel}>Link Text (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g. Shop Now"
                placeholderTextColor="#9CA3AF"
                maxLength={40}
                value={linkText}
                onChangeText={setLinkText}
              />

              <Text style={styles.inputLabel}>
                Bid Amount (tokens) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`Minimum: ${minimumBid}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
              />

              <Pressable
                style={[
                  styles.primaryBtn,
                  styles.submitBtn,
                  bannerLoading && styles.btnDisabled,
                ]}
                onPress={handlePlaceBid}
                disabled={bannerLoading}
              >
                {bannerLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Place Bid</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Leaderboard */}
          {bannerRound && bannerRound.topBids.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leaderboard</Text>
              {bannerRound.topBids.map((bid, index) => (
                <View key={index} style={styles.leaderRow}>
                  <View style={styles.leaderRank}>
                    <Text style={styles.leaderRankText}>
                      #{bid.slotIndex + 1}
                    </Text>
                  </View>
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderName} numberOfLines={1}>
                      {bid.displayName}
                    </Text>
                    <Text style={styles.leaderHeadline} numberOfLines={1}>
                      {bid.headline}
                    </Text>
                  </View>
                  <Text style={styles.leaderAmount}>{bid.amount}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerRight: {
    width: 36,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  roundCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  roundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: "#DCFCE7",
  },
  statusClosed: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#1F2937",
  },
  roundStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  balanceText: {
    fontSize: 14,
    color: "#1F2937",
  },
  balanceAmount: {
    fontWeight: "700",
    color: "#2563EB",
  },
  refundNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  refundText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  submitBtn: {
    marginTop: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  myBidCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  myBidOutbid: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  myBidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  myBidHeadline: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  myBidAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  outbidBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  outbidText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "700",
  },
  activeBidBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activeBidText: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "700",
  },
  increaseRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  increaseInput: {
    flex: 1,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  leaderRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  leaderRankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  leaderHeadline: {
    fontSize: 12,
    color: "#6B7280",
  },
  leaderAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
});
