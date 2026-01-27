import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "https://backend.globalalgotrading.com",
    // baseUrl: import.meta.env.VITE_API_URL || " http://69.62.126.107:3043/api",
    credentials: "include",
  }),
  tagTypes: ["Todos",
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
     'TradingAccount'
  ],
  endpoints: () => ({}),
});
