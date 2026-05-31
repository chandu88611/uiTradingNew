// src/services/zebu.api.ts
import { baseApi } from "./baseApi";

export interface ZebuPosition {
  tsym?: string;
  tradingSymbol?: string;
  exch?: string;
  exchange?: string;
  prd?: string;
  netqty?: number | string;
  quantity?: number | string;
  netavgprc?: number | string;
  averagePrice?: number | string;
  lp?: number | string;
  lastPrice?: number | string;
  urmtom?: number | string;
  rpnl?: number | string;
  pnl?: number | string;
  [key: string]: any;
}

function unwrap(res: any) {
  return res?.data ?? res;
}

export const zebuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /zebu/positions?tradingAccountId=X
    getZebuPositions: builder.query<{ data: ZebuPosition[] }, { tradingAccountId: number }>({
      query: ({ tradingAccountId }) => ({
        url: "/zebu/positions",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const raw = unwrap(res);
        const positions = raw?.positions ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        return { data: Array.isArray(positions) ? positions : [] };
      },
    }),

    // GET /zebu/holdings?tradingAccountId=X
    getZebuHoldings: builder.query<{ holdings: any[]; raw: any }, { tradingAccountId: number }>({
      query: ({ tradingAccountId }) => ({
        url: "/zebu/holdings",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const raw = unwrap(res);
        const holdings = raw?.holdings ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        return { holdings: Array.isArray(holdings) ? holdings : [], raw };
      },
    }),

    // GET /zebu/funds?tradingAccountId=X  (account balance / margin)
    getZebuFunds: builder.query<
      { availableCash: number; marginUsed: number; collateral: number; totalFunds: number },
      { tradingAccountId: number }
    >({
      query: ({ tradingAccountId }) => ({
        url: "/zebu/funds",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const d = unwrap(res);
        return {
          availableCash: Number(d?.availableCash ?? 0),
          marginUsed: Number(d?.marginUsed ?? 0),
          collateral: Number(d?.collateral ?? 0),
          totalFunds: Number(d?.totalFunds ?? 0),
        };
      },
    }),

    // GET /dhan/funds?tradingAccountId=X
    getDhanFunds: builder.query<
      { availableCash: number; marginUsed: number; collateral: number; totalFunds: number },
      { tradingAccountId: number }
    >({
      query: ({ tradingAccountId }) => ({
        url: "/dhan/funds",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const d = unwrap(res);
        return {
          availableCash: Number(d?.availableCash ?? 0),
          marginUsed: Number(d?.marginUsed ?? 0),
          collateral: Number(d?.collateral ?? 0),
          totalFunds: Number(d?.totalFunds ?? 0),
        };
      },
    }),

    // GET /signal/funds?tradingAccountId=X  (MT5 — funds arrive via EA state sync)
    getMt5Funds: builder.query<
      { availableCash: number; marginUsed: number; collateral: number; totalFunds: number; currency?: string },
      { tradingAccountId: number }
    >({
      query: ({ tradingAccountId }) => ({
        url: "/signal/funds",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const d = unwrap(res);
        return {
          availableCash: Number(d?.availableCash ?? 0),
          marginUsed: Number(d?.marginUsed ?? 0),
          collateral: Number(d?.collateral ?? 0),
          totalFunds: Number(d?.totalFunds ?? 0),
          currency: d?.currency,
        };
      },
    }),

    // GET /ctrader/funds?tradingAccountId=X  (cTrader — via gateway PROTO_OA_TRADER_RES)
    getCtraderFunds: builder.query<
      { availableCash: number; marginUsed: number; collateral: number; totalFunds: number; currency?: string },
      { tradingAccountId: number }
    >({
      query: ({ tradingAccountId }) => ({
        url: "/ctrader/funds",
        method: "GET",
        params: { tradingAccountId },
      }),
      transformResponse: (res: any) => {
        const d = unwrap(res);
        return {
          availableCash: Number(d?.availableCash ?? 0),
          marginUsed: Number(d?.marginUsed ?? 0),
          collateral: Number(d?.collateral ?? 0),
          totalFunds: Number(d?.totalFunds ?? 0),
          currency: d?.currency,
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetZebuPositionsQuery,
  useLazyGetZebuPositionsQuery,
  useGetZebuHoldingsQuery,
  useLazyGetZebuHoldingsQuery,
  useGetZebuFundsQuery,
  useLazyGetZebuFundsQuery,
  useGetDhanFundsQuery,
  useLazyGetDhanFundsQuery,
  useGetMt5FundsQuery,
  useLazyGetMt5FundsQuery,
  useGetCtraderFundsQuery,
  useLazyGetCtraderFundsQuery,
} = zebuApi;
