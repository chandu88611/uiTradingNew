import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  BarChart3,
  Shield,
  TrendingUp,
  Brain,
  Bot,
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

type Mode = "strategies" | "copy" | "both";

type StrategyPlanId = "basic" | "elite" | "pro";

interface StrategyPlan {
  id: StrategyPlanId;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  highlight: boolean;
  cta: string;
}

interface SelectionState {
  type: Mode;      // "strategies" | "copy" | "both"
  planId: string;  // e.g. "basic" | "copy-profit-share" | "bundle-elite-plus-copy"
}

const strategyPlans: StrategyPlan[] = [
  {
    id: "basic",
    name: "Basic Strategies",
    price: "₹999",
    priceNote: "/ month",
    description:
      "For traders who want simple intraday ideas on limited instruments.",
    features: [
      "Access to 1–2 core strategies",
      "Nifty / BankNifty focus",
      "Daily signal & level view",
      "Basic performance stats",
    ],
    highlight: false,
    cta: "Choose Basic",
  },
  {
    id: "elite",
    name: "Elite Strategies",
    price: "₹1,999",
    priceNote: "/ month",
    description:
      "More instruments + deeper stats for active traders using multiple setups.",
    features: [
      "All Basic strategies included",
      "Indices + select stocks & commodities",
      "Advanced stats (win-rate, drawdown)",
      "Priority strategy updates",
    ],
    highlight: true,
    cta: "Choose Elite",
  },
  {
    id: "pro",
    name: "Pro Strategies",
    price: "₹2,999",
    priceNote: "/ month",
    description:
      "Full library + detailed breakdown for traders who want everything unlocked.",
    features: [
      "All strategies unlocked",
      "Multi-timeframe breakdown",
      "Detailed backtest-style metrics",
      "Priority support / community",
    ],
    highlight: false,
    cta: "Choose Pro",
  },
];

const copyTradingPlan = {
  id: "copy-profit-share",
  name: "Copy Trading (Profit Sharing)",
  price: "20%",
  description:
    "Hands-free automated execution from our master account to your broker account.",
  features: [
    "Automatic trade execution",
    "Per-account risk controls",
    "Live P/L & analytics",
    "No fixed monthly fee",
    "20% only on net profitable months",
  ],
};

const bundlePlan = {
  id: "bundle-elite-plus-copy",
  name: "Elite + Copy Trading",
  price: "₹1,999 + 20%",
  description:
    "View Elite strategies AND automatically mirror them in your linked accounts.",
  features: [
    "All Elite strategies unlocked",
    "See logic + stats + live trades",
    "Auto-execution to your broker accounts",
    "Single dashboard for everything",
  ],
};

const SubscriptionsPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("copy");
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const isSelected = (type: Mode, id: string) =>
    selection?.type === type && selection.planId === id;

 const handleContinue = () => {
  if (!selection) return;

  const params = new URLSearchParams();

  // mode = strategies | copy | both
  params.set("mode", selection.type);

  // If strategies-only, send which tier (basic / elite / pro)
  if (selection.type === "strategies") {
    params.set("strategyTier", selection.planId); // basic | elite | pro
  }

  // If both (bundle), for now we treat it as Elite + copy
  if (selection.type === "both") {
    params.set("strategyTier", "elite");
  }

  // 🔥 IMPORTANT: For ALL paid flows go to Terms (agreement)
  window.location.href = `/subscriptions/terms?${params.toString()}`;
};


  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-semibold tracking-tight"
          >
            How do you want to{" "}
            <span className="text-emerald-400">use the platform?</span>
          </motion.h1>

          <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
            You can just view strategies, just use hands-free copy trading, or
            combine both. Step 1: select what you need.
          </p>
        </div>

        {/* STEPPER */}
        <div className="max-w-3xl mx-auto mb-8">
          <SubscriptionStepper currentStep={1} />
        </div>

        {/* MODE SWITCH */}
        <div className="max-w-3xl mx-auto mb-10 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
            Step 1 · Select your product
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setMode("strategies");
                setSelection(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition
                ${
                  mode === "strategies"
                    ? "bg-emerald-500 text-slate-900 border-emerald-500"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                }`}
            >
              I want only strategies (signals)
            </button>

            <button
              onClick={() => {
                setMode("copy");
                setSelection(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition
                ${
                  mode === "copy"
                    ? "bg-emerald-500 text-slate-900 border-emerald-500"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                }`}
            >
              I want only copy trading
            </button>

            <button
              onClick={() => {
                setMode("both");
                setSelection(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition
                ${
                  mode === "both"
                    ? "bg-emerald-500 text-slate-900 border-emerald-500"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                }`}
            >
              I want both (signals + auto)
            </button>
          </div>
        </div>

        {/* ICON ROW */}
        <div className="flex flex-wrap justify-center gap-10 mb-10 opacity-80">
          <div className="flex flex-col items-center text-slate-400 text-xs">
            <TrendingUp size={32} />
            <span className="mt-1">Smart Execution</span>
          </div>
          <div className="flex flex-col items-center text-slate-400 text-xs">
            <Zap size={32} />
            <span className="mt-1">Fast Signals</span>
          </div>
          <div className="flex flex-col items-center text-slate-400 text-xs">
            <BarChart3 size={32} />
            <span className="mt-1">Live Analytics</span>
          </div>
          <div className="flex flex-col items-center text-slate-400 text-xs">
            <Shield size={32} />
            <span className="mt-1">Risk Protection</span>
          </div>
        </div>

        {/* CONTENT AREA BASED ON MODE */}
        {mode === "strategies" && (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-slate-300 font-medium">
                Strategy access only – you see our ideas and trade wherever you want.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {strategyPlans.map((plan) => {
                const selected = isSelected("strategies", plan.id);
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() =>
                      setSelection({ type: "strategies", planId: plan.id })
                    }
                    className={`relative rounded-2xl border p-6 bg-slate-900/60 cursor-pointer ${
                      plan.highlight
                        ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                        : "border-slate-800"
                    } ${
                      selected
                        ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950"
                        : ""
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-4 px-3 py-1 text-[10px] rounded-xl bg-emerald-500 text-slate-900 font-bold">
                        MOST POPULAR
                      </div>
                    )}

                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      {plan.highlight && (
                        <Star className="text-emerald-400" size={18} />
                      )}
                      {plan.name}
                    </h3>
                    <p className="text-slate-400 text-xs mb-4">
                      {plan.description}
                    </p>

                    <div className="text-2xl font-bold text-emerald-400">
                      {plan.price}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {plan.priceNote}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-1.5 text-xs">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle
                            size={14}
                            className="text-emerald-400"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={`mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold ${
                        selected
                          ? "bg-emerald-500 text-slate-900"
                          : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      }`}
                    >
                      {selected ? "Selected" : plan.cta}
                      <ArrowRight size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {mode === "copy" && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-300 font-medium">
                Hands-free mode – you don’t need to think about strategy logic. We execute it for you.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() =>
                setSelection({ type: "copy", planId: copyTradingPlan.id })
              }
              className={`relative rounded-2xl border p-8 bg-slate-900/70 cursor-pointer ${
                isSelected("copy", copyTradingPlan.id)
                  ? "border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950"
                  : "border-emerald-500 shadow-xl shadow-emerald-500/10"
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-1 text-[11px] rounded-xl bg-emerald-500 text-slate-900 font-bold">
                BEST FOR COMPLETE AUTOMATION
              </div>

              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Bot className="text-emerald-400" size={20} />
                {copyTradingPlan.name}
              </h3>

              <p className="text-slate-400 text-sm mb-4">
                {copyTradingPlan.description}
              </p>

              <div className="text-4xl font-bold text-emerald-400 mb-4">
                {copyTradingPlan.price}
                <span className="text-sm text-slate-400 font-normal ml-1">
                  of net profitable months
                </span>
              </div>

              <ul className="mt-2 space-y-2 text-sm">
                {copyTradingPlan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold ${
                  isSelected("copy", copyTradingPlan.id)
                    ? "bg-emerald-500 text-slate-900"
                    : "bg-emerald-600 text-slate-900 hover:bg-emerald-500"
                }`}
              >
                {isSelected("copy", copyTradingPlan.id)
                  ? "Selected – Continue"
                  : "Select this plan"}
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </div>
        )}

        {mode === "both" && (
          <div className="grid md:grid-cols-[1.4fr,1.1fr] gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() =>
                setSelection({ type: "both", planId: bundlePlan.id })
              }
              className={`relative rounded-2xl border p-8 bg-slate-900/70 cursor-pointer ${
                isSelected("both", bundlePlan.id)
                  ? "border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950"
                  : "border-emerald-500 shadow-xl shadow-emerald-500/10"
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-1 text-[11px] rounded-xl bg-emerald-500 text-slate-900 font-bold">
                STRATEGIES + COPY TRADING
              </div>

              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Brain className="text-emerald-400" size={20} />
                {bundlePlan.name}
              </h3>

              <p className="text-slate-400 text-sm mb-4">
                {bundlePlan.description}
              </p>

              <div className="text-2xl font-bold text-emerald-400 mb-2">
                {bundlePlan.price}
                <span className="text-xs text-slate-400 font-normal ml-1">
                  (subscription + profit share)
                </span>
              </div>

              <ul className="mt-3 space-y-2 text-sm">
                {bundlePlan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold ${
                  isSelected("both", bundlePlan.id)
                    ? "bg-emerald-500 text-slate-900"
                    : "bg-emerald-600 text-slate-900 hover:bg-emerald-500"
                }`}
              >
                {isSelected("both", bundlePlan.id)
                  ? "Selected – Continue"
                  : "Get Elite + Copy"}
                <ArrowRight size={16} />
              </button>
            </motion.div>

            <div className="space-y-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-sm text-slate-300">
                <p className="font-semibold mb-1">What you get in this bundle</p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                  <li>Full Elite strategy access inside the platform.</li>
                  <li>Option to copy selected strategies to your broker accounts.</li>
                  <li>Clear P/L and profit-share breakdown every month.</li>
                  <li>You can stop or pause copy trading any time.</li>
                </ul>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">
                  What happens after this
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Accept copy-trading / subscription agreement.</li>
                  <li>Add billing / payout details.</li>
                  <li>Complete activation of subscription.</li>
                  <li>Connect broker & select which strategies to copy.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* CONTINUE BUTTON */}
        <div className="mt-10 max-w-3xl mx-auto flex flex-col items-center gap-3">
          <button
            disabled={!selection}
            onClick={handleContinue}
            className={`w-full md:w-80 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
              ${
                selection
                  ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
          >
            Continue
            <ArrowRight size={18} />
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            You can change plans later from the subscription dashboard.
          </p>

          <p className="text-[11px] text-slate-500">
            Not ready yet?{" "}
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="underline underline-offset-4 hover:text-emerald-400"
            >
              Continue with Free monitoring only
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
