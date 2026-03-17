import {
  LANDING_PROMO_DURATION_HOURS,
  LANDING_PROMO_TOKEN_COST,
} from "@/constants/marketplace";
import type { LandingContent } from "@/types";
import React, { useCallback, useRef, useState } from "react";
import {
    Dimensions,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_W - 32; // 16px margin each side

interface AnnouncementBannerProps {
  landings: LandingContent[];
}

export function AnnouncementBanner({ landings }: AnnouncementBannerProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const announcements = landings.filter((l) => !!l.headline);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
      setActiveSlide(index);
    },
    [],
  );

  if (announcements.length === 0) return null;

  const renderSlide = (item: LandingContent, index: number) => (
    <View key={index} style={[styles.container, { width: BANNER_WIDTH }]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ANNOUNCEMENT</Text>
        </View>
        <Text style={styles.metaText}>
          {(item.tokenCost ?? LANDING_PROMO_TOKEN_COST).toString()} tokens |{" "}
          {(item.durationHours ?? LANDING_PROMO_DURATION_HOURS).toString()} hrs
        </Text>
        <Text style={styles.headline} numberOfLines={2}>
          {item.headline}
        </Text>
        {item.body ? (
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
      </View>
    </View>
  );

  // Single announcement — no carousel needed
  if (announcements.length === 1) {
    return <View style={styles.wrapper}>{renderSlide(announcements[0], 0)}</View>;
  }

  return (
    <View style={styles.wrapper}>
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
        scrollEventThrottle={16}
      >
        {announcements.map(renderSlide)}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {announcements.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeSlide && styles.dotActive]}
          />
        ))}
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
    height: 180,
    position: "relative",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#4A6741",
  },
  blobTopRight: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#8B6F5B",
    opacity: 0.9,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -40,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#5B7A54",
    opacity: 0.8,
  },
  blobCenter: {
    position: "absolute",
    top: 20,
    left: 80,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#7B8E76",
    opacity: 0.6,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  metaText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
});
