import { api } from "@/lib/api";
import { auth, getIdToken, signOut } from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";
import { handleApiError } from "@/lib/handleApiError";
import type {
    Contact,
    LandingContent,
    Post,
    PostType,
    TokenBundle,
} from "@/types";
import { onAuthStateChanged, type User } from "firebase/auth";
import { create } from "zustand";

interface AppState {
  // Auth
  user: User | null;
  initAuth: () => () => void;
  logout: () => Promise<void>;

  // Device
  deviceId: string | null;
  initDeviceId: () => Promise<void>;

  // Feed
  posts: Post[];
  feedFilter: PostType | "ALL";
  feedLoading: boolean;
  setFeedFilter: (filter: PostType | "ALL") => void;
  fetchPosts: () => Promise<void>;

  // Token balance
  balance: number | null;
  fetchBalance: () => Promise<void>;

  // Token bundles
  bundles: TokenBundle[];
  fetchBundles: () => Promise<void>;

  // Landing
  landing: LandingContent | null;
  landingSeen: boolean;
  fetchLanding: () => Promise<void>;
  dismissLanding: () => void;

  // Contact
  contact: Contact | null;
  fetchContact: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // ── Auth ──
  user: auth.currentUser,
  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      set({ user: u });
      if (u) {
        get().fetchBalance();
      } else {
        set({ balance: null });
      }
    });
    return unsubscribe;
  },
  logout: async () => {
    await signOut();
    set({ user: null, balance: null });
  },

  // ── Device ──
  deviceId: null,
  initDeviceId: async () => {
    const id = await getDeviceId();
    set({ deviceId: id });
  },

  // ── Feed ──
  posts: [],
  feedFilter: "ALL",
  feedLoading: false,
  setFeedFilter: (filter) => {
    set({ feedFilter: filter });
    get().fetchPosts();
  },
  fetchPosts: async () => {
    set({ feedLoading: true });
    try {
      const filter = get().feedFilter;
      const params = filter !== "ALL" ? { type: filter } : undefined;
      const { data } = await api.get("/api/posts", { params });
      set({ posts: data.posts ?? data ?? [] });
    } catch (err) {
      handleApiError(err);
    } finally {
      set({ feedLoading: false });
    }
  },

  // ── Tokens ──
  balance: null,
  fetchBalance: async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      const { data } = await api.get("/api/tokens/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ balance: data.balance });
    } catch (err) {
      handleApiError(err);
    }
  },

  bundles: [],
  fetchBundles: async () => {
    try {
      const { data } = await api.get("/api/tokens/bundles");
      set({ bundles: data.bundles ?? data ?? [] });
    } catch (err) {
      handleApiError(err);
    }
  },

  // ── Landing ──
  landing: null,
  landingSeen: false,
  fetchLanding: async () => {
    try {
      const { data } = await api.get("/api/landing");
      const content: LandingContent = data.content ?? data;
      set({ landing: content });
    } catch {
      // silently ignore – not critical
    }
  },
  dismissLanding: () => set({ landingSeen: true }),

  // ── Contact ──
  contact: null,
  fetchContact: async () => {
    try {
      const { data } = await api.get("/api/contact");
      set({ contact: data.contact ?? data });
    } catch (err) {
      handleApiError(err);
    }
  },
}));
