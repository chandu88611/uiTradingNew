// src/services/tradingApi.ts
import { baseApi } from "./baseApi";

export type TradingviewHistoryParams =
  | { lastMinutes: number; page?: number; limit?: number }
  | {
      from: string; // ISO
      to: string; // ISO
      ticker?: string;
      exchange?: string;
      page?: number;
      limit?: number;
    };

export interface TradingviewAlertSnapshot {
  id?: number;
  jobId?: number;

  action?: string | null;
  ticker?: string | null;
  exchange?: string | null;
  interval?: string | null;

  alertTime?: string | null;
  barTime?: string | null;

  open?: string | number | null;
  close?: string | number | null;
  high?: string | number | null;
  low?: string | number | null;
  volume?: string | number | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  // allow extra fields (your backend may send more)
  [key: string]: any;
}

export interface TradingviewHistoryApiResponse {
  message?: string;
  data?: any; // backend can return many shapes
}

export const tradingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTradingviewAlertsHistory: builder.query<
      TradingviewHistoryApiResponse,
      TradingviewHistoryParams
    >({
      query: (params) => ({
        url: "/tradingview/alerts/history",
        method: "GET",
        params,
      }),
      providesTags: ["TradingviewAlertsHistory"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetTradingviewAlertsHistoryQuery } = tradingApi;
