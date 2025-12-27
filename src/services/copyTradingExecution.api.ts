// src/services/copyTradingExecution.api.ts
import { baseApi } from "./baseApi";

export type MarketCategory = "INDIA" | "FOREX";

export type SymbolSearchRow = {
  symbol: string;
  name?: string | null;
  exchange?: string | null;
  segment?: string | null;
  [k: string]: any;
};

export type ManualSide = "BUY" | "SELL";

// FOREX manual payload
export type ManualForexOrderType = "MARKET" | "LIMIT" | "STOP";
export type ManualForexTradeBody = {
  mode: "FOREX";
  targets: string[]; // tradingAccountIds or forexDetailIds (your choice)
  symbol: string;
  side: ManualSide;
  orderType: ManualForexOrderType;
  lots: number;
  price?: number | null;
  slPrice?: number | null;
  tpPrice?: number | null;
  comment?: string | null;
  clientOrderId?: string | null;
};

// INDIA manual payload
export type ManualIndiaOrderType = "MARKET" | "LIMIT" | "SL" | "SL-M";
export type ManualIndiaTradeBody = {
  mode: "INDIA";
  targets: string[];
  symbol: string;
  side: ManualSide;
  exchange: "NSE" | "BSE" | "NFO" | "MCX";
  product: "CNC" | "MIS" | "NRML";
  orderType: ManualIndiaOrderType;
  qty: number;
  price?: number | null;
  triggerPrice?: number | null;
  validity?: "DAY" | "IOC";
  clientOrderId?: string | null;
};

export type ManualCopyTradeBody = ManualForexTradeBody | ManualIndiaTradeBody;

export type ManualTradeFanoutResult = {
  requestId?: string;
  requested?: number;
  accepted?: number;
  failed?: number;
  // optional per-account statuses
  items?: Array<{
    targetId: string;
    status: "accepted" | "failed";
    message?: string;
    brokerOrderId?: string;
  }>;
  [k: string]: any;
};

export type StrategyRow = {
  id: string | number;
  name?: string | null;
  strategyName?: string | null;
  market?: MarketCategory | null;
  [k: string]: any;
};

export type CopyLinkSettings = {
  lotMultiplier?: number | null;
  maxLotPerTrade?: number | null;
  maxDailyTrades?: number | null;
  reverseTrades?: boolean;
  copySLTP?: boolean;
  // add more later (symbol mapping, risk, etc.)
  [k: string]: any;
};

export type CopyLinkRow = {
  mode: MarketCategory;
  strategyId: string;
  targetAccountIds: string[];
  settings?: CopyLinkSettings | null;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

export type UpsertCopyLinkBody = {
  mode: MarketCategory;
  strategyId: string;
  targetAccountIds: string[];
  settings?: CopyLinkSettings;
};

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const copyTradingExecutionApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["CopySymbols", "CopyStrategies", "CopyLinks"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      /**
       * ✅ GET /copy/symbols?mode=FOREX&q=EUR
       * expected response:
       * - { data: [{symbol, name...}] }
       * - OR { rows/items/data: [...] }
       */
      searchCopySymbols: builder.query<
        SymbolSearchRow[],
        { mode: MarketCategory; q: string }
      >({
        query: ({ mode, q }) => ({
          url: "/copy/symbols",
          method: "GET",
          params: { mode, q },
        }),
        transformResponse: (res: any) => {
          const raw = unwrapData<any>(res);
          const rows = raw?.rows ?? raw?.items ?? raw?.data ?? raw ?? [];
          return Array.isArray(rows) ? (rows as SymbolSearchRow[]) : [];
        },
        providesTags: ["CopySymbols"],
      }),

      /**
       * ✅ POST /copy/manual-trade
       * expected response:
       * - { data: { requestId, accepted, failed, items[] } }
       */
      placeManualCopyTrade: builder.mutation<
        ManualTradeFanoutResult,
        ManualCopyTradeBody
      >({
        query: (body) => ({
          url: "/copy/manual-trade",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<ManualTradeFanoutResult>(res),
      }),

      /**
       * ✅ GET /copy/strategies?mode=FOREX
       * expected response:
       * - { data: [{id,name...}] } or rows/items
       */
      listMyCopyStrategies: builder.query<StrategyRow[], { mode: MarketCategory }>({
        query: ({ mode }) => ({
          url: "/copy/strategies",
          method: "GET",
          params: { mode },
        }),
        transformResponse: (res: any) => {
          const raw = unwrapData<any>(res);
          const rows = raw?.rows ?? raw?.items ?? raw?.data ?? raw ?? [];
          return Array.isArray(rows) ? (rows as StrategyRow[]) : [];
        },
        providesTags: ["CopyStrategies"],
      }),

      /**
       * ✅ GET /copy/links?mode=FOREX
       * response: [{strategyId,targetAccountIds,settings}]
       */
      listMyCopyLinks: builder.query<CopyLinkRow[], { mode: MarketCategory }>({
        query: ({ mode }) => ({
          url: "/copy/links",
          method: "GET",
          params: { mode },
        }),
        transformResponse: (res: any) => {
          const raw = unwrapData<any>(res);
          const rows = raw?.rows ?? raw?.items ?? raw?.data ?? raw ?? [];
          return Array.isArray(rows) ? (rows as CopyLinkRow[]) : [];
        },
        providesTags: ["CopyLinks"],
      }),

      /**
       * ✅ POST /copy/links
       * upsert link: strategy -> accounts + settings
       */
      upsertCopyLink: builder.mutation<CopyLinkRow | any, UpsertCopyLinkBody>({
        query: (body) => ({
          url: "/copy/links",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["CopyLinks"],
      }),

      /**
       * ✅ DELETE /copy/links?mode=FOREX&strategyId=123
       */
      deleteCopyLink: builder.mutation<any, { mode: MarketCategory; strategyId: string }>({
        query: ({ mode, strategyId }) => ({
          url: "/copy/links",
          method: "DELETE",
          params: { mode, strategyId },
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["CopyLinks"],
      }),
    }),
    overrideExisting: true,
  });

export const {
  useSearchCopySymbolsQuery,
  useLazySearchCopySymbolsQuery,
  usePlaceManualCopyTradeMutation,
  useListMyCopyStrategiesQuery,
  useLazyListMyCopyStrategiesQuery,
  useListMyCopyLinksQuery,
  useLazyListMyCopyLinksQuery,
  useUpsertCopyLinkMutation,
  useDeleteCopyLinkMutation,
} = copyTradingExecutionApi;
