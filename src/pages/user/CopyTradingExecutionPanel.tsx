import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Save, Zap, Link2, Unlink2, Search, X } from "lucide-react";
import { toast } from "react-toastify";

import {
  usePlaceManualCopyTradeMutation,
  useListMyCopyLinksQuery,
  useUpsertCopyLinkMutation,
  useDeleteCopyLinkMutation,
  useListMyCopyStrategiesQuery,
  useSearchCopySymbolsQuery,
} from "../../services/copyTradingExecution.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

type Mode = "FOREX" | "INDIA";

type Props = {
  /** ✅ from user plan / subscription entitlements */
  enabledMarkets: Mode[];

  /**
   * Pass connected accounts from your existing components:
   * - FOREX: from /forex-trader-user-details/me
   * - INDIA: from your broker accounts endpoint
   */
  accounts: Array<{
    id: string | number;
    market: Mode;
    brokerType: string; // MT5 / CTRADER / ZERODHA / etc
    label: string; // "MT5 • 123456" / "Zerodha • AB1234"
    isMaster?: boolean;
  }>;

  /** Optional: initial market selection when both enabled */
  initialMarket?: Mode;

  /**
   * ✅ TradingView price display widget (UI-only).
   * This does NOT provide a legal quote API for trading execution.
   */
  showTradingViewWidget?: boolean;

  /**
   * Optional helper to map your symbol into TradingView format.
   * Example outputs:
   * - "FX:EURUSD"
   * - "OANDA:XAUUSD"
   * - "NSE:RELIANCE"
   */
  toTradingViewSymbol?: (args: { market: Mode; symbol: string }) => string;
};

type Side = "BUY" | "SELL";
type OrderTypeForex = "MARKET" | "LIMIT" | "STOP";
type OrderTypeIndia = "MARKET" | "LIMIT" | "SL" | "SL-M";

