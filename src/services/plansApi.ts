// src/store/services/userPlansApi.ts
import { baseApi } from "./baseApi";

export type MarketCode = "FOREX" | "CRYPTO" | "INDIAN";
export type BillingInterval = "monthly" | "yearly" | "lifetime";
export type PlanTypeCode = "STRATEGY" | "SELF_TRADE" | "COPY_TRADER" | "MASTER" | "BUNDLE";

export interface PlanType {
  id: string;
  code: PlanTypeCode;
  name: string;
  createdAt: string;
}

export interface Market {
  id: number;
  code: MarketCode;
  name: string;
  createdAt: string;
}

export interface PlanPricing {
  id: number;
  planId: string;
  priceInr: number;
  currency: string;
  interval: BillingInterval;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  id?: number;
  planId: string;
  featureKey: string;
  featureValue: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Strategy {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  metadata?: Record<string, any> | null;
}

export interface PlanStrategy {
  id: number;
  planId: string;
  strategyId: string;
  createdAt?: string;
  strategy?: Strategy | null; // will exist if backend joins
}

export interface SubscriptionPlan {
  id: string;
  planTypeId: string;
  marketId: number | null;

  name: string;
  description: string | null;
  isActive: boolean;
  metadata: Record<string, any> | null;

  createdAt: string;
  updatedAt: string;

  planType: PlanType;
  market: Market | null;

  pricing: PlanPricing | null;
  limits: any | null;

  features: PlanFeature[];
  bundleItems: any[];
  planStrategies: PlanStrategy[];
}

export interface PlansList {
  rows: SubscriptionPlan[];
  total: number;
}

export interface PublicPlansQuery {
  chunkSize?: number;
  initialOffset?: number;
  searchParam?: string;
  isActive?: boolean;
  planTypeCode?: PlanTypeCode;
  marketCode?: MarketCode | "NULL";
}

type ApiEnvelope<T> = { message: string; data: T };

const LIST_PLANS_URL = "admin/plans/subscription-plan/all";
const GET_PLAN_URL = "admin/plans/subscription-plan";

export const userPlansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listActivePlans: builder.query<PlansList, PublicPlansQuery | void>({
      query: (params) => ({
        url: LIST_PLANS_URL,
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiEnvelope<[SubscriptionPlan[], number]>) => ({
        rows: res?.data?.[0] ?? [],
        total: res?.data?.[1] ?? 0,
      }),
      providesTags: ["SubscriptionPlan"],
    }),

    getPlanById: builder.query<SubscriptionPlan, string>({
      query: (planId) => ({
        url: `${GET_PLAN_URL}/${planId}`,
        method: "GET",
      }),
      transformResponse: (res: ApiEnvelope<SubscriptionPlan>) => res.data,
      providesTags: (_r, _e, id) => [{ type: "SubscriptionPlan", id } as const],
    }),
  }),
});

export const { useListActivePlansQuery, useGetPlanByIdQuery } = userPlansApi;
