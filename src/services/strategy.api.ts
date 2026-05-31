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

export const strategyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  useToggleStrategyInstanceMutation,
  useToggleStrategyPlanMutation,
  useUpdateStrategyPlanVolumeMutation,
} = strategyApi;