import { baseApi } from "./baseApi";

type ToggleStrategyInstancePayload = {
  instanceId: number;
  enabled: boolean;
};

type ToggleStrategyPlanPayload = {
  planId: number | string;
  enabled: boolean;
};

type UpdateStrategyPlanVolumePayload = {
  planId: number | string;
  volume: number;
};

export type StrategySubscribePayload = {
  accountId?: number | string | null;
  tradingAccountId?: number | string | null;
  autoCopy?: boolean;
  allocationMode?: string;
  fixed?: number | null;
  percent?: number | null;
  multiplier?: number | null;
  maxRisk?: number | null;
  dailyLossLimit?: number | null;
  maxDrawdownStop?: number | null;
  maxSlippage?: number | null;
};

export type StrategyPerformanceQuery = {
  strategyId: number | string;
  accountId?: number | string | null;
};

function unwrapData<T>(response: any): T {
  return (response?.data ?? response) as T;
}

export const strategyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStrategyDetail: builder.query<any, number | string>({
      query: (strategyId) => ({
        url: `strategy/${strategyId}`,
        method: "GET",
      }),
      transformResponse: (response: any) => unwrapData<any>(response),
      providesTags: (_result, _error, strategyId) => [
        { type: "Strategy" as const, id: strategyId },
      ],
    }),

    getStrategyPerformance: builder.query<any, StrategyPerformanceQuery>({
      query: ({ strategyId, accountId }) => ({
        url: `strategy/${strategyId}/my-performance`,
        method: "GET",
        params:
          accountId === undefined || accountId === null || accountId === ""
            ? undefined
            : { accountId },
      }),
      transformResponse: (response: any) => unwrapData<any>(response),
      providesTags: (_result, _error, arg) => [
        { type: "Strategy" as const, id: `${arg.strategyId}:performance` },
      ],
    }),

    subscribeStrategy: builder.mutation<
      any,
      { strategyId: number | string; body: StrategySubscribePayload }
    >({
      query: ({ strategyId, body }) => ({
        url: `strategy/${strategyId}/subscribe`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => unwrapData<any>(response),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Strategy" as const, id: arg.strategyId },
        { type: "Strategy" as const, id: `${arg.strategyId}:performance` },
        "UserSubscription",
      ],
    }),

    toggleStrategyInstance: builder.mutation<any, ToggleStrategyInstancePayload>({
      query: ({ instanceId, enabled }) => ({
        url: `strategy/instance/${instanceId}/${enabled ? "enable" : "disable"}`,
        method: "PATCH",
        credentials: "include",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "StrategyInstance" as const, id: arg.instanceId },
        { type: "StrategyInstance" as const, id: "LIST" },
      ],
    }),

    toggleStrategyPlan: builder.mutation<any, ToggleStrategyPlanPayload>({
      query: ({ planId, enabled }) => ({
        url: `strategy/${planId}/${enabled ? "enable" : "disable"}`,
        method: "PATCH",
        credentials: "include",
      }),
      // invalidatesTags: (_r, _e, arg) => [
      //   { type: "StrategyPlan" as const, id: String(arg.planId) },
      //   { type: "StrategyPlan" as const, id: "LIST" },
      //   { type: "StrategyInstance" as const, id: "LIST" },
      // ],
    }),

    updateStrategyPlanVolume: builder.mutation<any, UpdateStrategyPlanVolumePayload>({
      query: ({ planId, volume }) => ({
        url: `strategy/instance/${planId}/volume`,
        method: "PATCH",
        body: { volume },
      }),
      // invalidatesTags: (_r, _e, arg) => [
      //   { type: "StrategyPlan" as const, id: String(arg.planId) },
      //   { type: "StrategyPlan" as const, id: "LIST" },
      // ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStrategyDetailQuery,
  useGetStrategyPerformanceQuery,
  useSubscribeStrategyMutation,
  useToggleStrategyInstanceMutation,
  useToggleStrategyPlanMutation,
  useUpdateStrategyPlanVolumeMutation,
} = strategyApi;
