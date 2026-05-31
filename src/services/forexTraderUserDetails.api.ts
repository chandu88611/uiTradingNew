// import { baseApi } from "./baseApi";

// export type TradingAccountCategory =
//   | "MT5"
//   | "CTRADER"
//   | "KITE"
//   | "ZEBU"
//   | "DHAN"
//   | string;

//   // ✅ add near other interfaces
// export interface GenerateZebuTokenPayload {
//   tradingAccountId: number;
//   totp: string;
// }

// export interface GenerateIndianAuthTokenPayload {
//   broker: "ZEBU" | "DHAN";
//   tradingAccountId: number;
//   totp: string;
// }

// export interface GenerateIndianAuthTokenResponse {
//   ok?: boolean;
//   message?: string;
//   data?: any;
// }

// export interface GenerateZebuTokenResponse {
//   ok?: boolean;
//   message?: string;
//   data?: any;
// }
// export type ForexTradeCategory = TradingAccountCategory;

// export interface ForexAccountRow {
//   id: number;
//   forexType: ForexTradeCategory;

//   // unified id for UI (accountId/clientId/login)
//   forexTraderUserId: string;

//   isMaster: boolean;
//   hasToken?: boolean;
// isEnabled?: boolean; 
//   status?: string;
//   lastVerifiedAt?: string | null;

//   createdAt?: string;
//   updatedAt?: string;

//   accountLabel?: string;
//   executionFlow?: string;
//   accountMeta?: Record<string, any> | null;

//   // keep anything else
//   [k: string]: any;
// }

// export type TradingBrokerApi = "MT5" | "CTrader" | "CTRADER" | string;

// export interface TradingAccountApi {
//   id: string;
//   createdAt: string;
//   updatedAt: string;

//   userId: string | number;

//   // ✅ backend sometimes returns empty broker but gives brokerId
//   broker?: TradingBrokerApi;
//   brokerId?: number;

//   isMaster: boolean;
//   executionFlow?: string;

//   accountLabel?: string;

//   // ✅ backend returns this at top-level in your sample
//   accountId?: string;
//   clientId?: string;
// isEnabled?: boolean; 
//   accountMeta?: Record<string, any> | null;

//   credentialsEncrypted?: string | null;
//   status?: string;
//   lastVerifiedAt?: string | null;

//   accessToken?: string | null;
//   refreshToken?: string | null;

//   [k: string]: any;
// }

// export interface ListTradingAccountsResponse {
//   accounts: TradingAccountApi[];
// }

// export interface CtraderConnectUrlResponse {
//   url: string;
// }

// /** brokerId mapping (based on your brokers table: 4=ZEBU; DHAN likely 5) */
// const BROKER_ID_TO_CODE: Record<number, ForexTradeCategory> = {
//   1: "KITE",
//   2: "MT5",
//   3: "CTRADER",
//   4: "ZEBU",
//   5: "DHAN",
// };

// function normalizeCategoryFromAccount(a: TradingAccountApi): ForexTradeCategory {
//   const b: any = a?.broker;

//   // ✅ broker can be string OR object {code,name,id}
//   const brokerCode = typeof b === "string" ? b : (b?.code ?? b?.name ?? "");
//   const brokerStr = String(brokerCode || "").toUpperCase().trim();

//   if (brokerStr.includes("CTRADER")) return "CTRADER";
//   if (brokerStr.includes("MT5")) return "MT5";
//   if (brokerStr) return brokerStr as any;

//   // ✅ fallback to brokerId (or broker.id)
//   const bid = Number(a?.brokerId ?? (typeof b === "object" ? b?.id : 0) ?? 0);
//   if (bid && BROKER_ID_TO_CODE[bid]) return BROKER_ID_TO_CODE[bid];

//   return "MT5";
// }

// function pickAccountId(a: TradingAccountApi): string {
//   const meta = a.accountMeta || {};

