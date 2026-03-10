import { api } from "@/lib/api";
import { auth, getIdToken, signOut } from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";
import { handleApiError } from "@/lib/handleApiError";
import { syncMessagingProfile } from "@/lib/messaging";
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
  user: User | null;
  initAuth: () => () => void;
  logout: () => Promise<void>;

  deviceId: string | null;
  initDeviceId: () => Promise<void>;

  posts: Post[];
  feedFilter: PostType | "ALL";
  feedLoading: boolean;
  setFeedFilter: (filter: PostType | "ALL") => void;
  fetchPosts: () => Promise<void>;

  balance: number | null;
  fetchBalance: () => Promise<void>;

  bundles: TokenBundle[];
  fetchBundles: () => Promise<void>;

  landings: LandingContent[];
  landing: LandingContent | null;
  landingSeen: boolean;
  fetchLanding: () => Promise<void>;
  dismissLanding: () => void;

  contact: Contact | null;
  fetchContact: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: auth.currentUser,
  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      set({ user: u });
      if (u) {
        void syncMessagingProfile(u).catch(() => {
          // Messaging can be configured separately from auth.
        });
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

  deviceId: null,
  initDeviceId: async () => {
    const id = await getDeviceId();
    set({ deviceId: id });
  },

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

  landings: [],
  landing: null,
  landingSeen: false,
  fetchLanding: async () => {
    try {
      const { data } = await api.get("/api/landing");
      let items: LandingContent[];
      if (Array.isArray(data.contents)) {
        items = data.contents;
      } else if (Array.isArray(data)) {
        items = data;
      } else {
        const single: LandingContent = data.content ?? data;
        items = [single];
      }
      set({ landings: items, landing: items[0] ?? null });
    } catch {
      // Landing content is optional.
    }
  },
  dismissLanding: () => set({ landingSeen: true }),

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
