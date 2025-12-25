// src/pages/user/TradingDashboardPage.tsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  History,
  RefreshCw,
  Search,
  CandlestickChart,
  XCircle,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  useGetTradingviewAlertsHistoryQuery,
  type TradingviewAlertSnapshot,
} from "../../services/tradingApi";
import { useNavigate } from "react-router-dom";

type Mode = "lastMinutes" | "range";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const sectionBase = "rounded-2xl border border-slate-800 bg-slate-900/40 p-6";

function isoLocalStartOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function isoLocalEndOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDatetimeLocalValue(v: string) {
  return new Date(v).toISOString();
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "rose" | "yellow" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
      : tone === "rose"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/25"
      : tone === "yellow"
      ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/25"
      : "bg-slate-500/10 text-slate-200 border-slate-500/20";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        toneClass
      )}
    >
      {children}
    </span>
  );
}

function actionTone(action?: string | null) {
  const a = String(action || "").toUpperCase();
  if (a.includes("BUY") || a.includes("LONG")) return "emerald";
  if (a.includes("SELL") || a.includes("SHORT")) return "rose";
  if (a.includes("CLOSE")) return "yellow";
  return "slate";
}

function safeNum(v: any) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function fmtPrice(v: any) {
  const n = safeNum(v);
  if (n === null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function fmtDateTimeParts(iso?: string | null) {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString(),
  };
}

/**
 * ✅ Your API returns lower-case keys.
 * Normalize them to UI.
 */
function normalizeRow(r: any): TradingviewAlertSnapshot {
  return {
    id: r?.id,
    jobId: r?.jobid ?? r?.jobId,
    ticker: r?.ticker,
    exchange: r?.exchange,
    interval: r?.interval,

    barTime: r?.bartime ?? r?.barTime,
    alertTime: r?.alerttime ?? r?.alertTime,

    open: r?.open,
    close: r?.close,
    high: r?.high,
    low: r?.low,
    volume: r?.volume,

    currency: r?.currency,
    basecurrency: r?.basecurrency,

    createdAt: r?.createdat ?? r?.createdAt,
    updatedAt: r?.updatedat ?? r?.updatedAt,

    action: r?.action ?? null,

    ...r,
  } as any;
}

/** ---------- UI ONLY Types (for future integration) ---------- */

type UiOpenTrade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number; // + / -
  openedAt: string; // ISO
  accountLabel?: string; // later multi-account
};

type UiClosedTrade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  openedAt: string;
  closedAt: string;
  accountLabel?: string;
};

/**
 * UI placeholders
 * Later: replace these with API data.
 */
const MOCK_OPEN_TRADES: UiOpenTrade[] = [
  {
    id: "pos_1",
    symbol: "BTCUSDT",
    side: "BUY",
    qty: 0.01,
    entryPrice: 43000,
    currentPrice: 43120,
    pnl: 1.2,
    openedAt: new Date().toISOString(),
    accountLabel: "Account #1",
  },
];

const MOCK_CLOSED_TRADES: UiClosedTrade[] = [
  {
    id: "hist_1",
    symbol: "BTCUSDT",
    side: "SELL",
    qty: 0.01,
    entryPrice: 43150,
    exitPrice: 43080,
    pnl: 0.7,
    openedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    closedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    accountLabel: "Account #1",
  },
];

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={clsx("px-3 py-2 text-sm text-slate-100", className)}>{children}</td>;
}

function NotConnectedNote({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
      <span className="text-slate-200 font-semibold">UI Only:</span> {text}
    </div>
  );
}

