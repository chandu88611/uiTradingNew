import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, ShieldCheck, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

const TermsPage: React.FC = () => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    window.location.href = "/subscriptions/success";
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-3xl w-full">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-semibold flex justify-center gap-3">
            <ShieldCheck className="text-emerald-400" size={32} />
            Profit Sharing – Terms & Agreement
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Please review and accept the terms before activating automated copy trading.
          </p>
        </motion.div>

        {/* TERMS CARD */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-xl"
        >
          {/* Icon */}
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-emerald-400" size={26} />
            <h2 className="text-xl font-semibold">Legal Agreement</h2>
          </div>

          {/* Terms Content */}
          <div className="space-y-5 text-sm leading-relaxed text-slate-300 h-[350px] overflow-y-auto pr-2">
            <p>
              By enabling Copy Trading & automated execution, you acknowledge that:
            </p>

            <ul className="list-disc list-inside space-y-3 text-slate-400">
              <li>Your trades will be automatically executed based on our master account signals.</li>
              <li>You understand that past performance does not guarantee future returns.</li>
              <li>You authorize our system to place and manage orders on your linked broker account.</li>
              <li>You will pay a **20% profit-sharing fee** based on realized monthly profits.</li>
              <li>No fee is charged in a loss-making month.</li>
              <li>You are fully responsible for your capital decisions and risk.</li>
              <li>The platform does not offer any return guarantee or fixed income assurance.</li>
              <li>Your broker login tokens are securely stored & encrypted.</li>
              <li>The system may pause trading during high volatility for protection.</li>
              <li>Withdrawals, deposits, or manual trades may affect automated logic.</li>
            </ul>

            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-600/30 rounded-xl">
              <AlertTriangle className="text-yellow-400 mt-1" size={20} />
              <p className="text-yellow-300 text-xs">
                Copy Trading involves market risks. Only trade with money you can afford to lose.
              </p>
            </div>

            <p className="text-slate-400 text-xs mt-4">
              By proceeding, you legally agree to all the terms listed above.
            </p>
          </div>

          {/* ACCEPT CHECKBOX */}
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

          {/* CTA */}
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
            Accept & Activate Copy Trading
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
