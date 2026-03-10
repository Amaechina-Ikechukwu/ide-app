import { LandingModal } from "@/components/LandingModal";
import { useStore } from "@/store/useStore";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

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
      <LandingModal />
    </>
  );
}
