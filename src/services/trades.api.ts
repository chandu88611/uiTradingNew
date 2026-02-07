// src/services/trades.api.ts
import { baseApi } from "./baseApi";

/**
 * Backend APIs:
 * 1) GET  /trade/all?start=0&count=10
 * 2) GET  /trade?id=123
 * 3) GET  /trade/history?start=0&count=10
 *
 * NOTE:
 * - Response shapes can vary; we keep them flexible but typed enough for UI.
 * - baseApi should already have baseUrl set (ex: http://69.62.126.107:3000)
 */

export type PagingParams = {
  start?: number; // default 0
  count?: number; // default 10
};

// If you want strict fields, replace `any` with your real backend shape later.
export interface TradeDto {
  id?: number | string;
  status?: string | null;
  symbol?: string | null;
  side?: string | null;
  qty?: number | string | null;
  price?: number | string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  pnl?: number | string | null;

  // allow extra fields from backend
  [key: string]: any;
}

// common wrapper (backend may return {data:...} or array directly)
export interface TradesListResponse {
  message?: string;
  data?: TradeDto[] | any;
  total?: number;
  start?: number;
  count?: number;

  [key: string]: any;
}

export interface TradeOneResponse {
  message?: string;
  data?: TradeDto | any;

  [key: string]: any;
}

export const tradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /trade/all?start&count
    getAllTrades: builder.query<TradesListResponse, PagingParams | void>({
      query: (params) => ({
        url: "/trade/all",
        method: "GET",
        params: params ?? { start: 0, count: 10 },
      }),
      providesTags: (result) => {
        // Tag each item + list tag so you can invalidate easily later
        const rows = (result as any)?.data;
        const arr: any[] = Array.isArray(rows) ? rows : Array.isArray(result as any) ? (result as any) : [];
        return [
          { type: "Trades" as const, id: "LIST" },
          ...arr
            .map((t) => t?.id)
            .filter((id) => id != null)
            .map((id) => ({ type: "Trades" as const, id })),
        ];
      },
    }),

    // GET /trade?id=123
    getTradeById: builder.query<TradeOneResponse, { id: number | string }>({
      query: ({ id }) => ({
        url: "/trade",
        method: "GET",
        params: { id },
      }),
      providesTags: (_res, _err, arg) => [{ type: "Trades", id: arg.id }],
    }),

    // GET /trade/history?start&count
    getTradesHistory: builder.query<TradesListResponse, PagingParams | void>({
      query: (params) => ({
        url: "/trade/history",
        method: "GET",
        params: params ?? { start: 0, count: 10 },
      }),
      providesTags: (result) => {
        const rows = (result as any)?.data;
        const arr: any[] = Array.isArray(rows) ? rows : Array.isArray(result as any) ? (result as any) : [];
        return [
          { type: "TradeHistory" as const, id: "LIST" },
          ...arr
            .map((t) => t?.id)
            .filter((id) => id != null)
            .map((id) => ({ type: "TradeHistory" as const, id })),
        ];
      },
    }),
  }),
  overrideExisting: false,
});

// ✅ Hooks
export const {
  useGetAllTradesQuery,
  useLazyGetAllTradesQuery,
  useGetTradeByIdQuery,
  useLazyGetTradeByIdQuery,
  useGetTradesHistoryQuery,
  useLazyGetTradesHistoryQuery,
} = tradesApi;
