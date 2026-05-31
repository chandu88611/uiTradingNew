import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "https://backend.tradebro.io",
    credentials: "include",
  }),
  tagTypes: [
    "Todos",
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
    "TradingviewAlertsHistory",
    "TradingAccount",
    "TradingAccounts",
    "Trades",
    "TradeHistory",
    "ZebuAuth",
    "IndiaToken",
  ],
  endpoints: () => ({}),
});
