import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
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
 * - UI DOES NOT mention internal execution technology
 */

type Mode = "forex" | "india" | "crypto" | "copy" | "bundle";

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
  const ff: any = (p.featureFlags || {}) as any;
  const highlights: string[] = [];

  // Keep these user-facing and non-technical
  if (ff.webhookAccess) highlights.push("Automation signals");
  if (ff.tradeCopier) highlights.push("Copy trading");
  if (ff.advancedRisk) highlights.push("Advanced risk controls");
  if (ff.priorityExecution) highlights.push("Priority processing");
  if (ff.vpsIncluded) highlights.push("Dedicated VPS");
  if (ff.paperTrading) highlights.push("Paper trading");

  highlights.push(`${p.maxActiveStrategies} strategies`);
  highlights.push(`${p.maxConnectedAccounts} accounts`);

  if (p.maxDailyTrades != null) highlights.push(`${p.maxDailyTrades} daily trades`);
  if ((p as any).maxLotPerTrade) highlights.push(`Max lot: ${(p as any).maxLotPerTrade}`);

  return highlights.slice(0, 6);
};

const sortByTier = (a: SubscriptionPlan, b: SubscriptionPlan) => {
  const tierRank: Record<string, number> = {
    starter: 1,
    basic: 2,
    standard: 3,
    pro: 4,
    premium: 5,
    elite: 6,
    lifetime: 7,
  };
  const ta = String((a.metadata as any)?.tier || "");
  const tb = String((b.metadata as any)?.tier || "");
  return (tierRank[ta] || 99) - (tierRank[tb] || 99);
};

const modeLabel = (m?: Mode) => {
  switch (m) {
    case "forex":
      return "Forex Plans";
    case "india":
      return "India Market Plans";
    case "crypto":
      return "Crypto Market Plans";
    case "copy":
      return "Copy Trading Plans";
    case "bundle":
      return "Bundle Plans";
    default:
      return "—";
  }
};

