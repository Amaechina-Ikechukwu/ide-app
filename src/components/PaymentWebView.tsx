import { Ionicons } from "@expo/vector-icons";
import type { PaystackCheckoutSession } from "@/lib/payments";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

interface PaymentWebViewProps {
  session: PaystackCheckoutSession;
  onSuccess: (reference?: string) => void;
  onFail: () => void;
}

const PAYSTACK_CLOSE_URL = "https://standard.paystack.co/close";
const DEFAULT_CALLBACK_PATH = "/api/payments/callback";

function tryParseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function matchesRedirectTarget(currentUrl: string, targetUrl?: string) {
  if (!targetUrl) return false;

  const current = tryParseUrl(currentUrl);
  const target = tryParseUrl(targetUrl);

  if (!current || !target) {
    return currentUrl.startsWith(targetUrl);
  }

  return current.origin === target.origin && current.pathname === target.pathname;
}

function getRedirectStatus(url: string) {
  const parsed = tryParseUrl(url);
  return parsed?.searchParams.get("status")?.trim().toLowerCase();
}

function getRedirectReference(url: string) {
  const parsed = tryParseUrl(url);
  return (
    parsed?.searchParams.get("reference") ??
    parsed?.searchParams.get("trxref") ??
    undefined
  );
}

export function PaymentWebView({
  session,
  onSuccess,
  onFail,
}: PaymentWebViewProps) {
  const completedRef = React.useRef(false);

  const finishSuccess = React.useCallback(
    (reference?: string) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onSuccess(reference);
    },
    [onSuccess],
  );

  const finishFail = React.useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onFail();
  }, [onFail]);

  const inspectUrl = React.useCallback(
    (url: string) => {
      if (!url) return;

      const normalizedUrl = url.toLowerCase();

      if (matchesRedirectTarget(url, session.cancelUrl)) {
        finishFail();
        return;
      }

      if (normalizedUrl.startsWith(PAYSTACK_CLOSE_URL)) {
        finishSuccess(getRedirectReference(url) ?? session.reference);
        return;
      }

      const hitCallback =
        matchesRedirectTarget(url, session.callbackUrl) ||
        normalizedUrl.includes(DEFAULT_CALLBACK_PATH);

      if (!hitCallback) {
        return;
      }

      const status = getRedirectStatus(url);
      if (
        status === "abandoned" ||
        status === "cancelled" ||
        status === "canceled" ||
        status === "error" ||
        status === "failed"
      ) {
        finishFail();
        return;
      }

      finishSuccess(getRedirectReference(url) ?? session.reference);
    },
    [finishFail, finishSuccess, session.callbackUrl, session.cancelUrl, session.reference],
  );

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
        source={{ uri: session.checkoutUrl }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        originWhitelist={["*"]}
        onNavigationStateChange={(state) => inspectUrl(state.url)}
        injectedJavaScript={`
          (function() {
            var post = function(payload) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(payload));
              }
            };
            var readState = function() {
              var status = document.getElementById('status');
              post({
                url: window.location.href,
                statusText: status ? status.innerText.trim() : ''
              });
            };
            readState();
            var target = document.body || document.documentElement;
            if (target) {
              var observer = new MutationObserver(readState);
              observer.observe(target, {
                childList: true,
                subtree: true,
                characterData: true
              });
            }
          })();
          true;
        `}
        onMessage={(e) => {
          let payload: { statusText?: string; url?: string } | null = null;

          try {
            payload = JSON.parse(e.nativeEvent.data);
          } catch {
            payload = { statusText: e.nativeEvent.data };
          }

          if (payload?.url) {
            inspectUrl(payload.url);
          }

          const status = payload?.statusText?.trim().toLowerCase();
          if (!status) return;

          if (status.includes("success")) {
            finishSuccess(session.reference);
          } else if (
            status.includes("cancel") ||
            status.includes("error") ||
            status.includes("fail")
          ) {
            finishFail();
          }
        }}
        onError={finishFail}
        onHttpError={finishFail}
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
