// src/services/copyTrading.api.ts
import { baseApi } from "./baseApi";

/** ========= Existing Types ========= */
export type CopyVisibility = "private" | "unlisted" | "public";

export type CopyFollowStatus =
  | "pending"
  | "active"
  | "paused"
  | "stopped"
  | "rejected";

export type CopyMaster = {
  id: number;
  ownerUserId?: number | null;

  sourceType?: "TRADING_ACCOUNT" | "STRATEGY";
  sourceTradingAccountId?: number | null;
  sourceStrategyId?: number | null;

  name: string;
  description?: string | null;

  visibility: CopyVisibility;
  requiresApproval: boolean;

  isActive?: boolean;
  metadata?: Record<string, any>;

  createdAt?: string;
  updatedAt?: string;

  [k: string]: any;
};

export type CopyFollow = {
  id: number;
  masterId: number;

  followerUserId: number;
  followerTradingAccountId: number;

  subscriptionId?: number | null;

  status: CopyFollowStatus;

  riskMode?: "multiplier" | "fixed_lot" | "fixed_risk_pct";
  riskValue?: number;

  maxLot?: number | null;
  maxOpenPositions?: number | null;
  maxDailyLoss?: number | null;
  slippageTolerance?: number | null;
  symbolWhitelist?: string[] | null;

  metadata?: Record<string, any>;

  requestedAt?: string;
  approvedAt?: string;
  pausedAt?: string;
  stoppedAt?: string;

  createdAt?: string;
  updatedAt?: string;

  [k: string]: any;
};

export type Paginated<T> = {
  page: number;
  limit: number;
  total?: number;
  items: T[];
};

function pickItems<T>(res: any): T[] {
  const rows = res?.items ?? res?.rows ?? res?.data ?? res?.result ?? [];
  return Array.isArray(rows) ? rows : [];
}

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

/** ========= Copy-trading-request APIs ========= */
export type MarketType = "FOREX" | "CRYPTO" | "INDIAN";

export type CopyTradingRequestItem = {
  id: number;
  type?: MarketType;
  masterAccountId?: number;
  userTradingAccountId?: number;
  masterId?: number;
  status?: string;
  requestedAt?: string;
  [k: string]: any;
};

export type GetCopyTradingRequestsArgs = {
  start?: number;
  count?: number;
  searchParams?: any;
};

export type HandleCopyTradingRequestBody = {
  userTradingAccountId: number;
  userEmail: string;
  masterAccountId?: number;
};

export type AllowCopyTradingBody = {
  approve: boolean;
  urequestId: number;
};

function normalizeRequests(res: any): CopyTradingRequestItem[] {
  const raw = res?.data ?? res;

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.requests)) return raw.requests;
  if (Array.isArray(raw?.data?.requests)) return raw.data.requests;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;

  return [];
}

/** ========= Alert Snapshot / Notification Types ========= */
export type AlertAction = "BUY" | "SELL" | "HOLD";

export type AlertExecutionMode = "OPEN" | "AMEND_SLTP" | null;

export type AlertOrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP"
  | "STOP_LIMIT"
  | "MARKET_RANGE"
  | null;

export type TradeAlertSnapshot = {
  id: number | string;
  userId?: number | string;

  ticker?: string | null;
  exchange?: string | null;
  interval?: string | null;

  action?: AlertAction | null;

  open?: string | number | null;
  close?: string | number | null;
  high?: string | number | null;
  low?: string | number | null;
  volume?: string | number | null;

  currency?: string | null;
  baseCurrency?: string | null;

  alertTime?: string | null;
  barTime?: string | null;

  executionMode?: AlertExecutionMode;
  entryRef?: string | null;
  orderType?: AlertOrderType;

  limitPrice?: string | number | null;
  stopPrice?: string | number | null;

  stopLoss?: string | number | null;
  takeProfit?: string | number | null;
  stopLossDistance?: string | number | null;
  takeProfitDistance?: string | number | null;
  stopLossAmount?: string | number | null;
  takeProfitAmount?: string | number | null;

  trailingStopLoss?: boolean | null;
  guaranteedStopLoss?: boolean | null;
  stopLossTriggerMethod?: string | null;

  trailingTakeProfitActivationDistance?: string | number | null;
  trailingTakeProfitDistance?: string | number | null;

  breakEvenActivationDistance?: string | number | null;
  breakEvenOffsetDistance?: string | number | null;
  trailingStopLossDistance?: string | number | null;

  tradingStrength?: string | number | null;

  adminStrategyTradeId?: string | number | null;
  strategyId?: string | number | null;
  planId?: string | number | null;
  subscriptionId?: string | number | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  [key: string]: any;
};

