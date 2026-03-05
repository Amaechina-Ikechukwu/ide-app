import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MoreScreen() {
  const landing = useStore((s) => s.landing);
  const contact = useStore((s) => s.contact);
  const fetchContact = useStore((s) => s.fetchContact);

  useEffect(() => {
    fetchContact();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Announcements Section */}
        {landing?.headline ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <View style={styles.announcementCard}>
              <View style={styles.updateBadge}>
                <View style={styles.updateDot} />
                <Text style={styles.updateText}>UPDATE</Text>
              </View>
              <Text style={styles.announcementTitle}>{landing.headline}</Text>
              <Text style={styles.announcementBody}>{landing.body}</Text>
              {landing.ctaUrl && (
                <Pressable
                  style={styles.ctaBtn}
                  onPress={() => Linking.openURL(landing.ctaUrl!)}
                >
                  <Text style={styles.ctaBtnText}>
                    {landing.ctaText ?? "Learn more"}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#2563EB" />
                </Pressable>
              )}
            </View>
          </View>
        ) : null}

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          {!contact ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.contactCard}>
              <Pressable
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${contact.email}`)}
              >
                <View
                  style={[styles.contactIcon, { backgroundColor: "#FEF3C7" }]}
                >
                  <Ionicons name="mail" size={20} color="#D97706" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email us</Text>
                  <Text style={styles.contactValue}>{contact.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </Pressable>

              <View style={styles.contactDivider} />

              <Pressable
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              >
                <View
                  style={[styles.contactIcon, { backgroundColor: "#DBEAFE" }]}
                >
                  <Ionicons name="call" size={20} color="#2563EB" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Call us</Text>
                  <Text style={styles.contactValue}>{contact.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </Pressable>

              <View style={styles.contactDivider} />

              <Pressable
                style={styles.contactRow}
                onPress={() =>
                  Linking.openURL(
                    `https://wa.me/${contact.whatsapp.replace("+", "")}`,
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
                  <Text style={styles.contactValue}>{contact.whatsapp}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </Pressable>
            </View>
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              IDE (Indicate Demand / Exchange) is a marketplace where you can
              post sale listings or request items. Posts auto-expire after 48
              hours. No sign-up required to browse or post.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
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
