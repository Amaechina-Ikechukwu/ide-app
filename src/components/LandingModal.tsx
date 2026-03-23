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
  const landingSeen = useStore((state) => state.landingSeen);
  const dismissLanding = useStore((state) => state.dismissLanding);

  const visible = Boolean(landing?.headline) && !landingSeen;
  const isCompact = screenWidth < 390;
  const cardWidth = Math.min(screenWidth - 18, 420);
  const cardHeight = screenHeight * 0.8;
  const imageHeight = Math.round(cardHeight * 0.58);
  const horizontalPadding = isCompact ? 22 : 28;
  const headlineSize = isCompact ? 28 : 32;
  const headlineLineHeight = isCompact ? 34 : 40;

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
              borderRadius: isCompact ? 24 : 28,
            },
          ]}
        >
          {/* Image section */}
          <View style={[styles.imageSection, { height: imageHeight }]}>
            {landing?.imageUrl ? (
              <Image
                source={{ uri: landing.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={[styles.glowOrb, styles.glowLeft]} />
                <View style={[styles.glowOrb, styles.glowRight]} />
              </View>
            )}
          </View>

          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            onPress={dismissLanding}
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color="#5B6B83" />
          </Pressable>

          {/* Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[
              styles.content,
              {
                paddingHorizontal: horizontalPadding,
                paddingTop: 24,
                paddingBottom: isCompact ? 28 : 32,
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

          <View pointerEvents="none" style={styles.innerBorder} />
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
    backgroundColor: "#08111E",
    overflow: "hidden",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.42,
    shadowRadius: 32,
    elevation: 20,
  },
  imageSection: {
    width: "100%",
    backgroundColor: "#0F1C2E",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: "#0F1C2E",
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 211, 152, 0.12)",
  },
  glowLeft: {
    top: -40,
    left: -40,
  },
  glowRight: {
    bottom: -40,
    right: -20,
  },
  closeButton: {
    position: "absolute",
    zIndex: 10,
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(241, 245, 249, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flexShrink: 1,
  },
  content: {
    flexGrow: 1,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(78, 131, 255, 0.78)",
    backgroundColor: "rgba(23, 60, 163, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headline: {
    color: "#F8FAFC",
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(226, 232, 240, 0.82)",
  },
  bodyCompact: {
    fontSize: 14,
    lineHeight: 22,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.08)",
    borderRadius: 28,
    pointerEvents: "none",
  },
});
