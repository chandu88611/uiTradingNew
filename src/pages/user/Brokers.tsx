// src/pages/user/ConnectBrokerPage.tsx

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const BROKER_DETAILS: any = {
  zerodha: {
    name: "Zerodha",
    logo: "/brokers/zerodha.png",
    color: "text-sky-400",
  },
  zebu: {
    name: "Zebu",
    logo: "/brokers/zebu.png",
    color: "text-purple-400",
  },
  dhan: {
    name: "Dhan",
    logo: "/brokers/dhan.png",
    color: "text-yellow-400",
  },
};

const ConnectBrokerPage: React.FC = () => {
  const { broker } = useParams();
  const navigate = useNavigate();

  const info = BROKER_DETAILS[broker as string];

  if (!info)
    return (
      <div className="h-screen flex items-center justify-center text-slate-300">
        Invalid broker
      </div>
    );

  const handleRedirect = () => {
    // This redirects user to your backend-generated login URL
    window.location.href = `/api/broker/${broker}/auth`;
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100  flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src={info.logo}
            alt={info.name}
            className="h-16 w-16 rounded-xl bg-slate-800 p-3 mb-4"
          />

          <h1 className={`text-2xl font-bold ${info.color}`}>
            Connect {info.name}
          </h1>

          <p className="text-slate-400 mt-2 text-sm">
            Allow your account to be securely linked to enable automated trading.
          </p>
        </div>

        {/* Permissions */}
        <div className="mt-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-200">
            What we access
          </h2>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-emerald-400 mt-1" size={18} />
              <p className="text-sm text-slate-300">
                Fetch your account profile & client ID
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-emerald-400 mt-1" size={18} />
              <p className="text-sm text-slate-300">
                Authorize placing orders on your behalf
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-emerald-400 mt-1" size={18} />
              <p className="text-sm text-slate-300">
                Read positions, trades & holdings
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-emerald-400 mt-1" size={18} />
              <p className="text-sm text-slate-300">
                Fetch real-time margin & balance
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-6 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex gap-3">
          <ShieldCheck size={24} className="text-emerald-400 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            We never store your broker password. Authentication is done via the
            broker’s official OAuth/login flow.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleRedirect}
          className="w-full mt-8 bg-emerald-500 text-slate-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"
        >
          Continue to {info.name} Login
          <ExternalLink size={18} />
        </button>

        {/* Back */}
        <button
          className="w-full text-slate-400 text-sm mt-4 hover:text-slate-200 flex items-center justify-center gap-1"
          onClick={() => navigate(-1)}
        >
          <ArrowRight size={16} className="rotate-180" />
          Go Back
        </button>
      </motion.div>
    </div>
  );
};

export default ConnectBrokerPage;