export type TradeNotificationAlert = TradeAlertSnapshot & {
  tradeAlertId?: string | number;
  alertId?: string | number;
  _id?: string;

  title?: string | null;
  message?: string | null;
  description?: string | null;

  isRead?: boolean;
  read?: boolean;
  unread?: boolean;
  readAt?: string | null;
  read_at?: string | null;
};

export type GetTradeAlertsArgs = {
  start?: number;
  count?: number;
  unreadOnly?: boolean;
};

function normalizeTradeAlerts(res: any): TradeNotificationAlert[] {
  const raw = res?.data ?? res;

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.alerts)) return raw.alerts;
  if (Array.isArray(raw?.data?.alerts)) return raw.data.alerts;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;

  return [];
}

/** ========= Alert History APIs ========= */
export type GetUserAlertHistoryArgs = {
  page?: number;
  limit?: number;
  ticker?: string;
  exchange?: string;
  interval?: string;
  from?: string;
  to?: string;
  lastMinutes?: number;
};

export type GetAdminAlertHistoryArgs = GetUserAlertHistoryArgs & {
  userId?: number;
  planId?: number;
};

export type AdminAlertHistoryResult = {
  data: TradeAlertSnapshot[];
  total: number;
  page: number;
  limit: number;
};

function normalizeUserAlertHistory(res: any): TradeAlertSnapshot[] {
  const raw = res?.data ?? res;

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.rows)) return raw.rows;

  return [];
}

function normalizeAdminAlertHistory(
  res: any,
  arg?: GetAdminAlertHistoryArgs
): AdminAlertHistoryResult {
  const raw = res?.data ?? res;

  const rows =
    Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.rows)
      ? raw.rows
      : [];

  return {
    data: rows,
    total: Number(raw?.total ?? rows.length ?? 0),
    page: Number(raw?.page ?? arg?.page ?? 1),
    limit: Number(raw?.limit ?? arg?.limit ?? 20),
  };
}

function cleanAlertHistoryParams(
  args?: GetUserAlertHistoryArgs | GetAdminAlertHistoryArgs
) {
  return {
    page: args?.page ?? 1,
    limit: args?.limit ?? 20,
    ...(args?.ticker ? { ticker: args.ticker } : {}),
    ...(args?.exchange ? { exchange: args.exchange } : {}),
    ...(args?.interval ? { interval: args.interval } : {}),
    ...(args?.from ? { from: args.from } : {}),
    ...(args?.to ? { to: args.to } : {}),
    ...(args?.lastMinutes !== undefined
      ? { lastMinutes: args.lastMinutes }
      : {}),
    ...("userId" in (args ?? {}) && (args as any)?.userId
      ? { userId: (args as any).userId }
      : {}),
    ...("planId" in (args ?? {}) && (args as any)?.planId
      ? { planId: (args as any).planId }
      : {}),
  };
}

