import React, { useState } from "react";

type Market = "equity" | "forex" | "commodities" | "crypto";

type Strategy = {
  id: number;
  name: string;
  createdBy: string;
  market: Market;
  symbol: string;
  riskLevel: "Low" | "Moderate" | "Aggressive";
  followers: number;
  roi30d: number; // in %
  roiAll: number; // in %
  winRate: number; // in %
  maxDrawdown: number; // in %
  avgTradesPerWeek: number;
  description: string;
  since: string;
};

const STRATEGIES: Strategy[] = [
  {
    id: 1,
    name: "BankNifty Mean Reversion",
    createdBy: "Tradebro Labs",
    market: "equity",
    symbol: "BANKNIFTY",
    riskLevel: "Moderate",
    followers: 142,
    roi30d: 14.2,
    roiAll: 63.5,
    winRate: 61,
    maxDrawdown: 9.8,
    avgTradesPerWeek: 18,
    description:
      "Intraday mean reversion on BankNifty futures with strict max loss and time-based exits.",
    since: "Jan 2024",
  },
  {
    id: 2,
    name: "XAUUSD London Breakout",
    createdBy: "Chandan Quant",
    market: "forex",
    symbol: "XAUUSD",
    riskLevel: "Aggressive",
    followers: 87,
    roi30d: 21.8,
    roiAll: 110.4,
    winRate: 55,
    maxDrawdown: 15.3,
    avgTradesPerWeek: 10,
    description:
      "Session breakout system on Gold with dynamic volatility filters and partial profit booking.",
    since: "Oct 2023",
  },
  {
    id: 3,
    name: "Nifty Options Premium Decay",
    createdBy: "Theta Vault",
    market: "equity",
    symbol: "NIFTY",
    riskLevel: "Low",
    followers: 204,
    roi30d: 8.9,
    roiAll: 48.1,
    winRate: 72,
    maxDrawdown: 6.4,
    avgTradesPerWeek: 8,
    description:
      "Non-directional option selling with strict margin utilisation and daily max loss guardrails.",
    since: "Jun 2023",
  },
];

