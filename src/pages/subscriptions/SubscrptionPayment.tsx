import React from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ShieldCheck,
  IndianRupee,
  ArrowRight,
  Clock,
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

const SubscriptionPaymentPage: React.FC = () => {
  // Dummy pricing
  const platformFee = 0; // change later if you add onboarding fee
  const gstPct = 18;
  const gstAmount = Math.round((platformFee * gstPct) / 100);
  const total = platformFee + gstAmount;

  const handlePayment = () => {
    // Dummy: no gateway, just redirect
    console.log("Dummy payment completed");
    window.location.href = "/subscriptions/success";
  };

  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-3xl w-full space-y-8">
        <SubscriptionStepper currentStep={4} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <CreditCard size={32} className="text-emerald-400" />
            Confirm & Activate Subscription
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Review your plan summary and complete payment to activate profit-sharing copy trading.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                Plan
              </p>
              <p className="text-sm font-semibold text-slate-100">
                Copy Trading – Profit Sharing
              </p>
              <p className="text-xs text-slate-400 mt-1">
                20% of net realized profit on profitable months.
              </p>
            </div>

            <div className="flex flex-col items-end text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                Profit Share
              </p>
              <p className="text-2xl font-bold text-emerald-400">20%</p>
              <p className="text-[11px] text-slate-500">
                No fixed fee in loss months
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
              Subscription Billing
            </p>

            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span className="flex items-center gap-1">
                  <IndianRupee size={14} />
                  {platformFee.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-400 text-xs">
                <span>GST @ {gstPct}%</span>
                <span className="flex items-center gap-1">
                  <IndianRupee size={12} />
                  {gstAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
                <span className="text-sm font-semibold">Total payable now</span>
                <span className="flex items-center gap-1 text-lg font-semibold text-emerald-400">
                  <IndianRupee size={18} />
                  {total.toLocaleString()}
                </span>
              </div>

              {total === 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  No upfront fee applicable for this plan currently. You will
                  only be charged profit-share on profitable months.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>
                Payments will be handled securely when gateway is integrated.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-500" />
              <span>Activation is instant after this step.</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full mt-2 bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition"
          >
            {total === 0 ? "Activate Subscription" : "Pay & Activate"}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentPage;
