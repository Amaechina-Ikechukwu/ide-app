import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export function LandingModal() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const landing = useStore((state) => state.landing);
  const landingActive = useStore((state) => state.landingActive);
  const landingStatus = useStore((state) => state.landingStatus);
  const landingSeen = useStore((state) => state.landingSeen);
  const dismissLanding = useStore((state) => state.dismissLanding);

  const visible =
    Boolean(landing?.headline) &&
    landingActive &&
    landingStatus === "live" &&
    !landingSeen;
  const isCompact = screenWidth < 390;
  const cardWidth = Math.min(screenWidth - 18, 420);
  const cardHeight = Math.min(screenHeight * 0.86, 760);
  const horizontalPadding = isCompact ? 22 : 28;
  const topPadding = isCompact ? 24 : 30;
  const contentTopInset = Math.max(cardHeight * 0.31, isCompact ? 190 : 220);
  const headlineSize = isCompact ? 46 : 54;
  const headlineLineHeight = isCompact ? 48 : 56;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={dismissLanding}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,
              borderRadius: isCompact ? 30 : 36,
            },
          ]}
        >
          <View style={styles.backdropBase} />
          {landing?.imageUrl ? (
            <Image
              source={{ uri: landing.imageUrl }}
              style={styles.backdropImage}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.backdropTint} />
          <View style={styles.topShade} />
          <View style={styles.bottomShade} />
          <View style={[styles.glowOrb, styles.glowLeft]} />
          <View style={[styles.glowOrb, styles.glowRight]} />
          <View pointerEvents="none" style={styles.innerBorder} />

          <Pressable
            style={[
              styles.closeButton,
              { top: topPadding, right: horizontalPadding },
            ]}
            onPress={dismissLanding}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color="#5B6B83" />
          </Pressable>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[
              styles.content,
              {
                paddingHorizontal: horizontalPadding,
                paddingTop: contentTopInset,
                paddingBottom: isCompact ? 24 : 30,
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {landing?.badgeText?.trim() || "NEW UPDATE"}
              </Text>
            </View>

            <Text
              style={[
                styles.headline,
                { fontSize: headlineSize, lineHeight: headlineLineHeight },
              ]}
            >
              {landing?.headline}
            </Text>

            {landing?.body ? (
              <Text style={[styles.body, isCompact && styles.bodyCompact]}>
                {landing.body}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 9,
  },
  card: {
    backgroundColor: "#050B16",
    overflow: "hidden",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.42,
    shadowRadius: 32,
    elevation: 20,
  },
  backdropBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#08111E",
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.72,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 10, 24, 0.24)",
  },
  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: "rgba(8, 15, 30, 0.08)",
  },
  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 330,
    backgroundColor: "rgba(2, 6, 23, 0.58)",
  },
  glowOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 211, 152, 0.12)",
  },
  glowLeft: {
    top: 62,
    left: -28,
  },
  glowRight: {
    top: 70,
    right: -10,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.08)",
  },
  closeButton: {
    position: "absolute",
    zIndex: 2,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(241, 245, 249, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(78, 131, 255, 0.78)",
    backgroundColor: "rgba(23, 60, 163, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  badgeText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headline: {
    color: "#F8FAFC",
    fontWeight: "800",
    letterSpacing: -1.8,
    marginBottom: 18,
  },
  body: {
    fontSize: 17,
    lineHeight: 30,
    color: "rgba(226, 232, 240, 0.82)",
    marginBottom: 8,
  },
  bodyCompact: {
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 6,
  },
});
