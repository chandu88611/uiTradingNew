// src/services/indiaMarket.api.ts
import { baseApi } from "./baseApi";

export type ZebuGenerateTokenBody = {
  tradingAccountId: number;
  password: string;
  factor2: string; // 6-digit TOTP code
};

export type ZebuGenerateTokenResponse =
  | { ok: true; message?: string; uid?: string; expiresAt?: string }
  | { ok?: boolean; message?: string; [k: string]: any };

export type ZebuSaveTokenBody = {
  tradingAccountId: number;
  accessToken: string;
  uid?: string;
  apiKey?: string;
};

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const indiaMarketApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["ZebuAuth"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      // POST /zebu/auth/token/generate  — generate & persist Zebu session token via TOTP
      generateZebuToken: builder.mutation<ZebuGenerateTokenResponse, ZebuGenerateTokenBody>({
        query: (body) => ({
          url: "/zebu/auth/token/generate",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<ZebuGenerateTokenResponse>(res),
        invalidatesTags: ["ZebuAuth", "TradingAccounts"],
      }),

      // POST /zebu/auth/token  — manually save an access token (admin / advanced)
      saveZebuToken: builder.mutation<any, ZebuSaveTokenBody>({
        query: (body) => ({
          url: "/zebu/auth/token",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["ZebuAuth", "TradingAccounts"],
      }),
    }),
    overrideExisting: true,
  });

export const {
  useGenerateZebuTokenMutation,
  useSaveZebuTokenMutation,
} = indiaMarketApi;
