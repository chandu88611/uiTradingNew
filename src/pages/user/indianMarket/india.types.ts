export type Market = "INDIA";
export type StrategySource = "PLATFORM" | "TRADINGVIEW";

export type PlanInstance = {
  planId: string;
  planName: string;
  endDate?: string | null;
  executionAllowed: boolean;

  limits: {
    maxConnectedAccounts?: number;
    maxActiveStrategies?: number; // if 1 => choose any one
    maxDailyTrades?: number;
    maxLotPerTrade?: number;
  };
};

export type PlanStrategyDef = {
  id: string;
  planId: string;
  market: Market;
  name: string;
  description: string;
  tags?: string[];
};

export type StrategySelections = Record<string /* planId */, string[] /* enabled strategy ids */>;

export type PlanSignalSettings = Record<
  string /* planId */,
  {
    strategiesEnabled: boolean;
    webhookEnabled: boolean;

    webhookSecret?: string;
    webhookDefaultAccountId?: string;

    // optional (later): rate-limit / de-dupe etc.
  }
>;
