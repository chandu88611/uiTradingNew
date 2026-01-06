import React, { useMemo, useState } from "react";

type Timeframe = "today" | "week" | "month";

type Trade = {
  id: string;
  timestamp: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  broker: string;
  strategy: string;
  pnl: number;
};

type Position = {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  qty: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
};

type Strategy = {
  id: string;
  name: string;
  status: "active" | "paused";
  signalsToday: number;
  winRate: number;
};

type BrokerAccount = {
  id: string;
  broker: string;
  accountId: string;
  balance: number;
  marginUsed: number;
  status: "connected" | "error" | "expired";
};

type PnlPoint = {
  timeLabel: string;
  value: number;
};

/** ---------- DEMO DATA ---------- **/

const now = new Date();

const mockPnlSeries: Record<Timeframe, PnlPoint[]> = {
  today: [
    { timeLabel: "09:30", value: 0 },
    { timeLabel: "10:00", value: 1200 },
    { timeLabel: "10:30", value: 800 },
    { timeLabel: "11:00", value: 2000 },
    { timeLabel: "11:30", value: 1500 },
    { timeLabel: "12:00", value: 2600 },
  ],
  week: [
    { timeLabel: "Mon", value: 500 },
    { timeLabel: "Tue", value: -300 },
    { timeLabel: "Wed", value: 2100 },
    { timeLabel: "Thu", value: 1800 },
    { timeLabel: "Fri", value: 3200 },
  ],
  month: [
    { timeLabel: "W1", value: -800 },
    { timeLabel: "W2", value: 1200 },
    { timeLabel: "W3", value: 3400 },
    { timeLabel: "W4", value: 5100 },
  ],
};

const mockTrades: Trade[] = [
  {
    id: "T1",
    timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    symbol: "NSE:RELIANCE",
    side: "BUY",
    qty: 50,
    price: 2950,
    broker: "Dhan",
    strategy: "Opening Range Breakout",
    pnl: 850,
  },
  {
    id: "T2",
    timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    symbol: "NSE:NIFTY24APRFUT",
    side: "SELL",
    qty: 75,
    price: 22650,
    broker: "Angel One",
    strategy: "Index Scalper",
    pnl: -300,
  },
  {
    id: "T3",
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    symbol: "NSE:BANKNIFTY24APR48000CE",
    side: "BUY",
    qty: 40,
    price: 185,
    broker: "Zerodha",
    strategy: "Options Trend Follower",
    pnl: 1200,
  },
  {
    id: "T4",
    timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
    symbol: "MCX:GOLDM",
    side: "SELL",
    qty: 10,
    price: 76000,
    broker: "Motilal Oswal",
    strategy: "Commodity Swing",
    pnl: 500,
  },
];

const mockPositions: Position[] = [
  {
    id: "P1",
    symbol: "NSE:RELIANCE",
    side: "LONG",
    qty: 50,
    avgPrice: 2900,
    currentPrice: 2955,
    unrealizedPnl: 2750,
  },
  {
    id: "P2",
    symbol: "NSE:NIFTY24APRFUT",
    side: "SHORT",
    qty: 25,
    avgPrice: 22720,
    currentPrice: 22680,
    unrealizedPnl: 1000,
  },
];

const mockStrategies: Strategy[] = [
  {
    id: "S1",
    name: "Opening Range Breakout",
    status: "active",
    signalsToday: 12,
    winRate: 71,
  },
  {
    id: "S2",
    name: "Index Scalper",
    status: "paused",
    signalsToday: 5,
    winRate: 60,
  },
  {
    id: "S3",
    name: "Options Trend Follower",
    status: "active",
    signalsToday: 8,
    winRate: 64,
  },
];

const mockAccounts: BrokerAccount[] = [
  {
    id: "B1",
    broker: "Motilal Oswal",
    accountId: "MO-12345",
    balance: 150000,
    marginUsed: 45000,
    status: "connected",
  },
  {
    id: "B2",
    broker: "Zerodha",
    accountId: "ZD-88721",
    balance: 85000,
    marginUsed: 25000,
    status: "connected",
  },
  {
    id: "B3",
    broker: "Dhan",
    accountId: "DH-55102",
    balance: 45000,
    marginUsed: 5000,
    status: "expired",
  },
];

/** ---------- SMALL UTILITIES ---------- **/

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "–";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function withinTimeframe(ts: string, tf: Timeframe): boolean {
  const d = new Date(ts);
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (tf === "today") return d.toDateString() === now.toDateString();
  if (tf === "week") return diffHours <= 24 * 7;
  return diffHours <= 24 * 30;
}

/** ---------- SPARKLINE COMPONENT ---------- **/

