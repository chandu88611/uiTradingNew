import React, { useState } from "react";

type Tab = "strategy" | "manual";
type Broker = "zerodha" | "dhan" | "angel" | "mt5" | "other";

type Account = {
  id: string;
  label: string;
  broker: Broker;
  useGlobalBroker: boolean;
  selected: boolean;
  balance?: number;
  token: string;
  allocationMode: "same" | "percent" | "fixed_lot";
  allocationValue: string; // % or lot
};

const initialAccounts: Account[] = [
  {
    id: "1",
    label: "Zerodha – Main",
    broker: "zerodha",
    useGlobalBroker: true,
    selected: true,
    balance: 250000,
    token: "",
    allocationMode: "percent",
    allocationValue: "50",
  },
  {
    id: "2",
    label: "Dhan – Intraday",
    broker: "dhan",
    useGlobalBroker: true,
    selected: true,
    balance: 150000,
    token: "",
    allocationMode: "same",
    allocationValue: "1x",
  },
];

const CopyControlCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("strategy");

  /* --------- GLOBAL / SHARED STATE --------- */
  const [globalBroker, setGlobalBroker] = useState<Broker>("zerodha");
  const [useGlobalBrokerForAll, setUseGlobalBrokerForAll] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

  const selectedAccounts = accounts.filter((a) => a.selected && a.token.trim());
  const totalSelected = selectedAccounts.length;

  const toggleAccountSelection = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const updateAccountField = (
    id: string,
    field: keyof Account,
    value: string | boolean
  ) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      )
    );
  };

  const handleAddAccount = () => {
    const newId = (accounts.length + 1).toString();
    setAccounts((prev) => [
      ...prev,
      {
        id: newId,
        label: `New Account ${newId}`,
        broker: globalBroker,
        useGlobalBroker: true,
        selected: true,
        balance: undefined,
        token: "",
        allocationMode: "same",
        allocationValue: "1x",
      },
    ]);
  };

  /* --------- STRATEGY TAB STATE --------- */
  const [strategyName, setStrategyName] = useState("BankNifty Mean Reversion");
  const [copyDirection, setCopyDirection] = useState<"both" | "long" | "short">(
    "both"
  );
  const [useMasterSlTp, setUseMasterSlTp] = useState(true);
  const [overrideSlBuffer, setOverrideSlBuffer] = useState("0");
  const [overrideTpBuffer, setOverrideTpBuffer] = useState("0");

  /* --------- MANUAL TAB STATE --------- */
  const [segment, setSegment] = useState<
    "index" | "equity" | "fo" | "forex" | "crypto"
  >("index");
  const [symbol, setSymbol] = useState("BANKNIFTY");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "sl" | "slm">(
    "market"
  );
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [slMode, setSlMode] = useState<"price" | "points" | "percent">(
    "points"
  );
  const [tpMode, setTpMode] = useState<"price" | "points" | "percent">(
    "points"
  );
  const [stopLoss, setStopLoss] = useState("50");
  const [takeProfit, setTakeProfit] = useState("100");
  const [trailingSl, setTrailingSl] = useState(false);
  const [timeInForce, setTimeInForce] = useState<"day" | "ioc" | "gtt">("day");
  const [validityMins, setValidityMins] = useState("2");
  const [maxSlippage, setMaxSlippage] = useState("0.3");

  const onSubmit = () => {
    if (totalSelected === 0) {
      alert("Add tokens and select at least one account.");
      return;
    }

    if (activeTab === "strategy") {
      console.log("Enable auto copy:", {
        strategyName,
        copyDirection,
        useMasterSlTp,
        overrideSlBuffer,
        overrideTpBuffer,
        globalBroker,
        useGlobalBrokerForAll,
        accounts: selectedAccounts,
      });
      alert(`Auto copy enabled for ${totalSelected} account(s) (mock).`);
    } else {
      console.log("Manual blast trade:", {
        segment,
        symbol,
        side,
        orderType,
        quantity,
        price,
        slMode,
        stopLoss,
        tpMode,
        takeProfit,
        trailingSl,
        timeInForce,
        validityMins,
        maxSlippage,
        globalBroker,
        useGlobalBrokerForAll,
        accounts: selectedAccounts,
      });
      alert(`Manual trade prepared for ${totalSelected} account(s) (mock).`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col gap-3 border-b border-white/5 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-400/80">
              Copy Engine
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Broadcast trades to all linked accounts
            </h1>
            <p className="mt-2 max-w-xl text-xs text-slate-400">
              Connect broker accounts once, then either follow your strategy
              automatically or push manual trades to all child accounts in a
              single click.
            </p>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
          {/* LEFT SIDE - TABS */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="inline-flex rounded-full bg-slate-900/70 p-1 text-xs">
              <TabButton
                active={activeTab === "strategy"}
                onClick={() => setActiveTab("strategy")}
              >
                Strategy auto copy
              </TabButton>
              <TabButton
                active={activeTab === "manual"}
                onClick={() => setActiveTab("manual")}
              >
                Manual multi-account trade
              </TabButton>
            </div>

            {/* CARD CONTENT */}
            <div className="rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5">
              {activeTab === "strategy" ? (
                <StrategyTab
                  strategyName={strategyName}
                  setStrategyName={setStrategyName}
                  copyDirection={copyDirection}
                  setCopyDirection={setCopyDirection}
                  useMasterSlTp={useMasterSlTp}
                  setUseMasterSlTp={setUseMasterSlTp}
                  overrideSlBuffer={overrideSlBuffer}
                  setOverrideSlBuffer={setOverrideSlBuffer}
                  overrideTpBuffer={overrideTpBuffer}
                  setOverrideTpBuffer={setOverrideTpBuffer}
                />
              ) : (
                <ManualTab
                  segment={segment}
                  setSegment={setSegment}
                  symbol={symbol}
                  setSymbol={setSymbol}
                  side={side}
                  setSide={setSide}
                  orderType={orderType}
                  setOrderType={setOrderType}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  price={price}
                  setPrice={setPrice}
                  slMode={slMode}
                  setSlMode={setSlMode}
                  tpMode={tpMode}
                  setTpMode={setTpMode}
                  stopLoss={stopLoss}
                  setStopLoss={setStopLoss}
                  takeProfit={takeProfit}
                  setTakeProfit={setTakeProfit}
                  trailingSl={trailingSl}
                  setTrailingSl={setTrailingSl}
                  timeInForce={timeInForce}
                  setTimeInForce={setTimeInForce}
                  validityMins={validityMins}
                  setValidityMins={setValidityMins}
                  maxSlippage={maxSlippage}
                  setMaxSlippage={setMaxSlippage}
                />
              )}
            </div>
          </div>

          {/* RIGHT SIDE - ACCOUNTS */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5">
              {/* Global broker + toggles */}
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <p className="text-xs font-medium text-slate-100">
                    Linked accounts & routing
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Add broker tokens once. We will reuse them for both{" "}
                    <span className="text-emerald-300">auto copy</span> and{" "}
                    <span className="text-emerald-300">manual blast trades</span>.
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Global broker route
                    </p>
                    <select
                      value={globalBroker}
                      onChange={(e) =>
                        setGlobalBroker(e.target.value as Broker)
                      }
                      className="w-44 rounded-xl border border-slate-600/70 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none ring-emerald-500/60 focus:ring-1"
                    >
                      <option value="zerodha">Zerodha</option>
                      <option value="dhan">Dhan</option>
                      <option value="angel">Angel One</option>
                      <option value="mt5">MT5 / Forex</option>
                      <option value="other">Other broker</option>
                    </select>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                      checked={useGlobalBrokerForAll}
                      onChange={(e) =>
                        setUseGlobalBrokerForAll(e.target.checked)
                      }
                    />
                    <span>Use this broker for all accounts</span>
                  </label>
                </div>

                {/* Account list */}
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAccountSelection(acc.id)}
                            className={`mt-0.5 h-4 w-4 rounded-[6px] border text-[10px] ${
                              acc.selected
                                ? "border-emerald-500 bg-emerald-500 text-black"
                                : "border-slate-500 bg-transparent text-transparent"
                            } flex items-center justify-center`}
                          >
                            ✓
                          </button>
                          <div>
                            <p className="text-xs font-medium text-slate-100">
                              {acc.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {acc.balance
                                ? `Approx. balance: ₹${acc.balance.toLocaleString()}`
                                : "Balance will sync after first login."}
                            </p>
                          </div>
                        </div>

                        {!useGlobalBrokerForAll && (
                          <select
                            value={acc.broker}
                            onChange={(e) =>
                              updateAccountField(
                                acc.id,
                                "broker",
                                e.target.value
                              )
                            }
                            className="rounded-xl border border-slate-600/70 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none"
                          >
                            <option value="zerodha">Zerodha</option>
                            <option value="dhan">Dhan</option>
                            <option value="angel">Angel</option>
                            <option value="mt5">MT5</option>
                            <option value="other">Other</option>
                          </select>
                        )}
                      </div>

                      {/* Token + allocation */}
                      <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-300">
                            Access token / API key
                          </p>
                          <input
                            type="password"
                            value={acc.token}
                            onChange={(e) =>
                              updateAccountField(
                                acc.id,
                                "token",
                                e.target.value
                              )
                            }
                            placeholder="Paste token from broker dashboard"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none ring-emerald-500/60 focus:ring-1"
                          />
                          <p className="text-[10px] text-slate-500">
                            We store this securely and only use it to place
                            trades and fetch balances.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-300">
                            Allocation for this account
                          </p>
                          <div className="flex gap-1">
                            <select
                              value={acc.allocationMode}
                              onChange={(e) =>
                                updateAccountField(
                                  acc.id,
                                  "allocationMode",
                                  e.target.value
                                )
                              }
                              className="w-28 rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100 outline-none"
                            >
                              <option value="same">Same as master</option>
                              <option value="percent">% of balance</option>
                              <option value="fixed_lot">Fixed lot</option>
                            </select>
                            <input
                              value={acc.allocationValue}
                              onChange={(e) =>
                                updateAccountField(
                                  acc.id,
                                  "allocationValue",
                                  e.target.value
                                )
                              }
                              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100 outline-none"
                              placeholder={
                                acc.allocationMode === "percent"
                                  ? "e.g. 25"
                                  : acc.allocationMode === "fixed_lot"
                                  ? "e.g. 0.5"
                                  : "e.g. 1x / 2x"
                              }
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Used for both strategy signals and manual trades.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddAccount}
                  className="mt-1 inline-flex items-center gap-1 rounded-full border border-dashed border-slate-600 px-3 py-1.5 text-[11px] text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
                >
                  <span className="text-sm">+</span>
                  Add another account
                </button>
              </div>

              {/* FOOTER ACTION */}
              <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-400">
                  {totalSelected === 0 ? (
                    <>
                      Add access tokens and select accounts to start.
                    </>
                  ) : (
                    <>
                      This action will affect{" "}
                      <span className="text-emerald-300 font-semibold">
                        {totalSelected} account
                        {totalSelected > 1 ? "s" : ""}
                      </span>
                      .
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                  disabled={totalSelected === 0}
                >
                  {activeTab === "strategy"
                    ? "Enable auto copy"
                    : "Place trade in all accounts"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------ SMALL SUB COMPONENTS ------------------------ */

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-1.5 transition ${
      active
        ? "bg-emerald-500 text-black shadow shadow-emerald-500/40"
        : "bg-transparent text-slate-300 hover:bg-slate-800"
    }`}
  >
    {children}
  </button>
);

/* STRATEGY TAB UI */
type StrategyTabProps = {
  strategyName: string;
  setStrategyName: (v: string) => void;
  copyDirection: "both" | "long" | "short";
  setCopyDirection: (v: "both" | "long" | "short") => void;
  useMasterSlTp: boolean;
  setUseMasterSlTp: (v: boolean) => void;
  overrideSlBuffer: string;
  setOverrideSlBuffer: (v: string) => void;
  overrideTpBuffer: string;
  setOverrideTpBuffer: (v: string) => void;
};

const StrategyTab: React.FC<StrategyTabProps> = ({
  strategyName,
  setStrategyName,
  copyDirection,
  setCopyDirection,
  useMasterSlTp,
  setUseMasterSlTp,
  overrideSlBuffer,
  setOverrideSlBuffer,
  overrideTpBuffer,
  setOverrideTpBuffer,
}) => {
  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400/80">
            Strategy auto copy
          </p>
          <p className="mt-1 text-xs text-slate-400">
            When TradingView fires an alert for this strategy, Tradebro will
            broadcast the trade to all selected accounts.
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-slate-300">
          Source: TradingView Webhook
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-100">Choose strategy</p>
        <select
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none ring-emerald-500/60 focus:ring-1"
        >
          <option>BankNifty Mean Reversion</option>
          <option>XAUUSD London Breakout</option>
          <option>Nifty Premium Decay</option>
        </select>
        <p className="text-[11px] text-slate-500">
          Strategy connects to a TradingView alert via webhook in the strategy
          settings page.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Direction */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-100">
            Which directions to copy?
          </p>
          <div className="inline-flex rounded-full bg-slate-900/80 p-1">
            {[
              { key: "both", label: "Buy + Sell" },
              { key: "long", label: "Only Buy / Long" },
              { key: "short", label: "Only Sell / Short" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() =>
                  setCopyDirection(opt.key as "both" | "long" | "short")
                }
                className={`rounded-full px-3 py-1 text-[11px] ${
                  copyDirection === opt.key
                    ? "bg-emerald-500 text-black"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Example: if you only want to short BankNifty with this strategy, use
            “Only Sell / Short”.
          </p>
        </div>

        {/* SL / TP handling */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-100">
            Stop-loss & Take-profit
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-900"
              checked={useMasterSlTp}
              onChange={(e) => setUseMasterSlTp(e.target.checked)}
            />
            <span>Use master strategy SL / TP as-is</span>
          </label>

          {!useMasterSlTp && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-slate-300">
                  Extra buffer on SL (points / pips)
                </p>
                <input
                  value={overrideSlBuffer}
                  onChange={(e) => setOverrideSlBuffer(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none ring-emerald-500/60 focus:ring-1"
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <p className="text-[11px] text-slate-300">
                  Extra buffer on TP (points / pips)
                </p>
                <input
                  value={overrideTpBuffer}
                  onChange={(e) => setOverrideTpBuffer(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none ring-emerald-500/60 focus:ring-1"
                  placeholder="e.g. -5 (tighter TP)"
                />
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            You can keep master SL/TP or adjust it slightly for your risk
            profile.
          </p>
        </div>
      </div>
    </div>
  );
};

/* MANUAL TAB UI */
type ManualTabProps = {
  segment: "index" | "equity" | "fo" | "forex" | "crypto";
  setSegment: (v: any) => void;
  symbol: string;
  setSymbol: (v: string) => void;
  side: "buy" | "sell";
  setSide: (v: "buy" | "sell") => void;
  orderType: "market" | "limit" | "sl" | "slm";
  setOrderType: (v: "market" | "limit" | "sl" | "slm") => void;
  quantity: string;
  setQuantity: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  slMode: "price" | "points" | "percent";
  setSlMode: (v: "price" | "points" | "percent") => void;
  tpMode: "price" | "points" | "percent";
  setTpMode: (v: "price" | "points" | "percent") => void;
  stopLoss: string;
  setStopLoss: (v: string) => void;
  takeProfit: string;
  setTakeProfit: (v: string) => void;
  trailingSl: boolean;
  setTrailingSl: (v: boolean) => void;
  timeInForce: "day" | "ioc" | "gtt";
  setTimeInForce: (v: "day" | "ioc" | "gtt") => void;
  validityMins: string;
  setValidityMins: (v: string) => void;
  maxSlippage: string;
  setMaxSlippage: (v: string) => void;
};

const ManualTab: React.FC<ManualTabProps> = (props) => {
  const {
    segment,
    setSegment,
    symbol,
    setSymbol,
    side,
    setSide,
    orderType,
    setOrderType,
    quantity,
    setQuantity,
    price,
    setPrice,
    slMode,
    setSlMode,
    tpMode,
    setTpMode,
    stopLoss,
    setStopLoss,
    takeProfit,
    setTakeProfit,
    trailingSl,
    setTrailingSl,
    timeInForce,
    setTimeInForce,
    validityMins,
    setValidityMins,
    maxSlippage,
    setMaxSlippage,
  } = props;

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400/80">
            Manual multi-account trade
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Define a trade once and fire it into all selected child accounts
            with their allocation rules.
          </p>
        </div>
      </div>

      {/* Basic trade */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Segment</p>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
          >
            <option value="index">Index / F&O</option>
            <option value="equity">Equity</option>
            <option value="fo">Futures & Options</option>
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Symbol</p>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
            placeholder="BANKNIFTY, XAUUSD, BTCUSDT…"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Side</p>
          <div className="inline-flex rounded-full bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setSide("buy")}
              className={`rounded-full px-3 py-1 text-[11px] ${
                side === "buy"
                  ? "bg-emerald-500 text-black"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Buy / Long
            </button>
            <button
              type="button"
              onClick={() => setSide("sell")}
              className={`rounded-full px-3 py-1 text-[11px] ${
                side === "sell"
                  ? "bg-red-500 text-black"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Sell / Short
            </button>
          </div>
        </div>
      </div>

      {/* Order details */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Order type</p>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as any)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="sl">SL</option>
            <option value="slm">SL-M</option>
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Quantity / lot</p>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
            placeholder="e.g. 1"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Limit price (if any)</p>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
            placeholder="Leave blank for market"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Time in force</p>
          <select
            value={timeInForce}
            onChange={(e) => setTimeInForce(e.target.value as any)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
          >
            <option value="day">DAY</option>
            <option value="ioc">IOC</option>
            <option value="gtt">GTT / Good-till</option>
          </select>
        </div>
      </div>

      {/* SL / TP */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-100">Stop loss</p>
          <div className="flex gap-2">
            <select
              value={slMode}
              onChange={(e) => setSlMode(e.target.value as any)}
              className="w-28 rounded-xl border border-slate-600 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100 outline-none"
            >
              <option value="points">Points / pips</option>
              <option value="price">Price</option>
              <option value="percent">% from entry</option>
            </select>
            <input
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="flex-1 rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
              placeholder="e.g. 50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-100">Take profit</p>
          <div className="flex gap-2">
            <select
              value={tpMode}
              onChange={(e) => setTpMode(e.target.value as any)}
              className="w-28 rounded-xl border border-slate-600 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100 outline-none"
            >
              <option value="points">Points / pips</option>
              <option value="price">Price</option>
              <option value="percent">% from entry</option>
            </select>
            <input
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="flex-1 rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
              placeholder="e.g. 100"
            />
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Valid only for</p>
          <input
            value={validityMins}
            onChange={(e) => setValidityMins(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
            placeholder="Minutes, e.g. 2"
          />
          <p className="text-[10px] text-slate-500">
            After this window, unfilled orders can be cancelled by engine.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] text-slate-300">Max slippage</p>
          <input
            value={maxSlippage}
            onChange={(e) => setMaxSlippage(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
            placeholder="e.g. 0.3%"
          />
          <p className="text-[10px] text-slate-500">
            Skip accounts where slippage exceeds this threshold.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-slate-300">Trailing SL</p>
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-500 bg-slate-900"
              checked={trailingSl}
              onChange={(e) => setTrailingSl(e.target.checked)}
            />
            <span>Enable trailing stop-loss</span>
          </label>
          <p className="text-[10px] text-slate-500">
            Actual trailing step size you can configure later per strategy or
            per account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CopyControlCenter;
