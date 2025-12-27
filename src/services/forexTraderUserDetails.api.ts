import { baseApi } from "./baseApi";

export type ForexTradeCategory = "MT5" | "CTRADER";

export type ForexTraderUserDetail = {
  id: number;
  userId: number;
  forexTraderUserId: string;
  forexType: ForexTradeCategory;
  isMaster: boolean;
  hasToken: boolean;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

export type UpsertMyForexDetailsBody = {
  forexTraderUserId: string;
  forexType: ForexTradeCategory;
  token?: string;          // ✅ optional (MT5 can skip)
  isMaster?: boolean;
};

export type PatchForexDetailsBody = {
  forexTraderUserId?: string;
  token?: string | null;
  isMaster?: boolean;
};

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const forexTraderUserDetailsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["ForexTraderUserDetails"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getMyForexTraderDetails: builder.query<ForexTraderUserDetail[], void>({
        query: () => ({ url: "/forex-trader-user-details/me", method: "GET" }),
        transformResponse: (res: any) => {
          const raw = unwrapData<any>(res);
          const rows = raw?.rows ?? raw?.items ?? raw?.data ?? raw ?? [];
          return Array.isArray(rows) ? (rows as ForexTraderUserDetail[]) : [];
        },
        providesTags: ["ForexTraderUserDetails"],
      }),

      upsertMyForexTraderDetails: builder.mutation<
        ForexTraderUserDetail,
        UpsertMyForexDetailsBody
      >({
        query: (body) => ({
          url: "/forex-trader-user-details/me",
          method: "PUT",
          body,
        }),
        transformResponse: (res: any) => unwrapData<any>(res)?.data ?? unwrapData<any>(res),
        invalidatesTags: ["ForexTraderUserDetails"],
      }),

      patchForexTraderDetailById: builder.mutation<
        ForexTraderUserDetail,
        { id: number; patch: PatchForexDetailsBody }
      >({
        query: ({ id, patch }) => ({
          url: `/forex-trader-user-details/${id}`,
          method: "PATCH",
          body: patch,
        }),
        transformResponse: (res: any) => unwrapData<any>(res)?.data ?? unwrapData<any>(res),
        invalidatesTags: ["ForexTraderUserDetails"],
      }),

      deleteForexTraderDetailById: builder.mutation<
        { deleted: number } | any,
        { id: number }
      >({
        query: ({ id }) => ({
          url: `/forex-trader-user-details/${id}`,
          method: "DELETE",
        }),
        transformResponse: (res: any) => unwrapData<any>(res)?.data ?? unwrapData<any>(res),
        invalidatesTags: ["ForexTraderUserDetails"],
      }),
    }),
    overrideExisting: true,
  });

export const {
  useGetMyForexTraderDetailsQuery,
  useUpsertMyForexTraderDetailsMutation,
  usePatchForexTraderDetailByIdMutation,
  useDeleteForexTraderDetailByIdMutation,
} = forexTraderUserDetailsApi;
