import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, Target, Wallet } from "lucide-react";
import { useGetMyPnlQuery } from "../../services/trades.api";
import { useListMyTradingAccountsQuery } from "../../services/tradingAccounts.api";
import { useLazyGetZebuFundsQuery } from "../../services/zebu.api";

const PERIODS = [
  { label: "7 Days",   value: "7d" },
  { label: "30 Days",  value: "30d" },
  { label: "90 Days",  value: "90d" },
  { label: "All Time", value: "all" },
];

function inr(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function PnlValue({ value }: { value: number }) {
  const pos = value >= 0;
  const Icon = pos ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-1 font-bold text-2xl ${pos ? "text-emerald-400" : "text-red-400"}`}>
      <Icon size={20} />
      {pos ? "+" : "-"}{inr(value)}
    </span>
  );
}

export default function PortfolioPnL() {
  const [period, setPeriod] = useState("30d");

  const { data: pnlData, isLoading: pnlLoading } = useGetMyPnlQuery({ period });
  const summary = (pnlData as any)?.data?.summary ?? {};
  const daily: any[] = (pnlData as any)?.data?.daily ?? [];

  const { data: accounts = [] } = useListMyTradingAccountsQuery();
  const zebuAcc = useMemo(
    () => (accounts as any[]).find((a: any) => String(a.broker ?? "").toUpperCase() === "ZEBU"),
    [accounts],
  );
  const [fetchFunds, { data: fundsData, isLoading: fundsLoading }] = useLazyGetZebuFundsQuery();
  React.useEffect(() => {
    if (zebuAcc?.id) fetchFunds({ tradingAccountId: zebuAcc.id });
  }, [zebuAcc?.id]);

  const byDate = useMemo(() => {
    const map: Record<string, { date: string; pnl: number; trades: number; symbols: string[] }> = {};
    for (const row of daily) {
      const d = String(row.date ?? "").slice(0, 10);
      if (!map[d]) map[d] = { date: d, pnl: 0, trades: 0, symbols: [] };
      map[d].pnl += Number(row.pnl ?? 0);
      map[d].trades += Number(row.trades ?? 0);
      if (row.symbol && !map[d].symbols.includes(row.symbol)) map[d].symbols.push(row.symbol);
    }
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [daily]);

  const maxAbs = useMemo(() => Math.max(...byDate.map((r) => Math.abs(r.pnl)), 1), [byDate]);
  const totalPnl = Number(summary.totalPnl ?? 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pt-16 md:pt-28 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 size={24} className="text-emerald-400" />
            Portfolio P&amp;L
          </h1>
          <p className="text-slate-400 text-sm mt-1">Net profit / loss from executed trades</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                period === p.value ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400 mb-2">Net P&amp;L</p>
          {pnlLoading ? <div className="h-8 bg-slate-800 rounded animate-pulse" /> : <PnlValue value={totalPnl} />}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400 mb-2">Total Trades</p>
          <p className="text-2xl font-bold">{pnlLoading ? "…" : (summary.totalTrades ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Target size={12} />Symbols</p>
          <p className="text-2xl font-bold">{pnlLoading ? "…" : (summary.uniqueSymbols ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Wallet size={12} />Available Cash</p>
          <p className="text-lg font-bold text-emerald-400">
            {!zebuAcc ? "—" : fundsLoading ? "…" : inr(fundsData?.availableCash ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400 mb-2">Margin Used</p>
          <p className="text-lg font-bold text-amber-400">
            {!zebuAcc ? "—" : fundsLoading ? "…" : inr(fundsData?.marginUsed ?? 0)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Daily Breakdown</h2>
          {!pnlLoading && byDate.length > 0 && (
            <span className="text-xs text-slate-400">{byDate.length} trading day{byDate.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Symbols</th>
                <th className="p-3 text-right">Trades</th>
                <th className="p-3 text-right">Net P&amp;L</th>
                <th className="p-3 w-28 text-right">Relative</th>
              </tr>
            </thead>
            <tbody>
              {pnlLoading && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading P&amp;L data…</td></tr>
              )}
              {!pnlLoading && byDate.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No completed trades in this period.
                  </td>
                </tr>
              )}
              {byDate.map((r) => {
                const pos = r.pnl >= 0;
                const barW = Math.max(Math.round((Math.abs(r.pnl) / maxAbs) * 80), 4);
                return (
                  <tr key={r.date} className="border-t border-slate-800 hover:bg-slate-900/40">
                    <td className="p-3 text-slate-300 whitespace-nowrap text-xs">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3 text-slate-400 text-xs max-w-[140px] truncate">
                      {r.symbols.length > 0 ? r.symbols.join(", ") : "—"}
                    </td>
                    <td className="p-3 text-right text-slate-300">{r.trades}</td>
                    <td className={`p-3 text-right font-semibold ${pos ? "text-emerald-400" : "text-red-400"}`}>
                      {pos ? "+" : "-"}{inr(r.pnl)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end">
                        <div
                          className={`h-3.5 rounded-sm ${pos ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                          style={{ width: `${barW}px` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
