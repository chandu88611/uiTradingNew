import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

const TermsPage: React.FC = () => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) return;
    // No API for now – just move to billing step
    window.location.href = "/subscriptions/billing";
  };

  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-3xl w-full">
        <SubscriptionStepper currentStep={2} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-semibold flex justify-center gap-3">
            <ShieldCheck className="text-emerald-400" size={32} />
            Profit Sharing – Terms & Agreement
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Please review and accept the terms before activating automated copy trading.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-emerald-400" size={26} />
            <h2 className="text-xl font-semibold">Legal Agreement</h2>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-slate-300 h-[320px] overflow-y-auto pr-2">
            <p>By enabling Copy Trading & automated execution, you acknowledge that:</p>

            <ul className="list-disc list-inside space-y-3 text-slate-400">
              <li>
                Orders will be automatically executed on your linked broker account
                based on our master strategy signals.
              </li>
              <li>
                Past performance does not guarantee future returns. Copy trading
                involves market risk and capital loss is possible.
              </li>
              <li>
                You authorize this platform to place, modify and close orders
                on your behalf using the broker tokens you provide.
              </li>
              <li>
                A <strong>20% profit-sharing fee</strong> is charged only on net realized
                profits at the end of each profitable month.
              </li>
              <li>No fee is charged in a loss-making month.</li>
              <li>
                You remain fully responsible for deposits, withdrawals and any
                manual trades you place on your broker account.
              </li>
              <li>
                The platform does not offer guaranteed returns, fixed income, or
                any kind of assured profit.
              </li>
              <li>
                Broker access tokens are stored in encrypted form, and can be revoked
                by you at any time.
              </li>
              <li>
                Trading may be temporarily paused during extreme volatility,
                connectivity issues or risk-protection events.
              </li>
              <li>
                Changing your capital or interfering with positions may affect
                risk and performance of the strategy.
              </li>
            </ul>

            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-600/30 rounded-xl">
              <AlertTriangle className="text-yellow-400 mt-1" size={20} />
              <p className="text-yellow-300 text-xs">
                Copy Trading is a high-risk activity. Only trade with money you can
                afford to lose. This is not investment advice or a guaranteed return
                product.
              </p>
            </div>

            <p className="text-slate-400 text-xs mt-2">
              By proceeding, you confirm that you have read, understood and agree to all
              the terms listed above.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="h-5 w-5 rounded border border-slate-700 bg-slate-800 accent-emerald-500"
            />
            <span className="text-sm text-slate-300">
              I have read and accept all the terms & conditions.
            </span>
          </div>

          <button
            disabled={!accepted}
            onClick={handleAccept}
            className={`mt-6 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
              ${
                accepted
                  ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }
            `}
          >
            <CheckCircle size={18} />
            Accept & Continue to Billing
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
