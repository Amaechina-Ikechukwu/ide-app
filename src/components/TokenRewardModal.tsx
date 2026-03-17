import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export interface TokenRewardSummary {
  previousBalance: number;
  nextBalance: number;
  delta: number;
}

interface TokenRewardModalProps {
  reward: TokenRewardSummary | null;
  visible: boolean;
  onClose: () => void;
}

export function TokenRewardModal({
  reward,
  visible,
  onClose,
}: TokenRewardModalProps) {
  const [displayedBalance, setDisplayedBalance] = useState(
    reward?.previousBalance ?? 0,
  );
  const haloPulse = useSharedValue(0);
  const iconLift = useSharedValue(16);

  useEffect(() => {
    if (!visible || !reward) {
      return;
    }

    setDisplayedBalance(reward.previousBalance);
    haloPulse.value = 0;
    iconLift.value = 16;

    haloPulse.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    iconLift.value = withTiming(0, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / 1400, 1);
      const nextValue = Math.round(
        reward.previousBalance + reward.delta * progress,
      );

      setDisplayedBalance(nextValue);
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 50);

    const closeTimer = setTimeout(onClose, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(closeTimer);
      haloPulse.value = 0;
      iconLift.value = 0;
    };
  }, [haloPulse, iconLift, onClose, reward, visible]);

  const outerHaloStyle = useAnimatedStyle(() => ({
    opacity: 0.18 - haloPulse.value * 0.08,
    transform: [{ scale: 1 + haloPulse.value * 0.22 }],
  }));

  const innerHaloStyle = useAnimatedStyle(() => ({
    opacity: 0.28 - haloPulse.value * 0.14,
    transform: [{ scale: 0.92 + haloPulse.value * 0.15 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: iconLift.value },
      { scale: 1 + haloPulse.value * 0.04 },
    ],
  }));

  if (!reward) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(180)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={ZoomIn.springify().damping(14)}
          exiting={ZoomOut.duration(180)}
          style={styles.card}
        >
          <View style={styles.heroWrap}>
            <Animated.View style={[styles.halo, styles.outerHalo, outerHaloStyle]} />
            <Animated.View style={[styles.halo, styles.innerHalo, innerHaloStyle]} />
            <Animated.View style={[styles.tokenBadge, iconStyle]}>
              <Ionicons name="diamond" size={34} color="#F59E0B" />
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(140)} style={styles.deltaPill}>
              <Text style={styles.deltaPillText}>+{reward.delta} tokens</Text>
            </Animated.View>
          </View>

          <Text style={styles.eyebrow}>PAYMENT SUCCESSFUL</Text>
          <Text style={styles.title}>Your balance just jumped</Text>
          <Text style={styles.balanceValue}>{displayedBalance}</Text>
          <Text style={styles.balanceLabel}>tokens available now</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Before</Text>
              <Text style={styles.summaryValue}>{reward.previousBalance}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>After</Text>
              <Text style={styles.summaryValue}>{reward.nextBalance}</Text>
            </View>
          </View>

          <Pressable onPress={onClose} style={styles.cta}>
            <Text style={styles.ctaText}>Nice</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  heroWrap: {
    width: 140,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  halo: {
    position: "absolute",
    borderRadius: 999,
  },
  outerHalo: {
    width: 110,
    height: 110,
    backgroundColor: "#DBEAFE",
  },
  innerHalo: {
    width: 84,
    height: 84,
    backgroundColor: "#BFDBFE",
  },
  tokenBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  deltaPill: {
    position: "absolute",
    right: 2,
    top: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  deltaPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#2563EB",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  balanceValue: {
    marginTop: 12,
    fontSize: 54,
    fontWeight: "800",
    color: "#111827",
    fontVariant: ["tabular-nums"],
  },
  balanceLabel: {
    marginTop: 2,
    fontSize: 15,
    color: "#6B7280",
  },
  summaryRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 24,
    marginBottom: 22,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
  cta: {
    minWidth: 120,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