//   const v =
//     a.accountId ??
//     a.clientId ??
//     (meta as any).ctraderAccountId ??
//     (meta as any).mt5LoginId ??
//     (meta as any).accountId ??
//     (meta as any).clientId ??
//     (meta as any).loginId ??
//     "";

//   if (v) return String(v);
//   if (a.accountLabel) return String(a.accountLabel);
//   return String(a.id);
// }

// function toForexRow(a: TradingAccountApi): ForexAccountRow {
//   return {
//     id: Number(a.id),
//     forexType: normalizeCategoryFromAccount(a),
//     forexTraderUserId: pickAccountId(a),

//     isMaster: !!a.isMaster,
//     hasToken: !!a.credentialsEncrypted || !!a.lastVerifiedAt || !!a.accessToken || !!a.refreshToken,

//     status: a.status,
//     isEnabled: typeof a.isEnabled === "boolean" ? a.isEnabled : undefined, // ✅ NEW

//     lastVerifiedAt: a.lastVerifiedAt ?? null,
//     createdAt: a.createdAt,
//     updatedAt: a.updatedAt,

//     accountLabel: a.accountLabel,
//     executionFlow: a.executionFlow,
//     accountMeta: a.accountMeta,

//     brokerId: a.brokerId,
//     accountId: a.accountId,
//     clientId: a.clientId,
//     accessToken: a.accessToken,
//     refreshToken: a.refreshToken,
//   };
// }
// /* ================= UI payloads ================= */

// export interface PatchTradingAccountEnabledPayload {
//   id: number;
//   isEnabled: boolean;
//   planId?: string; // optional (curl doesn't need it, but keeping optional won't hurt)
// }
// export interface UpsertForexAccountPayload {
//   planId: string;
//   forexType: ForexTradeCategory;

//   // ✅ this is accountId for all brokers
//   forexTraderUserId: string;

//   token?: string; // stored in credentialsEncrypted
//   isMaster: boolean;

//   accountLabel?: string;

//   // ✅ extra fields: apiKey/apiSecret etc
//   accountMeta?: Record<string, any> | null;

//   executionFlow?: string;
// }

// export interface PatchForexAccountPayload {
//   planId: string;
//   id: number;
//   patch: Partial<Omit<UpsertForexAccountPayload, "planId">> & {
//     status?: string;
//   };
// }

// function isIndianBroker(catUpper: string) {
//   return catUpper === "ZEBU" || catUpper === "DHAN" || catUpper === "KITE";
// }

// function buildCreateBody(p: UpsertForexAccountPayload) {
//   const cat = String(p.forexType || "").toUpperCase();
//   const isCtrader = cat === "CTRADER";
//   const isMt5 = cat === "MT5";
//   const isIndian = isIndianBroker(cat);
//   const broker = isCtrader ? "CTrader" : isMt5 ? "MT5" : cat;

//   const idMeta = isCtrader
//     ? { ctraderAccountId: p.forexTraderUserId }
//     : isMt5
//     ? { mt5LoginId: p.forexTraderUserId }
//     : { accountId: p.forexTraderUserId, clientId: p.forexTraderUserId };

//   const extra = (p.accountMeta || {}) as any;

//   const body: any = {
//     accountLabel: (p.accountLabel && String(p.accountLabel).trim()) || `${broker} • ${p.forexTraderUserId}`,
//     broker,
//     isMaster: !!p.isMaster,
//     executionFlow: (p.executionFlow || "direct").trim(),
//     accountMeta: { ...idMeta, ...(p.accountMeta || {}) },
//     credentialsEncrypted: p.token?.trim() ? p.token.trim() : null,
//   };

//   if (isIndian) {
//     body.accountId = p.forexTraderUserId;
//     body.clientId = p.forexTraderUserId;
//   }

