import type { BannerSlot } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_W - 32; // 16px margin each side
const AUTO_SCROLL_INTERVAL = 5000;

interface BannerCarouselProps {
  slots: BannerSlot[];
  roundId?: string;
}

export function AnnouncementBanner({ slots, roundId }: BannerCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const startAutoScroll = useCallback(() => {
    if (slots.length <= 1) return;
    autoScrollRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slots.length;
        scrollRef.current?.scrollTo({
          x: next * BANNER_WIDTH,
          animated: true,
        });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [slots.length]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [startAutoScroll, stopAutoScroll]);

  const onScrollBeginDrag = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  const onScrollEndDrag = useCallback(() => {
    startAutoScroll();
  }, [startAutoScroll]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
      setActiveSlide(index);
    },
    [],
  );

  if (slots.length === 0) return null;

  const handleSlotPress = (slot: BannerSlot) => {
    if (slot.linkUrl) {
      Linking.openURL(slot.linkUrl).catch(() => {});
    }
  };

  const renderSlide = (slot: BannerSlot, index: number) => (
    <Pressable
      key={index}
      style={[styles.container, { width: BANNER_WIDTH }]}
      onPress={() => handleSlotPress(slot)}
    >
      {slot.imageUrl ? (
        <Image
          source={{ uri: slot.imageUrl }}
          style={styles.bgImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.bgGradient}>
          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />
          <View style={styles.blobCenter} />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AD</Text>
          </View>
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={10} color="#F59E0B" />
            <Text style={styles.rankText}>#{slot.slotIndex + 1}</Text>
          </View>
        </View>
        <View style={styles.bidAmountRow}>
          <Ionicons name="flash" size={12} color="#F59E0B" />
          <Text style={styles.bidAmountText}>{slot.amount} tokens</Text>
        </View>
        <Text style={styles.headline} numberOfLines={2}>
          {slot.headline}
        </Text>
        {slot.body ? (
          <Text style={styles.body} numberOfLines={2}>
            {slot.body}
          </Text>
        ) : null}
        <View style={styles.bottomRow}>
          <Text style={styles.displayName}>{slot.displayName}</Text>
          {slot.linkText ? (
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaText}>{slot.linkText}</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.wrapper}>
      {slots.length === 1 ? (
        renderSlide(slots[0], 0)
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={BANNER_WIDTH}
          snapToAlignment="start"
          contentContainerStyle={styles.carouselContent}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={16}
        >
          {slots.map(renderSlide)}
        </ScrollView>
      )}

      {/* Dot indicators + Promote button */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slots.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeSlide && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          style={styles.promoteBtn}
          onPress={() => router.push("/banner-bid" as never)}
        >
          <Ionicons name="megaphone" size={14} color="#2563EB" />
          <Text style={styles.promoteBtnText}>Promote</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  carouselContent: {
    gap: 12,
  },
  container: {
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    position: "relative",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1E293B",
  },
  blobTopRight: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#3B82F6",
    opacity: 0.25,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -40,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#8B5CF6",
    opacity: 0.2,
  },
  blobCenter: {
    position: "absolute",
    top: 20,
    left: 80,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#06B6D4",
    opacity: 0.15,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: "auto",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rankText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "700",
  },
  bidAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  bidAmountText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "600",
  },
  headline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  displayName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ctaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dotActive: {
    backgroundColor: "#2563EB",
    width: 16,
  },
  promoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  promoteBtnText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
  },
});
