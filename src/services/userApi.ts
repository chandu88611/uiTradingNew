import { baseApi } from "./baseApi";

// ----------------------
// Common types
// ----------------------
export interface User {
  id: string | number;
  email: string;
  name?: string;
}

export interface ApiMessageResponse {
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  name?: string;
  provider?: "google";
  providerUserId?: string;
  referralCode?: string;
}

export interface GooglePayload {
  id_token: string;
  referralCode?: string;
}

export interface LoginResponse {
  message: string;
  user?: User;
  tokens?: {
    access: string;
    refresh: string;
  };
}

export interface MeResponse {
  user: User;
}

export interface UpdateMePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface BillingDetailsPayload {
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

// ----------------------
// Referral types
// ----------------------
export type ReferralLevel = 1 | 2 | 3;
export type SettlementStatus = "PENDING" | "UNLOCKED" | "FROZEN";
export type KycStatus = "VERIFIED" | "INCOMPLETE";

export interface ReferralUser {
  id?: number | string;
  name?: string;
  email?: string;
  referralCode?: string;
}

export interface ReferralNode {
  id?: number | string;
  parentId?: number | string | null;
  userId?: number | string;
  parentUserId?: number | string | null;
  name?: string;
  userName?: string;
  email?: string;
  plan?: string;
  planName?: string;
  joined?: string;
  createdAt?: string;
  commission?: number;
  volumeTraded?: number;
  tradeVolume?: number;
  daysUntilUnlock?: number;
  kycStatus?: KycStatus;
  settlementStatus?: SettlementStatus;
  level?: ReferralLevel | number;
  children?: ReferralNode[];
}

export interface MyReferralData {
  referralCode?: string;
  user?: ReferralUser;
  me?: ReferralUser;
  tree?: ReferralNode[];
  network?: ReferralNode[];
  referrals?: ReferralNode[];
  upline?: unknown;
  counts?: {
    level1?: number;
    level2?: number;
    level3?: number;
    total?: number;
  };
}

export interface MyReferralResponse {
  message?: string;
  data?: MyReferralData;
}

// ----------------------
// Settings types
// ----------------------
export interface TradeSettings {
  allowTrade: boolean;
}

export interface CopyTradeSettings {
  allowCopyTrade: boolean;
}

export interface EdgingSettings {
  isEnabled: boolean;
  notes: string | null;
  updatedAt: string | null;
}

export interface RiskLimitsSettings {
  isEnabled: boolean;
  dailyLossLimit: number | null;
  dailyProfitTarget: number | null;
  maxTradesPerDay: number | null;
  cooldownAfterLossMins: number | null;
  updatedAt: string | null;
}

export interface WalletSettings {
  currency: string;
  totalEarned: number;
  pendingRewards: number;
  withdrawableAmount: number;
  lockedWithdrawalAmount: number;
  totalWithdrawn: number;
  minWithdrawalAmount: number;
  holdDays: number;
}

export interface SettingsBroker {
  id: number | string;
  code: string;
  name: string;
  marketCategory: string;
}

export interface SettingsSubscription {
  id: number | string;
  planId: number | string;
  planName: string;
  status: string;
}

export interface SettingsAccount {
  id: number | string;
  accountId: string;
  accountLabel: string;
  isEnabled: boolean;
  isMaster: boolean;
  status: string;
  lastVerifiedAt: string | null;
  broker: SettingsBroker;
  subscription: SettingsSubscription | null;
}

export interface UserSettingsData {
  trade: TradeSettings;
  copyTrade: CopyTradeSettings;
  edging: EdgingSettings;
  riskLimits: RiskLimitsSettings;
  wallet?: WalletSettings;
  accounts: SettingsAccount[];
}

export interface UserSettingsResponse {
  message: string;
  data: UserSettingsData;
}

export interface UpdateTradeStatusPayload {
  allowTrade: boolean;
}

export interface UpdateCopyTradeStatusPayload {
  allowCopyTrade: boolean;
}

export interface UpdateEdgingStatusPayload {
  isEnabled: boolean;
  notes?: string | null;
}

export interface UpdateRiskLimitsPayload {
  isEnabled: boolean;
  dailyLossLimit: number | null;
  dailyProfitTarget: number | null;
  maxTradesPerDay: number | null;
  cooldownAfterLossMins: number | null;
}

// ----------------------
// userApi
// ----------------------
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // AUTH
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
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

    me: builder.query<MeResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    refreshToken: builder.mutation<{ access: string; refresh: string }, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    revokeToken: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "/auth/revoke",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    // USER
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
        method: "PATCH",
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

    // BILLING
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
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateExecutionProvider: builder.mutation<
      { message: string; data?: unknown },
      { executionProvider: "MT5" | "CTRADER" }
    >({
      query: (body) => ({
        url: "/me/execution-provider",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // REFERRAL
    getMyReferral: builder.query<MyReferralResponse, void>({
      query: () => ({
        url: "/user/referral",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // SETTINGS
    getUserSettings: builder.query<UserSettingsResponse, void>({
      query: () => ({
        url: "/user/settings",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    updateTradeStatus: builder.mutation<
      ApiMessageResponse,
      UpdateTradeStatusPayload
    >({
      query: (body) => ({
        url: "/user/trade-status",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateCopyTradeStatus: builder.mutation<
      ApiMessageResponse,
      UpdateCopyTradeStatusPayload
    >({
      query: (body) => ({
        url: "/user/copy-trade-status",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    getEdgingStatus: builder.query<
      { message: string; data: EdgingSettings },
      void
    >({
      query: () => ({
        url: "/user/edging-status",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    updateEdgingStatus: builder.mutation<
      ApiMessageResponse,
      UpdateEdgingStatusPayload
    >({
      query: (body) => ({
        url: "/user/edging-status",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateRiskLimits: builder.mutation<
      ApiMessageResponse,
      UpdateRiskLimitsPayload
    >({
      query: (body) => ({
        url: "/user/risk-limits",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useRefreshTokenMutation,
  useRevokeTokenMutation,
  useMeQuery,

  useGetMeQuery,
  useUpdateMeMutation,
  usePatchMeMutation,
  useChangePasswordMutation,
  useDeleteMeMutation,

  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
  useUpdateExecutionProviderMutation,

  useGetMyReferralQuery,

  useGetUserSettingsQuery,
  useUpdateTradeStatusMutation,
  useUpdateCopyTradeStatusMutation,
  useGetEdgingStatusQuery,
  useUpdateEdgingStatusMutation,
  useUpdateRiskLimitsMutation,
} = userApi;