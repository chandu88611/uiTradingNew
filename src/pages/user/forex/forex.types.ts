export type Market = "FOREX";
export type TvActionMode = "AUTO" | "BUY" | "SELL";
export type TvTemplateMode = "STRATEGY" | "MANUAL";
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
      tvTemplateMode?: TvTemplateMode; // STRATEGY uses TV placeholders, MANUAL is fixed
  tvActionMode?: TvActionMode; 
  }
>;

export type ForexAccountRowLite = {
  id: number | string;
  forexType?: string;
  forexTraderUserId?: string;
  isMaster?: boolean;
};



export type TvAlertSource = "STRATEGY" | "INDICATOR";
export type IndicatorActionSource = "PLOT" | "MANUAL";
 
/**
 * This is the per-plan saved config structure.
 * If you already have ForexPlanSignalSettings, replace its value type with this.
 */
export type ForexPlanSignalConfig = {
  // existing fields you already use
  strategiesEnabled: boolean;
  webhookEnabled: boolean;
  webhookSecret?: string;
  webhookDefaultAccountId?: string;

  // ✅ NEW: strategy vs indicator
  tvAlertSource?: TvAlertSource;

  /**
   * INDICATOR mode:
   * - PLOT: uses action_code="{{plot_0}}" (backend maps 1=buy, -1=sell)
   * - MANUAL: uses action="buy"/"sell" based on tvActionMode
   */
  tvIndicatorActionSource?: IndicatorActionSource;

  // Manual action selection (used only in INDICATOR+MANUAL)
  tvActionMode?: TvActionMode;

  // Custom overrides
  tvUseCustomQty?: boolean;
  tvCustomQty?: string;

  tvUseCustomSl?: boolean;
  tvCustomSl?: string;

  tvUseCustomTp?: boolean;
  tvCustomTp?: string;

  tvUseCustomTrailingSl?: boolean;
  tvCustomTrailingSl?: string;

  // Edging flags
  tvEdgingEnabled?: boolean;
  tvCloseOpposite?: boolean;
};

 
