import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Save, Zap, Link2, Unlink2, Search, X } from "lucide-react";
import { toast } from "react-toastify";

/**
 * ✅ Backend you will wire:
 * - Manual copy trade
 * - Strategy listing + link/unlink
 *
 * ❌ Removed: useSearchSymbolsQuery (your /copy/symbols endpoint doesn't exist)
 */

 
import {
  usePlaceManualCopyTradeMutation,
  useListMyCopyLinksQuery,
  useUpsertCopyLinkMutation,
  useDeleteCopyLinkMutation,
  useListMyCopyStrategiesQuery,
} from "../../services/copyTradingExecution.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

type Market = "FOREX" | "INDIA";
type Side = "BUY" | "SELL";
type OrderTypeForex = "MARKET" | "LIMIT" | "STOP";
type OrderTypeIndia = "MARKET" | "LIMIT" | "SL" | "SL-M";

type Props = {
  enabledMarkets: Market[]; // from plan
  accounts: Array<{
    id: string | number;
    market: Market;
    brokerType: string;
    label: string;
    isMaster?: boolean;
  }>;
  initialMarket?: Market;

  /**
   * TradingView embed widget (display only)
   * - If you saw 403 before, it’s usually because you tried to fetch it like an API.
   *   It must be loaded as a <script src="..."> embed.
   */
  showTradingViewWidget?: boolean;

  /**
   * Convert selected symbol into TradingView format.
   * Examples:
   * - FOREX: "FX:EURUSD"
   * - INDIA: "NSE:RELIANCE"
   * - CRYPTO often: "BINANCE:BTCUSDT"
   */
  toTradingViewSymbol?: (args: { market: Market; symbol: string; meta?: TvSymbol }) => string;

  /**
   * Optional: use a backend proxy to avoid CORS blocks.
   * If set, we call:
   *   `${symbolSearchProxyUrl}?text=...&type=...&exchange=...`
   */
  symbolSearchProxyUrl?: string;
};

type TvCategory = "all" | "forex" | "crypto" | "stocks" | "indices" | "futures";

type TvSymbol = {
  symbol: string;       // "EURUSD"
  full_name?: string;   // "FX:EURUSD" or "OANDA:EURUSD"
  description?: string; // "Euro / U.S. Dollar"
  exchange?: string;    // "OANDA", "FXCM", "NSE"
  type?: string;        // "forex", "crypto", "stock", ...
};

function mapCategoryToTvType(cat: TvCategory) {
  switch (cat) {
    case "forex":
      return "forex";
    case "crypto":
      return "crypto";
    case "stocks":
      return "stock";
    case "indices":
      return "index";
    case "futures":
      return "futures";
    default:
      return "";
  }
}

function guessDefaultExchange(market: Market) {
  // You can tweak:
  // - INDIA: NSE by default
  // - FOREX: blank means "all exchanges"
  return market === "INDIA" ? "NSE" : "";
}

/**
 * TradingView symbol search (best-effort).
 * If CORS blocks in browser, use symbolSearchProxyUrl (recommended).
 */