export default function TradingDashboardPage() {


    const navigate = useNavigate();

const onBack = () => {
  // if user came from some page, go back
  if (window.history.length > 1) navigate(-1);
  // fallback
  else navigate("/profile");
};
  const [mode, setMode] = useState<Mode>("lastMinutes");
  const [activeView, setActiveView] = useState<"signals" | "open" | "history">("signals");

  // lastMinutes mode
  const [lastMinutes, setLastMinutes] = useState<number>(60);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // range mode
  const [from, setFrom] = useState<string>(isoLocalStartOfDay());
  const [to, setTo] = useState<string>(isoLocalEndOfDay());
  const [ticker, setTicker] = useState<string>("");
  const [exchange, setExchange] = useState<string>("");

  const queryArgs = useMemo(() => {
    if (mode === "lastMinutes") return { lastMinutes, page, limit };
    return {
      from,
      to,
      ticker: ticker.trim() || undefined,
      exchange: exchange.trim() || undefined,
      page,
      limit,
    };
  }, [mode, lastMinutes, page, limit, from, to, ticker, exchange]);

  // ✅ TradingView alerts history API (signals)
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetTradingviewAlertsHistoryQuery(queryArgs as any);

  const apiData = (data as any)?.data ?? {};
  const rowsRaw = Array.isArray(apiData?.rows) ? apiData.rows : [];
  const rows: TradingviewAlertSnapshot[] = useMemo(
    () => rowsRaw.map(normalizeRow),
    [rowsRaw]
  );

  const total: number = Number(apiData?.total ?? rows.length);
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  const busy = isLoading || isFetching;

  // UI placeholders for trades (until APIs are ready)
  const openTrades = MOCK_OPEN_TRADES;
  const closedTrades = MOCK_CLOSED_TRADES;

  const onRefresh = async () => {
    try {
      await (refetch() as any);
      toast.success("Refreshed");
    } catch {
      toast.error("Refresh failed");
    }
  };

  const onCopyJson = async (row: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(row, null, 2));
      toast.success("Copied JSON");
    } catch {
      toast.error("Copy failed");
    }
  };

  const onCloseTradeUiOnly = async () => {
    toast.info("Close trade API not connected yet (UI only).");
  };

  return (
    <div className="min-h-screen px-4 pt-16 md:pt-28 md:px-6 pb-10 bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
      {/* Header */}
<div className="flex items-start justify-between gap-4 flex-wrap">
  <div className="flex items-start gap-3">
    <button
      onClick={onBack}
      className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
    >
      <ArrowLeft size={16} />
      Back
    </button>

    <div>
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Activity className="text-emerald-400" size={20} />
        Trading Workspace
      </h1>
      <p className="text-sm text-slate-400 mt-1">
        Signals (TradingView alerts) + Open trades + Trade history.
      </p>
    </div>
  </div>

  <button
    onClick={onRefresh}
    className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
  >
    <RefreshCw size={16} />
    {busy ? "Refreshing..." : "Refresh"}
  </button>
</div>


        {/* Top switch tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView("signals")}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
              activeView === "signals"
                ? "bg-emerald-500 text-slate-950 border-emerald-500"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            )}
          >
            <CandlestickChart size={16} />
            Signals
          </button>

          <button
            onClick={() => setActiveView("open")}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
              activeView === "open"
                ? "bg-emerald-500 text-slate-950 border-emerald-500"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            )}
          >
            <Wallet size={16} />
            Current Trades
          </button>

          <button
            onClick={() => setActiveView("history")}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
              activeView === "history"
                ? "bg-emerald-500 text-slate-950 border-emerald-500"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            )}
          >
            <History size={16} />
            Trades History
          </button>
        </div>

        {/* Filters (only for Signals right now) */}
        {activeView === "signals" && (
          <section className={sectionBase}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Filter size={16} className="text-slate-400" />
                Signals Filters
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMode("lastMinutes");
                    setPage(1);
                  }}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm border transition",
                    mode === "lastMinutes"
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  )}
                >
                  Last Minutes
                </button>
                <button
                  onClick={() => {
                    setMode("range");
                    setPage(1);
                  }}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm border transition",
                    mode === "range"
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  )}
                >
                  Date Range
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {mode === "lastMinutes" ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      Last Minutes
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lastMinutes}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setLastMinutes(Number.isFinite(v) ? v : 60);
                        setPage(1);
                      }}
                      className={inputBase}
                      placeholder="60"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300">Page</label>
                    <input
                      type="number"
                      min={1}
                      value={page}
                      onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300">Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={limit}
                      onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 20))}
                      className={inputBase}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => {
                        setLastMinutes(60);
                        setPage(1);
                        setLimit(20);
                      }}
                      className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm hover:bg-slate-700"
                    >
                      Reset
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      From
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(from)}
                      onChange={(e) => {
                        setFrom(fromDatetimeLocalValue(e.target.value));
                        setPage(1);
                      }}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      To
                    </label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(to)}
                      onChange={(e) => {
                        setTo(fromDatetimeLocalValue(e.target.value));
                        setPage(1);
                      }}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Search size={14} className="text-slate-400" />
                      Ticker (optional)
                    </label>
                    <input
                      value={ticker}
                      onChange={(e) => {
                        setTicker(e.target.value);
                        setPage(1);
                      }}
                      className={inputBase}
                      placeholder="BTCUSDT"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Search size={14} className="text-slate-400" />
                      Exchange (optional)
                    </label>
                    <input
                      value={exchange}
                      onChange={(e) => {
                        setExchange(e.target.value);
                        setPage(1);
                      }}
                      className={inputBase}
                      placeholder="BINANCE"
                    />
                  </div>
                </>
              )}
            </div>

            {isError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                Failed to load signals.
                <span className="ml-2 text-rose-300/90">
                  {(error as any)?.data?.message || (error as any)?.message || ""}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Signals Table */}
        {activeView === "signals" && (
          <section className={sectionBase}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <History size={16} className="text-slate-400" />
                <h2 className="text-lg font-semibold">Signals (TradingView Alerts)</h2>
                <span className="text-xs text-slate-500">
                  {busy ? "Loading…" : `${rows.length} rows • total ${total}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || busy}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-slate-400">
                  Page <span className="text-slate-200 font-semibold">{page}</span> /{" "}
                  <span className="text-slate-200 font-semibold">{totalPages}</span>
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={busy || page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-900/70">
                  <tr>
                    <Th>Action</Th>
                    <Th>Ticker</Th>
                    <Th>Exchange</Th>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Close</Th>
                    <Th>Interval</Th>
                    <Th>Job</Th>
                    <Th  >Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {busy ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="px-3 py-3" colSpan={9}>
                          <div className="h-4 w-full animate-pulse rounded bg-slate-800/70" />
                        </td>
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr className="border-t border-slate-800">
                      <td className="px-3 py-6 text-slate-400" colSpan={9}>
                        No signals found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => {
                      const tone = actionTone((r as any)?.action);
                      const { date, time } = fmtDateTimeParts(
                        (r as any)?.alertTime || (r as any)?.createdAt
                      );

                      return (
                        <motion.tr
                          key={(r as any)?.id ?? `${idx}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-t border-slate-800 hover:bg-slate-900/30"
                        >
                          <Td>
                            <Badge tone={tone as any}>
                              {String((r as any)?.action || "—").toUpperCase()}
                            </Badge>
                          </Td>
                          <Td className="font-semibold">{(r as any)?.ticker || "—"}</Td>
                          <Td className="text-slate-200">{(r as any)?.exchange || "—"}</Td>
                          <Td className="text-slate-300">{date}</Td>
                          <Td className="text-slate-300">{time}</Td>
                          <Td>{fmtPrice((r as any)?.close)}</Td>
                          <Td className="text-slate-300">{(r as any)?.interval || "—"}</Td>
                          <Td className="text-slate-400">
                            {(r as any)?.jobId ? `#${(r as any)?.jobId}` : "—"}
                          </Td>
                          <Td className="text-right">
                            <button
                              onClick={() => onCopyJson(r)}
                              className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                            >
                              Copy JSON
                            </button>
                          </Td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <NotConnectedNote text="This section is live (TradingView alerts history API is connected). Action will show once your backend sends action field (BUY/SELL/CLOSE)." />
          </section>
        )}

        {/* Current Trades (UI Only) */}
        {activeView === "open" && (
          <section className={sectionBase}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-slate-400" />
                <h2 className="text-lg font-semibold">Current Trades</h2>
                <span className="text-xs text-slate-500">{openTrades.length} open</span>
              </div>

              <button
                onClick={() => toast.info("Open positions API not connected yet (UI only).")}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-900/70">
                  <tr>
                    <Th>Side</Th>
                    <Th>Symbol</Th>
                    <Th>Qty</Th>
                    <Th>Entry</Th>
                    <Th>Current</Th>
                    <Th>PnL</Th>
                    <Th>Opened</Th>
                    <Th>Account</Th>
                    <Th  >Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {openTrades.length === 0 ? (
                    <tr className="border-t border-slate-800">
                      <td colSpan={9} className="px-3 py-6 text-slate-400">
                        No open trades.
                      </td>
                    </tr>
                  ) : (
                    openTrades.map((t) => {
                      const tone = t.side === "BUY" ? "emerald" : "rose";
                      const { date, time } = fmtDateTimeParts(t.openedAt);
                      const pnlTone = t.pnl >= 0 ? "text-emerald-300" : "text-rose-300";

                      return (
                        <tr key={t.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                          <Td>
                            <Badge tone={tone as any}>{t.side}</Badge>
                          </Td>
                          <Td className="font-semibold">{t.symbol}</Td>
                          <Td>{t.qty}</Td>
                          <Td>{fmtPrice(t.entryPrice)}</Td>
                          <Td>{fmtPrice(t.currentPrice)}</Td>
                          <Td className={clsx("font-semibold", pnlTone)}>
                            {t.pnl >= 0 ? `+${t.pnl}` : `${t.pnl}`}
                          </Td>
                          <Td className="text-slate-300">
                            {date} • {time}
                          </Td>
                          <Td className="text-slate-400">{t.accountLabel || "—"}</Td>
                          <Td className="text-right">
                            <button
                              onClick={onCloseTradeUiOnly}
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/25 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                            >
                              <XCircle size={14} />
                              Close
                            </button>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <NotConnectedNote text="Open positions + close-trade endpoints are not integrated yet. Button currently shows a toast. Later we’ll connect: GET /positions (open) + POST /positions/:id/close." />
          </section>
        )}

        {/* Trades History (UI Only) */}
        {activeView === "history" && (
          <section className={sectionBase}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <History size={16} className="text-slate-400" />
                <h2 className="text-lg font-semibold">Trades History</h2>
                <span className="text-xs text-slate-500">{closedTrades.length} records</span>
              </div>

              <button
                onClick={() => toast.info("Trade history API not connected yet (UI only).")}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-900/70">
                  <tr>
                    <Th>Side</Th>
                    <Th>Symbol</Th>
                    <Th>Qty</Th>
                    <Th>Entry</Th>
                    <Th>Exit</Th>
                    <Th>PnL</Th>
                    <Th>Opened</Th>
                    <Th>Closed</Th>
                    <Th>Account</Th>
                    <Th  >Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.length === 0 ? (
                    <tr className="border-t border-slate-800">
                      <td colSpan={10} className="px-3 py-6 text-slate-400">
                        No trade history yet.
                      </td>
                    </tr>
                  ) : (
                    closedTrades.map((t) => {
                      const tone = t.side === "BUY" ? "emerald" : "rose";
                      const pnlTone = t.pnl >= 0 ? "text-emerald-300" : "text-rose-300";
                      const opened = fmtDateTimeParts(t.openedAt);
                      const closed = fmtDateTimeParts(t.closedAt);

                      return (
                        <tr key={t.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                          <Td>
                            <Badge tone={tone as any}>{t.side}</Badge>
                          </Td>
                          <Td className="font-semibold">{t.symbol}</Td>
                          <Td>{t.qty}</Td>
                          <Td>{fmtPrice(t.entryPrice)}</Td>
                          <Td>{fmtPrice(t.exitPrice)}</Td>
                          <Td className={clsx("font-semibold", pnlTone)}>
                            {t.pnl >= 0 ? `+${t.pnl}` : `${t.pnl}`}
                          </Td>
                          <Td className="text-slate-300">{opened.date} • {opened.time}</Td>
                          <Td className="text-slate-300">{closed.date} • {closed.time}</Td>
                          <Td className="text-slate-400">{t.accountLabel || "—"}</Td>
                          <Td className="text-right">
                            <button
                              onClick={() => onCopyJson(t)}
                              className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                            >
                              Copy JSON
                            </button>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <NotConnectedNote text="Trade history endpoint not integrated yet. Later we’ll connect: GET /trades/history?from&to&page&limit." />
          </section>
        )}
      </div>
    </div>
  );
}
