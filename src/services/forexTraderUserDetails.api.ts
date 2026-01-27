// src/services/forexTraderUserDetails.api.ts
import { baseApi } from "./baseApi";

/**
 * What the UI expects
 */
export type ForexTradeCategory = "MT5" | "CTRADER";

export interface ForexAccountRow {
  id: number;
  forexType: ForexTradeCategory;
  forexTraderUserId: string;
  isMaster: boolean;

  // ✅ verified for cTrader if we have stored creds (or backend can also set lastVerifiedAt)
  hasToken?: boolean;

  status?: string;
  lastVerifiedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;

  // allow extra props safely
  [k: string]: any;
}

/**
 * API shapes (Postman: Trading Accounts)
 */
export type TradingBrokerApi = "MT5" | "CTrader" | "CTRADER" | string;

export interface TradingAccountApi {
  id: string;
  createdAt: string;
  updatedAt: string;

  userId: string | number;
  broker: TradingBrokerApi;

  isMaster: boolean;
  executionFlow?: string;

  accountLabel?: string;
  accountMeta?: Record<string, any> | null;

  credentialsEncrypted?: string | null;
  status?: string;
  lastVerifiedAt?: string | null;
}

export interface ListTradingAccountsResponse {
  accounts: TradingAccountApi[];
}

/**
 * ✅ cTrader connect URL response
 * Backend should return something like:
 *   { url: "https://id.ctrader.com/..." }
 * OR { data: { url: "..." } }
 */
export interface CtraderConnectUrlResponse {
  url: string;
}

function normalizeForexType(broker: TradingBrokerApi): ForexTradeCategory {
  const b = String(broker || "").toUpperCase();
  if (b.includes("CTRADER")) return "CTRADER";
  return "MT5";
}

function pickTraderUserId(a: TradingAccountApi): string {
  const meta = a.accountMeta || {};
  const candidate =
    (meta as any).ctraderAccountId ??
    (meta as any).mt5LoginId ??
    (meta as any).loginId ??
    (meta as any).accountId ??
    (meta as any).userId ??
    (meta as any).username ??
    "";

  if (candidate) return String(candidate);
  if (a.accountLabel) return String(a.accountLabel);
  return String(a.id);
}

function toForexRow(a: TradingAccountApi): ForexAccountRow {
  return {
    id: Number(a.id),
    forexType: normalizeForexType(a.broker),
    forexTraderUserId: pickTraderUserId(a),
    isMaster: !!a.isMaster,

    // ✅ if credentialsEncrypted exists => we consider verified
    hasToken: !!a.credentialsEncrypted || !!a.lastVerifiedAt,

    status: a.status,
    lastVerifiedAt: a.lastVerifiedAt ?? null,

    createdAt: a.createdAt,
    updatedAt: a.updatedAt,

    accountLabel: a.accountLabel,
    executionFlow: a.executionFlow,
    accountMeta: a.accountMeta,
  };
}

/**
 * UI payloads
 */
export interface UpsertForexAccountPayload {
  forexType: ForexTradeCategory;
  forexTraderUserId: string;

  /**
   * NOTE:
   * - For MT5 you may still pass token if your backend uses it.
   * - For cTrader we will NOT require token in UI anymore. Verification happens via redirect.
   */
  token?: string;

  isMaster: boolean;
}

export interface PatchForexAccountPayload {
  id: number;
  patch: Partial<UpsertForexAccountPayload> & {
    status?: string;
    accountLabel?: string;
    executionFlow?: string;
    accountMeta?: Record<string, any>;
  };
}

function buildCreateBody(p: UpsertForexAccountPayload) {
  const isCtrader = String(p.forexType).toUpperCase() === "CTRADER";

  return {
    accountLabel: `${isCtrader ? "cTrader" : "MT5"} • ${p.forexTraderUserId}`,
    broker: isCtrader ? "CTrader" : "MT5",
    isMaster: !!p.isMaster,
    executionFlow: "direct",
    accountMeta: isCtrader
      ? { ctraderAccountId: p.forexTraderUserId }
      : { mt5LoginId: p.forexTraderUserId },

    // ✅ for cTrader we won't set this from UI; backend will set after OAuth callback
    credentialsEncrypted: p.token?.trim() ? p.token.trim() : null,
  };
}

