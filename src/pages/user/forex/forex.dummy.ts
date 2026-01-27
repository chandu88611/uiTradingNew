import { ForexPlanInstance, ForexPlanStrategyDef } from "./forex.types";

export const dummyForexPlans: ForexPlanInstance[] = [
  {
    planId: "fx_basic",
    planName: "Forex Basic",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 2, maxActiveStrategies: 1, maxDailyTrades: 50, maxLotPerTrade: 1 },
  },
  {
    planId: "fx_pro",
    planName: "Forex Pro",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 5, maxActiveStrategies: 2, maxDailyTrades: 200, maxLotPerTrade: 3 },
  },
  {
    planId: "fx_elite",
    planName: "Forex Elite",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 10, maxActiveStrategies: 4, maxDailyTrades: 500, maxLotPerTrade: 10 },
  },
];

export const dummyForexPlanStrategies: ForexPlanStrategyDef[] = [
  // Basic (1 active)
  {
    id: "fx_basic_breakout",
    planId: "fx_basic",
    market: "FOREX",
    name: "Breakout Lite",
    description: "Simple breakout entries with conservative filters.",
    tags: ["breakout", "safe"],
  },
  {
    id: "fx_basic_reversion",
    planId: "fx_basic",
    market: "FOREX",
    name: "Mean Reversion Lite",
    description: "Range/reversion entries with tight risk.",
    tags: ["reversion"],
  },

  // Pro (2 active)
  {
    id: "fx_pro_momentum",
    planId: "fx_pro",
    market: "FOREX",
    name: "Momentum Pro",
    description: "Trend continuation momentum entries.",
    tags: ["trend", "momentum"],
  },
  {
    id: "fx_pro_scalp",
    planId: "fx_pro",
    market: "FOREX",
    name: "Scalp Pro",
    description: "Fast scalps. Needs max trades/day protection.",
    tags: ["scalp", "fast"],
  },
  {
    id: "fx_pro_reversion",
    planId: "fx_pro",
    market: "FOREX",
    name: "Reversion Pro",
    description: "Better sideways detection and entries.",
    tags: ["reversion"],
  },

  // Elite (4 active)
  {
    id: "fx_elite_smarttrend",
    planId: "fx_elite",
    market: "FOREX",
    name: "Smart Trend",
    description: "Adaptive trend entries across sessions.",
    tags: ["trend"],
  },
  {
    id: "fx_elite_newsfilter",
    planId: "fx_elite",
    market: "FOREX",
    name: "News Filter Guard",
    description: "Avoid trades around high-impact windows.",
    tags: ["guard"],
  },
  {
    id: "fx_elite_scalp",
    planId: "fx_elite",
    market: "FOREX",
    name: "Elite Scalp",
    description: "Higher frequency scalps (use strict limits).",
    tags: ["scalp"],
  },
  {
    id: "fx_elite_reversion",
    planId: "fx_elite",
    market: "FOREX",
    name: "Elite Reversion",
    description: "Mean reversion with volatility bands.",
    tags: ["reversion"],
  },
];
