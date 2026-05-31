// src/services/zebu.api.ts
import { baseApi } from "./baseApi";

export interface ZebuPosition {
  tradingSymbol?: string;
  exchange?: string;
  product?: string;
  quantity?: number | string;
  averagePrice?: number | string;
  lastPrice?: number | string;
  pnl?: number | string;
  marketValue?: number | string;
  [key: string]: any;
}

export interface ZebuPositionsResponse {
  ok?: boolean;
  data?: ZebuPosition[];
  positions?: ZebuPosition[];
  [key: string]: any;
}

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const zebuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getZebuPositions: builder.query<ZebuPositionsResponse, { tradingAccountId: number }>({
      query: ({ tradingAccountId }) => ({
        url: "/zebu/positions",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any): ZebuPositionsResponse => {
        const raw = unwrapData<any>(res);
        const positions = raw?.positions ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        return { ok: true, data: Array.isArray(positions) ? positions : [] };
      },
    }),
    getZebuHoldings: builder.query<any, { tradingAccountId: number }>({
      query: ({ tradingAccountId }) => ({
        url: "/zebu/holdings",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        const holdings = raw?.holdings ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        return { holdings: Array.isArray(holdings) ? holdings : [], raw };
      },
    }),
  }),
  overrideExisting: true,
});

export const { useGetZebuPositionsQuery, useLazyGetZebuPositionsQuery, useGetZebuHoldingsQuery, useLazyGetZebuHoldingsQuery } = zebuApi;