//   // ✅ ZEBU: ensure accountMeta.zebu exists (backend sample uses it)
//   if (cat === "ZEBU") {
//     const zebuMeta = {
//       apiKey: extra.apiKey ?? extra.zebu?.apiKey,
//       apiSecret: extra.apiSecret ?? extra.zebu?.apiSecret,
//       appKey: extra.appKey ?? extra.zebu?.appKey,
//       vendorCode: extra.vendorCode ?? extra.zebu?.vendorCode,
//       clientId: extra.clientId ?? extra.zebu?.clientId ?? p.forexTraderUserId,
//       accountId: extra.accountId ?? extra.zebu?.accountId ?? p.forexTraderUserId,
//       dhanClientId: extra.dhanClientId ?? p.forexTraderUserId,
//     };

//     body.accountMeta = {
//       ...(body.accountMeta || {}),
//       ...zebuMeta,         // keep flat (your sample has flat too)
//       zebu: { ...zebuMeta } // ✅ nested
//     };
//   }

//   return body;
// }

// function buildPatchBody(patch: PatchForexAccountPayload["patch"]) {
//   const body: any = {};

//   if (typeof patch.isMaster === "boolean") body.isMaster = patch.isMaster;
//   if (typeof patch.status === "string") body.status = patch.status;
//   if (typeof patch.accountLabel === "string") body.accountLabel = patch.accountLabel;
//   if (typeof patch.executionFlow === "string") body.executionFlow = patch.executionFlow;

//   if (patch.accountMeta) body.accountMeta = patch.accountMeta;

//   const cat = patch.forexType ? String(patch.forexType).toUpperCase() : "";
//   const isCtrader = cat === "CTRADER";
//   const isMt5 = cat === "MT5";
//   const isIndian = isIndianBroker(cat);

//   if (patch.forexTraderUserId) {
//     const idMeta = isCtrader
//       ? { ctraderAccountId: patch.forexTraderUserId }
//       : isMt5
//       ? { mt5LoginId: patch.forexTraderUserId }
//       : { accountId: patch.forexTraderUserId, clientId: patch.forexTraderUserId };

//     body.accountMeta = {
//       ...(body.accountMeta || {}),
//       ...idMeta,
//     };

//     if (isIndian) {
//       body.accountId = patch.forexTraderUserId;
//       body.clientId = patch.forexTraderUserId;
//     }
//   }

//   const meta = (patch.accountMeta || {}) as any;
//   if (isIndian) {
//     if (typeof meta.apiKey === "string" && meta.apiKey.trim()) body.apiKey = meta.apiKey.trim();
//     if (typeof meta.apiSecret === "string" && meta.apiSecret.trim()) body.apiSecret = meta.apiSecret.trim();
//   }

//   if (typeof patch.token === "string") {
//     const t = patch.token.trim();
//     body.credentialsEncrypted = t ? t : null;
//   }

//   return body;
// }

// export const forexTraderUserDetailsApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     getMyForexTraderDetails: builder.query<ForexAccountRow[], { planId: string }>({
//       query: ({ planId }) => ({
//         url: "trading-accounts",
//         method: "GET",
//         params: { planId },
//       }),
//       transformResponse: (res: ListTradingAccountsResponse) => {
//         const list = Array.isArray(res?.accounts) ? res.accounts : [];
//         return list.map(toForexRow);
//       },
//       providesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
//     }),

