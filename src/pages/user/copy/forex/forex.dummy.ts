// src/pages/copytrading/forex/forex.dummy.ts
import { ForexCopyPlanInstance, ForexPlanStrategies, ForexSafetySettings } from "./forex.types";

export const dummyForexPlans: ForexCopyPlanInstance[] = [
  {
    planId: "fx-pro-001",
    planName: "Forex Pro • Monthly",
    tier: "PRO",
    executionAllowed: true,
    limits: {
      maxConnectedAccounts: 3,
      maxActiveStrategies: 4,
      maxDailyTrades: 40,
      maxLotPerTrade: 2,
    },
    webhook: {
      endpointUrl: "https://api.yourapp.com/webhook/forex/fx-pro-001",
      secretMasked: "sk_live_****_PRO",
    },
  },
  {
    planId: "fx-elite-001",
    planName: "Forex Elite • Yearly",
    tier: "ELITE",
    executionAllowed: true,
    limits: {
      maxConnectedAccounts: 10,
      maxActiveStrategies: 12,
      maxDailyTrades: 200,
      maxLotPerTrade: 5,
    },
    webhook: {
      endpointUrl: "https://api.yourapp.com/webhook/forex/fx-elite-001",
      secretMasked: "sk_live_****_ELITE",
    },
  },
];

export const dummyForexPlanStrategies: ForexPlanStrategies = {
  "fx-pro-001": [
    {
      id: "pro-breakout-1",
      name: "London Breakout",
      description: "Breakout entries around London open with session filters.",
      tags: ["Session", "Breakout", "Stops"],
      risk: "MEDIUM",
    },
    {
      id: "pro-trend-1",
      name: "Trend Follow (EMA)",
      description: "Trend continuation using EMA alignment + pullback entry.",
      tags: ["Trend", "EMA", "Pullback"],
      risk: "LOW",
    },
    {
      id: "pro-scalp-1",
      name: "Scalper (Fast)",
      description: "High-frequency setup with strict slippage and spread guards.",
      tags: ["Scalp", "Fast", "Spread guard"],
      risk: "HIGH",
    },
  ],
  "fx-elite-001": [
    {
      id: "elite-grid-1",
      name: "Smart Grid (Hedged)",
      description: "Adaptive grid with exposure caps and kill-switch integration.",
      tags: ["Grid", "Caps", "Hedge"],
      risk: "HIGH",
    },
    {
      id: "elite-news-1",
      name: "News Filter Momentum",
      description: "Momentum signals with configurable news blackout windows.",
      tags: ["News", "Momentum", "Filter"],
      risk: "MEDIUM",
    },
    {
      id: "elite-mean-1",
      name: "Mean Reversion",
      description: "Reversion on extreme deviation with time-based exit rules.",
      tags: ["Mean", "Revert", "Exit rules"],
      risk: "LOW",
    },
    {
      id: "elite-trend-2",
      name: "Trend Follow (Multi-TF)",
      description: "Higher timeframe bias + lower timeframe trigger execution.",
      tags: ["Trend", "Multi-TF"],
      risk: "LOW",
    },
  ],
};

export const dummyForexSafetyDefaults: ForexSafetySettings = {
  "fx-pro-001": {
    pauseEnabled: false,
    pauseUntil: "",
    maxLossPerDay: 2500,
    minProfitPerDay: 500,
    maxDailyTrades: 40,
    maxOpenPositions: 6,
    maxLotPerTrade: 2,
    killSwitch: false,
  },
  "fx-elite-001": {
    pauseEnabled: false,
    pauseUntil: "",
    maxLossPerDay: 10000,
    minProfitPerDay: 2000,
    maxDailyTrades: 200,
    maxOpenPositions: 20,
    maxLotPerTrade: 5,
    killSwitch: false,
  },
};

export function webhookPayloadExample(planId: string) {
  return {
    planId,
    market: "FOREX",
    signal: {
      id: "tv_alert_123",
      symbol: "EURUSD",
      side: "BUY",
      orderType: "MARKET",
      lot: 0.1,
      sl: 15,
      tp: 25,
      comment: "TradingView alert",
    },
    meta: {
      sentAt: new Date().toISOString(),
      source: "TRADINGVIEW",
    },
  };
}
