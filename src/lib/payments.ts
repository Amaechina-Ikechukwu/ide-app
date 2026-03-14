export interface PaystackCheckoutSession {
  provider: "paystack";
  checkoutUrl: string;
  reference?: string;
  callbackUrl?: string;
  cancelUrl?: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

export function normalizePaystackCheckoutSession(
  payload: unknown,
): PaystackCheckoutSession | null {
  const root = asRecord(payload);
  if (!root) return null;

  const nested = asRecord(root.data) ?? asRecord(root.payment) ?? asRecord(root.session);
  const metadata = asRecord(nested?.metadata) ?? asRecord(root.metadata);

  const checkoutUrl = pickString(
    root.paymentUrl,
    root.authorization_url,
    root.authorizationUrl,
    nested?.paymentUrl,
    nested?.authorization_url,
    nested?.authorizationUrl,
  );

  if (!checkoutUrl) {
    return null;
  }

  return {
    provider: "paystack",
    checkoutUrl,
    reference: pickString(root.reference, nested?.reference),
    callbackUrl: pickString(
      root.callback_url,
      root.callbackUrl,
      nested?.callback_url,
      nested?.callbackUrl,
      metadata?.callback_url,
      metadata?.callbackUrl,
      process.env.EXPO_PUBLIC_PAYSTACK_CALLBACK_URL,
    ),
    cancelUrl: pickString(
      root.cancel_action,
      root.cancelAction,
      nested?.cancel_action,
      nested?.cancelAction,
      metadata?.cancel_action,
      metadata?.cancelAction,
      process.env.EXPO_PUBLIC_PAYSTACK_CANCEL_URL,
    ),
  };
}
