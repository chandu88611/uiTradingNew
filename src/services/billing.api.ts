import { baseApi } from "./baseApi";

type CreateSubscriptionCheckoutPayload = {
  planId: number;
};

type CreateSubscriptionCheckoutResponse = {
  message: string;
  data: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    invoiceId: number;
    planId: number;
    planName: string;
  };
};

type VerifySubscriptionPaymentPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  invoiceId: number;
};

type GetCurrentSubscriptionResponse = {
  message: string;
  data: any | null;
};

type CancelSubscriptionPayload = {
  immediate?: boolean;
};

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSubscriptionCheckout: builder.mutation<
      CreateSubscriptionCheckoutResponse,
      CreateSubscriptionCheckoutPayload
    >({
      query: ({ planId }) => ({
        url: "billing/subscription/checkout",
        method: "POST",
        body: { planId },
      }),
    }),

    verifySubscriptionPayment: builder.mutation<
      { message: string; data: any },
      VerifySubscriptionPaymentPayload
    >({
      query: ({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        invoiceId,
      }) => ({
        url: "billing/subscription/verify",
        method: "POST",
        body: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          invoiceId,
        },
      }),
    //   invalidatesTags: [
    //     { type: "CurrentSubscription" as const, id: "ME" },
    //     { type: "Billing" as const, id: "CURRENT" },
    //   ],
    }),

    getCurrentSubscriptionBilling: builder.query<
      GetCurrentSubscriptionResponse,
      void
    >({
      query: () => ({
        url: "billing/subscription/current",
        method: "GET",
      }),
    //   providesTags: [{ type: "CurrentSubscription" as const, id: "ME" }],
    }),

    cancelSubscriptionBilling: builder.mutation<
      { message: string; data: any },
      CancelSubscriptionPayload | void
    >({
      query: (payload) => ({
        url: "billing/subscription/cancel",
        method: "POST",
        body: payload ?? {},
      }),
    //   invalidatesTags: [{ type: "CurrentSubscription" as const, id: "ME" }],
    }),

    // ✅ GET /billing/invoices — paginated invoice history for the logged-in user
    listMyInvoices: builder.query<
      { data: any[]; total?: number; page?: number; limit?: number },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "billing/invoices",
        method: "GET",
        params: params ? { page: (params as any).page ?? 1, limit: (params as any).limit ?? 20 } : undefined,
      }),
      transformResponse: (res: any) => {
        const raw = res?.data ?? res;
        const items = raw?.data ?? raw?.items ?? raw?.invoices ?? (Array.isArray(raw) ? raw : []);
        return {
          data: Array.isArray(items) ? items : [],
          total: raw?.total ?? raw?.count,
          page: raw?.page ?? 1,
          limit: raw?.limit ?? 20,
        };
      },
    }),
  }),
});

export const {
  useCreateSubscriptionCheckoutMutation,
  useVerifySubscriptionPaymentMutation,
  useGetCurrentSubscriptionBillingQuery,
  useCancelSubscriptionBillingMutation,
  useListMyInvoicesQuery,
} = billingApi;