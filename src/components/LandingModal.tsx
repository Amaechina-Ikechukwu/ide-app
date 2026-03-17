import { resolveAppHref } from "@/lib/appLinks";
import {
  LANDING_PROMO_DURATION_HOURS,
  LANDING_PROMO_TOKEN_COST,
} from "@/constants/marketplace";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export function LandingModal() {
  const router = useRouter();
  const landing = useStore((s) => s.landing);
  const landingSeen = useStore((s) => s.landingSeen);
  const dismissLanding = useStore((s) => s.dismissLanding);

  const visible = !!landing?.headline && !landingSeen;

  const handleCtaPress = async () => {
    if (!landing?.ctaUrl) {
      return;
    }

    const appHref = resolveAppHref(landing.ctaUrl);
    if (appHref) {
      dismissLanding();
      router.push(appHref as never);
      return;
    }

    await Linking.openURL(landing.ctaUrl);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      onRequestClose={dismissLanding}
    >
      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Popup card — almost full screen */}
        <View style={styles.popup}>
          {/* ✕ Close button — top right, always visible */}
          <Pressable
            style={styles.closeBtn}
            onPress={dismissLanding}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>

          {/* Hero area */}
          {landing?.imageUrl ? (
            <Image
              source={{ uri: landing.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroGradient}>
              {/* Decorative circles */}
              <View style={styles.decoCircle1} />
              <View style={styles.decoCircle2} />
              <View style={styles.decoCircle3} />
              <View style={styles.heroIconWrap}>
                <Ionicons name="megaphone" size={48} color="#fff" />
              </View>
            </View>
          )}

          {/* Scrollable content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Sponsored badge */}
            <View style={styles.sponsoredBadge}>
              <Ionicons name="star" size={11} color="#EAB308" />
              <Text style={styles.sponsoredText}>SPONSORED</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  {landing?.tokenCost ?? LANDING_PROMO_TOKEN_COST} tokens
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  {landing?.durationHours ?? LANDING_PROMO_DURATION_HOURS} hrs
                </Text>
              </View>
            </View>

            {/* Headline */}
            <Text style={styles.headline}>{landing?.headline}</Text>

            {/* Body */}
            <Text style={styles.body}>{landing?.body}</Text>

            {/* CTA link if present */}
            {landing?.ctaUrl ? (
              <Pressable
                style={styles.ctaLink}
                onPress={() => {
                  void handleCtaPress();
                }}
              >
                <Text style={styles.ctaLinkText}>
                  {landing.ctaText ?? "Learn more"}
                </Text>
                <Ionicons name="open-outline" size={16} color="#2563EB" />
              </Pressable>
            ) : null}
          </ScrollView>

          {/* Bottom CTA */}
          <View style={styles.footer}>
            {landing?.ctaUrl ? (
              <Pressable
                style={styles.ctaBtn}
                onPress={() => {
                  void handleCtaPress();
                }}
              >
                <Text style={styles.ctaBtnText}>
                  {landing.ctaText ?? "Learn More"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            ) : null}

            <Pressable style={styles.dismissBtn} onPress={dismissLanding}>
              <Text style={styles.dismissText}>Continue to App</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  popup: {
    width: SCREEN_W - 24,
    height: SCREEN_H * 0.88,
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: 220,
  },
  heroGradient: {
    width: "100%",
    height: 220,
    backgroundColor: "#2563EB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  decoCircle1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -60,
  },
  decoCircle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    left: -30,
  },
  decoCircle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: 30,
    left: 40,
  },
  heroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 8,
  },
  sponsoredBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 14,
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 23,
    marginBottom: 16,
  },
  ctaLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  ctaLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 10,
  },
  ctaBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dismissBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dismissText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
});
