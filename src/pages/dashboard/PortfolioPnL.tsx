import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, Target, Wallet } from "lucide-react";
import { useGetMyPnlQuery } from "../../services/trades.api";
import { useListMyTradingAccountsQuery } from "../../services/tradingAccounts.api";
import {
  useLazyGetZebuFundsQuery,
  useLazyGetDhanFundsQuery,
  useLazyGetMt5FundsQuery,
  useLazyGetCtraderFundsQuery,
} from "../../services/zebu.api";

const PERIODS = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];
const inr = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function PortfolioPnL() {
  const [period, setPeriod] = useState("30d");
  const { data: pnlData, isLoading } = useGetMyPnlQuery({ period });
  const summary = (pnlData as any)?.data?.summary ?? {};
  const daily: any[] = (pnlData as any)?.data?.daily ?? [];

  const { data: accounts = [] } = useListMyTradingAccountsQuery();
  // Broker-agnostic funds: pick the first account that has a funds endpoint.
  const fundsAcc = useMemo(() => {
    const supported = ["ZEBU", "DHAN", "MT5", "CT", "CTRADER"];
    return (accounts as any[]).find((a: any) => supported.includes(String(a.broker ?? "").toUpperCase()));
  }, [accounts]);
  const fundsBroker = String(fundsAcc?.broker ?? "").toUpperCase();
  const isCtrader = fundsBroker === "CT" || fundsBroker === "CTRADER";

  const [fetchZebu, zebuFunds] = useLazyGetZebuFundsQuery();
  const [fetchDhan, dhanFunds] = useLazyGetDhanFundsQuery();
  const [fetchMt5, mt5Funds] = useLazyGetMt5FundsQuery();
  const [fetchCtrader, ctraderFunds] = useLazyGetCtraderFundsQuery();

  useEffect(() => {
    if (!fundsAcc?.id) return;
    if (fundsBroker === "ZEBU") fetchZebu({ tradingAccountId: fundsAcc.id });
    else if (fundsBroker === "DHAN") fetchDhan({ tradingAccountId: fundsAcc.id });
    else if (fundsBroker === "MT5") fetchMt5({ tradingAccountId: fundsAcc.id });
    else if (isCtrader) fetchCtrader({ tradingAccountId: fundsAcc.id });
  }, [fundsAcc?.id, fundsBroker]);

  const fundsState =
    fundsBroker === "DHAN" ? dhanFunds
    : fundsBroker === "MT5" ? mt5Funds
    : isCtrader ? ctraderFunds
    : zebuFunds;
  const fundsData = fundsState.data;
  const fundsLoading = fundsState.isLoading || fundsState.isFetching;
  const zebuAcc = fundsAcc; // keep existing JSX guards working (renamed concept)

  const byDate = useMemo(() => {
    const m: Record<string, {date:string;pnl:number;trades:number;symbols:string[]}> = {};
    for (const r of daily) {
      const d = String(r.date??"").slice(0,10);
      if (!m[d]) m[d] = { date: d, pnl: 0, trades: 0, symbols: [] };
      m[d].pnl += Number(r.pnl??0); m[d].trades += Number(r.trades??0);
      if (r.symbol && !m[d].symbols.includes(r.symbol)) m[d].symbols.push(r.symbol);
    }
    return Object.values(m).sort((a,b)=>b.date.localeCompare(a.date));
  }, [daily]);
  const maxAbs = useMemo(() => Math.max(...byDate.map(r=>Math.abs(r.pnl)), 1), [byDate]);
  const totalPnl = Number(summary.totalPnl ?? 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pt-16 md:pt-28 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><BarChart3 size={24} className="text-emerald-400" />Portfolio P&amp;L</h1>
          <p className="text-slate-400 text-sm mt-1">Net profit / loss from executed trades</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.value} onClick={()=>setPeriod(p.value)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${period===p.value?"bg-emerald-600 text-white":"bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400 mb-2">Net P&amp;L</p>
          {isLoading ? <div className="h-8 bg-slate-800 rounded animate-pulse" /> : (
            <span className={`flex items-center gap-1 font-bold text-2xl ${totalPnl>=0?"text-emerald-400":"text-red-400"}`}>
              {totalPnl>=0?<TrendingUp size={20}/>:<TrendingDown size={20}/>}{totalPnl>=0?"+":"-"}{inr(totalPnl)}
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><p className="text-xs text-slate-400 mb-2">Total Trades</p><p className="text-2xl font-bold">{isLoading?"…":(summary.totalTrades??0)}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Target size={12}/>Symbols</p><p className="text-2xl font-bold">{isLoading?"…":(summary.uniqueSymbols??0)}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Wallet size={12}/>Available Cash{fundsBroker?` · ${fundsBroker}`:""}</p><p className="text-lg font-bold text-emerald-400">{!fundsAcc?"—":fundsLoading?"…":inr(fundsData?.availableCash??0)}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><p className="text-xs text-slate-400 mb-2">Margin Used</p><p className="text-lg font-bold text-amber-400">{!fundsAcc?"—":fundsLoading?"…":inr(fundsData?.marginUsed??0)}</p></div>
      </div>
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800"><h2 className="text-sm font-semibold text-slate-200">Daily Breakdown</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Symbols</th><th className="p-3 text-right">Trades</th><th className="p-3 text-right">Net P&amp;L</th><th className="p-3 w-28 text-right">Relative</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading P&amp;L data…</td></tr>}
              {!isLoading && byDate.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No completed trades in this period.</td></tr>}
              {byDate.map(r => { const pos=r.pnl>=0; const w=Math.max(Math.round((Math.abs(r.pnl)/maxAbs)*80),4); return (
                <tr key={r.date} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="p-3 text-slate-300 whitespace-nowrap text-xs">{new Date(r.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                  <td className="p-3 text-slate-400 text-xs max-w-[140px] truncate">{r.symbols.length?r.symbols.join(", "):"—"}</td>
                  <td className="p-3 text-right text-slate-300">{r.trades}</td>
                  <td className={`p-3 text-right font-semibold ${pos?"text-emerald-400":"text-red-400"}`}>{pos?"+":"-"}{inr(r.pnl)}</td>
                  <td className="p-3"><div className="flex items-center justify-end"><div className={`h-3.5 rounded-sm ${pos?"bg-emerald-500/60":"bg-red-500/60"}`} style={{width:`${w}px`}}/></div></td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
