export type Market = "FOREX" | "INDIA" | "CRYPTO" | "COPY";
export type TabKey = "TRADING" | "RISK" | "STRATEGIES" | "USAGE" | "ACCOUNT";

export type MarketLimits = {
  hasPlan: boolean;
  plansCount: number;

  executionAllowed: boolean;
  earliestEndDate?: string | null;

  maxConnectedAccounts?: number;
  maxActiveStrategies?: number;
  maxDailyTrades?: number;
  maxLotPerTrade?: number;
};

export type MarketSummary = Record<Market, MarketLimits>;

export type PlanInstance = {
  market: Market;
  planId: string;
  planName: string;
  endDate?: string | null;
  executionAllowed: boolean;
  limits: {
    maxConnectedAccounts?: number;
    maxActiveStrategies?: number;
    maxDailyTrades?: number;
    maxLotPerTrade?: number;
  };
};

export type PlanPref = {
  mode: "AUTO_MAX" | "SPECIFIC";
  planId?: string | null;
};

export type PlanPrefs = Record<Market, PlanPref>;

/** ✅ Plan-owned strategy catalog (read-only definitions) */
export type PlanStrategyDef = {
  id: string;
  planId: string;
  market: Market;
  name: string;
  description: string;
  riskHint?: string;
  tags?: string[];
};

/** ✅ User selection state (what is enabled) — stored per plan */
export type StrategySelections = Record<string /* planId */, string[] /* enabled strategyIds */>;

export type RiskGuard = {
  enabled: boolean;
  pauseTrading: boolean;
  closePositions: boolean;
  notify: boolean;
  dailyMaxLoss?: number | null;
  dailyProfitTarget?: number | null;
  minGainPerDay?: number | null;
};

export type RiskSettings = {
  masterPause: boolean;
  pauseUntil?: string | null;
  pauseReason?: string;

  executionMode: "EXECUTION" | "SIGNALS_ONLY" | "PAPER";
  allowedMarkets: Record<Market, boolean>;

  globalGuards: RiskGuard;

  maxTradesPerDay?: number | null;
  maxOpenPositions?: number | null;
  maxLotPerTrade?: number | null;
  maxDrawdownPct?: number | null;

  cooldownAfterLossMins?: number | null;
  maxConsecutiveLosses?: number | null;
  pauseAfterConsecutiveLossesMins?: number | null;

  sessionEnabled: boolean;
  sessionDays: number[];
  sessionStart?: string;
  sessionEnd?: string;

  perMarketOverride: Record<
    Market,
    {
      enabled: boolean;
      guards: RiskGuard;
      maxLotPerTrade?: number | null;
      maxTradesPerDay?: number | null;
    }
  >;

  alerts: {
    email: boolean;
    telegram: boolean;
    telegramBotToken?: string;
    telegramChatId?: string;
  };
};

export type DummyPlan = {
  id: string;
  name: string;
  category?: string;
  included_markets?: string[];
  metadata?: Record<string, any>;
  limits?: Partial<PlanInstance["limits"]>;
  executionEnabled?: boolean;
};

export type DummySubscription = {
  id: string;
  endDate?: string | null;
  executionEnabled?: boolean;
  plan: DummyPlan;
};

export type DummyAccount = {
  id: string;
  name: string;
  provider: string;
  login?: string;
  market: Market;
};
