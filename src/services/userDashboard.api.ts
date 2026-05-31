import { baseApi } from "./baseApi";

export type DashboardUser = {
  id: number;
  email: string;
  name: string;
  isEmailVerified: boolean;
  isActive: boolean;
  isAdmin: boolean;
  allowTrade: boolean;
  allowCopyTrade: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type DashboardTradeStats = {
  active: number;
  closed: number;
  failed: number;
  total: number;
};

export type DashboardPlanMarket = {
  id: number;
  code: string;
  name: string;
};

export type DashboardPlanType = {
  id: string;
  code: string;
  name: string;
};

export type DashboardPlanPricing = {
  priceInr: number;
  currency: string;
  interval: string;
  isFree: boolean;
};

export type DashboardPlan = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  market: DashboardPlanMarket | null;
  planType: DashboardPlanType | null;
  pricing: DashboardPlanPricing | null;
};

export type DashboardSubscription = {
  id: number;
  userId: number;
  planId: number;
  status: string;
  autoRenew: boolean;
  executionEnabled: boolean;
  isWebhookEnabled: boolean;
  startDate: string | null;
  endDate: string | null;
  cancelAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: DashboardPlan | null;
};

export type DashboardBroker = {
  id: number;
  code: string;
  name: string;
  marketCategory: string | null;
  isActive: boolean;
};

export type DashboardAccountMarket = {
  code: string | null;
  name: string | null;
  brokerCategory: string | null;
};

export type DashboardAccountSubscription = {
  id: number | null;
  status: string | null;
  planId: number | null;
  planName: string | null;
};

export type DashboardAccountTradeCounts = {
  active: number;
  closed: number;
  failed: number;
  total: number;
};

export type DashboardAccount = {
  id: number;
  subscriptionId: number | null;
  accountId: string;
  accountLabel: string | null;
  isMaster: boolean;
  isEnabled: boolean;
  status: string;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  broker: DashboardBroker | null;
  market: DashboardAccountMarket | null;
  subscription: DashboardAccountSubscription | null;
  tradeCounts: DashboardAccountTradeCounts;
};

export type UserDashboardData = {
  user: DashboardUser;
  stats: {
    trades: DashboardTradeStats;
  };
  plans: {
    active: DashboardSubscription[];
    past: DashboardSubscription[];
  };
  accounts: DashboardAccount[];
};

type UserDashboardApiResponse = {
  message: string;
  data: UserDashboardData;
};

export const userDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserDashboard: builder.query<UserDashboardData, void>({
      query: () => ({
        url: "user/dashboard",
        method: "GET",
      }),
      transformResponse: (response: UserDashboardApiResponse) => response.data,
      providesTags: [{ type: "UserDashboard" as const, id: "OVERVIEW" }],
    }),
  }),
});

export const { useGetUserDashboardQuery } = userDashboardApi;