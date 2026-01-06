import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, PlugZap, ShieldCheck } from "lucide-react";
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

const sectionBase = "rounded-2xl border border-slate-800 bg-slate-900/40 p-6";

export default function IndianTradingPage() {
  const { data: subRes } = useGetMyCurrentSubscriptionQuery();
  const mySub = (subRes as any)?.data ?? null;
  const plan = mySub?.plan ?? null;

  const canUseIndia = useMemo(() => {
    return plan?.category === "INDIA" || Boolean(plan?.featureFlags?.indianMarket);
  }, [plan]);

  if (!canUseIndia) {
    return (
      <div className={sectionBase}>
        <div className="flex items-center gap-2 text-slate-200">
          <Zap size={16} />
          <div className="font-semibold">Indian Trading not enabled</div>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Your current plan does not include Indian market features.
        </p>
        <Link
          to="/pricing"
          className="mt-4 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Indian Trading</h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect broker accounts and attach purchased strategies OR trade with your own setup.
        </p>
      </div>

      <section className={sectionBase}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PlugZap size={18} className="text-emerald-400" />
          Connect Broker Account
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Add your Zerodha / Motilal / etc token in broker connect flow.
        </p>

        <Link
          to="/user/brokers"
          className="mt-4 inline-flex rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
        >
          Open Broker Connections
        </Link>
      </section>

      <section className={sectionBase}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap size={18} />
          Connect Our Strategy
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          If you purchased a strategy, connect it to your Indian broker accounts here.
        </p>

        <Link
          to="/user/use-strategy"
          className="mt-4 inline-flex rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
        >
          Browse / Connect Strategy
        </Link>
      </section>

      <section className={sectionBase}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" />
          Trade From Your End
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          (Later we can add “signals only / webhook only” for India too if you want.)
        </p>
      </section>
    </div>
  );
}
