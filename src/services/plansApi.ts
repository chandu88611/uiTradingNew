// src/store/services/userPlansApi.ts
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

  // backend might return plan as relation
  plan?: SubscriptionPlan;
}

export interface PublicPlansQuery {
  category?: MarketCategory;
  executionFlow?: ExecutionFlow;
  interval?: BillingInterval;
}

/**
 * NOTE: URLs must match your backend.
 * - Active plans list in your current planApi is: "admin/plans/subscription-plan/list"
 *   (even though it says admin, it's used as public in your code)
 * - User subscription endpoints are:
 *   POST /subscription/subscribe
 *   POST /subscription/cancel
 *   GET  /subscription/current
 */
export const userPlansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==============
    // USER: Plans
    // ==============

    listActivePlans: builder.query<
      { message: string; data: SubscriptionPlan[] },
      PublicPlansQuery | void
    >({
      query: (params) => ({
        url: "admin/plans/subscription-plan/all",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["SubscriptionPlan"],
    }),

    // Optional: single plan (if you have backend endpoint)
    getPlanById: builder.query<{ message: string; data: SubscriptionPlan }, number>({
      query: (planId) => ({
        url: `admin/plans/subscription-plan/${planId}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "SubscriptionPlan", id }],
    }),

    // ==========================
    // USER: Subscription actions
    // ==========================

    getMyCurrentSubscription: builder.query<
      { message: string; data: UserSubscription | null },
      void
    >({
      query: () => ({
        url: "/subscription/current",
        method: "GET",
      }),
      providesTags: ["UserSubscription"],
    }),

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

    cancelMySubscription: builder.mutation<
      { message: string; data?: any },
      { cancelAtPeriodEnd: boolean }
    >({
      query: (body) => ({
        url: "/subscription/cancel",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserSubscription"],
    }),
  }),
});

export const {
  useListActivePlansQuery,
  useGetPlanByIdQuery,

  useGetMyCurrentSubscriptionQuery,
  useSubscribeToPlanMutation,
  useCancelMySubscriptionMutation,
} = userPlansApi;
