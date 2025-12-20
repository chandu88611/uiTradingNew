import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";
import {
  useListActivePlansQuery,
  type SubscriptionPlan,
} from "../../services/plansApi";

import { useMeQuery } from "../../services/userApi";
import AuthModal from "../auth/AuthModel";

type Mode = "strategies" | "copy" | "both";

interface SelectionState {
  type: Mode;
  planId: number;
}

const inputBase =
  "w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-lg text-slate-200 outline-none text-sm focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10";

const formatINR = (priceCents: number) => {
  const rupees = Math.round(priceCents / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
};

const intervalLabel = (i: any) => {
  if (i === "monthly") return "/ month";
  if (i === "yearly") return "/ year";
  return "lifetime";
};

const getBadge = (p: SubscriptionPlan) => {
  const tier = (p.metadata as any)?.tier;
  if (tier === "elite") return "MOST POPULAR";
  if (tier === "pro") return "RECOMMENDED";
  if (p.interval === "lifetime") return "LIFETIME";
  return null;
};

const pickHighlights = (p: SubscriptionPlan) => {
  const ff = p.featureFlags || {};
  const highlights: string[] = [];

  if (ff.webhookAccess) highlights.push("Webhook access");
  if (ff.tradeCopier) highlights.push("Trade copier");
  if (ff.advancedRisk) highlights.push("Advanced risk controls");
  if (ff.priorityExecution) highlights.push("Priority execution");
  if (ff.vpsIncluded) highlights.push("VPS included");
  if (ff.paperTrading) highlights.push("Paper trading");

  highlights.push(`${p.maxActiveStrategies} strategies`);
  highlights.push(`${p.maxConnectedAccounts} accounts`);

  if (p.maxDailyTrades != null) highlights.push(`${p.maxDailyTrades} daily trades`);
  if (p.maxLotPerTrade) highlights.push(`Max lot: ${p.maxLotPerTrade}`);

  return highlights.slice(0, 6);
};

const sortByTier = (a: SubscriptionPlan, b: SubscriptionPlan) => {
  const tierRank: Record<string, number> = {
    starter: 1,
    basic: 1,
    standard: 2,
    pro: 3,
    premium: 4,
    elite: 5,
    lifetime: 6,
  };
  const ta = String((a.metadata as any)?.tier || "");
  const tb = String((b.metadata as any)?.tier || "");
  return (tierRank[ta] || 99) - (tierRank[tb] || 99);
};

const SubscriptionsPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("copy");
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [search, setSearch] = useState("");

  // ✅ auth state (robust + won't flicker)
  const {
    data: meRes,
    isLoading: meLoading,
    isFetching: meFetching,
    isError: meError,
  } = useMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  } as any);

  // supports both: { data: { id } } and direct { id }
  const me = (meRes as any)?.data ?? meRes;
  const isAuthenticated = Boolean(me?.id || me?.user?.id);
  const authReady = !(meLoading || meFetching);

  // ✅ modal
  const [authOpen, setAuthOpen] = useState(false);

  const { data, isLoading, isFetching } = useListActivePlansQuery(undefined);

  const allPlans: SubscriptionPlan[] = useMemo(() => {
    const raw = (data as any)?.data;
    if (Array.isArray(raw?.[0])) return raw[0] as SubscriptionPlan[];
    if (Array.isArray(raw)) return raw as SubscriptionPlan[];
    return [];
  }, [data]);

  const loading = isLoading || isFetching;

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPlans;
    return allPlans.filter((p) => {
      const hay = `${p.name} ${p.planCode} ${p.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allPlans, search]);

  const apiPlans = useMemo(
    () => filteredPlans.filter((p) => p.executionFlow === "API").sort(sortByTier),
    [filteredPlans]
  );

  const pinePlans = useMemo(
    () =>
      filteredPlans.filter((p) => p.executionFlow === "PINE_CONNECTOR").sort(sortByTier),
    [filteredPlans]
  );

  const goToTerms = (sel: SelectionState) => {
    const params = new URLSearchParams();
    params.set("mode", sel.type);
    params.set("planId", String(sel.planId));
    window.location.href = `/subscriptions/terms?${params.toString()}`;
  };

  // ✅ only select plan on click
  const handleSelectPlan = (sel: SelectionState) => {
    setSelection(sel);
  };

  // ✅ Continue button handles auth + proceed
  const handleContinue = () => {
    if (!selection) return;

    // ✅ don't decide auth until /me query is settled
    if (!authReady) return;

    if (isAuthenticated) {
      goToTerms(selection);
      return;
    }

    setAuthOpen(true);
  };

  // ✅ after login/register success
  const onAuthed = () => {
    if (selection) goToTerms(selection);
  };

  const renderCard = (p: SubscriptionPlan, type: Mode) => {
    const selected = selection?.type === type && selection?.planId === p.id;
    const badge = getBadge(p);
    const highlights = pickHighlights(p);

    return (
      <motion.div
        key={p.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={() => handleSelectPlan({ type, planId: p.id })}
        className={`relative rounded-2xl border p-6 bg-slate-900/60 cursor-pointer select-none
          ${
            selected
              ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 border-emerald-500"
              : "border-slate-800 hover:border-slate-700"
          }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelectPlan({ type, planId: p.id });
          }
        }}
      >
        {badge && (
          <div className="absolute -top-3 left-4 px-3 py-1 text-[10px] rounded-xl bg-emerald-500 text-slate-900 font-bold">
            {badge}
          </div>
        )}

        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
          {badge === "MOST POPULAR" && <Star className="text-emerald-400" size={18} />}
          {p.name}
        </h3>

        <p className="text-slate-400 text-xs mb-4">{p.description || "—"}</p>

        <div className="text-2xl font-bold text-emerald-400">
          {formatINR(p.priceCents)}
          <span className="text-xs font-normal text-slate-400 ml-1">
            {intervalLabel(p.interval as any)}
          </span>
        </div>

        <ul className="mt-4 space-y-1.5 text-xs">
          {highlights.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-400" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {selected && (
          <div className="mt-5">
            <span className="inline-flex rounded-full bg-emerald-500/15 text-emerald-400 px-3 py-1 border border-emerald-500/30 text-xs">
              Selected
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      {/* ✅ Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={onAuthed}
        defaultTab="login"
      />

      <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-semibold tracking-tight"
            >
              Choose your <span className="text-emerald-400">subscription</span>
            </motion.h1>
            <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
              Select your plan → accept terms → billing → payment.
            </p>

            {/* optional debug hint (safe to keep/remove) */}
            {!meLoading && meError && (
              <p className="text-xs text-yellow-400 mt-2">
                Auth check failed (/me). If you are logged in, ensure baseApi uses credentials: "include".
              </p>
            )}
          </div>

          <div className="max-w-3xl mx-auto mb-8">
            <SubscriptionStepper currentStep={1} />
          </div>

          <div className="max-w-3xl mx-auto mb-10 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Step 1 · Select your product
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setMode("strategies");
                    setSelection(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                    mode === "strategies"
                      ? "bg-emerald-500 text-slate-900 border-emerald-500"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  API Plans
                </button>

                <button
                  onClick={() => {
                    setMode("copy");
                    setSelection(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                    mode === "copy"
                      ? "bg-emerald-500 text-slate-900 border-emerald-500"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  Pine Connector
                </button>

                <button
                  onClick={() => {
                    setMode("both");
                    setSelection(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                    mode === "both"
                      ? "bg-emerald-500 text-slate-900 border-emerald-500"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  Bundle
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Search plans</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputBase}
                placeholder="Search by name / planCode"
              />
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{loading ? "Loading plans…" : `Active plans: ${allPlans.length}`}</span>
              {!loading && allPlans.length === 0 && (
                <span className="text-red-400">No active plans found</span>
              )}
            </div>
          </div>

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

          {mode === "strategies" && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-300 font-medium">
                  API Plans – India/Crypto broker API execution
                </p>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-800 p-6 bg-slate-900/60 animate-pulse"
                    >
                      <div className="h-5 w-40 bg-slate-800 rounded" />
                      <div className="h-3 w-56 bg-slate-800 rounded mt-3" />
                      <div className="h-10 w-32 bg-slate-800 rounded mt-5" />
                      <div className="h-10 w-full bg-slate-800 rounded-xl mt-6" />
                    </div>
                  ))}
                </div>
              ) : apiPlans.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-10">
                  No API plans found.
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {apiPlans.map((p) => renderCard(p, "strategies"))}
                </div>
              )}
            </>
          )}

          {mode === "copy" && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-300 font-medium">
                  Pine Connector – TradingView webhook → MT4/MT5
                </p>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-emerald-500/40 p-8 bg-slate-900/70 animate-pulse"
                    >
                      <div className="h-5 w-56 bg-slate-800 rounded" />
                      <div className="h-3 w-72 bg-slate-800 rounded mt-3" />
                      <div className="h-11 w-full bg-slate-800 rounded-xl mt-8" />
                    </div>
                  ))}
                </div>
              ) : pinePlans.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-10">
                  No Pine Connector plans found.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {pinePlans.map((p) => renderCard(p, "copy"))}
                </div>
              )}
            </>
          )}

          {mode === "both" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <Brain className="text-emerald-400" size={22} />
                  <p className="text-lg font-semibold text-slate-100">
                    Bundle plans not added yet
                  </p>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  When you insert bundle plans in DB, we’ll auto-show them here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ✅ ONE Continue button after selection */}
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {selection ? (
                <span>
                  Selected plan ID:{" "}
                  <span className="text-slate-100 font-semibold">{selection.planId}</span>{" "}
                  • Next: Terms → Billing → Payment
                </span>
              ) : (
                <span>Select any plan to continue</span>
              )}
            </div>

            <button
              disabled={!selection || !authReady}
              onClick={handleContinue}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                selection && authReady
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
              title={!authReady ? "Checking login status..." : undefined}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionsPage;