export const copyTradingApi = baseApi
  .enhanceEndpoints({
    addTagTypes: [
      "CopyMaster",
      "CopyMasters",
      "CopyFollows",
      "CopyFollowers",
      "CopyTradingRequests",
      "TradeAlerts",
      "AlertSnapshots",
      "AdminAlertSnapshots",
    ],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      /** ===== Existing endpoints ===== */

      getMyMaster: builder.query<CopyMaster | null, void>({
        query: () => ({ url: "/copy-trade/master/me", method: "GET" }),
        transformResponse: (res: any) => {
          const data = unwrapData<any>(res);
          return data ? (data as CopyMaster) : null;
        },
        providesTags: (result) =>
          result?.id
            ? [{ type: "CopyMaster" as const, id: result.id }]
            : ["CopyMaster"],
      }),

      upsertMyMaster: builder.mutation<
        CopyMaster,
        {
          tradingAccountId: number;
          name: string;
          description?: string;
          visibility?: CopyVisibility;
          requiresApproval?: boolean;
        }
      >({
        query: (body) => ({
          url: "/copy-trade/master",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<CopyMaster>(res),
        invalidatesTags: (result) =>
          result?.id
            ? [{ type: "CopyMaster" as const, id: result.id }, "CopyMasters"]
            : ["CopyMaster", "CopyMasters"],
      }),

      listMasters: builder.query<
        Paginated<CopyMaster>,
        { page?: number; limit?: number; visibility?: CopyVisibility }
      >({
        query: (params) => ({
          url: "/copy-trade/masters",
          method: "GET",
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
            visibility: params?.visibility ?? "public",
          },
        }),
        transformResponse: (res: any, _meta, arg) => {
          const raw = unwrapData<any>(res);

          return {
            page: Number(raw?.page ?? arg?.page ?? 1),
            limit: Number(raw?.limit ?? arg?.limit ?? 20),
            total: raw?.total ?? raw?.count ?? undefined,
            items: pickItems<CopyMaster>(raw),
          };
        },
        providesTags: (result) => {
          const base: any[] = ["CopyMasters"];

          for (const m of result?.items ?? []) {
            base.push({ type: "CopyMaster", id: m.id });
          }

          return base;
        },
      }),

      followMaster: builder.mutation<
        CopyFollow,
        {
          masterId: number;
          followerTradingAccountId: number;
          subscriptionId?: number;

          riskMode?: "multiplier" | "fixed_lot" | "fixed_risk_pct";
          riskValue?: number;
          maxLot?: number;
          maxOpenPositions?: number;
          maxDailyLoss?: number;
          slippageTolerance?: number;
          symbolWhitelist?: string[];
        }
      >({
        query: (body) => ({
          url: "/copy-trade/follows",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<CopyFollow>(res),
        invalidatesTags: ["CopyFollows", "CopyFollowers"],
      }),

      listMyFollows: builder.query<
        Paginated<CopyFollow>,
        { page?: number; limit?: number; status?: CopyFollowStatus }
      >({
        query: (params) => ({
          url: "/copy-trade/follows/me",
          method: "GET",
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
            ...(params?.status ? { status: params.status } : {}),
          },
        }),
        transformResponse: (res: any, _meta, arg) => {
          const raw = unwrapData<any>(res);

          return {
            page: Number(raw?.page ?? arg?.page ?? 1),
            limit: Number(raw?.limit ?? arg?.limit ?? 20),
            total: raw?.total ?? raw?.count ?? undefined,
            items: pickItems<CopyFollow>(raw),
          };
        },
        providesTags: (result) => {
          const base: any[] = ["CopyFollows"];

          for (const f of result?.items ?? []) {
            base.push({ type: "CopyFollows", id: f.id });
          }

          return base;
        },
      }),

      updateMyFollow: builder.mutation<
        CopyFollow,
        {
          followId: number;
          status?: CopyFollowStatus;

          riskMode?: "multiplier" | "fixed_lot" | "fixed_risk_pct";
          riskValue?: number;
          maxLot?: number;
          maxOpenPositions?: number;
          maxDailyLoss?: number;
          slippageTolerance?: number;
          symbolWhitelist?: string[];
        }
      >({
        query: ({ followId, ...body }) => ({
          url: `/copy-trade/follows/${followId}`,
          method: "PATCH",
          body,
        }),
        transformResponse: (res: any) => unwrapData<CopyFollow>(res),
        invalidatesTags: (_res, _err, arg) => [
          "CopyFollows",
          "CopyFollowers",
          { type: "CopyFollows" as const, id: arg.followId },
        ],
      }),

      listMyFollowers: builder.query<
        Paginated<CopyFollow>,
        { page?: number; limit?: number; status?: CopyFollowStatus }
      >({
        query: (params) => ({
          url: "/copy-trade/followers/me",
          method: "GET",
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 20,
            ...(params?.status ? { status: params.status } : {}),
          },
        }),
        transformResponse: (res: any, _meta, arg) => {
          const raw = unwrapData<any>(res);

          return {
            page: Number(raw?.page ?? arg?.page ?? 1),
            limit: Number(raw?.limit ?? arg?.limit ?? 20),
            total: raw?.total ?? raw?.count ?? undefined,
            items: pickItems<CopyFollow>(raw),
          };
        },
        providesTags: (result) => {
          const base: any[] = ["CopyFollowers"];

          for (const f of result?.items ?? []) {
            base.push({ type: "CopyFollowers", id: f.id });
          }

          return base;
        },
      }),

      decideFollowerRequest: builder.mutation<
        any,
        { followId: number; action: "approve" | "reject" }
      >({
        query: ({ followId, action }) => ({
          url: `/copy-trade/followers/${followId}/decision`,
          method: "PATCH",
          body: { action },
        }),
        invalidatesTags: (_res, _err, arg) => [
          "CopyFollowers",
          "CopyFollows",
          { type: "CopyFollowers" as const, id: arg.followId },
        ],
      }),

      /** ===== Copy trading request endpoints ===== */

      getCopyTradingRequests: builder.query<
        CopyTradingRequestItem[],
        GetCopyTradingRequestsArgs | void
      >({
        query: (args) => {
          const start = args?.start ?? 0;
          const count = args?.count ?? 10;
          const sp = args?.searchParams ?? null;
          const searchParamsValue = sp === null ? "null" : JSON.stringify(sp);

          return {
            url: "/trading-accounts/copy-trading-requests",
            method: "GET",
            params: {
              start,
              count,
              searchParams: searchParamsValue,
            },
          };
        },
        transformResponse: (res: any) => normalizeRequests(res),
        providesTags: ["CopyTradingRequests"],
      }),

      handleCopyTradingRequest: builder.mutation<
        any,
        HandleCopyTradingRequestBody
      >({
        query: (body) => ({
          url: "/trading-accounts/handle-copy-trading-request",
          method: "POST",
          body,
        }),
        invalidatesTags: ["CopyTradingRequests"],
      }),

      allowCopyTrading: builder.mutation<any, AllowCopyTradingBody>({
        query: (body) => ({
          url: "/trading-accounts/allow-copy-trading",
          method: "POST",
          body,
        }),
        invalidatesTags: ["CopyTradingRequests"],
      }),

      /** ===== Header notification alert APIs ===== */

      getTradeAlerts: builder.query<
        TradeNotificationAlert[],
        GetTradeAlertsArgs | void
      >({
        query: (args) => ({
          url: "/trade/alerts",
          method: "GET",
          params: {
            start: args?.start ?? 0,
            count: args?.count ?? 20,
            unreadOnly: args?.unreadOnly ?? false,
          },
        }),
        transformResponse: (res: any) => normalizeTradeAlerts(res),
        providesTags: ["TradeAlerts"],
      }),

      markTradeAlertRead: builder.mutation<any, string | number>({
        query: (tradeAlertId) => ({
          url: `/trade/alerts/${tradeAlertId}/read`,
          method: "PATCH",
        }),
        invalidatesTags: ["TradeAlerts"],
      }),

      markAllTradeAlertsRead: builder.mutation<any, void>({
        query: () => ({
          url: "/trade/alerts/read-all",
          method: "PATCH",
        }),
        invalidatesTags: ["TradeAlerts"],
      }),

      /** ===== Alert history endpoints for full history page ===== */

      getUserAlertHistory: builder.query<
        TradeAlertSnapshot[],
        GetUserAlertHistoryArgs | void
      >({
        query: (args) => ({
          url: "/tradingview/alerts/history",
          method: "GET",
          params: cleanAlertHistoryParams(args ?? undefined),
        }),
        transformResponse: (res: any) => normalizeUserAlertHistory(res),
        providesTags: ["AlertSnapshots"],
      }),

      getAdminAlertHistory: builder.query<
        AdminAlertHistoryResult,
        GetAdminAlertHistoryArgs | void
      >({
        query: (args) => ({
          url: "/tradingview/alerts/admin/history",
          method: "GET",
          params: cleanAlertHistoryParams(args ?? undefined),
        }),
        transformResponse: (res: any, _meta, arg) =>
          normalizeAdminAlertHistory(res, arg ?? undefined),
        providesTags: ["AdminAlertSnapshots"],
      }),
    }),
    overrideExisting: false,
  });

export const {
  useGetMyMasterQuery,
  useLazyGetMyMasterQuery,
  useUpsertMyMasterMutation,
  useListMastersQuery,
  useLazyListMastersQuery,
  useFollowMasterMutation,
  useListMyFollowsQuery,
  useLazyListMyFollowsQuery,
  useUpdateMyFollowMutation,
  useListMyFollowersQuery,
  useLazyListMyFollowersQuery,
  useDecideFollowerRequestMutation,

  useGetCopyTradingRequestsQuery,
  useLazyGetCopyTradingRequestsQuery,
  useHandleCopyTradingRequestMutation,
  useAllowCopyTradingMutation,

  useGetTradeAlertsQuery,
  useLazyGetTradeAlertsQuery,
  useMarkTradeAlertReadMutation,
  useMarkAllTradeAlertsReadMutation,

  useGetUserAlertHistoryQuery,
  useLazyGetUserAlertHistoryQuery,
  useGetAdminAlertHistoryQuery,
  useLazyGetAdminAlertHistoryQuery,
} = copyTradingApi;