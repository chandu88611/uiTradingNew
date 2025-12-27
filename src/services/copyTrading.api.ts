// src/services/copyTrading.api.ts
import { baseApi } from "./baseApi";

export type CopyVisibility = "private" | "unlisted" | "public";
export type CopyFollowStatus = "pending" | "active" | "paused" | "stopped" | "rejected";

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

  // allow backend extra keys safely
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

export const copyTradingApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["CopyMaster", "CopyMasters", "CopyFollows", "CopyFollowers"],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      // GET /copy-trade/master/me
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

      // POST /copy-trade/master
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
            ? [
                { type: "CopyMaster" as const, id: result.id },
                "CopyMasters",
              ]
            : ["CopyMaster", "CopyMasters"],
      }),

      // GET /copy-trade/masters?visibility=public&page=1&limit=20
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
          for (const m of result?.items ?? []) base.push({ type: "CopyMaster", id: m.id });
          return base;
        },
      }),

      // POST /copy-trade/follows
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
          // If your backend still uses "/copy-trade/follow", change this back.
          url: "/copy-trade/follows",
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<CopyFollow>(res),
        invalidatesTags: ["CopyFollows", "CopyFollowers"],
      }),

      // GET /copy-trade/follows/me?status=active&page=1&limit=20
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
          for (const f of result?.items ?? []) base.push({ type: "CopyFollows", id: f.id });
          return base;
        },
      }),

      // PATCH /copy-trade/follows/:followId
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

      // GET /copy-trade/followers/me?status=pending&page=1&limit=20
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
          for (const f of result?.items ?? []) base.push({ type: "CopyFollowers", id: f.id });
          return base;
        },
      }),

      // PATCH /copy-trade/followers/:followId/decision  { action: "approve" | "reject" }
      decideFollowerRequest: builder.mutation<any, { followId: number; action: "approve" | "reject" }>({
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
} = copyTradingApi;
