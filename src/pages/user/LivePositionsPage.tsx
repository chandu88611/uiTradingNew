import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Wallet,
  Gauge,
} from "lucide-react";
import { motion } from "framer-motion";
import { useListMyTradingAccountsQuery } from "../../services/tradingAccounts.api";
import { useGetZebuPositionsQuery } from "../../services/zebu.api";

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
  const { data: accounts = [] } = useListMyTradingAccountsQuery();
  const zebuAcc = (accounts as any[]).find(
    (a) => String(a.broker ?? "").toUpperCase() === "ZEBU"
  );
  const { data: posData, isLoading, isFetching, refetch } =
    useGetZebuPositionsQuery(
      { tradingAccountId: Number(zebuAcc?.id ?? 0) },
      { skip: !zebuAcc?.id, pollingInterval: 5000 }
    );

  const positions: Position[] = useMemo(
    () =>
      ((posData as any)?.data ?? [])
        .map((p: any) => ({
          id: String(p.tsym ?? p.tradingSymbol ?? Math.random()),
          symbol: String(p.tsym ?? p.tradingSymbol ?? ""),
          qty: Number(p.netqty ?? p.quantity ?? 0),
          avgPrice: Number(p.netavgprc ?? p.averagePrice ?? 0),
          currentPrice: Number(p.lp ?? p.lastPrice ?? 0),
          pnl: Number(p.urmtom ?? p.rpnl ?? p.pnl ?? 0),
          broker: "ZEBU",
          type:
            Number(p.netqty ?? p.quantity ?? 0) >= 0 ? "LONG" : "SHORT",
        }))
        .filter((p: any) => p.symbol),
    [posData]
  );

  const loading = isLoading || isFetching;

  const refresh = () => {
    if (zebuAcc?.id) refetch();
  };

  // Dashboard metrics
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalMargin = positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.qty * 0.15), 0);
  const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.qty), 0);

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Live Open Positions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitoring your real-time trades.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading || !zebuAcc?.id}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

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

      {/* POSITIONS TABLE */}
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
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  Loading positions…
                </td>
              </tr>
            )}

            {!loading && positions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No open positions. Connect a Zebu account to see live
                  positions.
                </td>
              </tr>
            )}

            {!loading &&
              positions.map((p) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default LivePositionsPage;
