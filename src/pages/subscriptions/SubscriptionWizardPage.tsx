import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Info,
  MapPin,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

import SubscriptionStepper, { type FlowStep } from "./SubscriptionStepper";

// ✅ IMPORTANT: Ensure this path matches your file name.
// If your file is AuthModel.tsx then use "../auth/AuthModel"

import { useMeQuery } from "../../services/userApi";
import {
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
} from "../../services/userApi";

import {
  useListActivePlansQuery,
  type SubscriptionPlan,
} from "../../services/plansApi";

import {
  useGetPlanByIdQuery,
  useSubscribeToPlanMutation,
} from "../../services/profileSubscription.api";
import AuthModal from "../auth/AuthModel";

/**
 * ✅ Single-page wizard
 * - sessionStorage persists progress so user resumes where left
 */

type Mode = "strategies" | "copy" | "both";

type FlowState = {
  step: FlowStep;

  // plan selection
  planId?: number;
  mode?: Mode;

  // terms step
  termsAccepted?: boolean;
  acceptedAt?: string;

  // billing step
  billingDone?: boolean;
};

const FLOW_KEY = "subscription_flow_v2";

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

const loadFlow = (): FlowState => {
  try {
    const raw = sessionStorage.getItem(FLOW_KEY);
    if (!raw) return { step: 1 };
    const parsed = JSON.parse(raw) as Partial<FlowState>;
    return {
      step: (parsed.step ?? 1) as FlowStep,
      planId: parsed.planId,
      mode: parsed.mode,
      termsAccepted: parsed.termsAccepted,
      acceptedAt: parsed.acceptedAt,
      billingDone: parsed.billingDone,
    };
  } catch {
    return { step: 1 };
  }
};

const saveFlow = (flow: FlowState) => {
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
};

/**
 * ✅ Max step user is allowed to ENTER (forward)
 * - BUT user can always go BACK to earlier steps.
 */
const getMaxAllowedStep = (flow: FlowState): FlowStep => {
  // Step 5 is a terminal "done" state — allow it if already reached
  if (flow.step === 5) return 5;

  const hasPlan = Boolean(flow.planId && flow.mode);
  const hasTerms = Boolean(flow.termsAccepted);
  const hasBilling = Boolean(flow.billingDone);

  if (!hasPlan) return 1;
  if (!hasTerms) return 2;
  if (!hasBilling) return 3;
  return 4;
};

/**
 * ✅ Clamp only if user is on an ILLEGAL forward step.
 * - DOES NOT force user forward (so Back works)
 */
const clampStepIfIllegalForward = (flow: FlowState): FlowStep => {
  const maxAllowed = getMaxAllowedStep(flow);
  if (flow.step > maxAllowed) return maxAllowed;
  if (flow.step < 1) return 1;
  return flow.step;
};