const CopyTradingPage: React.FC = () => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<number>(
    STRATEGIES[0]?.id ?? 0
  );
  const [marketFilter, setMarketFilter] = useState<Market | "all">("all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | "Low" | "Moderate" | "Aggressive"
  >("all");
  const [search, setSearch] = useState("");

  const [allocationMode, setAllocationMode] = useState<
    "fixed" | "balance_percent" | "multiplier"
  >("multiplier");
  const [fixedAmount, setFixedAmount] = useState("25000");
  const [balancePercent, setBalancePercent] = useState("10");
  const [multiplier, setMultiplier] = useState("1.0");
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState("2");
  const [dailyLossLimit, setDailyLossLimit] = useState("5");
  const [maxDrawdownStop, setMaxDrawdownStop] = useState("20");
  const [slippage, setSlippage] = useState("0.5");
  const [copyNewTrades, setCopyNewTrades] = useState(true);
  const [copyOpenPositions, setCopyOpenPositions] = useState(false);
  const [allowIntraday, setAllowIntraday] = useState(true);
  const [allowOvernight, setAllowOvernight] = useState(true);

  const selectedStrategy = STRATEGIES.find((s) => s.id === selectedStrategyId);

  const filteredStrategies = STRATEGIES.filter((s) => {
    if (marketFilter !== "all" && s.market !== marketFilter) return false;
    if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
    if (
      search &&
      !`${s.name} ${s.symbol} ${s.createdBy}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50">
      {/* Page container */}
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
              Copy Trading
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Mirror pro strategies with your own risk guardrails
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Choose a strategy, configure allocation & risk limits, and let
              Tradebro execute trades automatically in your linked broker
              accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/80">
                Live followers
              </p>
              <p className="text-sm font-semibold">430+</p>
            </div>
            <div className="rounded-2xl border border-slate-500/40 bg-slate-900/60 px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Avg. 30D ROI
              </p>
              <p className="text-sm font-semibold text-emerald-300">+12.9%</p>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
          {/* Left: strategy list + filters */}
          <section className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap gap-3">
                <div className="flex flex-col text-xs text-slate-400">
                  <span className="mb-1 text-[11px] uppercase tracking-[0.16em]">
                    Market
                  </span>
                  <div className="inline-flex rounded-full bg-slate-900/70 p-1 text-[11px] sm:text-xs">
                    {[
                      { key: "all", label: "All" },
                      { key: "equity", label: "Equity & F&O" },
                      { key: "forex", label: "Forex" },
                      { key: "commodities", label: "Commodities" },
                      { key: "crypto", label: "Crypto" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setMarketFilter(item.key as Market | "all")
                        }
                        className={`rounded-full px-3 py-1 transition ${
                          marketFilter === item.key
                            ? "bg-emerald-500 text-black"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col text-xs text-slate-400">
                  <span className="mb-1 text-[11px] uppercase tracking-[0.16em]">
                    Risk
                  </span>
                  <select
                    value={riskFilter}
                    onChange={(e) =>
                      setRiskFilter(
                        e.target.value as "all" | "Low" | "Moderate" | "Aggressive"
                      )
                    }
                    className="w-36 rounded-xl border border-slate-600/60 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none ring-emerald-500/50 focus:ring-1"
                  >
                    <option value="all">All profiles</option>
                    <option value="Low">Low risk</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="w-full sm:w-64">
                <div className="relative text-xs">
                  <input
                    type="text"
                    placeholder="Search by name / symbol / creator…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full border border-slate-600/70 bg-slate-950/80 px-9 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none ring-emerald-500/50 focus:ring-1"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    🔍
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy list */}
            <div className="space-y-3">
              {filteredStrategies.map((strategy) => {
                const isSelected = strategy.id === selectedStrategyId;
                return (
                  <button
                    key={strategy.id}
                    type="button"
                    onClick={() => setSelectedStrategyId(strategy.id)}
                    className={`w-full rounded-2xl border bg-gradient-to-r p-4 text-left transition hover:-translate-y-[1px] hover:shadow-lg hover:shadow-emerald-500/10 ${
                      isSelected
                        ? "border-emerald-500/80 from-[#071b18] via-[#050b14] to-[#050810]"
                        : "border-white/5 from-[#050810] via-[#050810] to-[#050810]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white sm:text-base">
                            {strategy.name}
                          </p>
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            {strategy.symbol}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          by <span className="text-slate-200">{strategy.createdBy}</span>{" "}
                          • {strategy.market === "equity" && "Equity & F&O"}
                          {strategy.market === "forex" && "Forex"}
                          {strategy.market === "commodities" && "Commodities"}
                          {strategy.market === "crypto" && "Crypto"} • since{" "}
                          {strategy.since}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            strategy.riskLevel === "Low"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : strategy.riskLevel === "Moderate"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              strategy.riskLevel === "Low"
                                ? "bg-emerald-400"
                                : strategy.riskLevel === "Moderate"
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                          />
                          {strategy.riskLevel} risk
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {strategy.followers.toLocaleString()} followers
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-300 sm:grid-cols-4">
                      <MetricPill
                        label="30D ROI"
                        value={`${strategy.roi30d.toFixed(1)}%`}
                        accent="positive"
                      />
                      <MetricPill
                        label="All-time ROI"
                        value={`${strategy.roiAll.toFixed(1)}%`}
                        accent="positive"
                      />
                      <MetricPill
                        label="Win rate"
                        value={`${strategy.winRate.toFixed(0)}%`}
                        accent="neutral"
                      />
                      <MetricPill
                        label="Max drawdown"
                        value={`-${strategy.maxDrawdown.toFixed(1)}%`}
                        accent="negative"
                      />
                    </div>
                  </button>
                );
              })}

              {filteredStrategies.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-600/40 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-400">
                  No strategies match your filters. Try changing market or risk
                  profile.
                </div>
              )}
            </div>
          </section>

          {/* Right: selected strategy + copy settings */}
          <section className="space-y-4">
            {/* Selected strategy summary */}
            <div className="rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5">
              {selectedStrategy ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
                        Selected strategy
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">
                        {selectedStrategy.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        {selectedStrategy.description}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 px-3 py-2 text-right text-xs">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        30D ROI
                      </p>
                      <p className="text-sm font-semibold text-emerald-300">
                        +{selectedStrategy.roi30d.toFixed(1)}%
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Max DD {selectedStrategy.maxDrawdown.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-300 sm:grid-cols-4">
                    <MetricPill
                      label="Avg trades / week"
                      value={selectedStrategy.avgTradesPerWeek.toString()}
                      accent="neutral"
                    />
                    <MetricPill
                      label="Followers"
                      value={selectedStrategy.followers.toString()}
                      accent="neutral"
                    />
                    <MetricPill
                      label="Win rate"
                      value={`${selectedStrategy.winRate.toFixed(0)}%`}
                      accent="positive"
                    />
                    <MetricPill
                      label="Since"
                      value={selectedStrategy.since}
                      accent="neutral"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  Select a strategy on the left to see details and configure copy
                  settings.
                </p>
              )}
            </div>

            {/* Copy settings */}
            <div className="space-y-4 rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
                    Copy settings
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    These limits apply only to your account. Strategy owner cannot
                    override them.
                  </p>
                </div>
                <button className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500 hover:text-black">
                  Reset to safe
                </button>
              </div>

              {/* Allocation mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <p className="font-medium text-slate-100">Allocation mode</p>
                  <p className="text-[11px] text-slate-400">
                    Broker balance: <span className="text-emerald-300">₹ 2,50,000</span>
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <AllocationPill
                    label="Fixed capital"
                    description="Use a fixed rupee amount per trade."
                    active={allocationMode === "fixed"}
                    onClick={() => setAllocationMode("fixed")}
                  />
                  <AllocationPill
                    label="Balance %"
                    description="Risk a fixed percent of balance."
                    active={allocationMode === "balance_percent"}
                    onClick={() => setAllocationMode("balance_percent")}
                  />
                  <AllocationPill
                    label="Lot multiplier"
                    description="Mirror master size with a multiplier."
                    active={allocationMode === "multiplier"}
                    onClick={() => setAllocationMode("multiplier")}
                  />
                </div>

                {/* Allocation inputs */}
                <div className="mt-2 grid gap-3 text-xs sm:grid-cols-2">
                  {allocationMode === "fixed" && (
                    <LabeledInput
                      label="Capital per trade (₹)"
                      value={fixedAmount}
                      onChange={setFixedAmount}
                      suffix="INR"
                    />
                  )}
                  {allocationMode === "balance_percent" && (
                    <LabeledInput
                      label="Percent of balance per trade"
                      value={balancePercent}
                      onChange={setBalancePercent}
                      suffix="%"
                    />
                  )}
                  {allocationMode === "multiplier" && (
                    <LabeledInput
                      label="Lot multiplier vs master"
                      value={multiplier}
                      onChange={setMultiplier}
                      suffix="x"
                    />
                  )}

                  <LabeledInput
                    label="Max risk per trade"
                    helper="If SL is hit, loss will not exceed this % of balance."
                    value={maxRiskPerTrade}
                    onChange={setMaxRiskPerTrade}
                    suffix="%"
                  />
                </div>
              </div>

              {/* Advanced guards */}
              <div className="space-y-3 border-t border-white/5 pt-3 text-xs">
                <p className="font-medium text-slate-100">Risk guardrails</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="Daily loss limit"
                    helper="Copy trading stops for the day once this loss is breached."
                    value={dailyLossLimit}
                    onChange={setDailyLossLimit}
                    suffix="%"
                  />
                  <LabeledInput
                    label="Max account drawdown"
                    helper="Auto-pause strategy if equity falls by this % from peak."
                    value={maxDrawdownStop}
                    onChange={setMaxDrawdownStop}
                    suffix="%"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="Max allowed slippage"
                    helper="If execution price deviates more than this, trade is skipped."
                    value={slippage}
                    onChange={setSlippage}
                    suffix="%"
                  />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-100">
                      Trade types to copy
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip
                        label="Intraday"
                        active={allowIntraday}
                        onClick={() => setAllowIntraday((v) => !v)}
                      />
                      <ToggleChip
                        label="Overnight / positional"
                        active={allowOvernight}
                        onClick={() => setAllowOvernight((v) => !v)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution behaviour */}
              <div className="space-y-3 border-t border-white/5 pt-3 text-xs">
                <p className="font-medium text-slate-100">Execution behaviour</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckboxRow
                    label="Copy all new trades automatically"
                    description="As soon as the master enters, your account mirrors the trade using your allocation rules."
                    checked={copyNewTrades}
                    onChange={setCopyNewTrades}
                  />
                  <CheckboxRow
                    label="Also sync current open positions"
                    description="On enabling, existing open positions of the strategy will be replicated."
                    checked={copyOpenPositions}
                    onChange={setCopyOpenPositions}
                  />
                </div>
              </div>

              {/* Action button */}
              <div className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-slate-400">
                  <p>
                    You can pause copy trading anytime from{" "}
                    <span className="text-emerald-300">My Portfolio → Strategies</span>.
                  </p>
                  <p className="mt-1">
                    By continuing, you agree that market risks are fully borne by you.
                  </p>
                </div>

                <button className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 sm:mt-0">
                  Enable copy trading
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- Small UI helpers ---------------------------- */

type MetricPillProps = {
  label: string;
  value: string;
  accent?: "positive" | "negative" | "neutral";
};

const MetricPill: React.FC<MetricPillProps> = ({ label, value, accent }) => {
  const accentClass =
    accent === "positive"
      ? "text-emerald-300"
      : accent === "negative"
      ? "text-red-300"
      : "text-slate-100";

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xs font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
};

type AllocationPillProps = {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
};

const AllocationPill: React.FC<AllocationPillProps> = ({
  label,
  description,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-full flex-col rounded-2xl border px-3 py-2 text-left text-xs transition ${
      active
        ? "border-emerald-500/80 bg-emerald-500/5 shadow shadow-emerald-500/40"
        : "border-slate-700/60 bg-slate-950/60 hover:border-emerald-500/60 hover:bg-slate-900"
    }`}
  >
    <span className="text-[11px] font-semibold text-slate-100">{label}</span>
    <span className="mt-1 text-[11px] text-slate-400">{description}</span>
  </button>
);

type LabeledInputProps = {
  label: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
};

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  helper,
  value,
  onChange,
  suffix,
}) => (
  <div className="space-y-1">
    <p className="text-xs font-medium text-slate-100">{label}</p>
    <div className="flex items-center rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-100 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/40">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-full bg-transparent text-xs outline-none"
        inputMode="decimal"
      />
      {suffix && (
        <span className="ml-2 text-[11px] text-slate-400">{suffix}</span>
      )}
    </div>
    {helper && <p className="text-[11px] text-slate-500">{helper}</p>}
  </div>
);

type ToggleChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const ToggleChip: React.FC<ToggleChipProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-[11px] transition ${
      active
        ? "border-emerald-500/80 bg-emerald-500/15 text-emerald-100"
        : "border-slate-700/70 bg-slate-950 text-slate-300 hover:border-emerald-500/60"
    }`}
  >
    {label}
  </button>
);

type CheckboxRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

const CheckboxRow: React.FC<CheckboxRowProps> = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-start gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-left hover:border-emerald-500/70"
  >
    <div
      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-[6px] border text-[10px] ${
        checked
          ? "border-emerald-500 bg-emerald-500 text-black"
          : "border-slate-500 bg-transparent text-transparent"
      }`}
    >
      ✓
    </div>
    <div className="text-xs">
      <p className="font-medium text-slate-100">{label}</p>
      {description && (
        <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  </button>
);

export default CopyTradingPage;
