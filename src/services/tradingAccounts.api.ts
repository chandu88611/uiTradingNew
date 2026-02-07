// src/services/tradingAccounts.api.ts
import { baseApi } from "./baseApi";

export type MarketCategory = "INDIA" | "FOREX";
export type ForexPlatform = "MT5" | "CTRADER";
export type TradingAccountStatus = "pending" | "verified" | "blocked";

export type TradingAccount = {
  id: number;

  market?: MarketCategory;
  forexPlatform?: ForexPlatform;

  broker: string;

  label?: string | null;
  accountLabel?: string | null;
  externalAccountId?: string | null;

  status: TradingAccountStatus;

  lastVerifiedAt?: string | null;
  last_verified_at?: string | null;

  createdAt?: string;
  updatedAt?: string;

  [k: string]: any;
};

export type CreateTradingAccountBody = {
  market: MarketCategory;
  broker: string;
  label?: string;
  externalAccountId?: string;
  credentials: Record<string, any>;
  forexPlatform?: ForexPlatform; // only for FOREX
};

// ✅ NEW: cTrader OAuth exchange (UI sends code only; backend identifies user via cookies)
export type ExchangeCTraderCodeBody = {
  code: string;
};

// Keep response flexible (depends on your backend)
// Common cases: { ok: true } or { message, data } or { data: { accounts: [...] } }
export type ExchangeCTraderCodeResponse =
  | { ok: true; message?: string; data?: any }
  | { ok?: boolean; message?: string; data?: any; [k: string]: any };

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const tradingAccountsApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["TradingAccounts"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      // ✅ GET /trading-accounts/me
      listMyTradingAccounts: builder.query<TradingAccount[], void>({
        query: () => ({
          url: "/trading-accounts/me",
          method: "GET",
        }),
        transformResponse: (res: any) => {
          const raw = unwrapData<any>(res);
          const rows = raw?.rows ?? raw?.items ?? raw?.data ?? raw ?? [];
          return Array.isArray(rows) ? (rows as TradingAccount[]) : [];
        },
        providesTags: ["TradingAccounts"],
      }),

      // ✅ POST /trading-accounts
      createTradingAccount: builder.mutation<TradingAccount, CreateTradingAccountBody>({
        query: (body) => ({
          url: "/trading-accounts",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<TradingAccount>(res),
        invalidatesTags: ["TradingAccounts"],
      }),

      // ✅ DELETE /trading-accounts/:id
      deleteTradingAccount: builder.mutation<
        { deleted?: boolean; id?: number } | any,
        { id: number }
      >({
        query: ({ id }) => ({
          url: `/trading-accounts/${id}`,
          method: "DELETE",
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["TradingAccounts"],
      }),

      // ✅ POST /trading-accounts/:id/verify
      verifyTradingAccount: builder.mutation<TradingAccount | any, { id: number }>({
        query: ({ id }) => ({
          url: `/trading-accounts/${id}/verify`,
          method: "POST",
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["TradingAccounts"],
      }),

      // ✅ PATCH /trading-accounts/:id
      patchTradingAccount: builder.mutation<any, { id: number; isEnabled: boolean }>({
        query: ({ id, ...body }) => ({
          url: `/trading-accounts/${id}`,
          method: "PATCH",
          body,
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["TradingAccounts"],
      }),

      // ✅ NEW: POST /ctrader/oauth/exchange
      // UI callback page sends { code } only.
      // Backend identifies the user from auth cookies (so we ensure credentials include).
      exchangeCTraderOAuthCode: builder.mutation<
        ExchangeCTraderCodeResponse,
        ExchangeCTraderCodeBody
      >({
        query: (body) => ({
          url: "/ctrader/oauth/exchange",
          method: "POST",
          body,
          credentials: "include", // ✅ send cookies
        }),
        transformResponse: (res: any) => unwrapData<ExchangeCTraderCodeResponse>(res),
        invalidatesTags: ["TradingAccounts"], // token exchange likely creates/updates ctrader accounts
      }),
    }),
    overrideExisting: true,
  });

export const {
  useListMyTradingAccountsQuery,
  useLazyListMyTradingAccountsQuery,
  useCreateTradingAccountMutation,
  useDeleteTradingAccountMutation,
  useVerifyTradingAccountMutation,
  usePatchTradingAccountMutation,

  // ✅ NEW hook
  useExchangeCTraderOAuthCodeMutation,
} = tradingAccountsApi;
