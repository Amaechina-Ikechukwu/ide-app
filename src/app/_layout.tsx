import { LandingModal } from "@/components/LandingModal";
import { isMessagingConfigured } from "@/lib/messaging";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function GlobalMessageIndicator() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const user = useStore((state) => state.user);
  const unreadMessageCount = useStore((state) => state.unreadMessageCount);

  if (
    !user ||
    !isMessagingConfigured() ||
    unreadMessageCount < 1 ||
    pathname.startsWith("/messages")
  ) {
    return null;
  }

  const label =
    unreadMessageCount === 1
      ? "1 new message"
      : `${unreadMessageCount} new messages`;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.indicatorWrap,
        { bottom: Math.max(insets.bottom + 20, 32) },
      ]}
    >
      <Pressable
        style={styles.indicatorButton}
        onPress={() => router.push("/(tabs)/messages")}
      >
        <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
        <Text style={styles.indicatorText}>{label}</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const initDeviceId = useStore((state) => state.initDeviceId);
  const fetchLanding = useStore((state) => state.fetchLanding);
  const initAuth = useStore((state) => state.initAuth);

  useEffect(() => {
    void initDeviceId();
    void fetchLanding();
    const unsubscribe = initAuth();
    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="post/[id]"
          options={{
            headerShown: true,
            title: "Post Details",
            headerTintColor: "#2563EB",
          }}
        />
        <Stack.Screen
          name="messages/[conversationId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Sign In",
            headerTintColor: "#2563EB",
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Create Account",
            headerTintColor: "#2563EB",
          }}
        />
      </Stack>
      <GlobalMessageIndicator />
      <LandingModal />
    </>
  );
}

const styles = StyleSheet.create({
  indicatorWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  indicatorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  indicatorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
