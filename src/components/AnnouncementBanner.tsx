import type { LandingContent } from "@/types";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface AnnouncementBannerProps {
  landing: LandingContent;
}

export function AnnouncementBanner({ landing }: AnnouncementBannerProps) {
  return (
    <View style={styles.container}>
      {landing.imageUrl ? (
        <Image
          source={{ uri: landing.imageUrl }}
          style={styles.bgImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.bgGradient}>
          {/* Organic blob shapes matching the screenshot */}
          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />
          <View style={styles.blobCenter} />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ANNOUNCEMENT</Text>
        </View>
        <Text style={styles.headline} numberOfLines={2}>
          {landing.headline}
        </Text>
        {landing.body ? (
          <Text style={styles.body} numberOfLines={2}>
            {landing.body}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
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
});
