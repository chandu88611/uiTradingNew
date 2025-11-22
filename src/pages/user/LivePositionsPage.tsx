import React, { useEffect, useState } from "react";
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

const initialPositions: Position[] = [
  {
    id: "P1",
    symbol: "BANKNIFTY24FEBFUT",
    qty: 25,
    avgPrice: 49200,
    currentPrice: 49320,
    pnl: 3000,
    broker: "Zerodha",
    type: "LONG",
  },
  {
    id: "P2",
    symbol: "NIFTY24FEBFUT",
    qty: 50,
    avgPrice: 22150,
    currentPrice: 22110,
    pnl: -2000,
    broker: "Dhan",
    type: "SHORT",
  },
  {
    id: "P3",
    symbol: "RELIANCE",
    qty: 20,
    avgPrice: 2630,
    currentPrice: 2645,
    pnl: 300,
    broker: "Zebu",
    type: "LONG",
  },
];

const LivePositionsPage: React.FC = () => {
  const [positions, setPositions] = useState(initialPositions);

  // mock live updates every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => {
          const change = (Math.random() - 0.5) * 20;
          const newPrice = Math.max(10, p.currentPrice + change);
          const newPnl =
            p.type === "LONG"
              ? (newPrice - p.avgPrice) * p.qty
              : (p.avgPrice - newPrice) * p.qty;

          return {
            ...p,
            currentPrice: newPrice,
            pnl: Number(newPnl.toFixed(2)),
          };
        })
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const closePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  // Dashboard metrics
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalMargin = positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.qty * 0.15), 0);
  const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.avgPrice * p.qty), 0);

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Live Open Positions</h1>
        <p className="text-slate-400 text-sm mt-1">Monitoring your real-time trades.</p>
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
                    onClick={() => closePosition(p.id)}
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
    </div>
  );
};

export default LivePositionsPage;
