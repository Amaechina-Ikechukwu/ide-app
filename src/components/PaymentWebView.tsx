import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

interface PaymentWebViewProps {
  paymentUrl: string;
  onSuccess: () => void;
  onFail: () => void;
}

export function PaymentWebView({
  paymentUrl,
  onSuccess,
  onFail,
}: PaymentWebViewProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={onFail} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 36 }} />
      </View>
      <WebView
        source={{ uri: paymentUrl }}
        style={styles.web}
        onNavigationStateChange={(state) => {
          // Detect callback URL
          if (state.url.includes("/api/payments/callback")) {
            // Will be handled by injectedJavaScript + onMessage
          }
        }}
        injectedJavaScript={`
          (function() {
            var status = document.getElementById('status');
            if (status) {
              window.ReactNativeWebView.postMessage(status.innerText.trim());
            }
            // Also observe for dynamic updates
            var observer = new MutationObserver(function() {
              var s = document.getElementById('status');
              if (s) {
                window.ReactNativeWebView.postMessage(s.innerText.trim());
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
          })();
          true;
        `}
        onMessage={(e) => {
          const msg = e.nativeEvent.data.toLowerCase();
          if (msg === "success") {
            onSuccess();
          } else if (msg === "failed" || msg === "error") {
            onFail();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  web: { flex: 1 },
});