function buildPatchBody(patch: PatchForexAccountPayload["patch"]) {
  const body: any = {};

  if (typeof patch.isMaster === "boolean") body.isMaster = patch.isMaster;
  if (typeof patch.status === "string") body.status = patch.status;
  if (typeof patch.accountLabel === "string") body.accountLabel = patch.accountLabel;
  if (typeof patch.executionFlow === "string") body.executionFlow = patch.executionFlow;

  if (patch.accountMeta) body.accountMeta = patch.accountMeta;

  if (patch.forexTraderUserId) {
    const forexType = patch.forexType ? String(patch.forexType).toUpperCase() : undefined;
    const isCtrader = forexType === "CTRADER";
    body.accountMeta = isCtrader
      ? { ctraderAccountId: patch.forexTraderUserId }
      : { mt5LoginId: patch.forexTraderUserId };
  }

  // ✅ used for:
  // - MT5 manual credential update (if you still do it)
  // - cTrader OAuth callback: we can PATCH with access_token (backend stores it)
  if (typeof patch.token === "string" && patch.token.trim()) {
    body.credentialsEncrypted = patch.token.trim();
  }

  return body;
}

export const forexTraderUserDetailsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyForexTraderDetails: builder.query<ForexAccountRow[], void>({
      query: () => ({
        url: "trading-accounts",
        method: "GET",
      }),
      transformResponse: (res: ListTradingAccountsResponse) => {
        const list = Array.isArray(res?.accounts) ? res.accounts : [];
        return list.map(toForexRow);
      },
      providesTags: (result) =>
        result
          ? [
              { type: "TradingAccount" as const, id: "LIST" },
              ...result.map((r) => ({ type: "TradingAccount" as const, id: r.id })),
            ]
          : [{ type: "TradingAccount" as const, id: "LIST" }],
    }),

    upsertMyForexTraderDetails: builder.mutation<ForexAccountRow, UpsertForexAccountPayload>({
      query: (payload) => ({
        url: "trading-accounts",
        method: "POST",
        body: buildCreateBody(payload),
      }),
      transformResponse: (res: { account: TradingAccountApi }) => toForexRow(res.account),
      invalidatesTags: [{ type: "TradingAccount" as const, id: "LIST" }],
    }),

    patchForexTraderDetailById: builder.mutation<ForexAccountRow, PatchForexAccountPayload>({
      query: ({ id, patch }) => ({
        url: `trading-accounts/${id}`,
        method: "PATCH",
        body: buildPatchBody(patch),
      }),
      transformResponse: (res: { account: TradingAccountApi }) => toForexRow(res.account),
      invalidatesTags: (_r, _e, arg) => [
        { type: "TradingAccount" as const, id: "LIST" },
        { type: "TradingAccount" as const, id: arg.id },
      ],
    }),

    deleteForexTraderDetailById: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `trading-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "TradingAccount" as const, id: "LIST" },
        { type: "TradingAccount" as const, id: arg.id },
      ],
    }),

    /**
     * ✅ cTrader connect URL
     * Backend should generate the broker OAuth URL and return it.
     *
     * If your backend uses a different route, change this URL only:
     *   trading-accounts/{id}/ctrader/connect-url
     */
    getCtraderConnectUrl: builder.query<CtraderConnectUrlResponse, { id: number; redirectUri?: string }>({
      query: ({ id, redirectUri }) => ({
        url: `trading-accounts/${id}/ctrader/connect-url`,
        method: "GET",
        params: redirectUri ? { redirectUri } : undefined,
      }),
      transformResponse: (res: any) => {
        const url = res?.data?.url ?? res?.url ?? res?.data ?? "";
        return { url: String(url || "") };
      },
    }),
  }),
});

export const {
  useGetMyForexTraderDetailsQuery,
  useUpsertMyForexTraderDetailsMutation,
  usePatchForexTraderDetailByIdMutation,
  useDeleteForexTraderDetailByIdMutation,

  // ✅ NEW
  useLazyGetCtraderConnectUrlQuery,
} = forexTraderUserDetailsApi;
