import React, { useEffect, useState } from "react";
import {
  Radio,
  Users,
  Activity,
  Wifi,
  HeartPulse,
  Server,
  AlertTriangle,
  Zap,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion } from "framer-motion";

/* ------------------------------
   MOCK TYPES
------------------------------ */
type SubscriberStatus = {
  id: string;
  name: string;
  broker: string;
  balance: number;
  status: "connected" | "disconnected" | "syncing";
  lastSync: string;
  lastTrade: string;
};

type EngineStatus = {
  engine: "MasterNode" | "FanoutQueue" | "BrokerGateway" | "PythonWorker";
  status: "healthy" | "warning" | "critical";
  delayMs: number;
  uptime: string;
};

type LastTrade = {
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
  fanout: number;
  time: string;
};

/* ------------------------------
   MAIN COMPONENT
------------------------------ */
const CopyTradingStatusPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberStatus[]>([]);
  const [engine, setEngine] = useState<EngineStatus[]>([]);
  const [lastTrades, setLastTrades] = useState<LastTrade[]>([]);

  /* Simulate Real-Time Updates */
  useEffect(() => {
    // mock subscribers
    setSubscribers([
      {
        id: "c1",
        name: "Rahul Shah",
        broker: "Zerodha",
        balance: 85000,
        status: "connected",
        lastSync: "5 sec ago",
        lastTrade: "10:32:11 AM",
      },
      {
        id: "c2",
        name: "Amit Verma",
        broker: "Angel One",
        balance: 42000,
        status: "syncing",
        lastSync: "12 sec ago",
        lastTrade: "10:31:54 AM",
      },
      {
        id: "c3",
        name: "Manoj Singh",
        broker: "Dhan",
        balance: 102000,
        status: "disconnected",
        lastSync: "2 min ago",
        lastTrade: "10:25:22 AM",
      },
    ]);

    // mock engine nodes
    setEngine([
      {
        engine: "MasterNode",
        status: "healthy",
        delayMs: 12,
        uptime: "2h 14m",
      },
      {
        engine: "FanoutQueue",
        status: "healthy",
        delayMs: 3,
        uptime: "2h 14m",
      },
      {
        engine: "BrokerGateway",
        status: "warning",
        delayMs: 121,
        uptime: "2h 12m",
      },
      {
        engine: "PythonWorker",
        status: "healthy",
        delayMs: 8,
        uptime: "2h 14m",
      },
    ]);

    // mock live last trades
    const interval = setInterval(() => {
      const newTrade: LastTrade = {
        symbol: ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS"][Math.floor(Math.random() * 4)],
        side: Math.random() > 0.5 ? "BUY" : "SELL",
        price: parseFloat((350 + Math.random() * 50).toFixed(2)),
        qty: Math.floor(Math.random() * 10) + 1,
        fanout: Math.floor(Math.random() * 20) + 5,
        time: new Date().toLocaleTimeString(),
      };
      setLastTrades((prev) => [newTrade, ...prev.slice(0, 10)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* Status Colors */
  const statusColor = {
    connected: "text-emerald-400",
    syncing: "text-yellow-400",
    disconnected: "text-rose-400",

    healthy: "text-emerald-400",
    warning: "text-yellow-400",
    critical: "text-rose-400",
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-6">

      {/* TOP HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Copy Trading Status</h1>
        <p className="text-sm text-slate-400">
          Monitor engine health, subscriber connectivity & fanout execution in real-time.
        </p>
      </div>

      {/* SYSTEM OVERVIEW GRID */}
      <div className="grid lg:grid-cols-4 gap-6">

        {engine.map((e) => (
          <motion.div
            key={e.engine}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{e.engine}</h2>
              <HeartPulse className={`w-5 h-5 ${statusColor[e.status]}`} />
            </div>

            <div className="text-slate-300 text-sm mt-2 space-y-1">
              <p>
                <span className="text-slate-400">Status:</span>{" "}
                <span className={statusColor[e.status]}>{e.status}</span>
              </p>
              <p>
                <span className="text-slate-400">Delay:</span> {e.delayMs} ms
              </p>
              <p>
                <span className="text-slate-400">Uptime:</span> {e.uptime}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SUBSCRIBER STATUS TABLE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Users size={18} /> Subscriber Connectivity
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-slate-300">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Broker</th>
                <th className="p-3 text-left">Balance</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Last Sync</th>
                <th className="p-3 text-left">Last Trade</th>
              </tr>
            </thead>

            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-slate-800">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.broker}</td>
                  <td className="p-3">₹{s.balance.toLocaleString()}</td>
                  <td className={`p-3 font-medium ${statusColor[s.status]}`}>
                    {s.status}
                  </td>
                  <td className="p-3">{s.lastSync}</td>
                  <td className="p-3">{s.lastTrade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LAST TRADES FEED */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity size={18} /> Latest Trades Broadcasted
        </h2>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {lastTrades.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between"
            >
              <div>
                <p className="text-sm font-medium">{t.symbol}</p>
                <p className="text-xs text-slate-400">{t.time}</p>
              </div>

              <div className="flex items-center gap-3">
                {t.side === "BUY" ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ArrowUp size={14} /> BUY
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <ArrowDown size={14} /> SELL
                  </span>
                )}

                <span className="text-slate-300 text-xs">
                  {t.qty} qty @ ₹{t.price}
                </span>
                <span className="text-slate-400 text-xs">
                  fanout: {t.fanout}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CopyTradingStatusPage;
