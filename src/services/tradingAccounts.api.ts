// src/services/tradingAccounts.api.ts
import { baseApi } from "./baseApi";

export type MarketCategory = "INDIA" | "FOREX";
export type ForexPlatform = "MT5" | "CTRADER";
export type TradingAccountStatus = "pending" | "verified" | "blocked";

export type TradingAccount = {
  id: number;

  // new-ish fields (if your backend stores them)
  market?: MarketCategory;
  forexPlatform?: ForexPlatform;

  // your table fields may be snake_case in response
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
      deleteTradingAccount: builder.mutation<{ deleted?: boolean; id?: number } | any, { id: number }>({
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
    }),
    overrideExisting: true,
  });

export const {
  useListMyTradingAccountsQuery,
  useLazyListMyTradingAccountsQuery,
  useCreateTradingAccountMutation,
  useDeleteTradingAccountMutation,
  useVerifyTradingAccountMutation,
} = tradingAccountsApi;