//     patchTradingAccountEnabled: builder.mutation<ForexAccountRow, PatchTradingAccountEnabledPayload>({
//   query: ({ id, isEnabled, planId }) => ({
//     url: `trading-accounts/${id}`,
//     method: "PATCH",
//     params: planId ? { planId } : undefined, // optional
//     body: { isEnabled }, // ✅ matches your curl
//   }),
//   transformResponse: (res: any) => {
//     // tolerate both {account:{...}} and direct account object
//     const acc = res?.account ?? res?.data?.account ?? res?.data ?? res;
//     return toForexRow(acc as TradingAccountApi);
//   },
//   invalidatesTags: (_r, _e, arg) => [
//     { type: "TradingAccount" as const, id: `LIST:${arg.planId ?? "NA"}` },
//     { type: "TradingAccount" as const, id: arg.id },
//   ],
// }),
//     generateZebuAuthToken: builder.mutation<GenerateZebuTokenResponse, GenerateZebuTokenPayload>({
//   query: ({ tradingAccountId, totp }) => ({
//     url: "zebu/auth/token/generate",
//     method: "POST",
//     body: { tradingAccountId, totp },
//   }),
//   transformResponse: (res: any) => {
//     // backend may return {message,data} or {data:{...}}
//     return {
//       ok: true,
//       message: res?.message ?? res?.data?.message ?? "Token generated",
//       data: res?.data ?? res,
//     };
//   },
// }),

//     upsertMyForexTraderDetails: builder.mutation<ForexAccountRow, UpsertForexAccountPayload>({
//       query: (payload) => ({
//         url: "trading-accounts",
//         method: "POST",
//         params: { planId: payload.planId },
//         body: buildCreateBody(payload),
//       }),
//       transformResponse: (res: { account: TradingAccountApi }) => toForexRow(res.account),
//       invalidatesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
//     }),

//     patchForexTraderDetailById: builder.mutation<ForexAccountRow, PatchForexAccountPayload>({
//       query: ({ id, patch, planId }) => ({
//         url: `trading-accounts/${id}`,
//         method: "PATCH",
//         params: { planId },
//         body: buildPatchBody(patch),
//       }),
//       transformResponse: (res: { account: TradingAccountApi }) => toForexRow(res.account),
//       invalidatesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
//     }),

//     deleteForexTraderDetailById: builder.mutation<void, { id: number; planId: string }>({
//       query: ({ id, planId }) => ({
//         url: `trading-accounts/${id}`,
//         method: "DELETE",
//         params: { planId },
//       }),
//       invalidatesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
//     }),

//     getCtraderConnectUrl: builder.query<CtraderConnectUrlResponse, { id: number; redirectUri?: string }>({
//       query: ({ id, redirectUri }) => ({
//         url: `trading-accounts/${id}/ctrader/connect-url`,
//         method: "GET",
//         params: redirectUri ? { redirectUri } : undefined,
//       }),
//       transformResponse: (res: any) => {
//         const url = res?.data?.url ?? res?.url ?? res?.data ?? "";
//         return { url: String(url || "") };
//       },
//     }),

//     generateIndianAuthToken: builder.mutation<
//   GenerateIndianAuthTokenResponse,
//   GenerateIndianAuthTokenPayload
// >({
//   query: ({ broker, tradingAccountId, totp }) => ({
//     // ✅ matches curl: /dhan/auth/token/generate
//     url: `${String(broker).toLowerCase()}/auth/token/generate`,
//     method: "POST",
//     body: { tradingAccountId, totp },
//   }),
//   transformResponse: (res: any) => ({
//     ok: true,
//     message: res?.message ?? res?.data?.message ?? "Token generated",
//     data: res?.data ?? res,
//   }),
// }),

//     checkIndianAuthToken: builder.mutation<
//   GenerateIndianAuthTokenResponse,
//   GenerateIndianAuthTokenPayload
// >({
//   query: ({ broker, tradingAccountId, totp }) => ({
//     // ✅ matches curl: /dhan/auth/token/generate
//     url: `${String(broker).toLowerCase()}/auth/token/generate`,
//     method: "POST",
//     body: { tradingAccountId, totp },
//   }),
//   transformResponse: (res: any) => ({
//     ok: true,
//     message: res?.message ?? res?.data?.message ?? "Token generated",
//     data: res?.data ?? res,
//   }),
// }),
    
//   }),
  
// });