export default function CopyTradingExecutionPanel({
  enabledMarkets,
  accounts,
  initialMarket,
  showTradingViewWidget = true,
  toTradingViewSymbol,
}: Props) {
  // -----------------------------
  // Market selection (plan-based)
  // -----------------------------
  const allowedMarkets = useMemo<Mode[]>(
    () => (enabledMarkets || []).filter(Boolean),
    [enabledMarkets]
  );

  const [market, setMarket] = useState<Mode>(() => {
    if (initialMarket && allowedMarkets.includes(initialMarket)) return initialMarket;
    return allowedMarkets[0] || "FOREX";
  });

  useEffect(() => {
    if (!allowedMarkets.length) return;
    if (!allowedMarkets.includes(market)) setMarket(allowedMarkets[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedMarkets.join("|")]);

  const [tab, setTab] = useState<"manual" | "automation">("manual");

  // -----------------------------
  // Accounts (filtered by market)
  // -----------------------------
  const marketAccounts = useMemo(
    () => accounts.filter((a) => a.market === market),
    [accounts, market]
  );

  // -----------------------------
  // Manual trade targets
  // -----------------------------
  const [targetAll, setTargetAll] = useState(true);
  const [targetIds, setTargetIds] = useState<Array<string>>([]);

  // keep targets valid when market changes
  useEffect(() => {
    setTargetAll(true);
    setTargetIds([]);
  }, [market]);

  const targets = useMemo(() => {
    if (targetAll) return marketAccounts.map((a) => String(a.id));
    return targetIds.filter((id) => marketAccounts.some((a) => String(a.id) === id));
  }, [marketAccounts, targetAll, targetIds]);

  const [side, setSide] = useState<Side>("BUY");

  // -----------------------------
  // Symbol search + selection
  // -----------------------------
  const [symbolQuery, setSymbolQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");

  // close dropdown on outside click
  const symbolBoxRef = useRef<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = symbolBoxRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced symbol search
  const [debouncedQ, setDebouncedQ] = useState(symbolQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(symbolQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [symbolQuery]);

  const {
    data: symbolsRes,
    isFetching: symbolsFetching,
    refetch: refetchSymbols,
  } = useSearchCopySymbolsQuery(
    { mode: market, q: debouncedQ },
    { skip: debouncedQ.length < 1 }
  );

  const symbolResults: Array<{ symbol: string; name?: string; tvSymbol?: string }> =
    useMemo(() => {
      const raw = (symbolsRes as any)?.data ?? symbolsRes ?? [];
      return Array.isArray(raw) ? raw : [];
    }, [symbolsRes]);

  const resolvedSymbol = useMemo(() => {
    return (selectedSymbol || symbolQuery).trim();
  }, [selectedSymbol, symbolQuery]);

  const tvSymbol = useMemo(() => {
    if (!showTradingViewWidget) return "";
    if (!resolvedSymbol) return "";

    // If backend returns tvSymbol, prefer it
    const hit = symbolResults.find((s) => s.symbol === resolvedSymbol);
    if (hit?.tvSymbol) return hit.tvSymbol;

    if (toTradingViewSymbol) return toTradingViewSymbol({ market, symbol: resolvedSymbol });

    // safe fallback guess
    if (resolvedSymbol.includes(":")) return resolvedSymbol;
    if (market === "INDIA") return `NSE:${resolvedSymbol}`;
    // FOREX fallback: EURUSD / XAUUSD
    return `FX:${resolvedSymbol.replace("/", "").toUpperCase()}`;
  }, [market, resolvedSymbol, showTradingViewWidget, symbolResults, toTradingViewSymbol]);

  // -----------------------------
  // Manual Trade State (FOREX)
  // -----------------------------
  const [fxOrderType, setFxOrderType] = useState<OrderTypeForex>("MARKET");
  const [fxLots, setFxLots] = useState<string>("0.01");
  const [fxPrice, setFxPrice] = useState<string>("");
  const [fxSlPrice, setFxSlPrice] = useState<string>("");
  const [fxTpPrice, setFxTpPrice] = useState<string>("");
  const [fxComment, setFxComment] = useState<string>("");

  // -----------------------------
  // Manual Trade State (INDIA)
  // -----------------------------
  const [inExchange, setInExchange] = useState<"NSE" | "BSE" | "NFO" | "MCX">("NSE");
  const [inProduct, setInProduct] = useState<"CNC" | "MIS" | "NRML">("MIS");
  const [inOrderType, setInOrderType] = useState<OrderTypeIndia>("MARKET");
  const [inQty, setInQty] = useState<string>("1");
  const [inPrice, setInPrice] = useState<string>("");
  const [inTriggerPrice, setInTriggerPrice] = useState<string>("");
  const [inValidity, setInValidity] = useState<"DAY" | "IOC">("DAY");

  const [placeManualTrade, { isLoading: placing }] = usePlaceManualCopyTradeMutation();

  function resetManual() {
    setTargetAll(true);
    setTargetIds([]);
    setSide("BUY");
    setSymbolQuery("");
    setSelectedSymbol("");
    setShowSuggestions(false);

    setFxOrderType("MARKET");
    setFxLots("0.01");
    setFxPrice("");
    setFxSlPrice("");
    setFxTpPrice("");
    setFxComment("");

    setInExchange("NSE");
    setInProduct("MIS");
    setInOrderType("MARKET");
    setInQty("1");
    setInPrice("");
    setInTriggerPrice("");
    setInValidity("DAY");
  }

  async function onPlaceManual() {
    try {
      const sym = resolvedSymbol;
      if (!sym) return toast.error("Symbol is required");
      if (!targets.length) return toast.error("Select at least 1 account");

      if (market === "FOREX") {
        const lots = Number(fxLots);
        if (!Number.isFinite(lots) || lots <= 0) return toast.error("Lots must be > 0");

        if (fxOrderType !== "MARKET") {
          const p = Number(fxPrice);
          if (!Number.isFinite(p) || p <= 0) return toast.error("Price is required for LIMIT/STOP");
        }

        const payload = {
          mode: "FOREX",
          targets,
          symbol: sym,
          side,
          orderType: fxOrderType,
          lots,
          price: fxOrderType === "MARKET" ? null : Number(fxPrice),
          slPrice: fxSlPrice.trim() ? Number(fxSlPrice) : null,
          tpPrice: fxTpPrice.trim() ? Number(fxTpPrice) : null,
          comment: fxComment.trim() || null,
        };

        await placeManualTrade(payload as any).unwrap();
        toast.success("Trade sent to all selected accounts ✅");
        resetManual();
        return;
      }

      // INDIA
      const qty = Number(inQty);
      if (!Number.isFinite(qty) || qty <= 0) return toast.error("Quantity must be > 0");

      if (inOrderType === "LIMIT") {
        const p = Number(inPrice);
        if (!Number.isFinite(p) || p <= 0) return toast.error("Limit price is required");
      }

      if (inOrderType === "SL" || inOrderType === "SL-M") {
        const tp = Number(inTriggerPrice);
        if (!Number.isFinite(tp) || tp <= 0) return toast.error("Trigger price is required for SL / SL-M");
        if (inOrderType === "SL") {
          const p = Number(inPrice);
          if (!Number.isFinite(p) || p <= 0) return toast.error("Price is required for SL");
        }
      }

      const payload = {
        mode: "INDIA",
        targets,
        symbol: sym,
        side,
        exchange: inExchange,
        product: inProduct,
        orderType: inOrderType,
        qty,
        price: inPrice.trim() ? Number(inPrice) : null,
        triggerPrice: inTriggerPrice.trim() ? Number(inTriggerPrice) : null,
        validity: inValidity,
      };

      await placeManualTrade(payload as any).unwrap();
      toast.success("Order sent to all selected accounts ✅");
      resetManual();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to place trade");
    }
  }

  // -----------------------------
  // Automation / Strategy Links
  // -----------------------------
  const {
    data: strategiesRes,
    isLoading: strategiesLoading,
    isFetching: strategiesFetching,
    refetch: refetchStrategies,
  } = useListMyCopyStrategiesQuery({ mode: market });

  const {
    data: linksRes,
    isLoading: linksLoading,
    isFetching: linksFetching,
    refetch: refetchLinks,
  } = useListMyCopyLinksQuery({ mode: market });

  const strategies: Array<any> = useMemo(() => {
    const raw = (strategiesRes as any)?.data ?? strategiesRes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [strategiesRes]);

  const links: Array<any> = useMemo(() => {
    const raw = (linksRes as any)?.data ?? linksRes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [linksRes]);

  const linkByStrategyId = useMemo(() => {
    const m = new Map<string, any>();
    links.forEach((l) => m.set(String(l.strategyId), l));
    return m;
  }, [links]);

  const [upsertLink, { isLoading: linking }] = useUpsertCopyLinkMutation();
  const [deleteLink, { isLoading: unlinking }] = useDeleteCopyLinkMutation();

  async function onLink(strategy: any) {
    try {
      if (!marketAccounts.length) return toast.error("Add at least one account first");
      const childIds = marketAccounts.map((a) => String(a.id));
      if (!childIds.length) return toast.error("No accounts available for this market");

      await upsertLink({
        mode: market,
        strategyId: String(strategy.id),
        targetAccountIds: childIds,
        settings: {
          lotMultiplier: 1,
          maxLotPerTrade: null,
          reverseTrades: false,
          copySLTP: true,
        },
      } as any).unwrap();

      toast.success("Strategy linked ✅");
      refetchLinks();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to link strategy");
    }
  }

  async function onUnlink(strategyId: string) {
    try {
      await deleteLink({ mode: market, strategyId } as any).unwrap();
      toast.success("Strategy unlinked");
      refetchLinks();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to unlink");
    }
  }

  const noMarketAccess = allowedMarkets.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold">Execution</p>
            <p className="text-xs text-slate-400 mt-1">
              Manual trades place orders across selected accounts. Automation links strategy signals → copy trades automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refetchSymbols();
                refetchStrategies();
                refetchLinks();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Market toggle (only if both allowed by plan) */}
        {!noMarketAccess && allowedMarkets.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {allowedMarkets.includes("FOREX") && (
              <TopPill
                active={market === "FOREX"}
                onClick={() => setMarket("FOREX")}
                icon={<span className="text-xs font-bold">FX</span>}
                label="FOREX"
              />
            )}
            {allowedMarkets.includes("INDIA") && (
              <TopPill
                active={market === "INDIA"}
                onClick={() => setMarket("INDIA")}
                icon={<span className="text-xs font-bold">IN</span>}
                label="INDIA"
              />
            )}
          </div>
        )}

        {/* Tabs */}
        {!noMarketAccess && (
          <div className="mt-4 flex flex-wrap gap-2">
            <TopPill active={tab === "manual"} onClick={() => setTab("manual")} icon={<Zap size={14} />} label="Manual Trade" />
            <TopPill
              active={tab === "automation"}
              onClick={() => setTab("automation")}
              icon={<Link2 size={14} />}
              label="Automation (Strategy Link)"
            />
          </div>
        )}
      </div>

      {noMarketAccess && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-300">
          Your current plan does not include FOREX/INDIA execution access.
        </div>
      )}

      {/* Manual */}
      {!noMarketAccess && tab === "manual" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Manual Trade</p>
              <p className="text-xs text-slate-400 mt-1">
                {market === "FOREX"
                  ? "Forex: Symbol + BUY/SELL + MARKET/LIMIT/STOP + Lots + optional SL/TP"
                  : "India: Exchange + Product + OrderType + Qty + optional Price/Trigger"}
              </p>
            </div>

            <button
              type="button"
              onClick={onPlaceManual}
              disabled={placing || !targets.length || !resolvedSymbol}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <Save size={16} />
              {placing ? "Placing..." : "Place Trade"}
            </button>
          </div>

          {/* Targets */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold text-slate-200">Targets</p>

              {marketAccounts.length === 0 ? (
                <div className="mt-2 text-sm text-slate-400">
                  No connected accounts for <span className="text-slate-200 font-semibold">{market}</span>.
                  Add accounts first.
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-200">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={targetAll}
                      onChange={(e) => setTargetAll(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                    />
                    All connected accounts ({marketAccounts.length})
                  </label>

                  {!targetAll && (
                    <div className="w-full mt-2">
                      <p className="text-[11px] text-slate-400 mb-2">Select accounts:</p>
                      <div className="flex flex-wrap gap-2">
                        {marketAccounts.map((a) => {
                          const id = String(a.id);
                          const checked = targetIds.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setTargetIds((p) => {
                                  if (p.includes(id)) return p.filter((x) => x !== id);
                                  return [...p, id];
                                });
                              }}
                              className={clsx(
                                "rounded-full border px-3 py-1 text-xs transition",
                                checked
                                  ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                                  : "border-slate-700 bg-slate-900/40 text-slate-200 hover:border-slate-500"
                              )}
                            >
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Symbol + Side */}
            <div className="md:col-span-2" ref={symbolBoxRef}>
              <label className="text-xs font-medium text-slate-300">Symbol *</label>

              <div className="relative">
                <input
                  value={symbolQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSymbolQuery(e.target.value);
                    setSelectedSymbol("");
                    setShowSuggestions(true);
                  }}
                  className={inputBase}
                  placeholder={market === "FOREX" ? "e.g. EURUSD / XAUUSD" : "e.g. RELIANCE / NIFTY24JANFUT"}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-2">
                  {symbolQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSymbolQuery("");
                        setSelectedSymbol("");
                        setShowSuggestions(false);
                      }}
                      className="hover:text-slate-200"
                      title="Clear"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <Search size={14} />
                </div>

                {/* Suggestions */}
                {showSuggestions && symbolQuery.trim().length > 0 && symbolResults.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/95 shadow-lg overflow-hidden">
                    <div className="max-h-64 overflow-auto">
                      {symbolResults.slice(0, 12).map((s) => (
                        <button
                          key={s.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedSymbol(s.symbol);
                            setSymbolQuery(s.symbol);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-900/60"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-100 font-medium">{s.symbol}</span>
                            {s.name && <span className="text-xs text-slate-400">{s.name}</span>}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-slate-800 flex items-center justify-between">
                      <span>{symbolsFetching ? "Searching..." : "Suggestions"}</span>
                      <button type="button" onClick={() => refetchSymbols()} className="hover:text-slate-200">
                        Refresh
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSide("BUY")}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    side === "BUY"
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-700 bg-slate-900/40 text-slate-200 hover:border-slate-500"
                  )}
                >
                  BUY
                </button>

                <button
                  type="button"
                  onClick={() => setSide("SELL")}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    side === "SELL"
                      ? "border-rose-400 bg-rose-500/15 text-rose-200"
                      : "border-slate-700 bg-slate-900/40 text-slate-200 hover:border-slate-500"
                  )}
                >
                  SELL
                </button>
              </div>

              {/* TradingView live price widget (display-only) */}
              {showTradingViewWidget && tvSymbol && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="text-[11px] text-slate-400 mb-2">
                    Live price (TradingView widget): <span className="text-slate-200 font-semibold">{tvSymbol}</span>
                  </div>
                  <TradingViewSymbolInfoWidget symbol={tvSymbol} />
                </div>
              )}
            </div>

            {/* Market-specific form */}
            {market === "FOREX" ? (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-300">Order Type</label>
                  <select
                    value={fxOrderType}
                    onChange={(e) => setFxOrderType(e.target.value as OrderTypeForex)}
                    className={clsx(inputBase, "!mt-1")}
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="STOP">STOP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Lots *</label>
                  <input value={fxLots} onChange={(e) => setFxLots(e.target.value)} className={inputBase} placeholder="0.01" />
                </div>

                {fxOrderType !== "MARKET" && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-300">Entry Price *</label>
                    <input value={fxPrice} onChange={(e) => setFxPrice(e.target.value)} className={inputBase} placeholder="e.g. 1.09250" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-300">Stop Loss (price)</label>
                  <input value={fxSlPrice} onChange={(e) => setFxSlPrice(e.target.value)} className={inputBase} placeholder="optional" />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Take Profit (price)</label>
                  <input value={fxTpPrice} onChange={(e) => setFxTpPrice(e.target.value)} className={inputBase} placeholder="optional" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Comment (optional)</label>
                  <input value={fxComment} onChange={(e) => setFxComment(e.target.value)} className={inputBase} placeholder="e.g. Manual copy trade" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-300">Exchange</label>
                  <select value={inExchange} onChange={(e) => setInExchange(e.target.value as any)} className={clsx(inputBase, "!mt-1")}>
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Product</label>
                  <select value={inProduct} onChange={(e) => setInProduct(e.target.value as any)} className={clsx(inputBase, "!mt-1")}>
                    <option value="MIS">MIS</option>
                    <option value="CNC">CNC</option>
                    <option value="NRML">NRML</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Order Type</label>
                  <select value={inOrderType} onChange={(e) => setInOrderType(e.target.value as any)} className={clsx(inputBase, "!mt-1")}>
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="SL">SL</option>
                    <option value="SL-M">SL-M</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Quantity *</label>
                  <input value={inQty} onChange={(e) => setInQty(e.target.value)} className={inputBase} placeholder="e.g. 1" />
                </div>

                {(inOrderType === "LIMIT" || inOrderType === "SL") && (
                  <div>
                    <label className="text-xs font-medium text-slate-300">Price *</label>
                    <input value={inPrice} onChange={(e) => setInPrice(e.target.value)} className={inputBase} placeholder="e.g. 2450.50" />
                  </div>
                )}

                {(inOrderType === "SL" || inOrderType === "SL-M") && (
                  <div>
                    <label className="text-xs font-medium text-slate-300">Trigger Price *</label>
                    <input value={inTriggerPrice} onChange={(e) => setInTriggerPrice(e.target.value)} className={inputBase} placeholder="e.g. 2448.00" />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Validity</label>
                  <select value={inValidity} onChange={(e) => setInValidity(e.target.value as any)} className={clsx(inputBase, "!mt-1")}>
                    <option value="DAY">DAY</option>
                    <option value="IOC">IOC</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Backend receives one request and fans-out internally to all targets. UI does not send server/password for MT5.
          </div>
        </div>
      )}

      {/* Automation */}
      {!noMarketAccess && tab === "automation" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Automation (Strategy Link)</p>
              <p className="text-xs text-slate-400 mt-1">
                Link your purchased strategies to copy trading accounts. When strategy triggers signals, backend places trades.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                refetchStrategies();
                refetchLinks();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {strategiesLoading || strategiesFetching ? (
            <div className="mt-4 text-sm text-slate-400">Loading strategies…</div>
          ) : strategies.length === 0 ? (
            <div className="mt-4 text-sm text-slate-300">No strategies found for your plan.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {strategies.map((s) => {
                const linked = linkByStrategyId.has(String(s.id));
                return (
                  <div key={String(s.id)} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {s.name || s.strategyName || `Strategy #${s.id}`}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {linked ? <span className="text-emerald-300">Linked</span> : <span className="text-slate-300">Not linked</span>}
                          {" "}• Market: <span className="text-slate-200 font-medium">{market}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {linked ? (
                          <button
                            type="button"
                            onClick={() => onUnlink(String(s.id))}
                            disabled={unlinking || linksLoading || linksFetching}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-60"
                          >
                            <Unlink2 size={14} />
                            {unlinking ? "Unlinking..." : "Unlink"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onLink(s)}
                            disabled={linking || linksLoading || linksFetching}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                          >
                            <Link2 size={14} />
                            {linking ? "Linking..." : "Link"}
                          </button>
                        )}
                      </div>
                    </div>

                    {linked && (
                      <div className="mt-3 text-[11px] text-slate-500">
                        Linked settings are stored in backend (lotMultiplier, reverseTrades, SL/TP copy, etc.). Add “Edit Settings” later as modal.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(linksLoading || linksFetching) && <div className="mt-3 text-[11px] text-slate-500">Syncing links…</div>}
        </div>
      )}
    </div>
  );
}

function TopPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
        active
          ? "bg-slate-100 text-slate-950 border-slate-100"
          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * TradingView widget (display-only).
 * Docs: TradingView widget embedding pages. :contentReference[oaicite:2]{index=2}
 */
function TradingViewSymbolInfoWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = ""; // clear old widget
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      locale: "in",
      colorTheme: "dark",
      isTransparent: true,
    });

    container.appendChild(script);

    return () => {
      // cleanup on unmount or symbol change
      if (container) container.innerHTML = "";
    };
  }, [symbol]);

  return <div ref={containerRef} />;
}
