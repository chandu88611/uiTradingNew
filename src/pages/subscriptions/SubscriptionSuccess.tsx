import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles, Link2 } from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

const SubscriptionSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 flex flex-col items-center p-6">
      <div className="max-w-lg w-full mb-6">
        <SubscriptionStepper currentStep={5} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-lg w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-10 text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 10 }}
          className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-emerald-500/20"
        >
          <CheckCircle size={52} className="text-emerald-400" />
        </motion.div>

        <h1 className="text-3xl font-semibold flex items-center justify-center gap-2">
          Subscription Activated
          <Sparkles className="text-yellow-400" size={24} />
        </h1>

        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          Your profit-sharing subscription is now active.  
          Next step: connect your broker accounts and enable the strategies you
          want to copy.
        </p>

        <div className="my-6 border-t border-slate-800"></div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-left text-sm space-y-2">
          <p>
            <span className="text-slate-300 font-medium">Status:</span>{" "}
            <span className="text-emerald-400">Active</span>
          </p>

          <p>
            <span className="text-slate-300 font-medium">Plan Type:</span>{" "}
            Profit Sharing (20%)
          </p>

          <p>
            <span className="text-slate-300 font-medium">Next Settlement:</span>{" "}
            1st of every month
          </p>

          <p>
            <span className="text-slate-300 font-medium">
              Billing information:
            </span>{" "}
            Saved successfully
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => (window.location.href = "/broker/accounts")}
            className="flex-1 bg-slate-900 border border-emerald-500/60 text-emerald-400 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition"
          >
            <Link2 size={18} />
            Connect Broker Accounts
          </button>

          <button
            onClick={() => (window.location.href = "/subscriptions/dashboard")}
            className="flex-1 bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition"
          >
            Open Subscription Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccessPage;
