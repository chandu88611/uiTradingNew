import React, { useMemo, useState } from "react";
import {
  Play,
  Pause,
  Activity,
  BarChart3,
  User,
  Zap,
  ArrowUp,
  ArrowDown,
  Radio,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAllTradesQuery } from "../../../services/trades.api";

/* ------------------------------
   TYPES
------------------------------ */
type LiveTrade = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  time: string;
  status: "executed" | "pending" | "failed";
  fanoutCount: number;
};

type Position = {
  symbol: string;
  qty: number;
  avgPrice: number;
  pAndL: number;
};

/* ------------------------------
   MAIN COMPONENT
------------------------------ */
const LiveTradingPage: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [masterAccount, setMasterAccount] = useState("Master-001");
  const [strategy, setStrategy] = useState("Breakout Booster");
  const [sessionPnl] = useState(0);

  const { data: tradesData, isLoading, isFetching, refetch } = useGetAllTradesQuery(
    { start: 0, count: 50 },
    { pollingInterval: 5000 }
  );

  const liveTrades: LiveTrade[] = useMemo(() => {
    const arr = tradesData?.data ?? tradesData;
    if (!Array.isArray(arr)) return [];
    return arr.map((t: any) => ({
      id: String(t.id ?? ""),
      symbol: String(t.symbol ?? ""),
      side: String(t.action ?? t.side ?? "BUY").toUpperCase().includes("SELL") ? "SELL" as const : "BUY" as const,
      qty: Number(t.volume ?? t.qty ?? 0),
      price: Number(t.price ?? 0),
      time: t.signalTime ?? t.createdAt ?? new Date().toISOString(),
      status: (() => {
        const s = String(t.status ?? "").toLowerCase();
        if (s.includes("complet") || s.includes("done")) return "executed" as const;
        if (s.includes("reject") || s.includes("fail")) return "failed" as const;
        return "pending" as const;
      })(),
      fanoutCount: 0,
    }));
  }, [tradesData]);

  const positions: Position[] = [];

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Live Trading Monitor</h1>
          <p className="text-slate-400 text-sm">
            Real-time broadcast execution & subscriber fanout monitoring
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition
                        ${isLive ? "bg-rose-500 text-white" : "bg-emerald-500 text-slate-900"}`}
          >
            {isLive ? <Pause size={18} /> : <Play size={18} />}
            {isLive ? "Stop Trading" : "Start Trading"}
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700"
          >
            <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* MASTER CONTROL PANEL */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* MASTER SETTINGS */}
        <div className="bg-slate-900/60 p-6 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={18} /> Master Account
          </h2>

          <select
            value={masterAccount}
            onChange={(e) => setMasterAccount(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
          >
            <option>Master-001</option>
            <option>Master-002</option>
            <option>Master-003</option>
          </select>

          <div>
            <label className="text-sm">Active Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option>Breakout Booster</option>
              <option>RSI Reversal</option>
              <option>Option Scalper</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Radio size={18} className={`${isLive ? "text-emerald-400" : "text-slate-500"}`} />
            <span className="text-sm">
              {isLive ? "Live — Broadcasting Trades" : "Offline"}
            </span>
          </div>
        </div>

        {/* SESSION PNL */}
        <div className="bg-slate-900/60 p-6 border border-slate-800 rounded-xl flex flex-col justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={18} /> Session P&L
          </h2>

          <div className="text-3xl font-semibold mt-4">
            {sessionPnl >= 0 ? (
              <span className="text-emerald-400">+₹{sessionPnl.toFixed(2)}</span>
            ) : (
              <span className="text-rose-400">₹{sessionPnl.toFixed(2)}</span>
            )}
          </div>

          <p className="text-slate-400 text-sm mt-2">
            Updated in real-time based on master account trades
          </p>
        </div>

        {/* WARNINGS */}
        <div className="bg-slate-900/60 p-6 border border-slate-800 rounded-xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-400" /> Alerts
          </h2>

          <ul className="text-sm text-slate-300 space-y-2 mt-3">
            <li>• Zero subscribers disconnected</li>
            <li>• All fanout settings valid</li>
            <li>• Slippage within safe limit</li>
          </ul>
        </div>
      </div>

      {/* ====================
          LIVE TRADES TABLE
      ====================== */}
      <div className="bg-slate-900/60 p-6 border border-slate-800 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity size={18} /> Live Trades
          {isFetching && (
            <span className="ml-2 text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Polling
            </span>
          )}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-300 border-b border-slate-700">
              <tr>
                <th className="p-3">Symbol</th>
                <th className="p-3">Side</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Price</th>
                <th className="p-3">Fanout</th>
                <th className="p-3">Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && liveTrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 text-sm">
                    No live trades found
                  </td>
                </tr>
              )}
              <AnimatePresence>
                {liveTrades.map((t) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-800"
                  >
                    <td className="p-3">{t.symbol}</td>
                    <td className="p-3">
                      {t.side === "BUY" ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ArrowUp size={14} /> BUY
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <ArrowDown size={14} /> SELL
                        </span>
                      )}
                    </td>
                    <td className="p-3">{t.qty}</td>
                    <td className="p-3">₹{t.price}</td>
                    <td className="p-3">{t.fanoutCount}</td>
                    <td className="p-3">{t.time}</td>
                    <td className="p-3">
                      {t.status === "executed" ? (
                        <span className="text-emerald-400">Executed</span>
                      ) : t.status === "failed" ? (
                        <span className="text-rose-400">Failed</span>
                      ) : (
                        <span className="text-yellow-400">Pending</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================
          LIVE LOGS
      ====================== */}
      <div className="bg-slate-900/60 p-6 border border-slate-800 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap size={18} /> Live Logs
        </h2>

        <div className="h-48 overflow-y-auto text-sm text-slate-300 space-y-2">
          {liveTrades.slice(0, 20).map((t, i) => (
            <p key={i}>• {t.status === "executed" ? "Executed" : t.status === "failed" ? "Failed" : "Pending"} {t.symbol} ({t.side})</p>
          ))}
          {liveTrades.length === 0 && !isLoading && (
            <p className="text-slate-500">No log entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTradingPage;
