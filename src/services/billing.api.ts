// src/services/billing.api.ts
import { baseApi } from "./baseApi";

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded";

export interface SubscriptionInvoiceDto {
  id: number | string;
  subscriptionId?: number | string | null;
  planId?: number | string | null;
  planName?: string | null;
  amountCents: number;
  currency?: string;
  status: InvoiceStatus;
  paymentGateway?: string | null;
  paymentReference?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceListResponse {
  data: SubscriptionInvoiceDto[];
  total?: number;
  page?: number;
  limit?: number;
}

function unwrapData<T>(res: any): T {
  return (res?.data ?? res) as T;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMyInvoices: builder.query<InvoiceListResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: "/billing/invoices",
        method: "GET",
        params: params ? { page: params.page ?? 1, limit: params.limit ?? 20 } : undefined,
      }),
      transformResponse: (res: any): InvoiceListResponse => {
        const raw = unwrapData<any>(res);
        const items = raw?.data ?? raw?.items ?? raw?.invoices ?? (Array.isArray(raw) ? raw : []);
        return {
          data: Array.isArray(items) ? items : [],
          total: raw?.total ?? raw?.count ?? undefined,
          page: raw?.page ?? 1,
          limit: raw?.limit ?? 20,
        };
      },
      providesTags: ["UserSubscription"],
    }),
  }),
  overrideExisting: true,
});

export const { useListMyInvoicesQuery } = billingApi;
