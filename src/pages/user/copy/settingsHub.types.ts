// settingsHub.types.ts
export type Market = "FOREX" | "INDIA" | "CRYPTO" | "COPY";

export type PlanLimits = {
  maxConnectedAccounts: number;
  maxActiveStrategies: number;
  maxDailyTrades?: number;
  maxLotPerTrade?: number;
};

export type PlanInstance = {
  planId: string;
  market: Market;
  planName: string; // "Forex Basic"
  tier?: "basic" | "pro" | "elite";
  executionAllowed: boolean;
  expiresAt?: string | null;
  limits: PlanLimits;

  // per your updated requirement:
  strategiesAvailable: boolean; // plan has strategies
  webhookAvailable: boolean; // plan has webhook
};

export type PlanSignalToggles = {
  strategiesEnabled: boolean;
  webhookEnabled: boolean;
};

export type PlanSignalSettings = Record<string, PlanSignalToggles>; // by planId

export type MarketPlanSelection = Record<Market, string | null>; // default plan per market

export type MarketUsageSnapshot = {
  accountsUsed: number | null;
  strategiesEnabledCount: number | null;
  tradesToday: number | null;
};

export type UsageByMarket = Record<Market, MarketUsageSnapshot>;

export type GlobalRiskSettings = {
  paused: boolean;
  pauseUntil: string | null; // ISO

  // daily rules
  maxLossAmount: number | null;
  maxLossPercent: number | null;

  minGainAmount: number | null;
  minGainPercent: number | null;

  maxTradesPerDay: number | null;
  stopAfterConsecutiveLosses: number | null;

  // simple schedule
  blockOutsideHours: boolean;
  tradeFromHHMM: string; // "09:15"
  tradeToHHMM: string; // "15:30"

  manualResumeRequired: boolean;
};