// export const {
//   useGetMyForexTraderDetailsQuery,
//   useUpsertMyForexTraderDetailsMutation,
//   usePatchForexTraderDetailByIdMutation,
//   useDeleteForexTraderDetailByIdMutation,
//   useLazyGetCtraderConnectUrlQuery,
//   useGenerateZebuAuthTokenMutation, // ✅ add this
//     useGenerateIndianAuthTokenMutation,
//     useCheckIndianAuthTokenMutation,
//     usePatchTradingAccountEnabledMutation
// } = forexTraderUserDetailsApi;



// forexTraderUserDetails.api.ts
import { baseApi } from "./baseApi";

/* ================= types ================= */

export type TradingAccountCategory =
  | "MT5"
  | "CTRADER"
  | "KITE"
  | "ZEBU"
  | "DHAN"
  | string;

export type ForexTradeCategory = TradingAccountCategory;

export interface GenerateZebuTokenPayload {
  tradingAccountId: number;
  totp: string;
}

export interface GenerateIndianAuthTokenPayload {
  broker: "ZEBU" | "DHAN";
  tradingAccountId: number;
  totp: string;
}

export interface GenerateIndianAuthTokenResponse {
  ok?: boolean;
  message?: string;
  data?: any;
}

export interface GenerateZebuTokenResponse {
  ok?: boolean;
  message?: string;
  data?: any;
}

export interface ForexAccountRow {
  id: number;
  forexType: ForexTradeCategory;

  // unified id for UI (accountId/clientId/login)
  forexTraderUserId: string;

  isMaster: boolean;
  hasToken?: boolean;
  isEnabled?: boolean;

  status?: string;
  lastVerifiedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;

  accountLabel?: string;
  executionFlow?: string;
  accountMeta?: Record<string, any> | null;

  // keep anything else
  [k: string]: any;
}

export type TradingBrokerApi = "MT5" | "CTrader" | "CTRADER" | string;

export type BrokerObj = {
  id?: number;
  code?: string;
  name?: string;
  marketCategory?: string;
  isActive?: boolean;
  [k: string]: any;
};

export interface TradingAccountApi {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;

  userId?: string | number;

  // ✅ backend may return broker as STRING OR OBJECT
  broker?: TradingBrokerApi | BrokerObj;
  brokerId?: number;

  isMaster?: boolean;
  executionFlow?: string;

  accountLabel?: string;

  // ✅ backend returns this at top-level in your sample
  accountId?: string;
  clientId?: string;
  isEnabled?: boolean;

  accountMeta?: Record<string, any> | null;

  credentialsEncrypted?: string | null;
  status?: string;
  lastVerifiedAt?: string | null;

  accessToken?: string | null;
  refreshToken?: string | null;

  [k: string]: any;
}

export interface ListTradingAccountsResponse {
  accounts?: TradingAccountApi[];
  data?: any; // some backends wrap inside data
}

export interface CtraderConnectUrlResponse {
  url: string;
}

/* ================= helpers ================= */

/** brokerId mapping (based on your brokers table: 4=ZEBU; DHAN likely 5) */
const BROKER_ID_TO_CODE: Record<number, ForexTradeCategory> = {
  1: "KITE",
  2: "MT5",
  3: "CTRADER",
  4: "ZEBU",
  5: "DHAN",
};

function normalizeCategoryFromAccount(a: TradingAccountApi): ForexTradeCategory {
  const b: any = a?.broker;

  // ✅ broker can be string OR object {code,name,id}
  const brokerCode = typeof b === "string" ? b : (b?.code ?? b?.name ?? "");
  const brokerStr = String(brokerCode || "").toUpperCase().trim();

  if (brokerStr.includes("CTRADER")) return "CTRADER";
  if (brokerStr.includes("MT5")) return "MT5";
  if (brokerStr) return brokerStr as any;

  // ✅ fallback to brokerId (or broker.id)
  const bid = Number(a?.brokerId ?? (typeof b === "object" ? b?.id : 0) ?? 0);
  if (bid && BROKER_ID_TO_CODE[bid]) return BROKER_ID_TO_CODE[bid];

  return "MT5";
}

