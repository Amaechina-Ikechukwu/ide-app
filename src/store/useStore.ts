import { api } from "@/lib/api";
import { auth, getIdToken, signOut } from "@/lib/auth";
import {
  LANDING_PROMO_DURATION_HOURS,
  LANDING_PROMO_TOKEN_COST,
} from "@/constants/marketplace";
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
  PaymentTransaction,
  Post,
  PostType,
  TokenBundle,
} from "@/types";
import { onAuthStateChanged, type User } from "firebase/auth";
import { create } from "zustand";

interface AuthenticatedRequestOptions {
  token?: string | null;
  silent?: boolean;
}

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
  fetchBalance: (options?: AuthenticatedRequestOptions) => Promise<number | null>;

  bundles: TokenBundle[];
  fetchBundles: () => Promise<void>;

  transactions: PaymentTransaction[];
  transactionsLoading: boolean;
  fetchTransactions: (
    options?: AuthenticatedRequestOptions,
  ) => Promise<PaymentTransaction[]>;

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
          const token = await u.getIdToken().catch(() => null);

          void get().fetchBalance({ token });
          void get().fetchTransactions({ token });

          try {
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

      } else {
        set({ balance: null, transactions: [] });
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
      transactions: [],
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
  fetchBalance: async (options) => {
    const token = options?.token ?? (await getIdToken());
    if (!token) return null;

    try {
      const { data } = await api.get("/api/tokens/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const balance =
        typeof data.balance === "number" && Number.isFinite(data.balance)
          ? data.balance
          : null;

      set({ balance });
      return balance;
    } catch (err) {
      if (!options?.silent) {
        handleApiError(err);
      }
      return get().balance;
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

  transactions: [],
  transactionsLoading: false,
  fetchTransactions: async (options) => {
    const token = options?.token ?? (await getIdToken());
    if (!token) {
      set({ transactions: [], transactionsLoading: false });
      return [];
    }

    set({ transactionsLoading: true });

    try {
      const { data } = await api.get("/api/payments/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactions = Array.isArray(data?.transactions)
        ? data.transactions
        : Array.isArray(data)
          ? data
          : [];

      set({ transactions });
      return transactions;
    } catch (err) {
      if (!options?.silent) {
        handleApiError(err);
      }
      return get().transactions;
    } finally {
      set({ transactionsLoading: false });
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
      items = items.map((item) => ({
        ...item,
        tokenCost:
          typeof item?.tokenCost === "number" &&
          Number.isFinite(item.tokenCost)
            ? item.tokenCost
            : LANDING_PROMO_TOKEN_COST,
        durationHours:
          typeof item?.durationHours === "number" &&
          Number.isFinite(item.durationHours)
            ? item.durationHours
            : LANDING_PROMO_DURATION_HOURS,
      }));
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
