export type Market = "FOREX";

export type ForexPlanInstance = {
  planId: string;
  planName: string;
  endDate?: string | null;
  executionAllowed: boolean;

  limits: {
    maxConnectedAccounts?: number;
    maxActiveStrategies?: number; // if 1 => choose only one
    maxDailyTrades?: number;
    maxLotPerTrade?: number;
  };
};

export type ForexPlanStrategyDef = {
  id: string;
  planId: string;
  market: Market;
  name: string;
  description: string;
  tags?: string[];
};

export type ForexStrategySelections = Record<string /* planId */, string[] /* enabled strategy ids */>;

export type ForexPlanSignalSettings = Record<
  string /* planId */,
  {
    strategiesEnabled: boolean;
    webhookEnabled: boolean;

    webhookSecret?: string;
    webhookDefaultAccountId?: string;
  }
>;

export type ForexAccountRowLite = {
  id: number | string;
  forexType?: string;
  forexTraderUserId?: string;
  isMaster?: boolean;
};