type BillingFormState = {
  panNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

const initialBillingForm: BillingFormState = {
  panNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

type PendingAfterAuth = "CONTINUE_FROM_PLAN" | null;

const SubscriptionWizardPage: React.FC = () => {
  // ✅ flow state + persist
  const [flow, setFlow] = useState<FlowState>(() => loadFlow());

  /**
   * ✅ Persist + clamp illegal forward steps ONLY
   * (so back button won't get overridden)
   */
  useEffect(() => {
    const clamped = clampStepIfIllegalForward(flow);
    if (clamped !== flow.step) {
      const next = { ...flow, step: clamped };
      setFlow(next);
      saveFlow(next);
      return;
    }
    saveFlow(flow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.step, flow.planId, flow.mode, flow.termsAccepted, flow.billingDone, flow.acceptedAt]);

  /**
   * ✅ setStep:
   * - Always allow going backward
   * - Allow going forward only up to maxAllowed
   */
  const setStep = (next: FlowStep) => {
    // allow going back always
    if (next < flow.step) {
      setFlow((p) => ({ ...p, step: next }));
      return;
    }

    const maxAllowed = getMaxAllowedStep(flow);
    if (next <= maxAllowed) {
      setFlow((p) => ({ ...p, step: next }));
      return;
    }

    // if user tries to jump forward illegally, clamp to maxAllowed
    setFlow((p) => ({ ...p, step: maxAllowed }));
  };

  // ✅ auth
  const {
    data: meRes,
    isLoading: meLoading,
    isFetching: meFetching,
    isError: meError,
    refetch: refetchMe,
  } = useMeQuery(undefined, { refetchOnMountOrArgChange: true } as any);

  const me = (meRes as any)?.data ?? meRes;
  const userId = Number(me?.id || me?.user?.id || 0);
  const isAuthenticated = Boolean(userId);
  const authReady = !(meLoading || meFetching);

  // ✅ auth modal + resume state
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<PendingAfterAuth>(null);

  // ✅ Plans list
  const [mode, setMode] = useState<Mode>(flow.mode ?? "copy");
  const [search, setSearch] = useState("");

  const { data: plansRes, isLoading: plansLoading, isFetching: plansFetching } =
    useListActivePlansQuery(undefined);

  const allPlans: SubscriptionPlan[] = useMemo(() => {
    const raw = (plansRes as any)?.data;
    if (Array.isArray(raw?.[0])) return raw[0] as SubscriptionPlan[];
    if (Array.isArray(raw)) return raw as SubscriptionPlan[];
    return [];
  }, [plansRes]);

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

  // ✅ Billing API
  const { data: billingRes, isLoading: loadingBilling } =
    useGetBillingDetailsQuery();

  const [saveBilling, { isLoading: savingBilling }] =
    useSaveBillingDetailsMutation();

  const [billingForm, setBillingForm] = useState<BillingFormState>(initialBillingForm);
  const [billingTouched, setBillingTouched] = useState<Record<keyof BillingFormState, boolean>>(
    {} as any
  );

  // Prefill billing form once data loads
  useEffect(() => {
    const existing = (billingRes as any)?.data;
    if (!existing) return;

    setBillingForm({
      panNumber: (existing.panNumber ?? "").toUpperCase(),
      addressLine1: existing.addressLine1 ?? "",
      addressLine2: existing.addressLine2 ?? "",
      city: existing.city ?? "",
      state: existing.state ?? "",
      pincode: existing.pincode ?? "",
    });
  }, [billingRes]);

  // ✅ Payment: fetch plan by selected planId
  const selectedPlanId = Number(flow.planId || 0);

  const { data: planRes, isLoading: planLoading } = useGetPlanByIdQuery(selectedPlanId, {
    skip: !selectedPlanId,
  } as any);

  const selectedPlan = (planRes as any)?.data;

  const [subscribeToPlan] = useSubscribeToPlanMutation();
  const [submitting, setSubmitting] = useState(false);

  // ✅ Terms checkbox
  const [termsChecked, setTermsChecked] = useState(Boolean(flow.termsAccepted));

  useEffect(() => {
    setTermsChecked(Boolean(flow.termsAccepted));
  }, [flow.termsAccepted]);

  // ✅ Validation billing
  const billingValidators = useMemo(() => {
    const pan = billingForm.panNumber.trim().toUpperCase();
    const pin = billingForm.pincode.trim();

    const panOk = !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const pinOk = !!pin && /^[0-9]{6}$/.test(pin);

    const requiredOk =
      billingForm.addressLine1.trim() &&
      billingForm.city.trim() &&
      billingForm.state.trim() &&
      billingForm.pincode.trim();

    return { panOk, pinOk, requiredOk };
  }, [billingForm]);

  const canSaveBilling = billingValidators.requiredOk && billingValidators.pinOk && billingValidators.panOk;

  // ✅ Pricing
  const gstPct = 18;
  const priceCents = Number(selectedPlan?.priceCents || 0);

  const gstCents = useMemo(() => Math.round((priceCents * gstPct) / 100), [priceCents]);
  const totalCents = priceCents + gstCents;

  // ✅ Plan selection card
  const renderPlanCard = (p: SubscriptionPlan, type: Mode) => {
    const selected = flow.planId === p.id && flow.mode === type;
    const badge = getBadge(p);
    const highlights = pickHighlights(p);

    return (
      <motion.div
        key={p.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={() => {
          setFlow((prev) => ({
            ...prev,
            planId: p.id,
            mode: type,
            // reset later steps on plan change
            termsAccepted: false,
            acceptedAt: undefined,
            billingDone: false,
            step: 1,
          }));
          setTermsChecked(false);
        }}
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
            setFlow((prev) => ({
              ...prev,
              planId: p.id,
              mode: type,
              termsAccepted: false,
              acceptedAt: undefined,
              billingDone: false,
              step: 1,
            }));
            setTermsChecked(false);
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

  // ✅ Step 1 Continue: show modal if not logged-in, else go to terms
  const handleContinueFromPlan = () => {
    if (!flow.planId || !flow.mode) return;

    if (!authReady) return;

    if (!isAuthenticated) {
      setPendingAfterAuth("CONTINUE_FROM_PLAN");
      setAuthOpen(true);
      return;
    }

    setStep(2);
  };

  // ✅ after login/register success from modal
  const onAuthed = async () => {
    setAuthOpen(false);

    try {
      await refetchMe();
    } catch {
      // ignore
    }

    if (pendingAfterAuth === "CONTINUE_FROM_PLAN") {
      setPendingAfterAuth(null);
      if (flow.planId && flow.mode) setStep(2);
    }
  };

  const handleAcceptTerms = () => {
    if (!termsChecked) return;

    setFlow((p) => ({
      ...p,
      termsAccepted: true,
      acceptedAt: new Date().toISOString(),
      step: 3,
    }));
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();

    setBillingTouched({
      panNumber: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      pincode: true,
    });

    if (!canSaveBilling) return;

    try {
      await saveBilling({
        panNumber: billingForm.panNumber.trim()
          ? billingForm.panNumber.trim().toUpperCase()
          : null,
        addressLine1: billingForm.addressLine1.trim(),
        addressLine2: billingForm.addressLine2.trim() || null,
        city: billingForm.city.trim(),
        state: billingForm.state.trim(),
        pincode: billingForm.pincode.trim(),
      }).unwrap();

      setFlow((p) => ({
        ...p,
        billingDone: true,
        step: 4,
      }));
    } catch (err) {
      console.error("Save billing failed:", err);
      alert("Failed to save billing details. Please try again.");
    }
  };

  const handleActivate = async () => {
    if (!flow.planId) return;

    if (!isAuthenticated) {
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);

      await subscribeToPlan({
        planId: flow.planId,
        trialDays: undefined,
      } as any).unwrap();

      setFlow((p) => ({ ...p, step: 5 }));
    } catch (err: any) {
      console.error("Activation failed:", err);
      alert(err?.data?.message || "Failed to activate subscription. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    sessionStorage.removeItem(FLOW_KEY);
    setFlow({ step: 1 });
    setMode("copy");
    setSearch("");
    setTermsChecked(false);
    setBillingTouched({} as any);
    setBillingForm(initialBillingForm);
    setPendingAfterAuth(null);
    setAuthOpen(false);
  };

  const step = flow.step;

  const showPlanStep = step === 1;
  const showTermsStep = step === 2;
  const showBillingStep = step === 3;
  const showPaymentStep = step === 4;
  const showDoneStep = step === 5;

  const plansLoadingState = plansLoading || plansFetching;

  const showBillingErr = (field: keyof BillingFormState, ok: boolean) =>
    Boolean(billingTouched[field]) && !ok;

  return (
    <>
      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingAfterAuth(null);
        }}
        onAuthed={onAuthed}
        defaultTab="login"
      />

      <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 pb-28">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-semibold tracking-tight"
            >
              Subscription <span className="text-emerald-400">Setup</span>
            </motion.h1>
            <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
              Choose plan → accept terms → billing → payment → done.
            </p>

            {!meLoading && meError && (
              <p className="text-xs text-yellow-400 mt-2">
                Auth check failed (/me). If you are logged in, ensure baseApi uses credentials: "include".
              </p>
            )}
          </div>

          <div className="max-w-3xl mx-auto mb-8">
            <SubscriptionStepper currentStep={step} />
          </div>

          {/* ✅ Back button fixed */}
          {step > 1 && step < 5 && (
            <div className="max-w-5xl mx-auto mb-6">
              <button
                onClick={() => setStep((step - 1) as FlowStep)}
                className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          )}

          {/* =========================
              STEP 1: PLAN
             ========================= */}
          {showPlanStep && (
            <>
              <div className="max-w-3xl mx-auto mb-10 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                    Step 1 · Select your product
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMode("strategies")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "strategies"
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      API Plans
                    </button>

                    <button
                      onClick={() => setMode("copy")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "copy"
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      Pine Connector
                    </button>

                    <button
                      onClick={() => setMode("both")}
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
                  <span>
                    {plansLoadingState ? "Loading plans…" : `Active plans: ${allPlans.length}`}
                  </span>
                  {!plansLoadingState && allPlans.length === 0 && (
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

                  {plansLoadingState ? (
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
                      {apiPlans.map((p) => renderPlanCard(p, "strategies"))}
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

                  {plansLoadingState ? (
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
                      {pinePlans.map((p) => renderPlanCard(p, "copy"))}
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

              {/* Bottom action */}
              <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
                <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    {flow.planId ? (
                      <span>
                        Selected plan ID:{" "}
                        <span className="text-slate-100 font-semibold">{flow.planId}</span>{" "}
                        • Next: Agreement → Billing → Payment
                      </span>
                    ) : (
                      <span>Select any plan to continue</span>
                    )}
                  </div>

                  <button
                    disabled={!flow.planId || !authReady}
                    onClick={handleContinueFromPlan}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      flow.planId && authReady
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                    title={!authReady ? "Checking login status..." : undefined}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* =========================
              STEP 2: TERMS
             ========================= */}
          {showTermsStep && (
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-semibold flex justify-center gap-3">
                  <ShieldCheck className="text-emerald-400" size={32} />
                  Terms & Agreement
                </h2>
                <p className="text-slate-400 mt-2 text-sm">
                  Please review and accept the terms before proceeding.
                </p>

                <p className="text-[11px] text-slate-500 mt-2">
                  Plan ID:{" "}
                  <span className="text-slate-300 font-semibold">{flow.planId}</span>{" "}
                  • Mode:{" "}
                  <span className="text-slate-300 font-semibold">{flow.mode}</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-emerald-400" size={26} />
                  <h3 className="text-xl font-semibold">Legal Agreement</h3>
                </div>

                <div className="space-y-5 text-sm leading-relaxed text-slate-300 h-[320px] overflow-y-auto pr-2">
                  <p>By enabling automated execution, you acknowledge that:</p>

                  <ul className="list-disc list-inside space-y-3 text-slate-400">
                    <li>Orders may be automatically executed based on strategy signals.</li>
                    <li>Past performance does not guarantee future returns.</li>
                    <li>You authorize the platform to place/modify/close orders on your behalf.</li>
                    <li>Profit-sharing / fees (if applicable) apply as per the plan terms.</li>
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
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                    className="h-5 w-5 rounded border border-slate-700 bg-slate-800 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300">
                    I have read and accept all the terms & conditions.
                  </span>
                </div>

                <button
                  disabled={!termsChecked}
                  onClick={handleAcceptTerms}
                  className={`mt-6 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
                    ${
                      termsChecked
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
          )}

          {/* =========================
              STEP 3: BILLING
             ========================= */}
          {showBillingStep && (
            <div className="max-w-5xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-3xl font-semibold flex items-center gap-3">
                    <User size={32} className="text-emerald-400" />
                    Billing Details (Invoice)
                  </h2>
                  <p className="text-slate-400 mt-2 text-sm max-w-xl">
                    We use these details only for invoices / basic KYC. Bank details are not required.
                  </p>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex gap-3">
                  <Info size={16} className="text-emerald-400 mt-0.5" />
                  <p>Provide correct address & PAN (PAN optional) for GST invoices.</p>
                </div>
              </motion.div>

              <div className="grid lg:grid-cols-[2fr,1.1fr] gap-6">
                <motion.form
                  onSubmit={handleSaveBilling}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-8"
                >
                  {/* PAN */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <User size={20} className="text-emerald-400" />
                      PAN (Optional)
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm">PAN Number</label>
                        <input
                          maxLength={10}
                          value={billingForm.panNumber}
                          onChange={(e) =>
                            setBillingForm((p) => ({
                              ...p,
                              panNumber: e.target.value.toUpperCase(),
                            }))
                          }
                          onBlur={() =>
                            setBillingTouched((p) => ({ ...p, panNumber: true }))
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
                          placeholder="ABCDE1234F"
                          disabled={loadingBilling}
                        />
                        {showBillingErr("panNumber", billingValidators.panOk) && (
                          <p className="text-xs text-red-300 mt-1">
                            Enter a valid PAN (ABCDE1234F)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <MapPin size={20} className="text-emerald-400" />
                      Address (for GST invoices)
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm">Address Line 1</label>
                        <input
                          required
                          value={billingForm.addressLine1}
                          onChange={(e) =>
                            setBillingForm((p) => ({
                              ...p,
                              addressLine1: e.target.value,
                            }))
                          }
                          onBlur={() =>
                            setBillingTouched((p) => ({
                              ...p,
                              addressLine1: true,
                            }))
                          }
                          className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                          placeholder="Flat / House / Building"
                          disabled={loadingBilling}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-sm">Address Line 2</label>
                        <input
                          value={billingForm.addressLine2}
                          onChange={(e) =>
                            setBillingForm((p) => ({
                              ...p,
                              addressLine2: e.target.value,
                            }))
                          }
                          onBlur={() =>
                            setBillingTouched((p) => ({
                              ...p,
                              addressLine2: true,
                            }))
                          }
                          className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                          placeholder="Road / Area / Locality"
                          disabled={loadingBilling}
                        />
                      </div>

                      <div>
                        <label className="text-sm">City</label>
                        <input
                          required
                          value={billingForm.city}
                          onChange={(e) =>
                            setBillingForm((p) => ({ ...p, city: e.target.value }))
                          }
                          onBlur={() =>
                            setBillingTouched((p) => ({ ...p, city: true }))
                          }
                          className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                          disabled={loadingBilling}
                        />
                      </div>

                      <div>
                        <label className="text-sm">State</label>
                        <input
                          required
                          value={billingForm.state}
                          onChange={(e) =>
                            setBillingForm((p) => ({ ...p, state: e.target.value }))
                          }
                          onBlur={() =>
                            setBillingTouched((p) => ({ ...p, state: true }))
                          }
                          className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                          disabled={loadingBilling}
                        />
                      </div>

                      <div>
                        <label className="text-sm">Pincode</label>
                        <input
                          required
                          maxLength={6}
                          value={billingForm.pincode}
                          onChange={(e) =>
                            setBillingForm((p) => ({
                              ...p,
                              pincode: e.target.value,
                            }))
                          }
                          onBlur={() =>
                            setBillingTouched((p) => ({ ...p, pincode: true }))
                          }
                          className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                          disabled={loadingBilling}
                        />
                        {showBillingErr("pincode", billingValidators.pinOk) && (
                          <p className="text-xs text-red-300 mt-1">
                            Pincode must be 6 digits
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingBilling || loadingBilling || !canSaveBilling}
                    className="w-full bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={18} />
                    {savingBilling ? "Saving..." : "Save & Continue to Payment"}
                    <ArrowRight size={18} />
                  </button>
                </motion.form>

                <div className="space-y-4">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-2">Why we need this?</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      <li>To generate GST-compliant invoices.</li>
                      <li>Basic identity verification (PAN optional).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-2">Selected Plan</h3>
                    <p className="text-xs text-slate-400">
                      Plan ID:{" "}
                      <span className="text-slate-200 font-semibold">{flow.planId ?? "—"}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mode:{" "}
                      <span className="text-slate-200 font-semibold">{flow.mode ?? "—"}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================
              STEP 4: PAYMENT
             ========================= */}
          {showPaymentStep && (
            <div className="max-w-3xl mx-auto space-y-8">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-3xl font-semibold flex items-center gap-3">
                  <CreditCard size={32} className="text-emerald-400" />
                  Confirm & Activate Subscription
                </h2>
                <p className="text-slate-400 mt-2 text-sm">
                  Review your plan summary and proceed.
                </p>
              </motion.div>

              {!isAuthenticated && !meLoading && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200 flex gap-3">
                  <AlertTriangle className="mt-0.5" size={18} />
                  <div>You are not logged in. Please login and continue.</div>
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
                      {planLoading ? "Loading..." : (selectedPlan?.name || "Selected Plan")}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {planLoading ? "—" : (selectedPlan?.description || "—")}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-2">
                      Mode:{" "}
                      <span className="text-slate-300 font-semibold">{flow.mode}</span>{" "}
                      • Plan ID:{" "}
                      <span className="text-slate-300 font-semibold">{flow.planId}</span>{" "}
                      • User ID:{" "}
                      <span className="text-slate-300 font-semibold">{userId || "—"}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Price</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {planLoading ? "—" : formatINR(priceCents)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedPlan?.interval === "monthly"
                        ? "per month"
                        : selectedPlan?.interval === "yearly"
                        ? "per year"
                        : "lifetime"}
                    </p>
                  </div>
                </div>

                {/* PAYMENT BREAKUP */}
                <div className="border-t border-slate-800 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
                    Payment Summary
                  </p>

                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Plan price</span>
                      <span className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        {planLoading ? "—" : Math.round(priceCents / 100).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>GST @ {gstPct}%</span>
                      <span className="flex items-center gap-1">
                        <IndianRupee size={12} />
                        {planLoading ? "—" : Math.round(gstCents / 100).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
                      <span className="text-sm font-semibold">Total payable now</span>
                      <span className="flex items-center gap-1 text-lg font-semibold text-emerald-400">
                        <IndianRupee size={18} />
                        {planLoading ? "—" : Math.round(totalCents / 100).toLocaleString("en-IN")}
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
                  disabled={planLoading || submitting || !isAuthenticated}
                  onClick={handleActivate}
                  className="w-full mt-2 bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Activating..."
                    : totalCents === 0
                    ? "Activate Subscription"
                    : "Pay & Activate"}
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            </div>
          )}

          {/* =========================
              STEP 5: DONE
             ========================= */}
          {showDoneStep && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <CheckCircle className="text-emerald-400" size={28} />
                </div>

                <h2 className="text-2xl font-semibold mt-4">Subscription Activated</h2>
                <p className="text-slate-400 mt-2 text-sm">
                  You can now start using your subscription features.
                </p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500">Plan ID</p>
                    <p className="text-sm text-slate-100 font-semibold">{flow.planId ?? "—"}</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500">Mode</p>
                    <p className="text-sm text-slate-100 font-semibold">{flow.mode ?? "—"}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => resetFlow()}
                    className="px-5 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                  >
                    Start New Subscription
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem(FLOW_KEY);
                      window.location.href = "/dashboard";
                    }}
                    className="px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Go to Dashboard
                  </button>
                </div>

                <button
                  onClick={resetFlow}
                  className="mt-4 text-xs text-slate-500 hover:text-slate-300"
                >
                  Reset wizard state
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionWizardPage;
