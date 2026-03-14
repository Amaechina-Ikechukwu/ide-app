import { AxiosError } from "axios";
import { Alert } from "react-native";

export function handleApiError(err: unknown) {
  if (!(err instanceof AxiosError)) throw err;
  const status = err.response?.status;
  const message = err.response?.data?.error ?? "Something went wrong.";

  switch (status) {
    case 400:
      Alert.alert("Invalid input", message);
      break;
    case 401:
      Alert.alert("Sign in required", "Please sign in to continue.");
      break;
    case 402:
      Alert.alert("Payment failed", message);
      break;
    case 403:
      Alert.alert("Not allowed", message);
      break;
    case 409:
      Alert.alert("Editing locked", message);
      break;
    case 404:
      /* silently remove from list */
      break;
    case 429: {
      const ms: number = err.response?.data?.retryAfterMs ?? 0;
      const h = (ms / 3_600_000).toFixed(1);
      Alert.alert("Rate limited", `Try again in ${h}h.`);
      break;
    }
    case 502:
      Alert.alert("Service unavailable", "Payment gateway is down. Try later.");
      break;
    default:
      Alert.alert("Error", message);
  }
}
