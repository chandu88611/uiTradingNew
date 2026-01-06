// src/services/indiaToken.api.ts
import { baseApi } from "./baseApi";

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export type CreateTokenLinkRes = {
  link: string;        // shareable link
  expiresAt: string;   // ISO
  requestId: string;   // optional
};

export const indiaTokenApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["IndiaToken"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      createIndiaTokenLink: builder.mutation<CreateTokenLinkRes, { tradingAccountId: number }>({
        query: (body) => ({
          url: `/india/token-requests`,
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<CreateTokenLinkRes>(res),
        invalidatesTags: ["IndiaToken"],
      }),

      adminUpdateIndiaToken: builder.mutation<any, { tradingAccountId: number; accessToken: string }>({
        query: (body) => ({
          url: `/india/token`,
          method: "POST",
          body,
        }),
        transformResponse: (res: any) => unwrapData<any>(res),
        invalidatesTags: ["IndiaToken"],
      }),
    }),
    overrideExisting: true,
  });

export const { useCreateIndiaTokenLinkMutation, useAdminUpdateIndiaTokenMutation } = indiaTokenApi;
