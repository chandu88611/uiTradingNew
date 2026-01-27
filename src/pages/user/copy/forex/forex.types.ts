// src/pages/copytrading/forex/forex.types.ts
export type ForexAccountType = "MT5" | "CTRADER";

export type ForexCopyAccount = {
  id: number;
  type: ForexAccountType;
  label: string; // UI label (e.g. "Main MT5")
  enabled: boolean;
  isMaster: boolean; // trader only (follower is always child)
  userId: string; // MT5 login id OR cTrader account id
  hasToken?: boolean; // cTrader token presence
  createdAt: string;
  updatedAt: string;
};

export type ForexCopyPlanInstance = {
  planId: string;
  planName: string;
  tier: "FREE" | "PRO" | "ELITE";
  executionAllowed: boolean;
  limits: {
    maxConnectedAccounts: number;
    maxActiveStrategies: number;
    maxDailyTrades: number;
    maxLotPerTrade: number;
  };
  webhook: {
    endpointUrl: string;
    secretMasked: string;
  };
};

export type ForexPlanSignalSettings = Record<
  string,
  { strategiesEnabled: boolean; webhookEnabled: boolean }
>;

export type ForexStrategyDef = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  risk: "LOW" | "MEDIUM" | "HIGH";
};

export type ForexPlanStrategies = Record<string, ForexStrategyDef[]>;

export type ForexStrategySelections = Record<string, string[]>; // planId -> strategyIds

export type ForexSafetySettings = Record<
  string,
  {
    pauseEnabled: boolean;
    pauseUntil?: string; // ISO

    maxLossPerDay: number; // currency
    minProfitPerDay: number;

    maxDailyTrades: number;
    maxOpenPositions: number;
    maxLotPerTrade: number;

    killSwitch: boolean; // disable all executions quickly
  }
>;

export type ForexFollowerLinkState = {
  traderCode: string;
  status: "NONE" | "PENDING" | "CONNECTED";
};

export type ForexCopySettings = {
  multiplier: number; // 1x, 0.5x etc
  maxSlippagePips: number;
  perTradeRiskCap: number; // currency
  pauseCopy: boolean;
};