const modeDesc = (m?: Mode) => {
  switch (m) {
    case "forex":
      return "Automated forex trading with risk controls and performance tracking.";
    case "india":
      return "Plans designed for Indian market automation and account management.";
    case "crypto":
      return "Plans designed for crypto automation with faster execution and analytics.";
    case "copy":
      return "Follow a master and mirror trades with configurable risk settings.";
    case "bundle":
      return "All-in-one plans that combine multiple products and limits.";
    default:
      return "";
  }
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

const getMaxAllowedStep = (flow: FlowState): FlowStep => {
  if (flow.step === 5) return 5;

  const hasPlan = Boolean(flow.planId && flow.mode);
  const hasTerms = Boolean(flow.termsAccepted);
  const hasBilling = Boolean(flow.billingDone);

  if (!hasPlan) return 1;
  if (!hasTerms) return 2;
  if (!hasBilling) return 3;
  return 4;
};

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
  const [flow, setFlow] = useState<FlowState>(() => loadFlow());

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

  const setStep = (next: FlowStep) => {
    if (next < flow.step) {
      setFlow((p) => ({ ...p, step: next }));
      return;
    }

    const maxAllowed = getMaxAllowedStep(flow);
    if (next <= maxAllowed) {
      setFlow((p) => ({ ...p, step: next }));
      return;
    }

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

  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState<PendingAfterAuth>(null);

  // ✅ Plans list
  const [mode, setMode] = useState<Mode>(flow.mode ?? "forex");
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

  const safeFF = (p: SubscriptionPlan) => (p.featureFlags || {}) as any;

  // ✅ Tabs (no tech wording, only business grouping)
  const bundlePlans = useMemo(
    () => filteredPlans.filter((p) => Boolean(safeFF(p)?.bundle)).sort(sortByTier),
    [filteredPlans]
  );

  const copyPlans = useMemo(
    () => filteredPlans.filter((p) => Boolean(safeFF(p)?.tradeCopier)).sort(sortByTier),
    [filteredPlans]
  );

  const forexPlans = useMemo(
    () =>
      filteredPlans
        .filter((p) => p.category === "FOREX" && !safeFF(p)?.bundle && !safeFF(p)?.tradeCopier)
        .sort(sortByTier),
    [filteredPlans]
  );

  const indiaPlans = useMemo(
    () =>
      filteredPlans
        .filter((p) => p.category === "INDIA" && !safeFF(p)?.bundle && !safeFF(p)?.tradeCopier)
        .sort(sortByTier),
    [filteredPlans]
  );

  const cryptoPlans = useMemo(
    () =>
      filteredPlans
        .filter((p) => p.category === "CRYPTO" && !safeFF(p)?.bundle && !safeFF(p)?.tradeCopier)
        .sort(sortByTier),
    [filteredPlans]
  );

  // ✅ Billing
  const { data: billingRes, isLoading: loadingBilling } = useGetBillingDetailsQuery();
  const [saveBilling, { isLoading: savingBilling }] = useSaveBillingDetailsMutation();

  const [billingForm, setBillingForm] = useState<BillingFormState>(initialBillingForm);
  const [billingTouched, setBillingTouched] = useState<Record<keyof BillingFormState, boolean>>(
    {} as any
  );

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

  // ✅ Payment: selected plan details
  const selectedPlanId = Number(flow.planId || 0);
  const { data: planRes, isLoading: planLoading } = useGetPlanByIdQuery(selectedPlanId, {
    skip: !selectedPlanId,
  } as any);

  const selectedPlan = (planRes as any)?.data;

  const [subscribeToPlan] = useSubscribeToPlanMutation();
  const [submitting, setSubmitting] = useState(false);

  // ✅ Terms
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

  const canSaveBilling =
    billingValidators.requiredOk && billingValidators.pinOk && billingValidators.panOk;

  // ✅ Pricing
  const gstPct = 18;
  const priceCents = Number(selectedPlan?.priceCents || 0);
  const gstCents = useMemo(() => Math.round((priceCents * gstPct) / 100), [priceCents]);
  const totalCents = priceCents + gstCents;

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
    setMode("forex");
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

          {/* Back button */}
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
                    Step 1 · Select your plan
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMode("forex")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "forex"
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      Forex
                    </button>

                    <button
                      onClick={() => setMode("india")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "india"
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      India
                    </button>

                    <button
                      onClick={() => setMode("crypto")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "crypto"
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      Crypto
                    </button>

                    <button
                      onClick={() => setMode("copy")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "copy"
                          ? "bg-emerald-500 text-slate-900 border-emerald-500"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      Copy Trading
                    </button>

                    <button
                      onClick={() => setMode("bundle")}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                        mode === "bundle"
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
                  <span className="mt-1">Performance</span>
                </div>
                <div className="flex flex-col items-center text-slate-400 text-xs">
                  <Zap size={32} />
                  <span className="mt-1">Fast Execution</span>
                </div>
                <div className="flex flex-col items-center text-slate-400 text-xs">
                  <BarChart3 size={32} />
                  <span className="mt-1">Analytics</span>
                </div>
                <div className="flex flex-col items-center text-slate-400 text-xs">
                  <Shield size={32} />
                  <span className="mt-1">Risk Controls</span>
                </div>
              </div>

              {/* Mode header */}
              <div className="text-center mb-4">
                <p className="text-sm text-slate-300 font-medium">{modeLabel(mode)}</p>
                <p className="text-xs text-slate-500 mt-1">{modeDesc(mode)}</p>
              </div>

              {/* Plans grid */}
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
              ) : (
                <>
                  {mode === "forex" &&
                    (forexPlans.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-10">
                        No Forex plans found.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {forexPlans.map((p) => renderPlanCard(p, "forex"))}
                      </div>
                    ))}

                  {mode === "india" &&
                    (indiaPlans.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-10">
                        No India plans found.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-6">
                        {indiaPlans.map((p) => renderPlanCard(p, "india"))}
                      </div>
                    ))}

                  {mode === "crypto" &&
                    (cryptoPlans.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-10">
                        No Crypto plans found.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-6">
                        {cryptoPlans.map((p) => renderPlanCard(p, "crypto"))}
                      </div>
                    ))}

                  {mode === "copy" &&
                    (copyPlans.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-10">
                        No Copy Trading plans found.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {copyPlans.map((p) => renderPlanCard(p, "copy"))}
                      </div>
                    ))}

                  {mode === "bundle" &&
                    (bundlePlans.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-10">
                        No Bundle plans found.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {bundlePlans.map((p) => renderPlanCard(p, "bundle"))}
                      </div>
                    ))}
                </>
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
                  • Category:{" "}
                  <span className="text-slate-300 font-semibold">{modeLabel(flow.mode)}</span>
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
                    <li>Execution may be paused during volatility / connectivity / risk events.</li>
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
                      Category:{" "}
                      <span className="text-slate-200 font-semibold">
                        {modeLabel(flow.mode)}
                      </span>
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
                      Category:{" "}
                      <span className="text-slate-300 font-semibold">{modeLabel(flow.mode)}</span>{" "}
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
                    <span>Secure checkout will be integrated here.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <span>Activation happens after confirmation.</span>
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
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="text-sm text-slate-100 font-semibold">{modeLabel(flow.mode)}</p>
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
