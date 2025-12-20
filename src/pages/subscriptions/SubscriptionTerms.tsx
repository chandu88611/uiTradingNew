import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

type FlowState = {
  planId: number;
  mode: "strategies" | "copy" | "both";
  termsAccepted: boolean;
  acceptedAt: string;
};

const FLOW_KEY = "subscription_flow_v1";

const TermsPage: React.FC = () => {
  const [accepted, setAccepted] = useState(false);

  // Read planId + mode from URL
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const planId = Number(params.get("planId") || 0);
  const mode = (params.get("mode") || "copy") as FlowState["mode"];

  // Guard: if no planId, push back to plans page
  useEffect(() => {
    if (!planId) {
      window.location.href = "/subscriptions";
      return;
    }
  }, [planId]);

  const handleAccept = () => {
    if (!accepted) return;

    const flow: FlowState = {
      planId,
      mode,
      termsAccepted: true,
      acceptedAt: new Date().toISOString(),
    };

    // ✅ Persist flow state for next pages
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));

    // ✅ Keep planId/mode in URL so user can refresh safely
    const next = new URLSearchParams();
    next.set("planId", String(planId));
    next.set("mode", mode);

    window.location.href = `/subscriptions/billing?${next.toString()}`;
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
            Terms & Agreement
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Please review and accept the terms before proceeding.
          </p>

          {/* Small context line */}
          <p className="text-[11px] text-slate-500 mt-2">
            Plan ID: <span className="text-slate-300 font-semibold">{planId}</span> • Mode:{" "}
            <span className="text-slate-300 font-semibold">{mode}</span>
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
            <p>By enabling automated execution, you acknowledge that:</p>

            <ul className="list-disc list-inside space-y-3 text-slate-400">
              <li>Orders may be automatically executed based on strategy signals.</li>
              <li>Past performance does not guarantee future returns.</li>
              <li>You authorize the platform to place/modify/close orders on your behalf.</li>
              <li>
                Profit-sharing / fees (if applicable) apply as per the plan terms.
              </li>
              <li>You remain responsible for deposits, withdrawals, and any manual trades.</li>
              <li>No guaranteed returns or assured profit is provided.</li>
              <li>Trading may be paused during volatility / connectivity / risk events.</li>
            </ul>

            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-600/30 rounded-xl">
              <AlertTriangle className="text-yellow-400 mt-1" size={20} />
              <p className="text-yellow-300 text-xs">
                Trading is risky. Only trade with money you can afford to lose.
                This is not investment advice.
              </p>
            </div>

            <p className="text-slate-400 text-xs mt-2">
              By proceeding, you confirm that you have read and agreed to the terms.
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
            Accept & Continue
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
