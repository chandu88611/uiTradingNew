import React, { useState } from "react";

type Broker = "zerodha" | "dhan" | "angel" | "mt5" | "other";

type Account = {
  id: string;
  label: string;
  broker: Broker;
  tokenPresent: boolean;
  balance?: number;
};

const mockAccounts: Account[] = [
  {
    id: "1",
    label: "Zerodha – Main",
    broker: "zerodha",
    tokenPresent: true,
    balance: 250000,
  },
  {
    id: "2",
    label: "Dhan – Swing",
    broker: "dhan",
    tokenPresent: false,
    balance: 150000,
  },
];

const UserStrategyDetailPage: React.FC = () => {
  // this would come from API by id in real app
  const strategy = {
    id: "banknifty-mean-reversion",
    name: "BankNifty Mean Reversion",
    provider: "Tradebro Labs",
    riskLevel: "Moderate",
    since: "Jan 2024",
    followers: 132,
    roi30d: 14.2,
    roiAll: 63.5,
    winRate: 61,
    maxDrawdown: 9.8,
    avgTradesPerWeek: 18,
    description:
      "Intraday mean reversion system on BankNifty futures with strict time-based exits and fixed risk per trade.",
  };

  const [autoCopyEnabled, setAutoCopyEnabled] = useState(true);

  // global copy settings (for this user + this strategy)
  const [allocationMode, setAllocationMode] = useState<
    "fixed" | "percent" | "multiplier"
  >("percent");
  const [fixedAmount, setFixedAmount] = useState("25000");
  const [balancePercent, setBalancePercent] = useState("10");
  const [multiplier, setMultiplier] = useState("1.0");
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState("2");
  const [dailyLossLimit, setDailyLossLimit] = useState("5");
  const [maxDrawdownStop, setMaxDrawdownStop] = useState("20");
  const [maxSlippage, setMaxSlippage] = useState("0.5");

  // accounts (user can have many, but we only allow 1 active for this strategy)
  const [accounts] = useState<Account[]>(mockAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    mockAccounts[0]?.id ?? null
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleSaveSettings = () => {
    if (!selectedAccountId) {
      alert("Please select an account for this strategy.");
      return;
    }
    if (!selectedAccount?.tokenPresent) {
      alert("Selected account does not have a valid token. Please connect token first.");
      return;
    }

    // send to backend: POST /api/strategies/:id/subscribe
    console.log("Saving subscription:", {
      strategyId: strategy.id,
      autoCopyEnabled,
      allocationMode,
      fixedAmount,
      balancePercent,
      multiplier,
      maxRiskPerTrade,
      dailyLossLimit,
      maxDrawdownStop,
      maxSlippage,
      selectedAccountId,
    });

    alert("Settings saved for selected account (mock).");
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col gap-3 border-b border-white/5 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
              Strategies / <span className="text-slate-300">Details</span>
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {strategy.name}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              by <span className="text-slate-200">{strategy.provider}</span> •{" "}
              {strategy.riskLevel} risk • since {strategy.since}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/80">
                30D ROI
              </p>
              <p className="text-sm font-semibold text-emerald-300">
                +{strategy.roi30d.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-600/50 bg-slate-900/70 px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Followers
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {strategy.followers}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
          {/* LEFT: strategy overview + copy settings */}
          <div className="space-y-4">
            {/* Overview */}
            <div className="rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5">
              <p className="text-xs font-medium text-slate-100">
                Strategy overview
              </p>
              <p className="mt-2 text-xs text-slate-300">
                {strategy.description}
              </p>

              <div className="mt-4 grid gap-3 text-[11px] text-slate-300 sm:grid-cols-4">
                <MetricPill
                  label="All-time ROI"
                  value={`${strategy.roiAll.toFixed(1)}%`}
                  accent="positive"
                />
                <MetricPill
                  label="Win rate"
                  value={`${strategy.winRate.toFixed(0)}%`}
                  accent="positive"
                />
                <MetricPill
                  label="Max drawdown"
                  value={`-${strategy.maxDrawdown.toFixed(1)}%`}
                  accent="negative"
                />
                <MetricPill
                  label="Trades / week"
                  value={strategy.avgTradesPerWeek.toString()}
                  accent="neutral"
                />
              </div>

              {/* Chart placeholder */}
              <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 px-3 py-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Equity curve (mock)</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5">
                    6M view
                  </span>
                </div>
                <div className="mt-2 h-32 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-slate-800 to-slate-900" />
              </div>
            </div>

            {/* Copy settings */}
            <div className="space-y-3 rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-100">
                    My copy settings
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    These rules apply to{" "}
                    <span className="text-emerald-300">
                      the selected account only
                    </span>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoCopyEnabled((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] ${
                    autoCopyEnabled
                      ? "bg-emerald-500 text-black"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      autoCopyEnabled ? "bg-black" : "bg-slate-400"
                    }`}
                  />
                  {autoCopyEnabled ? "Auto copy: ON" : "Auto copy: OFF"}
                </button>
              </div>

              {/* Allocation */}
              <div className="space-y-2 text-xs">
                <p className="font-medium text-slate-100">Allocation mode</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <AllocationPill
                    label="Fixed capital"
                    description="Use a fixed rupee amount."
                    active={allocationMode === "fixed"}
                    onClick={() => setAllocationMode("fixed")}
                  />
                  <AllocationPill
                    label="Balance %"
                    description="Use a percent of balance."
                    active={allocationMode === "percent"}
                    onClick={() => setAllocationMode("percent")}
                  />
                  <AllocationPill
                    label="Lot multiplier"
                    description="Mirror master lots."
                    active={allocationMode === "multiplier"}
                    onClick={() => setAllocationMode("multiplier")}
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {allocationMode === "fixed" && (
                    <LabeledInput
                      label="Capital per trade (₹)"
                      value={fixedAmount}
                      onChange={setFixedAmount}
                      suffix="INR"
                    />
                  )}
                  {allocationMode === "percent" && (
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
                    helper="If SL hits, loss won't exceed this % of balance."
                    value={maxRiskPerTrade}
                    onChange={setMaxRiskPerTrade}
                    suffix="%"
                  />
                </div>

                {/* Risk guardrails */}
                <div className="mt-3 grid gap-3 border-t border-white/5 pt-3 text-xs sm:grid-cols-2">
                  <LabeledInput
                    label="Daily loss limit"
                    helper="Pause copy for the day if this is breached."
                    value={dailyLossLimit}
                    onChange={setDailyLossLimit}
                    suffix="%"
                  />
                  <LabeledInput
                    label="Max account drawdown"
                    helper="Pause if equity falls by this % from peak."
                    value={maxDrawdownStop}
                    onChange={setMaxDrawdownStop}
                    suffix="%"
                  />
                  <LabeledInput
                    label="Max slippage"
                    helper="Skip trades with worse slippage than this."
                    value={maxSlippage}
                    onChange={setMaxSlippage}
                    suffix="%"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: single account selection + save */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5">
              <p className="text-xs font-medium text-slate-100">
                Choose account for this strategy
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                You can link <span className="font-semibold">only one</span>{" "}
                trading account to this strategy at a time. You can change it
                later.
              </p>

              {/* account radio list */}
              <div className="mt-3 space-y-2 text-[11px]">
                {accounts.map((acc) => {
                  const selected = acc.id === selectedAccountId;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-emerald-500/80 bg-emerald-500/5 shadow shadow-emerald-500/30"
                          : "border-slate-700/70 bg-slate-950/70 hover:border-emerald-500/60"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border ${
                            selected
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-500 bg-transparent"
                          }`}
                        >
                          {selected && (
                            <div className="m-[3px] h-2 w-2 rounded-full bg-black" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-100">
                            {acc.label}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Broker:{" "}
                            <span className="uppercase">
                              {acc.broker.toUpperCase()}
                            </span>{" "}
                            •{" "}
                            {acc.balance
                              ? `Approx. balance: ₹${acc.balance.toLocaleString()}`
                              : "Balance syncing soon"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          acc.tokenPresent
                            ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40"
                            : "bg-red-500/10 text-red-200 border border-red-500/40"
                        }`}
                      >
                        {acc.tokenPresent ? "Token linked" : "Token missing"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* footer */}
              <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-400">
                  {selectedAccount ? (
                    <>
                      <span className="font-semibold text-emerald-300">
                        {selectedAccount.label}
                      </span>{" "}
                      will receive all trades from this strategy when
                      auto-copy is ON.
                    </>
                  ) : (
                    <>No account selected.</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                  disabled={!selectedAccount || !selectedAccount.tokenPresent}
                >
                  Save & enable
                </button>
              </div>
            </div>

            {/* Your personal performance snippet (optional) */}
            <div className="rounded-2xl border border-white/8 bg-[#070b16] p-4 text-[11px] text-slate-300">
              <p className="text-xs font-medium text-slate-100">
                My performance with this strategy
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                This will show P&L only for the selected account.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <MetricPill
                  label="Realized P&L (MTD)"
                  value="+₹4,320"
                  accent="positive"
                />
                <MetricPill
                  label="Unrealized P&L"
                  value="+₹650"
                  accent="neutral"
                />
                <MetricPill
                  label="Total trades copied"
                  value="46"
                  accent="neutral"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL UI HELPERS ---------- */

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
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 px-3 py-2">
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
        : "border-slate-700/70 bg-slate-950/70 hover:border-emerald-500/60 hover:bg-slate-900"
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

export default UserStrategyDetailPage;
