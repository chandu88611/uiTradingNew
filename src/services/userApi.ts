import { baseApi } from "./baseApi";

// ----------------------
// Types
// ----------------------
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface BillingDetailsPayload {
  // ✅ match backend keys
  panNumber?: string | null;

 

  addressLine1: string;
  addressLine2?: string | null;

  city: string;
  state: string;
  pincode: string;
}


export interface BillingDetailsResponse {
  message: string;
  data?: BillingDetailsPayload;
}

export interface GooglePayload {
  id_token: string;
}

export interface UpdateTradeStatusPayload {
  allowTrade: boolean;
}

export interface TradeStatusResponse {
  message: string;
  data?: {
    allowTrade?: boolean;
  };
}


export interface LoginResponse {
  message: string;
  user?: User;
  // ⛔ We will IGNORE tokens on the frontend when using cookies.
  tokens?: {
    access: string;
    refresh: string;
  };
}

export interface MeResponse {
  user: User;
}

// ----------------------
// USER payloads (optional)
// ----------------------
export interface UpdateMePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiMessageResponse {
  message: string;
}

// ----------------------
// userApi Service (ONLY AUTH + USER)
// ----------------------
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ================= AUTH =================

    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
updateTradeStatus: builder.mutation<TradeStatusResponse, UpdateTradeStatusPayload>({
  query: (body) => ({
    url: "/user/trade-status",
    method: "PUT",
    body,
  }),
  invalidatesTags: ["User"],
}),

    register: builder.mutation<LoginResponse, RegisterPayload>({
      query: (body) => ({
        url: "/user/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    googleLogin: builder.mutation<LoginResponse, GooglePayload>({
      query: (body) => ({
        url: "/auth/google",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // cookie-based session
    me: builder.query<MeResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // cookie-based refresh
    refreshToken: builder.mutation<{ access: string; refresh: string }, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    // logout (clear cookies)
    revokeToken: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    // ================= USER =================

    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: "/user/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    updateMe: builder.mutation<
      { message: string; user?: User } | ApiMessageResponse,
      UpdateMePayload
    >({
      query: (body) => ({
        url: "/user/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    patchMe: builder.mutation<
      { message: string; user?: User } | ApiMessageResponse,
      UpdateMePayload
    >({
      query: (body) => ({
        url: "/user/me",
        method: "GET",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    changePassword: builder.mutation<ApiMessageResponse, ChangePasswordPayload>({
      query: (body) => ({
        url: "/user/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    deleteMe: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "/user/me",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // ================= BILLING DETAILS =================

    getBillingDetails: builder.query<BillingDetailsResponse, void>({
      query: () => ({
        url: "/user/billing",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    

    saveBillingDetails: builder.mutation<
      BillingDetailsResponse,
      BillingDetailsPayload
    >({
      query: (body) => ({
        url: "/user/billing",
        method: "PUT", // change to PUT if backend expects update
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),

  

  
});

// ----------------------
// export hooks
// ----------------------
export const {
  // auth
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useRefreshTokenMutation,
  useRevokeTokenMutation,
  useMeQuery,

  // user
  useGetMeQuery,
  useUpdateMeMutation,
  usePatchMeMutation,
  useChangePasswordMutation,
  useDeleteMeMutation,

  // billing
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
  useUpdateTradeStatusMutation
} = userApi;
