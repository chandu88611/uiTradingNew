// src/store/services/userSubscriptionApi.ts
import { baseApi } from "./baseApi";

export type MarketCategory = "FOREX" | "CRYPTO" | "INDIA";
export type ExecutionFlow = "PINE_CONNECTOR" | "MANAGED" | "API";
export type BillingInterval = "monthly" | "yearly" | "lifetime";

export type SubscriptionStatusV2 =
  | "trialing"
  | "active"
  | "past_due"
  | "liquidate_only"
  | "paused"
  | "canceled"
  | "expired";

export interface SubscriptionPlan {
  id: number;
  planCode: string;
  name: string;
  description: string | null;

  priceCents: number;
  currency: string;
  interval: BillingInterval;

  category: MarketCategory;
  executionFlow: ExecutionFlow;

  maxActiveStrategies: number;
  maxConnectedAccounts: number;
  maxDailyTrades: number | null;
  maxLotPerTrade: string | null;

  featureFlags: Record<string, any> | null;
  isActive: boolean;

  metadata: Record<string, any> | null;

  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: number;
  userId: number;
  planId: number;

  status?: string; // legacy
  statusV2?: SubscriptionStatusV2 | null;

  executionEnabled: boolean;
  webhookToken?: string | null;

  startDate: string;
  endDate?: string | null;

  cancelAt?: string | null;
  canceledAt?: string | null;
  liquidateOnlyUntil?: string | null;

  createdAt: string;
  updatedAt: string;

  plan?: SubscriptionPlan | null;

  // ✅ computed for UI
  webhookUrl?: string | null;
}

export interface PublicPlansQuery {
  category?: MarketCategory;
  executionFlow?: ExecutionFlow;
  interval?: BillingInterval;
}

export interface CurrentSubscriptionQuery {
  market?: string;
  start?: number;
  count?: number;
}

/**
 * ✅ IMPORTANT:
 * - If baseApi.baseUrl = https://backend.tradebro.io  -> keep "/admin"
 * - If baseApi.baseUrl = https://backend.tradebro.io/admin -> set "" (empty)
 */
const ADMIN_PREFIX = "/admin"; // change to "" if baseUrl already includes "/admin"

const withAdmin = (path: string) =>
  `${ADMIN_PREFIX}${path}`.replace(/\/{2,}/g, "/");

/**
 * Build webhook URL for UI display.
 * This is separate from backend baseUrl used for API calls.
 */
function buildWebhookUrl(token?: string | null) {
  if (!token) return null;

  const base =
    (import.meta as any)?.env?.VITE_PUBLIC_API_URL ||
    (import.meta as any)?.env?.VITE_API_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return `${String(base).replace(/\/$/, "")}/webhooks/tradingview/${token}`;
}

export const userSubscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================
    // USER: Current subscription
    // ==========================
    getMyCurrentSubscription: builder.query<
      { message: string; data?: any; subscription?: any },
      CurrentSubscriptionQuery | void
    >({
      query: (params) => ({
        url: "/subscription/current",
        method: "GET",
        params: params ?? undefined,
      }),
     
      providesTags: ["UserSubscription"],
    }),

    // ==========================
    // USER: Subscribe
    // ==========================
    subscribeToPlan: builder.mutation<
      { message: string; data: UserSubscription },
      { planId: number; trialDays?: number }
    >({
      query: (body) => ({
        url: "/subscription/subscribe",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserSubscription"],
    }),

    // ==========================
    // USER: Cancel subscription
    // ==========================
    cancelMySubscription: builder.mutation<
      { message: string; data: UserSubscription },
      { cancelAtPeriodEnd?: boolean }
    >({
      query: (body) => ({
        url: "/subscription/cancel",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserSubscription"],
    }),

    // ==========================
    // USER: Plans list
    // ==========================
    listActivePlans: builder.query<
      { message: string; data: SubscriptionPlan[] },
      PublicPlansQuery | void
    >({
      query: (params) => ({
        url: withAdmin("/plans/subscription-plan/all"),
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["SubscriptionPlan"],
    }),

    // ==========================
    // USER: Single plan
    // ==========================
    getPlanById: builder.query<{ message: string; data: SubscriptionPlan }, number>({
      query: (planId) => ({
        url: withAdmin(`/plans/subscription-plan/${planId}`),
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "SubscriptionPlan", id }],
    }),

    // ✅ PATCH /subscription/strategy-selections
    saveStrategySelections: builder.mutation<
      { data: any },
      { strategySelections: Record<string, string[]> }
    >({
      query: (body) => ({
        url: "/subscription/strategy-selections",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["UserSubscription"],
    }),

    // ✅ PATCH /subscription/webhook-settings
    saveWebhookSettings: builder.mutation<
      { message?: string; data: {
        id: number;
        subscriptionId?: number;
        planId?: number;
        isWebhookEnabled: boolean;
        webhookToken: string | null;
        defaultTradingAccountId?: number | null;
        payloadDefaults?: Record<string, any>;
      } },
      {
        subscriptionId?: number | string | null;
        planId?: number | string | null;
        isWebhookEnabled: boolean;
        defaultTradingAccountId?: number | string | null;
        payloadDefaults?: Record<string, any>;
      }
    >({
      query: (body) => ({
        url: "/subscription/webhook-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["UserSubscription"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyCurrentSubscriptionQuery,
  useSubscribeToPlanMutation,
  useCancelMySubscriptionMutation,
  useListActivePlansQuery,
  useGetPlanByIdQuery,
  useSaveStrategySelectionsMutation,
  useSaveWebhookSettingsMutation,
} = userSubscriptionApi;
