import { DummyAccount, DummySubscription, PlanStrategyDef } from "./types";

export const dummySubscriptions: DummySubscription[] = [
  {
    id: "sub_1",
    endDate: "2026-12-31T23:59:59Z",
    executionEnabled: true,
    plan: {
      id: "plan_fx_pro",
      name: "Pro Forex",
      category: "FOREX",
      executionEnabled: true,
      limits: {
        maxConnectedAccounts: 3,
        maxActiveStrategies: 1, // ✅ "choose any one"
        maxDailyTrades: 40,
        maxLotPerTrade: 2,
      },
    },
  },
  {
    id: "sub_2",
    endDate: "2026-06-30T23:59:59Z",
    executionEnabled: true,
    plan: {
      id: "plan_fx_elite",
      name: "Elite Forex",
      category: "FOREX",
      executionEnabled: true,
      limits: {
        maxConnectedAccounts: 6,
        maxActiveStrategies: 3, // ✅ allow multiple
        maxDailyTrades: 120,
        maxLotPerTrade: 5,
      },
    },
  },
  {
    id: "sub_3",
    endDate: "2026-05-15T23:59:59Z",
    executionEnabled: false,
    plan: {
      id: "plan_india_basic",
      name: "India Basic",
      category: "INDIA",
      executionEnabled: false,
      limits: {
        maxConnectedAccounts: 1,
        maxActiveStrategies: 1,
        maxDailyTrades: 10,
        maxLotPerTrade: 1,
      },
    },
  },
  {
    id: "sub_4",
    endDate: "2026-10-01T23:59:59Z",
    executionEnabled: true,
    plan: {
      id: "plan_bundle_all",
      name: "Bundle All",
      category: "BUNDLE",
      included_markets: ["FOREX", "INDIA", "CRYPTO", "COPY"],
      metadata: { tier: "bundle", includes: "multi" },
      executionEnabled: true,
      limits: {
        maxConnectedAccounts: 10,
        maxActiveStrategies: 5,
        maxDailyTrades: 200,
        maxLotPerTrade: 10,
      },
    },
  },
];

export const dummyAccounts: DummyAccount[] = [
  { id: "acc_fx_1", name: "ICMarkets MT5", provider: "MT5", login: "123456", market: "FOREX" },
  { id: "acc_fx_2", name: "Pepperstone cTrader", provider: "cTrader", login: "CT-8891", market: "FOREX" },
  { id: "acc_in_1", name: "Zerodha Kite", provider: "Kite", login: "ABCD12", market: "INDIA" },
  { id: "acc_cr_1", name: "Binance Futures", provider: "Binance", login: "key-****", market: "CRYPTO" },
  { id: "acc_cp_1", name: "Copy Master #1", provider: "Copy", login: "master-001", market: "COPY" },
];

/** ✅ Strategies shipped by each plan. User can only enable/disable these. */
export const dummyPlanStrategies: PlanStrategyDef[] = [
  // Pro Forex (1 active at a time)
  {
    id: "fx_pro_trend",
    planId: "plan_fx_pro",
    market: "FOREX",
    name: "Trend Rider",
    description: "Trend confirmation + strict caps. Safe default.",
    riskHint: "Recommended with daily loss guard + cooldown",
    tags: ["trend", "safe"],
  },
  {
    id: "fx_pro_breakout",
    planId: "plan_fx_pro",
    market: "FOREX",
    name: "Breakout Hunter",
    description: "Captures volatility expansions. Needs strict risk rules.",
    riskHint: "Use low lot + max trades/day",
    tags: ["breakout", "volatile"],
  },

  // Elite Forex (up to 3)
  {
    id: "fx_elite_trend_plus",
    planId: "plan_fx_elite",
    market: "FOREX",
    name: "Trend Rider+",
    description: "Trend system with multi-timeframe filter.",
    tags: ["trend"],
  },
  {
    id: "fx_elite_scalp",
    planId: "plan_fx_elite",
    market: "FOREX",
    name: "Scalp Engine",
    description: "Fast entries, higher frequency. Use cooldown + max trades.",
    tags: ["scalp", "fast"],
  },
  {
    id: "fx_elite_reversion",
    planId: "plan_fx_elite",
    market: "FOREX",
    name: "Mean Reversion",
    description: "Range trades. Avoid news times.",
    tags: ["reversion"],
  },

  // India Basic
  {
    id: "in_basic_swing",
    planId: "plan_india_basic",
    market: "INDIA",
    name: "Swing Builder",
    description: "Low frequency swing entries for NSE/BSE.",
    tags: ["swing"],
  },

  // Bundle (example: per market)
  {
    id: "bundle_crypto_grid",
    planId: "plan_bundle_all",
    market: "CRYPTO",
    name: "Grid Bot",
    description: "Range grid strategy. Works best in sideways markets.",
    tags: ["grid"],
  },
  {
    id: "bundle_copy_guarded",
    planId: "plan_bundle_all",
    market: "COPY",
    name: "Guarded Copy",
    description: "Copies with strict max loss/day and position caps.",
    tags: ["copy", "risk"],
  },
];
