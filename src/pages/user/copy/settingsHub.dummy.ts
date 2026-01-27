// settingsHub.dummy.ts
import { Market, PlanInstance, UsageByMarket, PlanSignalSettings, MarketPlanSelection, GlobalRiskSettings } from "./settingsHub.types";

export const dummyPlans: PlanInstance[] = [
  // FOREX
  {
    planId: "fx_basic_001",
    market: "FOREX",
    planName: "Forex Basic",
    tier: "basic",
    executionAllowed: true,
    expiresAt: "2026-03-01T00:00:00.000Z",
    limits: { maxConnectedAccounts: 2, maxActiveStrategies: 1, maxDailyTrades: 50, maxLotPerTrade: 2 },
    strategiesAvailable: true,
    webhookAvailable: true,
  },
  {
    planId: "fx_elite_002",
    market: "FOREX",
    planName: "Forex Elite",
    tier: "elite",
    executionAllowed: true,
    expiresAt: "2026-12-31T00:00:00.000Z",
    limits: { maxConnectedAccounts: 10, maxActiveStrategies: 10, maxDailyTrades: 300, maxLotPerTrade: 10 },
    strategiesAvailable: true,
    webhookAvailable: true,
  },

  // INDIA
  {
    planId: "in_basic_101",
    market: "INDIA",
    planName: "India Basic",
    tier: "basic",
    executionAllowed: true,
    expiresAt: "2026-02-15T00:00:00.000Z",
    limits: { maxConnectedAccounts: 2, maxActiveStrategies: 1, maxDailyTrades: 30 },
    strategiesAvailable: true,
    webhookAvailable: true,
  },
  {
    planId: "in_pro_102",
    market: "INDIA",
    planName: "India Pro",
    tier: "pro",
    executionAllowed: true,
    expiresAt: "2026-06-15T00:00:00.000Z",
    limits: { maxConnectedAccounts: 5, maxActiveStrategies: 5, maxDailyTrades: 120 },
    strategiesAvailable: true,
    webhookAvailable: true,
  },

  // CRYPTO
  {
    planId: "cr_basic_201",
    market: "CRYPTO",
    planName: "Crypto Basic",
    tier: "basic",
    executionAllowed: true,
    expiresAt: "2026-02-10T00:00:00.000Z",
    limits: { maxConnectedAccounts: 2, maxActiveStrategies: 1, maxDailyTrades: 200 },
    strategiesAvailable: true,
    webhookAvailable: true,
  },

  // COPY
  {
    planId: "cp_basic_301",
    market: "COPY",
    planName: "Copy Basic",
    tier: "basic",
    executionAllowed: true,
    expiresAt: "2026-04-01T00:00:00.000Z",
    limits: { maxConnectedAccounts: 10, maxActiveStrategies: 1 },
    strategiesAvailable: true, // you said copy plan has one simple strategy
    webhookAvailable: true,
  },
];

export const dummyUsage: UsageByMarket = {
  FOREX: { accountsUsed: 2, strategiesEnabledCount: 0, tradesToday: 6 },
  INDIA: { accountsUsed: 2, strategiesEnabledCount: 1, tradesToday: 3 },
  CRYPTO: { accountsUsed: 1, strategiesEnabledCount: 0, tradesToday: 12 },
  COPY: { accountsUsed: 4, strategiesEnabledCount: 1, tradesToday: 9 },
};

export const dummyPlanSignals: PlanSignalSettings = {
  fx_basic_001: { strategiesEnabled: false, webhookEnabled: false },
  fx_elite_002: { strategiesEnabled: true, webhookEnabled: true },

  in_basic_101: { strategiesEnabled: true, webhookEnabled: true },
  in_pro_102: { strategiesEnabled: true, webhookEnabled: false },

  cr_basic_201: { strategiesEnabled: false, webhookEnabled: true },

  cp_basic_301: { strategiesEnabled: true, webhookEnabled: true },
};

export const dummySelections: MarketPlanSelection = {
  FOREX: "fx_basic_001",
  INDIA: "in_basic_101",
  CRYPTO: "cr_basic_201",
  COPY: "cp_basic_301",
};

export const dummyGlobalRisk: GlobalRiskSettings = {
  paused: false,
  pauseUntil: null,

  maxLossAmount: 2500,
  maxLossPercent: null,

  minGainAmount: 800,
  minGainPercent: null,

  maxTradesPerDay: 25,
  stopAfterConsecutiveLosses: 3,

  blockOutsideHours: true,
  tradeFromHHMM: "09:15",
  tradeToHHMM: "15:30",

  manualResumeRequired: true,
};
