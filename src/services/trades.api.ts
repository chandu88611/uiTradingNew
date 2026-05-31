// src/services/trades.api.ts
import { baseApi } from "./baseApi";

/**
 * Backend APIs:
 * 1) GET  /trade/all?start=0&count=10&accountId=123&searchParams=...
 * 2) GET  /trade?id=123
 * 3) GET  /trade/history?start=0&count=10&accountId=123&searchParams=...
 *
 * Mutations:
 * 4) POST /trade/close   body: { signalIds: [], isCloseAll: boolean }
 *
 * NOTE:
 * - Response shapes can vary; we normalize rows for UI so status doesn't become [object Object]
 */

export type PagingParams = {
  start?: number; // default 0
  count?: number; // default 10
  accountId?: string; // UI passes string
  searchParams?: string;
};

// UI-friendly shape
export interface TradeDto {
  id?: number | string;
  status?: string | null;
  symbol?: string | null;
  side?: string | null; // BUY/SELL
  qty?: number | string | null;
  price?: number | string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  [key: string]: any;
}

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

/** ---------- Normalizers ---------- */
function normalizeStatus(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (typeof v.status === "string") return v.status;
    if (typeof (v as any).state === "string") return (v as any).state;
  }
  return String(v);
}

function normalizeSide(row: any): string | null {
  const v = row?.side ?? row?.action ?? row?.direction ?? row?.type;
  if (v == null) return null;
  return String(v).toUpperCase();
}

function normalizeQty(row: any): number | string | null {
  const v = row?.qty ?? row?.quantity ?? row?.volume ?? row?.lots ?? row?.size;
  return v == null ? null : v;
}

function normalizeSymbol(row: any): string | null {
  const v = row?.symbol ?? row?.ticker ?? row?.instrument;
  return v == null ? null : String(v);
}

function normalizePrice(row: any): number | string | null {
  const v = row?.price ?? row?.entry ?? row?.openPrice ?? row?.open_price;
  return v == null ? null : v;
}

function normalizeOpenedAt(row: any): string | null {
  const v = row?.openedAt ?? row?.openTime ?? row?.signalTime ?? row?.createdAt ?? row?.time;
  return v == null ? null : String(v);
}

function normalizeClosedAt(row: any): string | null {
  const v = row?.closedAt ?? row?.closeTime ?? row?.updatedAt ?? row?.timeClose;
  return v == null ? null : String(v);
}

function normalizeTrade(row: any): TradeDto {
  return {
    ...row,
    id: row?.id,
    symbol: normalizeSymbol(row),
    side: normalizeSide(row),
    qty: normalizeQty(row),
    price: normalizePrice(row),
    openedAt: normalizeOpenedAt(row),
    closedAt: normalizeClosedAt(row),
    status: normalizeStatus(row?.status),
  };
}

function normalizeListResponse(res: any): TradesListResponse {
  const rows =
    Array.isArray(res?.data) ? res.data :
    Array.isArray(res?.trades) ? res.trades :
    Array.isArray(res) ? res :
    [];

  const data = rows.map(normalizeTrade);
  if (Array.isArray(res)) return { data };
  return { ...(res ?? {}), data };
}

function normalizeOneResponse(res: any): TradeOneResponse {
  const row = res?.data ?? res;
  const data = row ? normalizeTrade(row) : row;
  if (res && typeof res === "object" && "data" in res) return { ...(res ?? {}), data };
  return { data };
}

/** ---------- NEW Close payload ---------- */
export type CloseTradesRequest = {
  signalIds: Array<number | string>;
  isCloseAll: boolean;
};

export const tradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTrades: builder.query<TradesListResponse, PagingParams | void>({
      query: (params) => ({
        url: "/trade/all",
        method: "GET",
        params: params ?? { start: 0, count: 10 },
      }),
      transformResponse: (res: any) => normalizeListResponse(res),
      providesTags: (result) => {
        const arr: any[] = Array.isArray((result as any)?.data) ? (result as any).data : [];
        return [
          { type: "Trades" as const, id: "LIST" },
          ...arr
            .map((t) => t?.id)
            .filter((id) => id != null)
            .map((id) => ({ type: "Trades" as const, id })),
        ];
      },
    }),

    getTradeById: builder.query<TradeOneResponse, { id: number | string }>({
      query: ({ id }) => ({
        url: "/trade",
        method: "GET",
        params: { id },
      }),
      transformResponse: (res: any) => normalizeOneResponse(res),
      providesTags: (_res, _err, arg) => [{ type: "Trades", id: arg.id }],
    }),

    getTradesHistory: builder.query<TradesListResponse, PagingParams | void>({
      query: (params) => ({
        url: "/trade/history",
        method: "GET",
        params: params ?? { start: 0, count: 10 },
      }),
      transformResponse: (res: any) => normalizeListResponse(res),
      providesTags: (result) => {
        const arr: any[] = Array.isArray((result as any)?.data) ? (result as any).data : [];
        return [
          { type: "TradeHistory" as const, id: "LIST" },
          ...arr
            .map((t) => t?.id)
            .filter((id) => id != null)
            .map((id) => ({ type: "TradeHistory" as const, id })),
        ];
      },
    }),

    /** ✅ Single endpoint for close-one and close-all */
    closeTrades: builder.mutation<any, CloseTradesRequest>({
      query: (body) => ({
        url: "/trade/close",
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => {
        const ids = (arg?.signalIds ?? []).filter((x) => x != null);
        return [
          { type: "Trades", id: "LIST" },
          { type: "TradeHistory", id: "LIST" },
          ...ids.map((id) => ({ type: "Trades" as const, id })),
        ];
      },
    }),

    // ✅ GET /trade/pnl?period=7d|30d|90d|all
    getMyPnl: builder.query<any, { period?: string } | void>({
      query: (params) => ({
        url: "/trade/pnl",
        method: "GET",
        params: params ? { period: (params as any).period ?? "30d" } : undefined,
      }),
      providesTags: [{ type: "TradeHistory" as const, id: "PNL" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTradesQuery,
  useLazyGetAllTradesQuery,
  useGetTradeByIdQuery,
  useLazyGetTradeByIdQuery,
  useGetTradesHistoryQuery,
  useLazyGetTradesHistoryQuery,

  // ✅ NEW (single hook)
  useCloseTradesMutation,
  useGetMyPnlQuery,
} = tradesApi;
