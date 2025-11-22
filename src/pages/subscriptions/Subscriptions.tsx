import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  BarChart3,
  Shield,
  TrendingUp,
} from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "₹0",
    description: "For monitoring and manual trading only.",
    features: [
      "View dashboard",
      "Track P/L",
      "Manual trade logs",
      "Broker connection",
    ],
    highlight: false,
    cta: "Continue Free",
  },
  {
    id: "profit-share",
    name: "Copy Trading (Profit Sharing)",
    price: "20%",
    description:
      "Automated trading using our strategies. Pay only when you make profit.",
    features: [
      "Automated execution",
      "Access to strategy library",
      "Copy-trading engine",
      "Live analytics dashboard",
      "Risk-managed execution",
      "No fixed fee — pay only if in profit",
    ],
    highlight: true,
    cta: "Activate Profit Sharing",
  },
];

const SubscriptionsPage: React.FC = () => {
  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold tracking-tight"
        >
          Choose Your Plan
        </motion.h1>

        <p className="text-slate-400 mt-2 max-w-xl mx-auto">
          Start free or enable our automated trading engine with a profit-sharing model.
        </p>
      </div>

      {/* Icon Row */}
      <div className="flex justify-center gap-10 mb-16 opacity-80">
        <div className="flex flex-col items-center text-slate-400">
          <TrendingUp size={32} />
          <span className="text-xs mt-1">Smart Execution</span>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <Zap size={32} />
          <span className="text-xs mt-1">Fast Signals</span>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <BarChart3 size={32} />
          <span className="text-xs mt-1">Live Analytics</span>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <Shield size={32} />
          <span className="text-xs mt-1">Risk Protection</span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative rounded-2xl border p-8 bg-slate-900/60 
              ${
                plan.highlight
                  ? "border-emerald-500 shadow-xl shadow-emerald-500/10"
                  : "border-slate-800"
              }`}
          >
            {/* Highlight Badge */}
            {plan.highlight && (
              <div className="absolute -top-3 left-6 px-3 py-1 text-xs rounded-xl bg-emerald-500 text-slate-900 font-bold">
                BEST FOR TRADING
              </div>
            )}

            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              {plan.highlight && <Star className="text-emerald-400" size={20} />}
              {plan.name}
            </h3>

            <p className="text-slate-400 text-sm">{plan.description}</p>

            {/* Price */}
            <div className="mt-6 text-4xl font-bold text-emerald-400">
              {plan.price}
              {plan.id === "profit-share" && (
                <span className="text-lg text-slate-400"> / profit</span>
              )}
            </div>

            {/* Features */}
            <ul className="mt-6 space-y-2 text-sm">
              {plan.features.map((f, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => {
                if (plan.id === "profit-share")
                  window.location.href = "/subscriptions/terms";
                else window.location.href = "/dashboard";
              }}
              className={`mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold
                ${
                  plan.highlight
                    ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }
              `}
            >
              {plan.cta} <ArrowRight size={16} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
