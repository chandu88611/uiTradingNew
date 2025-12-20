import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  ShieldCheck,
  IndianRupee,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

import { useMeQuery } from "../../services/userApi";
import { useGetPlanByIdQuery, useSubscribeToPlanMutation } from "../../services/profileSubscription.api";

type FlowState = {
  planId: number;
  mode: "strategies" | "copy" | "both";
  termsAccepted: boolean;
  acceptedAt: string;
};

const FLOW_KEY = "subscription_flow_v1";

const formatINR = (priceCents: number) => {
  const rupees = Math.round(priceCents / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
};

const SubscriptionPaymentPage: React.FC = () => {
  const [flow, setFlow] = useState<FlowState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ auth
  const { data: meRes, isLoading: meLoading } = useMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  } as any);
  const userId = Number((meRes as any)?.data?.id || 0);
  const isAuthenticated = Boolean(userId);

  // ✅ load flow state
  useEffect(() => {
    const raw = sessionStorage.getItem(FLOW_KEY);
    if (!raw) {
      window.location.href = "/subscriptions";
      return;
    }
    try {
      const parsed = JSON.parse(raw) as FlowState;
      if (!parsed?.planId) {
        window.location.href = "/subscriptions";
        return;
      }
      if (!parsed?.termsAccepted) {
        const qs = new URLSearchParams();
        qs.set("planId", String(parsed.planId));
        qs.set("mode", parsed.mode || "copy");
        window.location.href = `/subscriptions/terms?${qs.toString()}`;
        return;
      }
      setFlow(parsed);
    } catch {
      sessionStorage.removeItem(FLOW_KEY);
      window.location.href = "/subscriptions";
    }
  }, []);

  const planId = flow?.planId || 0;

  // ✅ fetch plan
  const { data: planRes, isLoading: planLoading } = useGetPlanByIdQuery(planId, {
    skip: !planId,
  } as any);

  const plan = (planRes as any)?.data;

  // ✅ subscribe mutation
  const [subscribeToPlan] = useSubscribeToPlanMutation();

  // ✅ pricing from plan
  const priceCents = Number(plan?.priceCents || 0);
  const gstPct = 18;

  const gstCents = useMemo(() => {
    // if you want GST only for certain plans, add condition here
    return Math.round((priceCents * gstPct) / 100);
  }, [priceCents]);

  const totalCents = priceCents + gstCents;

  // ✅ show plan label based on plan execution flow / mode
  const planTitle = plan?.name || "Selected Plan";
  const planDesc = plan?.description || "";

  const handleActivate = async () => {
    if (!flow?.planId) return;

    // Must be logged in
    if (!isAuthenticated) {
      // redirect to login page or subscriptions page
      window.location.href = "/subscriptions";
      return;
    }

    try {
      setSubmitting(true);

      /**
       * ✅ TODAY: no payment gateway integrated
       * - We "activate" subscription directly.
       * Later:
       * - create order -> open gateway -> confirm -> then subscribe
       */
      const res = await subscribeToPlan({
        planId: flow.planId,
        trialDays: undefined,
      }).unwrap();

      // You may want to store subscription in storage if needed
      // sessionStorage.setItem("last_subscription", JSON.stringify(res.data));

      window.location.href = "/subscriptions/success";
    } catch (err: any) {
      console.error("Subscription activation failed:", err);
      alert(err?.data?.message || "Failed to activate subscription. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = planLoading || meLoading || !flow;

  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-3xl w-full space-y-8">
        <SubscriptionStepper currentStep={4} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <CreditCard size={32} className="text-emerald-400" />
            Confirm & Activate Subscription
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Review your plan summary and proceed.
          </p>
        </motion.div>

        {!isAuthenticated && !meLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200 flex gap-3">
            <AlertTriangle className="mt-0.5" size={18} />
            <div>
              You are not logged in. Please login and come back to activate.
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6"
        >
          {/* PLAN SUMMARY */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Plan</p>
              <p className="text-sm font-semibold text-slate-100">
                {loading ? "Loading..." : planTitle}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {loading ? "—" : planDesc || "—"}
              </p>
              {flow?.mode && (
                <p className="text-[11px] text-slate-500 mt-2">
                  Mode: <span className="text-slate-300 font-semibold">{flow.mode}</span> •
                  Plan ID: <span className="text-slate-300 font-semibold">{planId}</span> •
                  User ID: <span className="text-slate-300 font-semibold">{userId || "—"}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-end text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                Price
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {loading ? "—" : formatINR(priceCents)}
              </p>
              <p className="text-[11px] text-slate-500">
                {plan?.interval === "monthly"
                  ? "per month"
                  : plan?.interval === "yearly"
                  ? "per year"
                  : "lifetime"}
              </p>
            </div>
          </div>

          {/* BILLING BREAKUP */}
          <div className="border-t border-slate-800 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
              Payment Summary
            </p>

            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Plan price</span>
                <span className="flex items-center gap-1">
                  <IndianRupee size={14} />
                  {loading ? "—" : Math.round(priceCents / 100).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-slate-400 text-xs">
                <span>GST @ {gstPct}%</span>
                <span className="flex items-center gap-1">
                  <IndianRupee size={12} />
                  {loading ? "—" : Math.round(gstCents / 100).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
                <span className="text-sm font-semibold">Total payable now</span>
                <span className="flex items-center gap-1 text-lg font-semibold text-emerald-400">
                  <IndianRupee size={18} />
                  {loading ? "—" : Math.round(totalCents / 100).toLocaleString("en-IN")}
                </span>
              </div>

              {totalCents === 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  No upfront fee for this plan currently.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Gateway will be integrated here later.</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-500" />
              <span>Activation will happen after confirmation.</span>
            </div>
          </div>

          <button
            disabled={loading || submitting || !isAuthenticated}
            onClick={handleActivate}
            className="w-full mt-2 bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Activating..." : totalCents === 0 ? "Activate Subscription" : "Pay & Activate"}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentPage;