const PnlSparkline: React.FC<{ data: PnlPoint[] }> = ({ data }) => {
  if (!data.length) return null;

  const width = 260;
  const height = 80;
  const paddingX = 8;
  const paddingY = 8;

  const xs = data.map((_, i) =>
    paddingX + (i * (width - 2 * paddingX)) / Math.max(data.length - 1, 1)
  );
  const ys = (() => {
    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal === minVal ? 1 : maxVal - minVal;

    return values.map(
      (v) =>
        height - paddingY - ((v - minVal) * (height - 2 * paddingY)) / range
    );
  })();

  const pathD = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-20 text-emerald-400"
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {xs.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={ys[i]}
          r={2.5}
          className="fill-current"
        />
      ))}
    </svg>
  );
};

/** ---------- MAIN DASHBOARD COMPONENT ---------- **/

const UserDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [showOnlyProfitable, setShowOnlyProfitable] = useState(false);

  const filteredTrades = useMemo(
    () => mockTrades.filter((t) => withinTimeframe(t.timestamp, timeframe)),
    [timeframe]
  );

  const totalPnl = useMemo(
    () => filteredTrades.reduce((sum, t) => sum + t.pnl, 0),
    [filteredTrades]
  );

  const totalTrades = filteredTrades.length;

  const winRate = useMemo(() => {
    if (!filteredTrades.length) return 0;
    const wins = filteredTrades.filter((t) => t.pnl > 0).length;
    return Math.round((wins / filteredTrades.length) * 100);
  }, [filteredTrades]);

  const runningPositions = mockPositions.length;

  const activeStrategiesCount = strategies.filter(
    (s) => s.status === "active"
  ).length;

  const filteredTradesForTable = useMemo(() => {
    if (!showOnlyProfitable) return filteredTrades;
    return filteredTrades.filter((t) => t.pnl > 0);
  }, [filteredTrades, showOnlyProfitable]);

  const handleStrategyToggle = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === "active" ? "paused" : "active",
            }
          : s
      )
    );
  };

  const pnlSeries = mockPnlSeries[timeframe];

  return (
    <div className="min-h-screen px-6   bg-slate-950 text-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-1">
            Trading Dashboard
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Welcome back, Trader 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live overview of your copy trading performance & risk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Master Stream Status */}
          <div className="flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-3 py-1.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">
              Master Stream: <span className="text-emerald-400">Connected</span>
            </span>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center rounded-full bg-slate-900/70 border border-slate-800 p-1 text-xs">
            {(["today", "week", "month"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full capitalize transition ${
                  timeframe === tf
                    ? "bg-emerald-400 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {tf === "today"
                  ? "Today"
                  : tf === "week"
                  ? "This Week"
                  : "This Month"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        {/* Total P&L */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-emerald-500/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Net P&L ({timeframe === "today"
                ? "Today"
                : timeframe === "week"
                ? "This Week"
                : "This Month"}
              )
            </p>
            <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-300/80 bg-emerald-500/10 rounded-full px-2 py-0.5">
              Live
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <p
              className={`text-2xl font-semibold ${
                totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatPnl(totalPnl)}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            From {filteredTrades.length} closed trades
          </p>
          <div className="mt-4">
            <PnlSparkline data={pnlSeries} />
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">
            Win Rate
          </p>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-2xl font-semibold text-emerald-400">
              {winRate}%
            </p>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                style={{ width: `${Math.min(winRate, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {winRate >= 60
                ? "Good edge. Keep your risk under control."
                : "Focus on refining entries & exits."}
            </p>
          </div>
        </div>

        {/* Total Trades */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">
            Total Trades
          </p>
          <p className="text-2xl font-semibold text-slate-100">
            {totalTrades}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Executed in this timeframe across all brokers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="rounded-full bg-slate-800 px-2 py-1">
              Active strategies:{" "}
              <span className="text-emerald-400 font-medium">
                {activeStrategiesCount}
              </span>
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-1">
              Brokers:{" "}
              <span className="text-emerald-400 font-medium">
                {mockAccounts.length}
              </span>
            </span>
          </div>
        </div>

        {/* Positions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-medium text-slate-400 mb-1">
            Running Positions
          </p>
          <p className="text-2xl font-semibold text-slate-100">
            {runningPositions}
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            {mockPositions.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.symbol}{" "}
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      p.side === "LONG"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {p.side}
                  </span>
                </span>
                <span
                  className={`font-medium ${
                    p.unrealizedPnl >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatPnl(p.unrealizedPnl)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Middle: Strategies + Brokers */}
      <div className="grid gap-4 lg:grid-cols-5 mb-6">
        {/* Strategies */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.15em] mb-1">
                Strategies
              </p>
              <h2 className="text-sm font-semibold text-slate-100">
                Live Strategy Control
              </h2>
            </div>
            <div className="text-[11px] text-slate-400">
              Active:{" "}
              <span className="text-emerald-400 font-semibold">
                {activeStrategiesCount}
              </span>
              {" / "}
              {strategies.length}
            </div>
          </div>

          <div className="space-y-3">
            {strategies.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Signals today:{" "}
                    <span className="font-semibold text-slate-200">
                      {s.signalsToday}
                    </span>{" "}
                    • Win rate:{" "}
                    <span className="font-semibold text-emerald-400">
                      {s.winRate}%
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1 text-[11px] ${
                      s.status === "active"
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        s.status === "active"
                          ? "bg-emerald-400"
                          : "bg-slate-500"
                      }`}
                    />
                    {s.status === "active" ? "Running" : "Paused"}
                  </span>
                  <button
                    onClick={() => handleStrategyToggle(s.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      s.status === "active"
                        ? "bg-emerald-400/90"
                        : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition ${
                        s.status === "active"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Broker Accounts */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.15em] mb-1">
                Accounts
              </p>
              <h2 className="text-sm font-semibold text-slate-100">
                Connected Brokers
              </h2>
            </div>
            <button className="text-[11px] rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300 hover:bg-emerald-500/20 transition">
              + Add Account
            </button>
          </div>

          <div className="space-y-3">
            {mockAccounts.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {a.broker}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {a.accountId}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      a.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : a.status === "expired"
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {a.status === "connected"
                      ? "Connected"
                      : a.status === "expired"
                      ? "Session Expired"
                      : "Error"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                  <span>
                    Balance:{" "}
                    <span className="font-semibold text-slate-100">
                      {formatCurrency(a.balance)}
                    </span>
                  </span>
                  <span>
                    Margin used:{" "}
                    <span className="font-semibold text-slate-100">
                      {formatCurrency(a.marginUsed)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Positions + Trades */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Positions Detailed */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Open Positions
            </h2>
            <span className="text-[11px] text-slate-400">
              MTM auto-refresh (demo)
            </span>
          </div>
          <div className="space-y-3">
            {mockPositions.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {p.symbol}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Qty:{" "}
                      <span className="font-semibold text-slate-200">
                        {p.qty}
                      </span>{" "}
                      • Avg:{" "}
                      <span className="font-semibold text-slate-200">
                        {p.avgPrice}
                      </span>{" "}
                      • LTP:{" "}
                      <span className="font-semibold text-slate-200">
                        {p.currentPrice}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      p.side === "LONG"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {p.side}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Unrealized P&L:
                  </span>
                  <span
                    className={`font-semibold ${
                      p.unrealizedPnl >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatPnl(p.unrealizedPnl)}
                  </span>
                </div>
              </div>
            ))}
            {mockPositions.length === 0 && (
              <p className="text-xs text-slate-500">
                No open positions right now.
              </p>
            )}
          </div>
        </div>

        {/* Trades Table */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Recent Trades
              </h2>
              <p className="text-[11px] text-slate-400">
                Filtered by timeframe & profitability (demo).
              </p>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={showOnlyProfitable}
                onChange={(e) =>
                  setShowOnlyProfitable(e.target.checked)
                }
                className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
              />
              Only profitable
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  <th className="py-2 pr-4 text-left">Time</th>
                  <th className="py-2 pr-4 text-left">Symbol</th>
                  <th className="py-2 pr-4 text-left">Side</th>
                  <th className="py-2 pr-4 text-right">Qty</th>
                  <th className="py-2 pr-4 text-right">Price</th>
                  <th className="py-2 pr-4 text-left">Broker</th>
                  <th className="py-2 pr-4 text-left">Strategy</th>
                  <th className="py-2 pl-4 text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {filteredTradesForTable.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-6 text-center text-slate-500 text-xs"
                    >
                      No trades in this filter.
                    </td>
                  </tr>
                )}
                {filteredTradesForTable.map((t) => {
                  const d = new Date(t.timestamp);
                  const timeStr = d.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-slate-900/80 hover:bg-slate-900/60 transition"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap text-slate-300">
                        {timeStr}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-slate-100">
                        {t.symbol}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.side === "BUY"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-right text-slate-200">
                        {t.qty}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-right text-slate-200">
                        {t.price.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-slate-300">
                        {t.broker}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap text-slate-300">
                        {t.strategy}
                      </td>
                      <td
                        className={`py-2 pl-4 whitespace-nowrap text-right font-semibold ${
                          t.pnl >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatPnl(t.pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