function pickAccountId(a: TradingAccountApi): string {
  const meta = a.accountMeta || {};
  const v =
    a.accountId ??
    a.clientId ??
    (meta as any).ctraderAccountId ??
    (meta as any).mt5LoginId ??
    (meta as any).accountId ??
    (meta as any).clientId ??
    (meta as any).loginId ??
    "";

  if (v) return String(v);
  if (a.accountLabel) return String(a.accountLabel);
  return String(a.id);
}

function toForexRow(a: TradingAccountApi): ForexAccountRow {
  return {
    id: Number(a.id),
    forexType: normalizeCategoryFromAccount(a),
    forexTraderUserId: pickAccountId(a),

    isMaster: !!a.isMaster,

    // ✅ token heuristics (covers your response fields)
    hasToken: !!a.credentialsEncrypted || !!a.lastVerifiedAt || !!a.accessToken || !!a.refreshToken,

    status: a.status,
    isEnabled: typeof a.isEnabled === "boolean" ? a.isEnabled : undefined,

    lastVerifiedAt: a.lastVerifiedAt ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,

    accountLabel: a.accountLabel,
    executionFlow: a.executionFlow,
    accountMeta: a.accountMeta,

    brokerId: a.brokerId,
    accountId: a.accountId,
    clientId: a.clientId,
    accessToken: a.accessToken,
    refreshToken: a.refreshToken,
  };
}

/* ================= UI payloads ================= */

export interface PatchTradingAccountEnabledPayload {
  id: number;
  isEnabled: boolean;
  planId?: string; // optional
}

export interface UpsertForexAccountPayload {
  planId: string;
  forexType: ForexTradeCategory;

  // ✅ this is accountId for all brokers
  forexTraderUserId: string;

  token?: string; // stored in credentialsEncrypted (if backend supports)
  isMaster: boolean;

  accountLabel?: string;

  // ✅ extra fields: apiKey/apiSecret etc
  accountMeta?: Record<string, any> | null;

  executionFlow?: string;
}

export interface PatchForexAccountPayload {
  planId: string;
  id: number;
  patch: Partial<Omit<UpsertForexAccountPayload, "planId">> & {
    status?: string;
  };
}

function isIndianBroker(catUpper: string) {
  return catUpper === "ZEBU" || catUpper === "DHAN" || catUpper === "KITE";
}

function buildCreateBody(p: UpsertForexAccountPayload) {
  const cat = String(p.forexType || "").toUpperCase();
  const isCtrader = cat === "CTRADER";
  const isMt5 = cat === "MT5";
  const isIndian = isIndianBroker(cat);
  const broker = isCtrader ? "CTrader" : isMt5 ? "MT5" : cat;

  const idMeta = isCtrader
    ? { ctraderAccountId: p.forexTraderUserId }
    : isMt5
    ? { mt5LoginId: p.forexTraderUserId }
    : { accountId: p.forexTraderUserId, clientId: p.forexTraderUserId };

  const extra = (p.accountMeta || {}) as any;

  const body: any = {
    accountLabel: (p.accountLabel && String(p.accountLabel).trim()) || `${broker} • ${p.forexTraderUserId}`,
    broker,
    isMaster: !!p.isMaster,
    executionFlow: (p.executionFlow || "direct").trim(),
    accountMeta: { ...idMeta, ...(p.accountMeta || {}) },
    credentialsEncrypted: p.token?.trim() ? p.token.trim() : null,
  };

  if (isIndian) {
    body.accountId = p.forexTraderUserId;
    body.clientId = p.forexTraderUserId;
  }

  // ✅ ZEBU: store both flat + nested accountMeta.zebu (matches your backend sample)
  if (cat === "ZEBU") {
    const zebuMeta = {
      apiKey: extra.apiKey ?? extra.zebu?.apiKey,
      apiSecret: extra.apiSecret ?? extra.zebu?.apiSecret,
      appKey: extra.appKey ?? extra.zebu?.appKey,
      vendorCode: extra.vendorCode ?? extra.zebu?.vendorCode,
      clientId: extra.clientId ?? extra.zebu?.clientId ?? p.forexTraderUserId,
      accountId: extra.accountId ?? extra.zebu?.accountId ?? p.forexTraderUserId,
      dhanClientId: extra.dhanClientId ?? p.forexTraderUserId,
    };

    body.accountMeta = {
      ...(body.accountMeta || {}),
      ...zebuMeta,
      zebu: { ...zebuMeta },
    };
  }

  return body;
}

