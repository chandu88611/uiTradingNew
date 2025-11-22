import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCcw,
  Power,
  ArrowLeft,
  Clock,
  Activity,
  User,
} from "lucide-react";

const BROKER_LOGOS: any = {
  zerodha: "/brokers/zerodha.png",
  zebu: "/brokers/zebu.png",
  dhan: "/brokers/dhan.png",
};

const BROKER_COLORS: any = {
  zerodha: "text-sky-400",
  zebu: "text-purple-400",
  dhan: "text-yellow-400",
};

type BrokerStatus = "live" | "expired" | "error";

const BrokerManagePage = () => {
  const { broker } = useParams();
  const navigate = useNavigate();

  // Mock state
  const [status, setStatus] = useState<BrokerStatus>("live");
  const [expiry, setExpiry] = useState(3600); // seconds left
  const [latestOrders, setLatestOrders] = useState([
    { symbol: "NIFTY24JANFUT", qty: 50, side: "BUY", time: "10:24 AM" },
    { symbol: "BANKNIFTY24JANFUT", qty: 25, side: "SELL", time: "10:06 AM" },
  ]);

  const clientId = "AB1234";

  // Expiry countdown
  useEffect(() => {
    if (expiry <= 0) {
      setStatus("expired");
      return;
    }
    const t = setInterval(() => setExpiry((e) => e - 1), 1000);
    return () => clearInterval(t);
  }, [expiry]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const reconnect = () => {
    setStatus("live");
    setExpiry(3600);
  };

  const refreshToken = () => {
    setStatus("live");
    setExpiry(7200);
  };

  const disconnect = () => {
    navigate("/user/brokers");
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 ">

      {/* Back */}
      <button
        onClick={() => navigate("/user/brokers")}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} /> Back to Brokers
      </button>

      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <img
              src={BROKER_LOGOS[broker!]}
              className="h-14 w-14 rounded-xl bg-slate-800 p-2"
            />

            <div>
              <h1
                className={`text-2xl font-bold ${BROKER_COLORS[broker!]}`}
              >
                {broker?.toUpperCase()}
              </h1>
              <p className="text-slate-400 text-sm">
                Manage your broker connection
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === "live" && (
                <CheckCircle2 size={28} className="text-emerald-400" />
              )}
              {status === "expired" && (
                <AlertTriangle size={28} className="text-yellow-400" />
              )}
              {status === "error" && (
                <XCircle size={28} className="text-rose-400" />
              )}

              <div>
                <p className="text-slate-400 text-xs">Connection Status</p>
                <p className="text-lg font-semibold capitalize">
                  {status}
                </p>
              </div>
            </div>

            {status === "live" && (
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity size={20} className="animate-pulse" />
                <span className="text-sm">Live</span>
              </div>
            )}
          </div>

          {/* Expiry */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <Clock size={18} className="text-emerald-400" />
            <div>
              <p className="text-xs text-slate-400">Token Expires In</p>
              <p className="font-medium">{formatTime(expiry)}</p>
            </div>
          </div>

          {/* Client ID */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
            <User size={18} className="text-emerald-400" />
            <div>
              <p className="text-xs text-slate-400">Client ID</p>
              <p className="font-medium">{clientId}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={refreshToken}
              className="px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 flex items-center gap-2 text-sm"
            >
              <RefreshCcw size={16} /> Refresh Token
            </button>

            <button
              onClick={reconnect}
              className="px-4 py-2 bg-emerald-500 text-slate-900 rounded-xl hover:bg-emerald-400 flex items-center gap-2 text-sm"
            >
              Reconnect
            </button>

            <button
              onClick={disconnect}
              className="px-4 py-2 bg-rose-500 text-slate-900 rounded-xl hover:bg-rose-400 flex items-center gap-2 text-sm"
            >
              <Power size={16} /> Disconnect
            </button>
          </div>
        </motion.div>

        {/* Today's Orders */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold mb-3">Today's Orders</h2>

          <div className="space-y-3">
            {latestOrders.map((o, i) => (
              <div
                key={i}
                className="flex justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-xl"
              >
                <div>
                  <p className="font-medium">{o.symbol}</p>
                  <p className="text-xs text-slate-400">{o.time}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm">{o.qty} Qty</p>
                  <p
                    className={`text-xs ${
                      o.side === "BUY"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {o.side}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BrokerManagePage;
