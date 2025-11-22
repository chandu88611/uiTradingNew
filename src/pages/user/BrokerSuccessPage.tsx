// src/pages/user/BrokerSuccessPage.tsx

import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
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

const BrokerSuccessPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const broker = params.get("broker") || "broker";
  const clientId = params.get("clientId") || "—";
  const expiresIn = params.get("expires") || "6 hours";

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100  flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-xl text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <CheckCircle size={64} className="text-emerald-400" />
        </motion.div>

        {/* Broker Logo */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={BROKER_LOGOS[broker]}
            alt={broker}
            className="h-16 w-16 rounded-xl bg-slate-800 p-3 mb-3"
          />

          <h1 className={`text-2xl font-bold ${BROKER_COLORS[broker]}`}>
            {broker.toUpperCase()} Connected!
          </h1>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-4 text-left">
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <User size={20} className="text-emerald-400" />
            <div>
              <p className="text-slate-400 text-xs">Client ID</p>
              <p className="text-slate-200 font-medium">{clientId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <Clock size={20} className="text-emerald-400" />
            <div>
              <p className="text-slate-400 text-xs">Token Validity</p>
              <p className="text-slate-200 font-medium">{expiresIn}</p>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
            <ShieldCheck size={22} className="text-emerald-400 mt-0.5" />
            <p className="text-xs text-slate-400">
              Your credentials are **not stored**. We only keep an encrypted
              session token issued by the broker.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate("/user/brokers")}
            className="w-full bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition flex items-center justify-center gap-2"
          >
            Go to Broker Dashboard <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full text-slate-400 text-sm hover:text-slate-200 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BrokerSuccessPage;
