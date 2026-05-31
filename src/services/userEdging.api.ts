import { baseApi } from "./baseApi";

export type UserEdgingStatus = {
  isEnabled: boolean;
  notes?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type UpdateUserEdgingStatusPayload = {
  isEnabled: boolean;
  notes?: string;
};

export const userEdgingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserEdgingStatus: builder.query<UserEdgingStatus, void>({
      query: () => ({
        url: "user/edging-status",
        method: "GET",
      }),
      providesTags: [{ type: "UserEdging" as const, id: "STATUS" }],
    }),

    updateUserEdgingStatus: builder.mutation<UserEdgingStatus, UpdateUserEdgingStatusPayload>({
      query: (body) => ({
        url: "user/edging-status",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "UserEdging" as const, id: "STATUS" }],
    }),
  }),
});

export const {
  useGetUserEdgingStatusQuery,
  useUpdateUserEdgingStatusMutation,
} = userEdgingApi;