import { CryptoPlanInstance, CryptoPlanStrategyDef } from "./crypto.types";

export const dummyCryptoPlans: CryptoPlanInstance[] = [
  {
    planId: "crypto_basic",
    planName: "Crypto Basic",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 2, maxActiveStrategies: 1, maxDailyTrades: 20, maxLotPerTrade: 1 },
  },
  {
    planId: "crypto_pro",
    planName: "Crypto Pro",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 5, maxActiveStrategies: 2, maxDailyTrades: 200, maxLotPerTrade: 3 },
  },
  {
    planId: "crypto_elite",
    planName: "Crypto Elite",
    endDate: "2026-12-31T23:59:59Z",
    executionAllowed: true,
    limits: { maxConnectedAccounts: 10, maxActiveStrategies: 4, maxDailyTrades: 500, maxLotPerTrade: 10 },
  },
];

export const dummyCryptoPlanStrategies: CryptoPlanStrategyDef[] = [
  // Basic (1 active)
  {
    id: "c_basic_breakout",
    planId: "crypto_basic",
    market: "CRYPTO",
    name: "Breakout Lite",
    description: "Simple breakout entries with strict caps.",
    tags: ["breakout", "safe"],
  },
  {
    id: "c_basic_reversion",
    planId: "crypto_basic",
    market: "CRYPTO",
    name: "Mean Reversion Lite",
    description: "Range entries for sideways moves.",
    tags: ["reversion"],
  },

  // Pro (2 active)
  {
    id: "c_pro_trend",
    planId: "crypto_pro",
    market: "CRYPTO",
    name: "Trend Rider",
    description: "Trend continuation + volatility filters.",
    tags: ["trend"],
  },
  {
    id: "c_pro_scalp",
    planId: "crypto_pro",
    market: "CRYPTO",
    name: "Scalp Pro",
    description: "Fast entries (use max trades/day).",
    tags: ["scalp", "fast"],
  },

  // Elite (4 active)
  {
    id: "c_elite_trend",
    planId: "crypto_elite",
    market: "CRYPTO",
    name: "Elite Trend",
    description: "Adaptive trend logic across regimes.",
    tags: ["trend"],
  },
  {
    id: "c_elite_reversion",
    planId: "crypto_elite",
    market: "CRYPTO",
    name: "Elite Reversion",
    description: "Reversion with volatility bands.",
    tags: ["reversion"],
  },
  {
    id: "c_elite_momentum",
    planId: "crypto_elite",
    market: "CRYPTO",
    name: "Momentum Burst",
    description: "Momentum burst entries + filters.",
    tags: ["momentum"],
  },
  {
    id: "c_elite_guard",
    planId: "crypto_elite",
    market: "CRYPTO",
    name: "Risk Guard",
    description: "Extra safety checks and safeguards.",
    tags: ["guard"],
  },
];
