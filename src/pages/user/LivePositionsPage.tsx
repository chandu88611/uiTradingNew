import React, { useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  X,
  RefreshCcw,
  Wallet,
  Gauge,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetAllTradesQuery } from "../../services/trades.api";
import { useLazyGetZebuPositionsQuery } from "../../services/zebu.api";
import { useListMyTradingAccountsQuery } from "../../services/tradingAccounts.api";

type Position = {
  id: string;
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  broker: string;
  type: "LONG" | "SHORT";
};

const LivePositionsPage: React.FC = () => {
  const { data: tradesData, isLoading: tradesLoading, refetch } = useGetAllTradesQuery({ start: 0, count: 20 });
  const { data: accounts = [] } = useListMyTradingAccountsQuery();
  const zebuAccount = accounts.find((a: any) => String(a.broker ?? "").toUpperCase() === "ZEBU");

  const [fetchPositions, { data: zebuPositionsData, isLoading: positionsLoading }] = useLazyGetZebuPositionsQuery();

  useEffect(() => {
    if (zebuAccount?.id) {
      fetchPositions({ tradingAccountId: zebuAccount.id });
    }
  }, [zebuAccount?.id]);

  const isLoading = tradesLoading || positionsLoading;

  const positions: Position[] = useMemo(() => {
    if (zebuAccount?.id) {
      const zebuPositions = zebuPositionsData?.data ?? [];
      return zebuPositions
        .map((p: any) => ({
          id: String(p.token ?? p.tradingSymbol ?? Math.random()),
          symbol: String(p.tradingSymbol ?? p.tsym ?? ""),
          qty: Number(p.quantity ?? p.netQty ?? p.qty ?? 0),
          avgPrice: Number(p.averagePrice ?? p.avgprc ?? p.avgPrice ?? 0),
          currentPrice: Number(p.lastPrice ?? p.lp ?? p.currentPrice ?? 0),
          pnl: Number(p.pnl ?? p.unrealizedPnl ?? 0),
          broker: "ZEBU",
          type: Number(p.quantity ?? 0) >= 0 ? "LONG" as const : "SHORT" as const,
        }))
        .filter((p: Position) => p.qty !== 0 || p.symbol !== "");
    }

    const arr = tradesData?.data ?? tradesData;
    if (!Array.isArray(arr)) return [];
    // Show recent pending trades as "open positions" approximation
    return arr
      .filter((t: any) => {
        const status = String(t.status ?? "").toLowerCase();
        return status.includes("pending") || status.includes("open") || status.includes("progress");
      })
      .slice(0, 10)
      .map((t: any) => ({
        id: String(t.id ?? ""),
        symbol: String(t.symbol ?? ""),
        qty: Number(t.volume ?? t.qty ?? 0),
        avgPrice: Number(t.price ?? t.avgPrice ?? 0),
        currentPrice: Number(t.price ?? t.avgPrice ?? 0),
        pnl: 0,
        broker: String(t.brokerCode ?? t.broker ?? ""),
        type: (String(t.action ?? t.side ?? "BUY").toUpperCase().includes("SELL") ? "SHORT" : "LONG") as "LONG" | "SHORT",
      }));
  }, [tradesData, zebuPositionsData, zebuAccount?.id]);

  // Dashboard metrics
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalMargin = positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.qty * 0.15), 0);
  const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.qty), 0);

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Live Open Positions</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoring your real-time trades.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
        >
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>
      {zebuAccount && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          Showing Zebu positions. Connect additional brokers to see more.
        </div>
      )}
      {isLoading && <p className="text-xs text-slate-400">Loading positions…</p>}

      {/* METRIC CARDS */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Total PnL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center gap-4"
        >
          <TrendingUp className="text-emerald-400" size={32} />
          <div>
            <p className="text-sm text-slate-400">Total P/L</p>
            <h2
              className={`text-xl font-semibold ${
                totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              ₹{totalPnl.toFixed(2)}
            </h2>
          </div>
        </motion.div>

        {/* Margin Used */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center gap-4"
        >
          <Wallet className="text-blue-400" size={32} />
          <div>
            <p className="text-sm text-slate-400">Margin Used</p>
            <h2 className="text-xl font-semibold text-blue-400">
              ₹{totalMargin.toFixed(0)}
            </h2>
          </div>
        </motion.div>

        {/* Exposure */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center gap-4"
        >
          <Gauge className="text-orange-400" size={32} />
          <div>
            <p className="text-sm text-slate-400">Total Exposure</p>
            <h2 className="text-xl font-semibold text-orange-400">
              ₹{totalExposure.toFixed(0)}
            </h2>
          </div>
        </motion.div>
      </div>

      {/* EMPTY STATE */}
      {!isLoading && positions.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-300 font-medium">No open positions.</p>
          <p className="text-slate-500 text-sm mt-1">Trades with pending or in-progress status will appear here.</p>
        </div>
      )}

      {/* POSITIONS TABLE */}
      {positions.length > 0 && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-x-auto"
      >
        <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl">
          <thead className="bg-slate-900/70 border-b border-slate-800">
            <tr className="text-left text-slate-300">
              <th className="p-3">Symbol</th>
              <th className="p-3">Type</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Avg Price</th>
              <th className="p-3">LTP</th>
              <th className="p-3">Broker</th>
              <th className="p-3 text-right">P/L</th>
              <th className="p-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {positions.map((p) => (
              <tr
                key={p.id}
                className="border-b border-slate-800 hover:bg-slate-800/40"
              >
                <td className="p-3 font-medium">{p.symbol}</td>

                <td className="p-3">
                  {p.type === "LONG" ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingUp size={16} /> LONG
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <TrendingDown size={16} /> SHORT
                    </span>
                  )}
                </td>

                <td className="p-3">{p.qty}</td>
                <td className="p-3">₹{p.avgPrice}</td>

                <td className="p-3 text-blue-400">{p.currentPrice.toFixed(2)}</td>
                <td className="p-3">{p.broker}</td>

                <td
                  className={`p-3 text-right font-semibold ${
                    p.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  ₹{p.pnl.toFixed(2)}
                </td>

                {/* CLOSE BUTTON */}
                <td className="p-3 text-right">
                  <button
                    onClick={() => refetch()}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-1"
                  >
                    <X size={14} /> Close
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      )}
    </div>
  );
};

export default LivePositionsPage;
