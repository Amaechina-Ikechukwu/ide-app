# IDE App — AI Implementation Guide

> **Purpose:** This document is written so that an AI coding assistant (Copilot, Cursor, Claude, etc.)
> can implement the **Expo React Native** client for the IDE App with zero ambiguity.
> Copy-paste the relevant section into your AI prompt.

---

## 1. What the App Does

IDE (Indicate Demand / Exchange) is a marketplace feed app.

- Users post **SALE** listings (selling something) or **REQUEST** listings (wanting to buy / seeking offers).
- Other users browse the feed and contact the poster directly (no in-app chat needed initially).
- Posts auto-expire after **48 hours**.
- **No sign-up is required** to browse or post — only payment/token purchase requires a Firebase account.

---

## 2. Tech Stack (Client)

| Layer | Package |
|---|---|
| Framework | `expo` (SDK 51+), `expo-router` v3 for file-based navigation |
| HTTP | `axios` or `fetch` (built-in) |
| Storage | `expo-secure-store` (device ID) |
| Auth | `firebase` JS SDK v10 (`getAuth`, `signInWithEmailAndPassword`, `getIdToken`) |
| Image pick | `expo-image-picker` |
| Image upload | Firebase Storage JS SDK (`uploadBytes`, `getDownloadURL`) |
| WebView | `react-native-webview` |
| Deep links | `expo-linking` |
| State | `zustand` (recommended) or React Context |

### Install command
```bash
npx create-expo-app ide-app --template blank-typescript
cd ide-app
npx expo install expo-secure-store expo-image-picker react-native-webview expo-linking
npm install firebase axios zustand
```

---

## 3. Backend Base URL

| Environment | URL |
|---|---|
| Expo Go / physical device | `http://<your-local-ip>:3000` (e.g. `http://192.168.1.5:3000`) |
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator | `http://localhost:3000` |
| Production (Cloud Run) | `https://ide-api-<hash>-uc.a.run.app` — copy from Cloud Run console after first deploy |

Store the base URL in one place:
```ts
// lib/api.ts
import Constants from "expo-constants";
import axios from "axios";

export const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000",
});
```

Interactive API docs (Swagger UI): `GET /api/docs`
Raw OpenAPI JSON (for code generators): `GET /api/docs/openapi.json`

---

## 4. Device Identity (No Sign-Up)

Generate a stable UUID on first launch and persist it with `expo-secure-store`.

```ts
// lib/deviceId.ts
import * as SecureStore from "expo-secure-store";
import { randomUUID } from "expo-crypto";

const KEY = "ide_device_id";

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(KEY);
  if (!id) {
    id = randomUUID();
    await SecureStore.setItemAsync(KEY, id);
  }
  return id;
}
```

Call `getDeviceId()` once at app startup (e.g. in the root `_layout.tsx`) and store in global state. Pass it in every post-creation request body.

---

## 5. Firebase Auth (Token Purchases Only)

Only needed when the user wants to buy tokens. Use **Email/Password** (or Phone) auth.

```ts
// lib/auth.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  // ...other config values
});

export const auth = getAuth(app);

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
```

Attach to API requests:
```ts
const token = await getIdToken();
const res = await api.post("/api/payments/initiate", body, {
  headers: { Authorization: `Bearer ${token}` },
});
```

Store Firebase config values in `.env` using the `EXPO_PUBLIC_` prefix so Expo exposes them to the JS bundle.

---

## 6. Screens & API Mapping

### 6.1 Feed Screen — `GET /api/posts`

```
GET /api/posts               → all posts (SALE + REQUEST mixed)
GET /api/posts?type=SALE     → only SALE posts
GET /api/posts?type=REQUEST  → only REQUEST posts
```

**Rendering rules:**
| Field | SALE card | REQUEST card |
|---|---|---|
| Accent colour | Green `#4CAF50` | Blue `#2196F3` |
| Label badge | "FOR SALE" | "WANTED" |
| Price | Show if present | Show as "Budget: ₦X" or omit |

Use a `FlatList` with `onRefresh` / `refreshing` for pull-to-refresh. Sort is already newest-first from the API.

