// src/services/brokerConnect.api.ts
import { baseApi } from "./baseApi";

export interface GenerateZebuTokenPayload {
  tradingAccountId: number;
  totp: string;
  password: string;
}

export interface GenerateIndianAuthTokenPayload {
  broker: "ZEBU" | "DHAN";
  tradingAccountId: number;
  totp: string;
}

export interface GenerateTokenResponse {
  ok?: boolean;
  message?: string;
  data?: any;
}

export interface SaveTradingAccountTokenPayload {
  tradingAccountId: number;
  token: string;
  planId?: string;
}

export interface SaveDhanAccessTokenPayload {
  tradingAccountId: number;
  accessToken: string;
}

export interface TradingAccountApi {
  id: number | string;
  status?: string;
  isEnabled?: boolean;
  lastVerifiedAt?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  credentialsEncrypted?: string | null;
  broker?: any;
  brokerId?: number;
  accountLabel?: string;
  accountId?: string;
  clientId?: string;
  accountMeta?: Record<string, any> | null;
  [k: string]: any;
}

/** Try to pull token from varying backend shapes */
export function extractTokenAny(res: any): string {
  const d = res?.data ?? res ?? {};
  const token =
    d?.token ??
    d?.accessToken ??
    d?.access_token ??
    d?.data?.token ??
    d?.data?.accessToken ??
    d?.data?.access_token ??
    d?.sessionToken ??
    d?.session_token ??
    "";
  return String(token || "").trim();
}

export const brokerConnectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ZEBU: generate token using password + totp */
    generateZebuAuthToken: builder.mutation<GenerateTokenResponse, GenerateZebuTokenPayload>({
      query: ({ tradingAccountId, totp, password }) => ({
        url: "zebu/auth/token/generate",
        method: "POST",
        body: { tradingAccountId, totp, password },
      }),
      transformResponse: (res: any) => ({
        ok: true,
        message: res?.message ?? res?.data?.message ?? "Token generated",
        data: res?.data ?? res,
      }),
    }),

    /** DHAN: generate token using totp */
    generateIndianAuthToken: builder.mutation<GenerateTokenResponse, GenerateIndianAuthTokenPayload>({
      query: ({ broker, tradingAccountId, totp }) => ({
        url: `${String(broker).toLowerCase()}/auth/token/generate`,
        method: "POST",
        body: { tradingAccountId, totp },
      }),
      transformResponse: (res: any) => ({
        ok: true,
        message: res?.message ?? res?.data?.message ?? "Token generated",
        data: res?.data ?? res,
      }),
    }),

    /**
     * ✅ DHAN: user pastes token directly
     * Endpoint: POST dhan/auth/token
     * Body: { tradingAccountId, accessToken }
     */
    saveDhanAccessToken: builder.mutation<GenerateTokenResponse, SaveDhanAccessTokenPayload>({
      query: ({ tradingAccountId, accessToken }) => ({
        url: "dhan/auth/token",
        method: "POST",
        body: { tradingAccountId, accessToken },
      }),
      transformResponse: (res: any) => ({
        ok: true,
        message: res?.message ?? res?.data?.message ?? "Token saved",
        data: res?.data ?? res,
      }),
    }),

    /**
     * Generic save token to trading account (credentialsEncrypted)
     * Used for ZEBU manual token paste OR saving generated token.
     */
    saveTradingAccountToken: builder.mutation<TradingAccountApi, SaveTradingAccountTokenPayload>({
      query: ({ tradingAccountId, token, planId }) => ({
        url: `trading-accounts/${tradingAccountId}`,
        method: "PATCH",
        params: planId ? { planId } : undefined,
        body: { credentialsEncrypted: token },
      }),
      transformResponse: (res: any) => res?.account ?? res?.data?.account ?? res?.data ?? res,
      invalidatesTags: (_r, _e, arg) => [
        { type: "TradingAccount" as const, id: arg.tradingAccountId },
        ...(arg.planId ? [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }] : []),
      ],
    }),
  }),
});

export const {
  useGenerateZebuAuthTokenMutation,
  useGenerateIndianAuthTokenMutation,
  useSaveDhanAccessTokenMutation,
  useSaveTradingAccountTokenMutation,
} = brokerConnectApi;