import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ExpiryBadgeProps {
  expiresAt: number;
}

function expiryLabel(expiresAt: number): { text: string; urgent: boolean } {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return { text: "Expired", urgent: true };
  const hours = Math.ceil(remaining / 3_600_000);
  if (hours <= 6) return { text: `${hours}h remaining`, urgent: true };
  if (hours <= 24) return { text: `${hours}h left`, urgent: false };
  const days = Math.ceil(hours / 24);
  return { text: `${days}d left`, urgent: false };
}

export function ExpiryBadge({ expiresAt }: ExpiryBadgeProps) {
  const { text, urgent } = expiryLabel(expiresAt);

  return (
    <View style={[styles.badge, urgent && styles.urgent]}>
      <Ionicons
        name={urgent ? "alert-circle-outline" : "time-outline"}
        size={14}
        color={urgent ? "#DC2626" : "#6B7280"}
      />
      <Text style={[styles.text, urgent && styles.urgentText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  urgent: {},
  text: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  urgentText: {
    color: "#DC2626",
  },
});
