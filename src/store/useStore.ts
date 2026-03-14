import { api } from "@/lib/api";
import { auth, getIdToken, signOut } from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";
import { handleApiError } from "@/lib/handleApiError";
import {
  isMessagingConfigured,
  subscribeToUserConversations,
  syncMessagingProfile,
} from "@/lib/messaging";
import { normalizePosts } from "@/lib/posts";
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

  unreadConversationCount: number;
  unreadMessageCount: number;

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
    let unsubscribeConversations: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      unsubscribeConversations?.();
      unsubscribeConversations = null;

      set({
        user: u,
        unreadConversationCount: 0,
        unreadMessageCount: 0,
      });

      if (u) {
        void (async () => {
          try {
            await u.getIdToken();
            await syncMessagingProfile(u);
          } catch {
            // Messaging can be configured separately from auth.
          }
        })();

        if (isMessagingConfigured()) {
          unsubscribeConversations = subscribeToUserConversations(
            u.uid,
            (items) => {
              const unreadConversationCount = items.filter(
                (item) => item.unreadCount > 0,
              ).length;
              const unreadMessageCount = items.reduce(
                (sum, item) => sum + Math.max(item.unreadCount, 0),
                0,
              );

              set({ unreadConversationCount, unreadMessageCount });
            },
          );
        }

        get().fetchBalance();
      } else {
        set({ balance: null });
      }
    });

    return () => {
      unsubscribeConversations?.();
      unsubscribeAuth();
    };
  },
  logout: async () => {
    await signOut();
    set({
      user: null,
      balance: null,
      unreadConversationCount: 0,
      unreadMessageCount: 0,
    });
  },

  unreadConversationCount: 0,
  unreadMessageCount: 0,

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
      set({ posts: normalizePosts(data.posts ?? data) });
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
