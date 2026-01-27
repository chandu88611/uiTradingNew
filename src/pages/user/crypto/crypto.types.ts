export type Market = "CRYPTO";

export type CryptoPlanInstance = {
  planId: string;
  planName: string;
  endDate?: string | null;
  executionAllowed: boolean;

  limits: {
    maxConnectedAccounts?: number;
    maxActiveStrategies?: number;
    maxDailyTrades?: number;
    maxLotPerTrade?: number; // for crypto treat as "max size" later
  };
};

export type CryptoPlanStrategyDef = {
  id: string;
  planId: string;
  market: Market;
  name: string;
  description: string;
  tags?: string[];
};

export type CryptoStrategySelections = Record<string /* planId */, string[] /* enabled strategy ids */>;

export type CryptoPlanSignalSettings = Record<
  string /* planId */,
  {
    strategiesEnabled: boolean;
    webhookEnabled: boolean;

    webhookSecret?: string;
    webhookDefaultAccountId?: string;
  }
>;