function buildPatchBody(patch: PatchForexAccountPayload["patch"]) {
  const body: any = {};

  if (typeof patch.isMaster === "boolean") body.isMaster = patch.isMaster;
  if (typeof patch.status === "string") body.status = patch.status;
  if (typeof patch.accountLabel === "string") body.accountLabel = patch.accountLabel;
  if (typeof patch.executionFlow === "string") body.executionFlow = patch.executionFlow;

  if (patch.accountMeta) body.accountMeta = patch.accountMeta;

  const cat = patch.forexType ? String(patch.forexType).toUpperCase() : "";
  const isCtrader = cat === "CTRADER";
  const isMt5 = cat === "MT5";
  const isIndian = isIndianBroker(cat);

  if (patch.forexTraderUserId) {
    const idMeta = isCtrader
      ? { ctraderAccountId: patch.forexTraderUserId }
      : isMt5
      ? { mt5LoginId: patch.forexTraderUserId }
      : { accountId: patch.forexTraderUserId, clientId: patch.forexTraderUserId };

    body.accountMeta = {
      ...(body.accountMeta || {}),
      ...idMeta,
    };

    if (isIndian) {
      body.accountId = patch.forexTraderUserId;
      body.clientId = patch.forexTraderUserId;
    }
  }

  // ✅ For Indian brokers, also allow top-level apiKey/apiSecret if backend expects it
  const meta = (patch.accountMeta || {}) as any;
  if (isIndian) {
    if (typeof meta.apiKey === "string" && meta.apiKey.trim()) body.apiKey = meta.apiKey.trim();
    if (typeof meta.apiSecret === "string" && meta.apiSecret.trim()) body.apiSecret = meta.apiSecret.trim();
  }

  // ✅ ZEBU: keep accountMeta.zebu in sync during patch too
  if (cat === "ZEBU") {
    const zebu = meta?.zebu || {};
    const zebuMeta = {
      apiKey: meta.apiKey ?? zebu.apiKey,
      apiSecret: meta.apiSecret ?? zebu.apiSecret,
      appKey: meta.appKey ?? zebu.appKey,
      vendorCode: meta.vendorCode ?? zebu.vendorCode,
      clientId: meta.clientId ?? zebu.clientId,
      accountId: meta.accountId ?? zebu.accountId,
      dhanClientId: meta.dhanClientId ?? zebu.dhanClientId,
    };

    body.accountMeta = {
      ...(body.accountMeta || {}),
      ...zebuMeta,
      zebu: { ...(body.accountMeta?.zebu || {}), ...zebuMeta },
    };
  }

  if (typeof patch.token === "string") {
    const t = patch.token.trim();
    body.credentialsEncrypted = t ? t : null;
  }

  return body;
}

function extractAccounts(res: any): TradingAccountApi[] {
  // tolerate: {accounts:[]}, {data:{accounts:[]}}, {data:[...]}, [...]
  const a1 = res?.accounts;
  if (Array.isArray(a1)) return a1;

  const d = res?.data ?? res;
  const a2 = d?.accounts;
  if (Array.isArray(a2)) return a2;

  if (Array.isArray(d)) return d;

  return [];
}

