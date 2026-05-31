// src/services/followers.api.ts
import { baseApi } from "./baseApi";

/** ==== API shapes (from your Postman response) ==== */
export type FollowStatus = "pending" | "active" | "paused" | "stopped" | string;

export type BrokerMarket = "FOREX" | "CRYPTO" | "INDIAN" | string;

export interface ApiBroker {
  id: number;
  code: string; // MT5 / CTRADER / ZEBU / etc
  name: string;
  marketCategory: BrokerMarket;
  isActive?: boolean;
}

export interface ApiUser {
  id: number;
  email: string;
  name: string;
}

export interface ApiTradingAccount {
  id: number;
  userId: number;
  subscriptionId: number;
  isMaster: boolean;
  brokerId: number;

  accountId: string;
  accountLabel: string;
  accountMeta?: Record<string, any> | null;

  credentialsEncrypted?: string | null;
  status?: string;

  lastVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  accessToken?: string | null;
  refreshToken?: string | null;

  broker?: ApiBroker;
  user?: ApiUser; // present on master
  subscription?: any;
}

export interface ApiFollowerRow {
  id: number;
  masterId: number;
  followerUserId: number;
  followerTradingAccountId: number;

  status: FollowStatus;
  requestedAt?: string | null;
  approvedAt?: string | null;
  pausedAt?: string | null;
  stoppedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;

  master: ApiTradingAccount;
  followerTradingAccount: ApiTradingAccount;
}

export interface ListFollowerAccountsResponse {
  message: string;
  followers: ApiFollowerRow[];
}

/** ==== Query args ==== */
export interface ListFollowerAccountsArgs {
  start?: number;
  count?: number;
  searchParams?: string; // "active" | "pending" etc
}

/** ==== RTK service ==== */
export const followersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFollowerUserTradingAccounts: builder.query<
      ListFollowerAccountsResponse,
      ListFollowerAccountsArgs | void
    >({
      query: (arg) => {
        const a = (arg || {}) as ListFollowerAccountsArgs;
        return {
          url: "subscription/follower-user-trading-account",
          method: "GET",
          params: {
            start: a.start ?? 0,
            count: a.count ?? 20,
            ...(a.searchParams ? { searchParams: a.searchParams } : {}),
          },
        };
      },
      providesTags: (_r) => [{ type: "FollowerTradingAccount" as const, id: "LIST" }],
    }),
  }),
});

export const { useGetFollowerUserTradingAccountsQuery } = followersApi;
