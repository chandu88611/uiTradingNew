import { PlanInstance, PlanStrategyDef } from "./india.types";

export const dummyIndiaPlans: PlanInstance[] = [
  {
    planId: "plan_india_basic",
    planName: "India Basic",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 2, maxActiveStrategies: 1, maxDailyTrades: 20, maxLotPerTrade: 1 },
  },
  {
    planId: "plan_india_elite",
    planName: "India Elite",
    endDate: "2026-06-30T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 10, maxActiveStrategies: 3, maxDailyTrades: 200, maxLotPerTrade: 5 },
  },
];

export const dummyIndiaPlanStrategies: PlanStrategyDef[] = [
  // Basic (1 active)
  {
    id: "in_basic_swing",
    planId: "plan_india_basic",
    market: "INDIA",
    name: "Swing Builder",
    description: "Retail friendly swing entries.",
    tags: ["swing", "low-risk"],
  },
  {
    id: "in_basic_breakout",
    planId: "plan_india_basic",
    market: "INDIA",
    name: "Breakout Lite",
    description: "Breakouts with strict caps. Avoid news.",
    tags: ["breakout"],
  },

  // Elite (3 active)
  {
    id: "in_elite_swing_plus",
    planId: "plan_india_elite",
    market: "INDIA",
    name: "Swing Builder+",
    description: "Better filtering + more signals.",
    tags: ["swing"],
  },
  {
    id: "in_elite_intraday",
    planId: "plan_india_elite",
    market: "INDIA",
    name: "Intraday Momentum",
    description: "Intraday momentum. Needs max trades/day.",
    tags: ["intraday", "fast"],
  },
  {
    id: "in_elite_reversion",
    planId: "plan_india_elite",
    market: "INDIA",
    name: "Mean Reversion",
    description: "Range entries. Best in sideways markets.",
    tags: ["reversion"],
  },
];