```tsx
// components/PostCard.tsx (outline)
const COLORS = { SALE: "#4CAF50", REQUEST: "#2196F3" };

export function PostCard({ post }: { post: Post }) {
  const accent = COLORS[post.type];
  return (
    <View style={[styles.card, { borderLeftColor: accent, borderLeftWidth: 4 }]}>
      <Text style={[styles.badge, { backgroundColor: accent }]}>
        {post.type === "SALE" ? "FOR SALE" : "WANTED"}
      </Text>
      <Text style={styles.title}>{post.title}</Text>
      {post.price && (
        <Text>{post.type === "SALE" ? `₦${post.price}` : `Budget: ₦${post.price}`}</Text>
      )}
      <ExpiryBadge expiresAt={post.expiresAt} />
    </View>
  );
}
```

---

### 6.2 Create Post Screen — `POST /api/posts`

**Required body fields:** `deviceId`, `type` (`SALE` | `REQUEST`), `title`, `description`
**Optional:** `imageUrls[]` (max 5), `price`, `currency`, `tags[]`

**Pick and upload images first:**
```ts
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

async function pickAndUploadImage(deviceId: string): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] });
  if (result.canceled) throw new Error("Cancelled");

  const { uri } = result.assets[0];
  const blob = await (await fetch(uri)).blob();
  const storage = getStorage();
  const storageRef = ref(storage, `posts/${deviceId}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
```

**Submit the post:**
```ts
const deviceId = await getDeviceId();
const token = await getIdToken(); // null for free users

const res = await api.post(
  "/api/posts",
  { deviceId, type, title, description, imageUrls, price, currency, tags },
  token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
);
```

**Rate-limit handling:**
```ts
if (error.response?.status === 429) {
  const { retryAfterMs } = error.response.data;
  const hours = (retryAfterMs / 3_600_000).toFixed(1);
  Alert.alert("Slow down!", `Free users can post once every 24 h.\nTry again in ${hours}h.`);
}
```

**Premium flow:**
- Attach `Authorization` header — server deducts 1 token automatically.
- No cooldown; previous posts are soft-deleted server-side.

---

### 6.3 Post Detail Screen — `GET /api/posts/{id}`

Show all post fields. Use this helper to render the expiry state:

```ts
function expiryLabel(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "Expired";
  if (remaining < 6 * 3_600_000) {
    const h = Math.ceil(remaining / 3_600_000);
    return `Expires in ${h}h`;
  }
  return new Date(expiresAt).toLocaleDateString();
}
```

---

### 6.4 Delete Post — `DELETE /api/posts/{id}`

```ts
const deviceId = await getDeviceId();
const token = await getIdToken();

await api.delete(`/api/posts/${postId}`, {
  data: { deviceId },                                          // always send deviceId
  ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
});
```

---

### 6.5 Token Store Screen

**Step 1 — Load bundles (public):**
```ts
const { data } = await api.get("/api/tokens/bundles");
// data.bundles: Array<{ id, units, price, currency }>
```

**Step 2 — Show balance (auth required):**
```ts
const token = await getIdToken();
const { data } = await api.get("/api/tokens/balance", {
  headers: { Authorization: `Bearer ${token}` },
});
// data.balance: number
```

**Step 3 — Initiate purchase (auth required):**
```ts
const token = await getIdToken();
const { data } = await api.post(
  "/api/payments/initiate",
  { bundle: "BUNDLE_100", email: user.email },
  { headers: { Authorization: `Bearer ${token}` } }
);
// data.paymentUrl → open in WebView
```

**Step 4 — Open Paystack WebView and intercept callback:**
```tsx
import { WebView } from "react-native-webview";

export function PaymentWebView({ paymentUrl, onSuccess, onFail }) {
  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={async (state) => {
        if (state.url.includes("/api/payments/callback")) {
          // Inject JS to read the status element
          // We use onMessage instead — inject postMessage
        }
      }}
      injectedJavaScript={`
        (function() {
          const status = document.getElementById('status');
          if (status) {
            window.ReactNativeWebView.postMessage(status.innerText.trim());
          }
        })();
        true;
      `}
      onMessage={(e) => {
        if (e.nativeEvent.data === "success") onSuccess();
        else onFail();
      }}
    />
  );
}
```

**Step 5 — Refresh balance after success:**
```ts
const { data } = await api.get("/api/tokens/balance", {
  headers: { Authorization: `Bearer ${await getIdToken()}` },
});
setBalance(data.balance);
```

---

### 6.6 Landing / Announcements Screen — `GET /api/landing`

Fetch on first app launch (once per session). Show as a bottom-sheet or modal overlay before the feed loads.

```ts
const { data } = await api.get("/api/landing");
const content: LandingContent = data.content;