function useTradingViewSymbolSearch(args: {
  market: Market;
  q: string;
  category: TvCategory;
  proxyUrl?: string;
}) {
  const { market, q, category, proxyUrl } = args;

  const [items, setItems] = useState<TvSymbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef(new Map<string, TvSymbol[]>());

  useEffect(() => {
    const text = q.trim();
    if (!text) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const tvType = mapCategoryToTvType(category);
    const exchange = guessDefaultExchange(market);

    const cacheKey = `${market}__${category}__${exchange}__${text.toLowerCase()}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setItems(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        // Option A: Backend proxy (recommended)
        if (proxyUrl) {
          const u = new URL(proxyUrl, window.location.origin);
          u.searchParams.set("text", text);
          if (tvType) u.searchParams.set("type", tvType);
          if (exchange) u.searchParams.set("exchange", exchange);

          const res = await fetch(u.toString(), { credentials: "include" });
          if (!res.ok) throw new Error(`Proxy failed (${res.status})`);
          const json = await res.json();

          const list: TvSymbol[] = Array.isArray(json) ? json : (json?.data ?? []);
          if (!cancelled) {
            cacheRef.current.set(cacheKey, list);
            setItems(list);
          }
          return;
        }

        // Option B: Direct TradingView symbol search (may be CORS-blocked)
        // (This is not an “official public API”; it can change anytime.)
        const endpoint = new URL("https://symbol-search.tradingview.com/symbol_search/");
        endpoint.searchParams.set("text", text);
        endpoint.searchParams.set("hl", "1");
        endpoint.searchParams.set("lang", "en");
        endpoint.searchParams.set("domain", "production");
        if (tvType) endpoint.searchParams.set("type", tvType);
        if (exchange) endpoint.searchParams.set("exchange", exchange);

        const res = await fetch(endpoint.toString());
        if (!res.ok) throw new Error(`TradingView search failed (${res.status})`);
        const json = await res.json();

        const list: TvSymbol[] = Array.isArray(json) ? json : [];
        if (!cancelled) {
          cacheRef.current.set(cacheKey, list);
          setItems(list);
        }
      } catch (e: any) {
        if (!cancelled) {
          setItems([]);
          // Show real reason instead of “No matches”
          setError(
            e?.message ||
              "Symbol search failed. If you see CORS in console, add a backend proxy."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [market, q, category, proxyUrl]);

  return { items, loading, error };
}

/**
 * TradingView widget embed component
 * - This is DISPLAY ONLY; it won’t give you a JS price value.
 * - Must be embedded via <script src="...">, not fetched like an API. :contentReference[oaicite:2]{index=2}
 */
function TradingViewMiniWidget({
  tvSymbol,
  height = 220,
}: {
  tvSymbol: string;
  height?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);
    host.appendChild(container);

    // Use mini symbol overview (works well for current price + small chart)
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";

    // TradingView expects the JSON config as script textContent. :contentReference[oaicite:3]{index=3}
    script.textContent = JSON.stringify({
      symbol: tvSymbol,
      width: "100%",
      height,
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });

    container.appendChild(script);

    return () => {
      if (host) host.innerHTML = "";
    };
  }, [tvSymbol, height]);

  return <div ref={hostRef} className="w-full" />;
}

export default function CopyTradingExecutionPanel({
  enabledMarkets,
  accounts,
  initialMarket = "FOREX",
  showTradingViewWidget = true,
  toTradingViewSymbol,
  symbolSearchProxyUrl,
}: Props) {
  const [tab, setTab] = useState<"manual" | "automation">("manual");

  // Market selection inside execution panel (only if plan has both)
  const [market, setMarket] = useState<Market>(initialMarket);

  useEffect(() => {
    if (!enabledMarkets?.length) return;
    if (!enabledMarkets.includes(market)) setMarket(enabledMarkets[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledMarkets.join("|")]);

  const canForex = enabledMarkets.includes("FOREX");
  const canIndia = enabledMarkets.includes("INDIA");
  const showMarketSwitch = enabledMarkets.length > 1;

  const marketAccounts = useMemo(
    () => accounts.filter((a) => a.market === market),
    [accounts, market]
  );

  // -----------------------------
  // Manual Trade State
  // -----------------------------
  const [targetAll, setTargetAll] = useState(true);
  const [targetIds, setTargetIds] = useState<Array<string>>([]);

  const targets = useMemo(() => {
    if (targetAll) return marketAccounts.map((a) => String(a.id));
    return targetIds;
  }, [marketAccounts, targetAll, targetIds]);

  const [side, setSide] = useState<Side>("BUY");
  const [symbolQuery, setSymbolQuery] = useState("");
  const [selected, setSelected] = useState<TvSymbol | null>(null);

  // Suggestions filters like TradingView (All / Forex / Crypto / ...)
  const [tvCategory, setTvCategory] = useState<TvCategory>("all");

  // debounce input
  const [debouncedQ, setDebouncedQ] = useState(symbolQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(symbolQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [symbolQuery]);

  const { items: symbolResults, loading: symbolLoading, error: symbolError } =
    useTradingViewSymbolSearch({
      market,
      q: debouncedQ,
      category: tvCategory,
      proxyUrl: symbolSearchProxyUrl,
    });

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

  const [placeManualTrade, { isLoading: placing }] =
    usePlaceManualCopyTradeMutation();

  function resetManual() {
    setTargetAll(true);
    setTargetIds([]);
    setSide("BUY");
    setSymbolQuery("");
    setSelected(null);
    setTvCategory("all");

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

  function getFinalSymbol() {
    return (selected?.symbol || symbolQuery).trim();
  }

  function getTradingViewSymbol() {
    const sym = getFinalSymbol();
    if (!sym) return "";
    if (toTradingViewSymbol) return toTradingViewSymbol({ market, symbol: sym, meta: selected || undefined });

    // default mapping (adjust if you want BINANCE for crypto etc.)
    if (sym.includes(":")) return sym;
    return market === "INDIA"
      ? `NSE:${sym.toUpperCase()}`
      : `FX:${sym.replace("/", "").toUpperCase()}`;
  }

  async function onPlaceManual() {
    try {
      const sym = getFinalSymbol();
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
    isFetching: strategiesFetching,
    refetch: refetchStrategies,
  } = useListMyCopyStrategiesQuery({ mode: market } as any);

  const {
    data: linksRes,
    isFetching: linksFetching,
    refetch: refetchLinks,
  } = useListMyCopyLinksQuery({ mode: market } as any);

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

  const tvSymbol = useMemo(() => getTradingViewSymbol(), [market, selected, symbolQuery]);

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

        {/* Market switch (if plan has both) */}
        {showMarketSwitch && (
          <div className="mt-4 inline-flex rounded-full bg-slate-950/40 p-1 text-xs">
            {canForex && (
              <button
                type="button"
                onClick={() => setMarket("FOREX")}
                className={clsx(
                  "rounded-full px-4 py-2 transition",
                  market === "FOREX"
                    ? "bg-emerald-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                FOREX
              </button>
            )}
            {canIndia && (
              <button
                type="button"
                onClick={() => setMarket("INDIA")}
                className={clsx(
                  "rounded-full px-4 py-2 transition",
                  market === "INDIA"
                    ? "bg-emerald-500 text-slate-950 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                INDIA
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <TopPill
            active={tab === "manual"}
            onClick={() => setTab("manual")}
            icon={<Zap size={14} />}
            label="Manual Trade"
          />
          <TopPill
            active={tab === "automation"}
            onClick={() => setTab("automation")}
            icon={<Link2 size={14} />}
            label="Automation (Strategy Link)"
          />
        </div>
      </div>

      {/* Manual */}
      {tab === "manual" && (
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
              disabled={placing}
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
                        const checked = targetIds.includes(String(a.id));
                        return (
                          <button
                            key={String(a.id)}
                            type="button"
                            onClick={() => {
                              setTargetIds((p) => {
                                const id = String(a.id);
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
            </div>

            {/* Symbol + Side */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Symbol *</label>

              {/* Category pills like TradingView */}
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  ["all", "All"],
                  ["forex", "Forex"],
                  ["crypto", "Crypto"],
                  ["indices", "Indices"],
                  ["stocks", "Stocks"],
                  ["futures", "Futures"],
                ] as Array<[TvCategory, string]>).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTvCategory(k)}
                    className={clsx(
                      "rounded-full border px-3 py-1 text-xs transition",
                      tvCategory === k
                        ? "border-slate-100 bg-slate-100 text-slate-950"
                        : "border-slate-700 bg-slate-950/30 text-slate-200 hover:border-slate-500"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <input
                  value={symbolQuery}
                  onChange={(e) => {
                    setSymbolQuery(e.target.value);
                    setSelected(null);
                  }}
                  className={inputBase}
                  placeholder={
                    market === "FOREX"
                      ? "Try: eurusd / gold / bitcoin"
                      : "Try: reliance / nifty / tcs"
                  }
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-2">
                  {symbolQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSymbolQuery("");
                        setSelected(null);
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
                {symbolQuery.trim().length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/95 shadow-lg overflow-hidden">
                    <div className="px-3 py-2 text-[11px] text-slate-400 border-b border-slate-800 flex items-center justify-between">
                      <span>
                        {symbolLoading ? "Searching…" : "Suggestions"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          // quick re-trigger by “touching” query
                          setSymbolQuery((p) => p + "");
                        }}
                        className="hover:text-slate-200 inline-flex items-center gap-2"
                      >
                        <RefreshCw size={12} />
                        Refresh
                      </button>
                    </div>

                    <div className="max-h-72 overflow-auto">
                      {symbolError ? (
                        <div className="px-3 py-3 text-xs text-rose-300">
                          {symbolError}
                          <div className="mt-2 text-[11px] text-slate-500">
                            If console shows CORS, set <span className="text-slate-300">symbolSearchProxyUrl</span>.
                          </div>
                        </div>
                      ) : symbolLoading ? (
                        <div className="px-3 py-3 text-xs text-slate-400">Loading…</div>
                      ) : symbolResults.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-slate-400">No matches</div>
                      ) : (
                        symbolResults.slice(0, 20).map((s, idx) => {
                          const title = s.symbol || s.full_name || `Result ${idx + 1}`;
                          return (
                            <button
                              key={`${title}-${idx}`}
                              type="button"
                              onClick={() => {
                                setSelected(s);
                                setSymbolQuery(s.symbol || "");
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-900/60"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-slate-100 font-medium truncate">
                                    {s.symbol}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {s.description || s.full_name || ""}
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-300 shrink-0">
                                  {(s.exchange || "").toUpperCase()}{" "}
                                  {s.type ? `• ${String(s.type).toUpperCase()}` : ""}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* BUY/SELL */}
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
            </div>

            {/* TradingView widget preview */}
            {showTradingViewWidget && tvSymbol && (
              <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-[11px] text-slate-400 mb-2">
                  Preview (TradingView): <span className="text-slate-200">{tvSymbol}</span>
                </div>
                <TradingViewMiniWidget tvSymbol={tvSymbol} height={220} />
                <div className="mt-2 text-[11px] text-slate-500">
                  Widget is display-only. For exact executable price, fetch quotes from your broker/MT5 server.
                </div>
              </div>
            )}

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
                  <input
                    value={fxLots}
                    onChange={(e) => setFxLots(e.target.value)}
                    className={inputBase}
                    placeholder="0.01"
                  />
                </div>

                {fxOrderType !== "MARKET" && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-300">Entry Price *</label>
                    <input
                      value={fxPrice}
                      onChange={(e) => setFxPrice(e.target.value)}
                      className={inputBase}
                      placeholder="e.g. 1.09250"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-300">Stop Loss (price)</label>
                  <input
                    value={fxSlPrice}
                    onChange={(e) => setFxSlPrice(e.target.value)}
                    className={inputBase}
                    placeholder="optional"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Take Profit (price)</label>
                  <input
                    value={fxTpPrice}
                    onChange={(e) => setFxTpPrice(e.target.value)}
                    className={inputBase}
                    placeholder="optional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Comment (optional)</label>
                  <input
                    value={fxComment}
                    onChange={(e) => setFxComment(e.target.value)}
                    className={inputBase}
                    placeholder="e.g. Manual copy trade"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-300">Exchange</label>
                  <select
                    value={inExchange}
                    onChange={(e) => setInExchange(e.target.value as any)}
                    className={clsx(inputBase, "!mt-1")}
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Product</label>
                  <select
                    value={inProduct}
                    onChange={(e) => setInProduct(e.target.value as any)}
                    className={clsx(inputBase, "!mt-1")}
                  >
                    <option value="MIS">MIS</option>
                    <option value="CNC">CNC</option>
                    <option value="NRML">NRML</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Order Type</label>
                  <select
                    value={inOrderType}
                    onChange={(e) => setInOrderType(e.target.value as any)}
                    className={clsx(inputBase, "!mt-1")}
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="SL">SL</option>
                    <option value="SL-M">SL-M</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Quantity *</label>
                  <input
                    value={inQty}
                    onChange={(e) => setInQty(e.target.value)}
                    className={inputBase}
                    placeholder="e.g. 1"
                  />
                </div>

                {(inOrderType === "LIMIT" || inOrderType === "SL") && (
                  <div>
                    <label className="text-xs font-medium text-slate-300">Price *</label>
                    <input
                      value={inPrice}
                      onChange={(e) => setInPrice(e.target.value)}
                      className={inputBase}
                      placeholder="e.g. 2450.50"
                    />
                  </div>
                )}

                {(inOrderType === "SL" || inOrderType === "SL-M") && (
                  <div>
                    <label className="text-xs font-medium text-slate-300">Trigger Price *</label>
                    <input
                      value={inTriggerPrice}
                      onChange={(e) => setInTriggerPrice(e.target.value)}
                      className={inputBase}
                      placeholder="e.g. 2448.00"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Validity</label>
                  <select
                    value={inValidity}
                    onChange={(e) => setInValidity(e.target.value as any)}
                    className={clsx(inputBase, "!mt-1")}
                  >
                    <option value="DAY">DAY</option>
                    <option value="IOC">IOC</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Execution sends one request and backend fans out internally. UI does not send MT5 server/password.
          </div>
        </div>
      )}

      {/* Automation */}
      {tab === "automation" && (
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

          {strategiesFetching ? (
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
                          {linked ? (
                            <span className="text-emerald-300">Linked</span>
                          ) : (
                            <span className="text-slate-300">Not linked</span>
                          )}{" "}
                          • Market: <span className="text-slate-200 font-medium">{market}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {linked ? (
                          <button
                            type="button"
                            onClick={() => onUnlink(String(s.id))}
                            disabled={unlinking || linksFetching}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-60"
                          >
                            <Unlink2 size={14} />
                            {unlinking ? "Unlinking..." : "Unlink"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onLink(s)}
                            disabled={linking || linksFetching}
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
                        Linked settings are stored in backend (lotMultiplier, reverseTrades, SL/TP copy, etc.).
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {linksFetching && <div className="mt-3 text-[11px] text-slate-500">Syncing links…</div>}
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
