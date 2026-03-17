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
const CALLBACK_STATUS_SCRIPT = `
  (function() {
    var postStatus = function() {
      var status = document.getElementById('status');
      if (!status || !window.ReactNativeWebView) {
        return false;
      }

      var params = new URLSearchParams(window.location.search);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        url: window.location.href,
        statusText: status.innerText.trim(),
        reference: params.get('reference') || params.get('trxref') || ''
      }));
      return true;
    };

    if (postStatus()) {
      return true;
    }

    var target = document.body || document.documentElement;
    if (target && typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function() {
        if (postStatus()) {
          observer.disconnect();
        }
      });

      observer.observe(target, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    setTimeout(postStatus, 300);
    return true;
  })();
  true;
`;

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

function isCallbackUrl(url: string, callbackUrl?: string) {
  return matchesRedirectTarget(url, callbackUrl) || url.toLowerCase().includes(DEFAULT_CALLBACK_PATH);
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

function getStatusOutcome(statusText?: string | null) {
  const normalized = statusText?.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("success")) {
    return "success";
  }

  if (
    normalized.includes("abandon") ||
    normalized.includes("cancel") ||
    normalized.includes("error") ||
    normalized.includes("fail")
  ) {
    return "fail";
  }

  return null;
}

export function PaymentWebView({
  session,
  onSuccess,
  onFail,
}: PaymentWebViewProps) {
  const completedRef = React.useRef(false);
  const webViewRef = React.useRef<WebView | null>(null);

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

  const requestCallbackStatus = React.useCallback(() => {
    webViewRef.current?.injectJavaScript(CALLBACK_STATUS_SCRIPT);
  }, []);

  const inspectUrl = React.useCallback(
    (url: string) => {
      if (!url) return;

      const normalizedUrl = url.toLowerCase();

      if (
        matchesRedirectTarget(url, session.cancelUrl) ||
        normalizedUrl.startsWith(PAYSTACK_CLOSE_URL)
      ) {
        finishFail();
        return;
      }

      if (!isCallbackUrl(url, session.callbackUrl)) {
        return;
      }

      const outcome = getStatusOutcome(getRedirectStatus(url));
      if (outcome === "fail") {
        finishFail();
        return;
      }

      if (outcome === "success") {
        finishSuccess(getRedirectReference(url) ?? session.reference);
      }
    },
    [finishFail, finishSuccess, session.callbackUrl, session.cancelUrl, session.reference],
  );

  const handleLoadEnd = React.useCallback(
    ({ nativeEvent }: { nativeEvent: { url?: string } }) => {
      const url = nativeEvent.url;
      if (!url) return;

      inspectUrl(url);
      if (isCallbackUrl(url, session.callbackUrl)) {
        requestCallbackStatus();
      }
    },
    [inspectUrl, requestCallbackStatus, session.callbackUrl],
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
        ref={webViewRef}
        source={{ uri: session.checkoutUrl }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        originWhitelist={["*"]}
        onNavigationStateChange={(state) => inspectUrl(state.url)}
        onLoadEnd={handleLoadEnd}
        onMessage={(e) => {
          let payload:
            | { reference?: string; statusText?: string; url?: string }
            | null = null;

          try {
            payload = JSON.parse(e.nativeEvent.data);
          } catch {
            payload = { statusText: e.nativeEvent.data };
          }

          if (payload?.url) {
            inspectUrl(payload.url);
          }

          const outcome = getStatusOutcome(payload?.statusText);
          if (!outcome) return;

          if (outcome === "success") {
            finishSuccess(payload?.reference || session.reference);
          } else if (outcome === "fail") {
            finishFail();
          }
        }}
        onError={finishFail}
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