// Show modal if headline is non-empty
if (content.headline) {
  // display modal
}
```

If `content.ctaUrl` is present, render a button using `expo-linking`:
```ts
import * as Linking from "expo-linking";
<Button title={content.ctaText ?? "Learn more"} onPress={() => Linking.openURL(content.ctaUrl!)} />
```

---

### 6.7 About / Contact Screen — `GET /api/contact`

```ts
const { data } = await api.get("/api/contact");
const { email, phone, whatsapp } = data.contact;
```

```tsx
import * as Linking from "expo-linking";

<Pressable onPress={() => Linking.openURL(`mailto:${email}`)}>
  <Text>Email us</Text>
</Pressable>

<Pressable onPress={() => Linking.openURL(`tel:${phone}`)}>
  <Text>Call us</Text>
</Pressable>

<Pressable onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace("+", "")}`)}>
  <Text>WhatsApp</Text>
</Pressable>
```

---

## 7. TypeScript Types

```ts
// types/index.ts

export type PostType = "SALE" | "REQUEST";

export interface Post {
  id: string;
  deviceId: string;
  userId?: string;
  type: PostType;
  title: string;
  description: string;
  imageUrls: string[];
  price?: number;
  currency?: string;
  tags: string[];
  isPremium: boolean;
  tokenCost: number;
  createdAt: number;   // Unix ms
  expiresAt: number;   // Unix ms
  deleted: boolean;
}

export interface TokenBundle {
  id: "BUNDLE_100" | "BUNDLE_350" | "BUNDLE_1000";
  units: number;
  price: number;
  currency: string;
}

export interface LandingContent {
  headline: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  updatedAt: number;
}

export interface Contact {
  email: string;
  phone: string;
  whatsapp: string;
}
```

---

## 8. Error Handling

```ts
// lib/handleApiError.ts
import { Alert } from "react-native";
import { AxiosError } from "axios";

export function handleApiError(err: unknown) {
  if (!(err instanceof AxiosError)) throw err;
  const status = err.response?.status;
  const message = err.response?.data?.error ?? "Something went wrong.";

  switch (status) {
    case 400: Alert.alert("Invalid input", message); break;
    case 401: Alert.alert("Sign in required", "Please sign in to continue."); break;
    case 402: Alert.alert("Payment failed", message); break;
    case 403: Alert.alert("Not allowed", message); break;
    case 404: /* silently remove from list */ break;
    case 429: {
      const ms: number = err.response?.data?.retryAfterMs ?? 0;
      const h = (ms / 3_600_000).toFixed(1);
      Alert.alert("Rate limited", `Try again in ${h}h.`);
      break;
    }
    case 502: Alert.alert("Service unavailable", "Payment gateway is down. Try later."); break;
    default:  Alert.alert("Error", message);
  }
}
```

| HTTP Status | Meaning | UI action |
|---|---|---|
| `400` | Validation error | Show `error` field as Alert |
| `401` | Not authenticated | Prompt sign-in screen |
| `402` | Payment not confirmed | Show retry option |
| `403` | Not the post owner | "You can't delete this post" |
| `404` | Not found / expired | Remove from local list silently |
| `429` | Rate limited | Countdown timer from `retryAfterMs` |
| `502` | Payment gateway down | "Payment service unavailable, try later" |

---

## 9. Suggested Navigation Structure (expo-router)

```
app/
├── _layout.tsx            ← root layout, loads deviceId, checks landing
├── (tabs)/
│   ├── _layout.tsx        ← BottomTabNavigator
│   ├── index.tsx          ← Feed (All / For Sale / Wanted tabs)
│   ├── create.tsx         ← Create Post
│   ├── tokens.tsx         ← Token balance + buy tokens
│   └── more.tsx           ← Landing announcements + Contact
├── post/[id].tsx          ← Post detail
└── auth/
    ├── login.tsx          ← Email sign-in (shown only when buying tokens)
    └── register.tsx
```

---

## 10. Quick-Start Prompt for AI

Paste this into your AI assistant to generate the Expo project:

