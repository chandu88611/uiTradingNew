import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "https://backend.tradebro.io",
    // baseUrl: import.meta.env.VITE_API_URL || " http://69.62.126.107:3043/api",
    credentials: "include",
  }),
    refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,

  // ✅ drop cache immediately when no component is using it
  keepUnusedDataFor: 0,

  tagTypes: [ 
    "UserEdging",
    "UserDashboard",
    "User",
    "UserSubscription",
    "SubscriptionPlan",
    "BrokerSession",
    "BrokerCredential",
    "BrokerSessions",
    "WorkspaceOpenTrades",
    "WorkspaceTradeHistory",
    "WorkspaceSignals",
    "WorkspaceAlerts",
    "TradingViewAlertsHistory",
    "TradingviewAlertsHistory", 
    'TradingAccount',
    'Trades',
    'TradeHistory',
    "FollowerTradingAccount",
    "StrategyInstance",
    "Strategy"
  ],
  endpoints: () => ({}),
});