function extractAccount(res: any): TradingAccountApi | null {
  // tolerate: {account:{...}}, {data:{account:{...}}}, direct object
  const acc = res?.account ?? res?.data?.account ?? res?.data ?? res;
  if (acc && typeof acc === "object") return acc as TradingAccountApi;
  return null;
}

/* ================= RTK Query ================= */

export const forexTraderUserDetailsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyForexTraderDetails: builder.query<ForexAccountRow[], { planId: string }>({
      query: ({ planId }) => ({
        url: "trading-accounts",
        method: "GET",
        params: { planId },
      }),
      transformResponse: (res: any) => extractAccounts(res).map(toForexRow),
      providesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
    }),

    patchTradingAccountEnabled: builder.mutation<ForexAccountRow, PatchTradingAccountEnabledPayload>({
      query: ({ id, isEnabled, planId }) => ({
        url: `trading-accounts/${id}`,
        method: "PATCH",
        params: planId ? { planId } : undefined,
        body: { isEnabled }, // ✅ matches your curl
      }),
      transformResponse: (res: any) => {
        const acc = extractAccount(res);
        return toForexRow((acc || ({} as any)) as TradingAccountApi);
      },
      invalidatesTags: (_r, _e, arg) => [
        // IMPORTANT: invalidate the correct LIST when planId is present
        ...(arg.planId ? [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }] : []),
        { type: "TradingAccount" as const, id: arg.id },
      ],
    }),

    generateZebuAuthToken: builder.mutation<GenerateZebuTokenResponse, GenerateZebuTokenPayload>({
      query: ({ tradingAccountId, totp }) => ({
        url: "zebu/auth/token/generate",
        method: "POST",
        body: { tradingAccountId, totp },
      }),
      transformResponse: (res: any) => ({
        ok: true,
        message: res?.message ?? res?.data?.message ?? "Token generated",
        data: res?.data ?? res,
      }),
    }),

    upsertMyForexTraderDetails: builder.mutation<ForexAccountRow, UpsertForexAccountPayload>({
      query: (payload) => ({
        url: "trading-accounts",
        method: "POST",
        params: { planId: payload.planId },
        body: buildCreateBody(payload),
      }),
      transformResponse: (res: any) => {
        const acc = extractAccount(res);
        return toForexRow((acc || ({} as any)) as TradingAccountApi);
      },
      invalidatesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
    }),

    patchForexTraderDetailById: builder.mutation<ForexAccountRow, PatchForexAccountPayload>({
      query: ({ id, patch, planId }) => ({
        url: `trading-accounts/${id}`,
        method: "PATCH",
        params: { planId },
        body: buildPatchBody(patch),
      }),
      transformResponse: (res: any) => {
        const acc = extractAccount(res);
        return toForexRow((acc || ({} as any)) as TradingAccountApi);
      },
      invalidatesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
    }),

    deleteForexTraderDetailById: builder.mutation<void, { id: number; planId: string }>({
      query: ({ id, planId }) => ({
        url: `trading-accounts/${id}`,
        method: "DELETE",
        params: { planId },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "TradingAccount" as const, id: `LIST:${arg.planId}` }],
    }),

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

    generateIndianAuthToken: builder.mutation<GenerateIndianAuthTokenResponse, GenerateIndianAuthTokenPayload>({
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

    // If you want "check" separate later, keep this.
    checkIndianAuthToken: builder.mutation<GenerateIndianAuthTokenResponse, GenerateIndianAuthTokenPayload>({
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
  }),
});

export const {
  useGetMyForexTraderDetailsQuery,
  useUpsertMyForexTraderDetailsMutation,
  usePatchForexTraderDetailByIdMutation,
  useDeleteForexTraderDetailByIdMutation,
  useLazyGetCtraderConnectUrlQuery,
  useGenerateZebuAuthTokenMutation,
  useGenerateIndianAuthTokenMutation,
  useCheckIndianAuthTokenMutation,
  usePatchTradingAccountEnabledMutation,
} = forexTraderUserDetailsApi;