```
Build an Expo React Native app (TypeScript, expo-router v3, SDK 51) called "IDE"
using the REST API documented at:
  - Swagger UI:   http://localhost:3000/api/docs
  - OpenAPI JSON: http://localhost:3000/api/docs/openapi.json

Packages to install:
  expo-secure-store, expo-image-picker, expo-crypto, expo-linking,
  react-native-webview, firebase, axios, zustand

Key requirements:
1. No login to browse or post. Identify users with a stable UUID from expo-secure-store (key: "ide_device_id").
2. Feed screen: FlatList of posts with tabs All / For Sale / Wanted.
   - SALE cards: green left border (#4CAF50), badge "FOR SALE".
   - REQUEST cards: blue left border (#2196F3), badge "WANTED".
   - Pull-to-refresh. Show "Expires in Xh" badge when expiresAt is within 6 hours.
3. Create Post screen: image picker → upload to Firebase Storage → pass download URLs.
   On HTTP 429, show an Alert with the remaining hours from retryAfterMs.
4. Token Store screen:
   a. GET /api/tokens/bundles to display bundle cards.
   b. GET /api/tokens/balance (Bearer token) to show balance.
   c. POST /api/payments/initiate (Bearer token) → open paymentUrl in react-native-webview.
   d. Inject JS into WebView to postMessage(document.getElementById('status').innerText).
   e. On "success" message, close WebView and refresh balance.
5. Auth: Firebase email/password only for token purchase. Use getIdToken() as Bearer header.
6. Landing: GET /api/landing on first session open → show content in a Modal if headline is non-empty.
7. Contact screen: GET /api/contact → buttons using expo-linking for mailto, tel, and wa.me.
8. Use the TypeScript types and handleApiError() from AI_IMPLEMENTATION_GUIDE.md.
```

---

## 11. Docker & Cloud Run Deployment

### 11.1 Files added

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Bun build → slim production image |
| `.dockerignore` | Excludes secrets, node_modules, dist from build context |
| `cloudbuild.yaml` | Google Cloud Build pipeline: build → push → deploy |

### 11.2 Local Docker test

```bash
# Build
docker build -t ide-api .

# Run locally (pass your .env variables)
docker run --rm -p 8080:8080 --env-file .env ide-api

# Verify
curl http://localhost:8080/
```

### 11.3 First-time GCP setup

Run these once from your local machine (requires `gcloud` CLI):

```bash
# 1. Set your project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# 3. Create Artifact Registry repo
gcloud artifacts repositories create ide-api \
  --repository-format=docker \
  --location=us-central1

# 4. Store secrets in Secret Manager (repeat for each variable)
gcloud secrets create FIREBASE_PROJECT_ID --data-file=- <<< "your-project-id"
gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=- <<< "your-client-email"
gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=- <<< "$(cat your-key.json | jq -r .private_key)"
gcloud secrets create FIREBASE_DATABASE_URL --data-file=- <<< "https://your-project-id-default-rtdb.firebaseio.com"
gcloud secrets create PAYSTACK_SECRET_KEY --data-file=- <<< "sk_live_xxx"
gcloud secrets create CONTACT_EMAIL --data-file=- <<< "you@example.com"
gcloud secrets create CONTACT_PHONE --data-file=- <<< "+2348000000000"
gcloud secrets create CONTACT_WHATSAPP --data-file=- <<< "+2348000000000"

# 5. Grant Cloud Build SA access to Secret Manager and Cloud Run
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"
```

### 11.4 Manual deploy (one-off)

```bash
# Build and push
gcloud builds submit --config cloudbuild.yaml .

# Or deploy directly without Cloud Build
gcloud run deploy ide-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### 11.5 Continuous deployment (auto on git push)

```bash
# Connect your GitHub repo to Cloud Build
gcloud builds triggers create github \
  --repo-name=ide-api \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml
```

Every push to `main` will now: type-check → build Docker image → push to Artifact Registry → deploy to Cloud Run.

### 11.6 After first deploy — update APP_BASE_URL

Cloud Run assigns a stable URL. Get it and update the env var:

```bash
SERVICE_URL=$(gcloud run services describe ide-api \
  --region us-central1 \
  --format='value(status.url)')

gcloud run services update ide-api \
  --region us-central1 \
  --update-env-vars APP_BASE_URL=${SERVICE_URL}
```

Also update `extra.apiUrl` in the Expo app's `app.config.js` to this URL before the production build.

### 11.7 Cloud Run considerations

| Setting | Value | Reason |
|---|---|---|
| `--min-instances=0` | Scale to zero | Cost saving for a new app |
| `--max-instances=10` | Hard cap | Prevent runaway billing |
| `--concurrency=80` | Bun can handle high concurrency | Cloud Run default |
| `--memory=512Mi` | Enough for Bun + firebase-admin | Increase if OOM |
| Cold start | ~1–2 s (Bun is fast) | Acceptable for mobile API |
| `FIREBASE_PRIVATE_KEY` | Stored in Secret Manager | Never in image or env vars directly |
