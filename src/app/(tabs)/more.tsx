import { resolveAppHref } from "@/lib/appLinks";
import {
  APP_NAME,
  LANDING_PROMO_DURATION_HOURS,
  LANDING_PROMO_TOKEN_COST,
  LISTING_LIFETIME_HOURS,
} from "@/constants/marketplace";
import { useStore } from "@/store/useStore";
import type { LandingContent } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_W - 32;

const FALLBACK_CONTACT = {
  email: "marketbalogun@gmail.com",
  phone: "08133470844",
  whatsapp: "+2348133470844",
};

export default function MoreScreen() {
  const router = useRouter();
  const landings = useStore((s) => s.landings);
  const contact = useStore((s) => s.contact);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const displayContact = contact ?? FALLBACK_CONTACT;
  const announcements = landings.filter((l) => !!l.headline);

  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / CARD_WIDTH);
      setActiveSlide(index);
    },
    [],
  );

  const handleAnnouncementLink = useCallback(
    async (url: string) => {
      const appHref = resolveAppHref(url);
      if (appHref) {
        router.push(appHref as never);
        return;
      }

      await Linking.openURL(url);
    },
    [router],
  );

  const renderAnnouncementCard = (item: LandingContent, index: number) => (
    <View key={index} style={[styles.announcementCard, { width: CARD_WIDTH }]}>
      <View style={styles.updateBadge}>
        <View style={styles.updateDot} />
        <Text style={styles.updateText}>ANNOUNCEMENT</Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>
            {item.tokenCost ?? LANDING_PROMO_TOKEN_COST} tokens
          </Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>
            {item.durationHours ?? LANDING_PROMO_DURATION_HOURS} hrs
          </Text>
        </View>
      </View>
      <Text style={styles.announcementTitle}>{item.headline}</Text>
      <Text style={styles.announcementBody}>{item.body}</Text>
      {item.ctaUrl ? (
        <Pressable
          style={styles.ctaBtn}
          onPress={() => {
            void handleAnnouncementLink(item.ctaUrl!);
          }}
        >
          <Text style={styles.ctaBtnText}>{item.ctaText ?? "Learn more"}</Text>
          <Ionicons name="arrow-forward" size={16} color="#2563EB" />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {announcements.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Announcements</Text>
              {announcements.length > 1 ? (
                <Text style={styles.slideCounter}>
                  {activeSlide + 1} / {announcements.length}
                </Text>
              ) : null}
            </View>

            {announcements.length === 1 ? (
              renderAnnouncementCard(announcements[0], 0)
            ) : (
              <>
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={CARD_WIDTH}
                  snapToAlignment="start"
                  contentContainerStyle={styles.carouselContent}
                  onScroll={onCarouselScroll}
                  scrollEventThrottle={16}
                >
                  {announcements.map(renderAnnouncementCard)}
                </ScrollView>

                <View style={styles.dotsRow}>
                  {announcements.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === activeSlide && styles.dotActive]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          <View style={styles.contactCard}>
            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${displayContact.email}`)}
            >
              <View
                style={[styles.contactIcon, { backgroundColor: "#FEF3C7" }]}
              >
                <Ionicons name="mail" size={20} color="#D97706" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email us</Text>
                <Text style={styles.contactValue}>{displayContact.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </Pressable>

            <View style={styles.contactDivider} />

            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${displayContact.phone}`)}
            >
              <View
                style={[styles.contactIcon, { backgroundColor: "#DBEAFE" }]}
              >
                <Ionicons name="call" size={20} color="#2563EB" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Call us</Text>
                <Text style={styles.contactValue}>{displayContact.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </Pressable>

            <View style={styles.contactDivider} />

            <Pressable
              style={styles.contactRow}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${displayContact.whatsapp.replace("+", "")}`,
                )
              }
            >
              <View
                style={[styles.contactIcon, { backgroundColor: "#D1FAE5" }]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>
                  {displayContact.whatsapp}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              {APP_NAME} is a community marketplace for Idemili, Anambra State.
              Post sale listings or request items you need. Posts auto-expire
              after {LISTING_LIFETIME_HOURS} hours. No sign-up required to
              browse or post.
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
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
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 0,
  },
  slideCounter: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  carouselContent: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  updateBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  updateText: { fontSize: 11, fontWeight: "700", color: "#374151" },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  announcementTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  announcementBody: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "600", color: "#2563EB" },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: "#2563EB",
    width: 20,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  contactValue: { fontSize: 13, color: "#9CA3AF" },
  contactDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  aboutCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aboutText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: { fontSize: 12, color: "#9CA3AF" },
});
