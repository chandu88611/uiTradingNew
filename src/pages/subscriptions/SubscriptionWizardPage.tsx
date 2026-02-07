// SubscriptionPlansMarketplaceV3.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  BadgeCheck,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Filter,
  Info,
  Layers,
  Shield,
  Sparkles,
  Star,
  Users,
  Wallet,
  X,
  Zap,
  Search,
  RefreshCw,
  FileText,
  MapPin,
  CreditCard,
} from "lucide-react";

import AuthModal from "../../pages/auth/AuthModel"; // ✅ adjust path if needed

import {
  useGetMyCurrentSubscriptionQuery,
  useSubscribeToPlanMutation,
  useListActivePlansQuery,
  useGetPlanByIdQuery,
} from "../../services/profileSubscription.api";

import {
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
} from "../../services/userApi";

type BillingCycle = "MONTHLY" | "YEARLY";
type PlanTier = "BASIC" | "PRO" | "ELITE" | "BUNDLE";
type MarketCodeUI = "NSE" | "BSE" | "FOREX" | "CRYPTO";
type MarketFilter = "ALL" | "MULTI" | MarketCodeUI;

type Step = "PLAN" | "TERMS" | "ADDRESS" | "PAYMENT" | "SUBSCRIBE";

const container = "max-w-7xl mx-auto px-4 sm:px-5 md:px-8";
const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const subtle = "text-slate-400 text-xs md:text-sm leading-relaxed";
const pill =
  "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300";
const inputBase =
  "mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600";

const ALL_MARKETS: MarketCodeUI[] = ["NSE", "BSE", "FOREX", "CRYPTO"];

const cx = (...cls: Array<string | false | undefined | null>) =>
  cls.filter(Boolean).join(" ");

const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const boolish = (v: any) => v === true || v === "true" || v === 1 || v === "1";

const numish = (v: any, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const is401 = (err: any) =>
  err?.status === 401 ||
  err?.originalStatus === 401 ||
  err?.data?.statusCode === 401;

const toPlanId = (v: any): string | null => {
  const s = String(v ?? "").trim();
  return s.length ? s : null; // ✅ UUID string
};

const notifyError = (err: any, fallback = "Something went wrong") => {
  const msg =
    err?.data?.message ||
    err?.data?.error ||
    err?.error ||
    err?.message ||
    fallback;
  toast.error(String(msg));
};

const planTypeMeta: Record<
  PlanTier,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  BASIC: { label: "BASIC", cls: "bg-slate-200 text-slate-950", icon: <Zap size={14} /> },
  PRO: { label: "PRO", cls: "bg-emerald-400 text-slate-950", icon: <Star size={14} /> },
  ELITE: { label: "ELITE", cls: "bg-amber-400 text-slate-950", icon: <Crown size={14} /> },
  BUNDLE: { label: "BUNDLE", cls: "bg-sky-400 text-slate-950", icon: <Sparkles size={14} /> },
};

const Divider = () => <div className="my-4 h-px w-full bg-slate-800/80" />;

const PlanMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-xs text-slate-300">
    <span className="text-emerald-400">{icon}</span>
    <span className="text-slate-500">{label}:</span>
    <span className="font-semibold text-slate-200">{value}</span>
  </div>
);

// -------- plan helpers ----------
function featuresToMap(features: Array<{ featureKey: string; featureValue: string }>) {
  const m: Record<string, string> = {};
  for (const f of features ?? []) m[f.featureKey] = String(f.featureValue);
  return m;
}
function getFeatureFlags(plan: any): Record<string, any> {
  if (Array.isArray(plan?.features)) return featuresToMap(plan.features);
  if (plan?.featureFlags && typeof plan.featureFlags === "object") return plan.featureFlags;
  return {};
}
function toTierFromMetadata(name: string, metadata: any, planTypeCode?: string | null): PlanTier {
  const tier = String(metadata?.tier ?? "").toUpperCase();
  if (tier === "BASIC" || tier === "PRO" || tier === "ELITE" || tier === "BUNDLE") return tier;
  if (planTypeCode === "BUNDLE") return "BUNDLE";
  const n = String(name || "").toLowerCase();
  if (n.includes("elite")) return "ELITE";
  if (n.includes("pro")) return "PRO";
  if (n.includes("bundle")) return "BUNDLE";
  return "BASIC";
}
function deriveMarketCodes(plan: any): { isMulti: boolean; marketCodes: MarketCodeUI[] } {
  const md = plan?.metadata ?? {};
  const looksMulti =
    plan?.marketId == null || md?.includes === "multi" || /bundle|all/i.test(String(plan?.name ?? ""));
  if (looksMulti) return { isMulti: true, marketCodes: ALL_MARKETS };

  const code = plan?.market?.code || plan?.category;
  if (code === "FOREX") return { isMulti: false, marketCodes: ["FOREX"] };
  if (code === "CRYPTO") return { isMulti: false, marketCodes: ["CRYPTO"] };
  if (code === "INDIAN" || code === "INDIA") return { isMulti: false, marketCodes: ["NSE", "BSE"] };

  return { isMulti: false, marketCodes: [] };
}
function planInterval(plan: any): "monthly" | "yearly" | "lifetime" | null {
  const a = plan?.pricing?.interval;
  if (a) return String(a).toLowerCase() as any;
  const b = plan?.interval;
  if (b) return String(b).toLowerCase() as any;
  return null;
}
function priceInInr(plan: any): { isFree: boolean; priceInr: number | null } {
  if (plan?.pricing) {
    const p = Number(plan?.pricing?.priceInr);
    return { isFree: !!plan?.pricing?.isFree, priceInr: Number.isFinite(p) ? p : null };
  }
  const cents = Number(plan?.priceCents);
  const isFree = cents === 0 || plan?.isFree === true;
  if (!Number.isFinite(cents)) return { isFree, priceInr: null };
  return { isFree, priceInr: cents / 100 };
}
function cycleToInterval(cycle: BillingCycle) {
  return cycle === "MONTHLY" ? "monthly" : "yearly";
}

const marketChip = (code: MarketCodeUI) => (
  <span key={code} className={pill}>
    <Layers size={14} className="text-emerald-400" />
    {code}
  </span>
);

const featurePills = (plan: any) => {
  const f = getFeatureFlags(plan);
  const copyTrading = boolish(f.copy_trading) || boolish(f.copyTrading) || boolish(f.isCopyTrading);
  const priority = boolish(f.priority_support) || boolish(f.prioritySupport) || boolish(f.priority);
  const maxAccounts =
    plan?.limits?.maxConnectedAccounts ??
    plan?.maxConnectedAccounts ??
    (f.max_accounts ? numish(f.max_accounts, 0) : 0) ??
    0;

  const items: { ok: boolean; label: string; icon: React.ReactNode }[] = [
    { ok: true, label: `Strategies: ${Array.isArray(plan?.planStrategies) ? plan.planStrategies.length : 0}`, icon: <BarChart3 size={14} className="text-emerald-400" /> },
    { ok: copyTrading, label: "Copy Trading", icon: <Users size={14} className="text-emerald-400" /> },
    { ok: priority, label: "Priority", icon: <Star size={14} className="text-emerald-400" /> },
    { ok: true, label: `Accounts: ${maxAccounts || 0}`, icon: <Layers size={14} className="text-emerald-400" /> },
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((it) => (
        <span
          key={it.label}
          className={cx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
            it.ok ? "border-emerald-500/30 bg-emerald-500/10 text-slate-200" : "border-slate-800 bg-slate-950/30 text-slate-500"
          )}
        >
          {it.icon}
          {it.label}
        </span>
      ))}
    </div>
  );
};

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ k: Step; label: string }> = [
    { k: "PLAN", label: "Plan" },
    { k: "TERMS", label: "Terms" },
    { k: "ADDRESS", label: "Address" },
    { k: "PAYMENT", label: "Payment" },
    { k: "SUBSCRIBE", label: "Subscribe" },
  ];
  const activeIdx = steps.findIndex((s) => s.k === step);

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s, idx) => {
        const active = idx === activeIdx;
        const done = idx < activeIdx;
        return (
          <div
            key={s.k}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-extrabold",
              done
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : active
                ? "border-slate-700 bg-slate-950/50 text-slate-200"
                : "border-slate-800 bg-slate-950/30 text-slate-500"
            )}
          >
            <span className={cx("h-2 w-2 rounded-full", done ? "bg-emerald-400" : active ? "bg-slate-300" : "bg-slate-700")} />
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="w-full">
      <p className="mb-2 text-[11px] font-semibold text-slate-400">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-[12px] font-extrabold text-slate-200 outline-none focus:border-emerald-500/60"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-slate-950">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronRight
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 rotate-90"
        />
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500">{label}</span>
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/40 p-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cx(
                "px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition",
                active ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-slate-100"
              )}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------- Address draft ----------
type AddressDraft = {
  panNumber?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
};
const emptyAddress: AddressDraft = {
  panNumber: null,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};
function validateAddress(a: AddressDraft) {
  if (!a.addressLine1?.trim()) return "Address Line 1 is required";
  if (!a.city?.trim()) return "City is required";
  if (!a.state?.trim()) return "State is required";
  if (!a.pincode?.trim()) return "Pincode is required";
  return null;
}

// -------- Resume snapshot ----------
type ResumeState = {
  modalOpen: boolean;
  step: Step;
  selectedPlanId: string | null;
  agreed: boolean;
  paymentDone: boolean;
  addressDraft: AddressDraft;
  editingAddress: boolean;
};

export default function SubscriptionPlansMarketplaceV3() {
  // filters
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<PlanTier | "ALL">("ALL");
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

  // selection
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // modal flow
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("PLAN");

  // terms + payment
  const [agreed, setAgreed] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // address
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);
  const [editingAddress, setEditingAddress] = useState(false);

  // auth modal
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "signup">("login");
  const [authPromptedOnce, setAuthPromptedOnce] = useState(false);
  const resumeRef = useRef<ResumeState | null>(null);

  const snapshot = (): ResumeState => ({
    modalOpen,
    step,
    selectedPlanId,
    agreed,
    paymentDone,
    addressDraft,
    editingAddress,
  });

  const openAuthAndRemember = (override?: Partial<ResumeState>) => {
    resumeRef.current = { ...snapshot(), ...(override ?? {}) };
    setAuthDefaultTab("login");
    setAuthOpen(true);
  };

  const restoreResume = () => {
    const r = resumeRef.current;
    resumeRef.current = null;
    if (!r) return;

    setSelectedPlanId(r.selectedPlanId);
    setModalOpen(r.modalOpen);
    setStep(r.step);
    setAgreed(r.agreed);
    setPaymentDone(r.paymentDone);
    setAddressDraft(r.addressDraft);
    setEditingAddress(r.editingAddress);
  };

  // current subscription (also acts like auth-check: 401 => not logged in)
  const {
    data: currentSubResp,
    isFetching: isFetchingCurrentSub,
    error: currentSubError,
    refetch: refetchCurrentSub,
  } = useGetMyCurrentSubscriptionQuery(undefined as any);

  const isUnauthed = is401(currentSubError);

  useEffect(() => {
    // ✅ If user is not logged in, show auth modal (once automatically)
    if (isUnauthed && !authPromptedOnce) {
      setAuthPromptedOnce(true);
      openAuthAndRemember(); // remember current state (even if nothing yet)
    }
  }, [isUnauthed, authPromptedOnce]);

  const currentSub = (currentSubResp as any)?.data ?? null;
  const currentStatus = currentSub?.statusV2 ?? currentSub?.status ?? null;

  // plans list
  const {
    data: listResp,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useListActivePlansQuery(undefined);

  // ✅ FIXED: your API returns data: [ [plans], count ]
  const rawPlans: any[] = useMemo(() => {
    const d: any = listResp;
    const payload = d?.data ?? d;

    if (Array.isArray(payload) && Array.isArray(payload[0])) return payload[0]; // tuple
    if (Array.isArray(payload)) return payload; // direct array
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data?.rows)) return payload.data.rows;

    return [];
  }, [listResp]);

  // filter plans
  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    const wantInterval = cycleToInterval(cycle);

    return rawPlans
      .filter((p: any) => p?.isActive !== false)
      .filter((p: any) => {
        const interval = planInterval(p);
        if (!interval) return true;
        if (interval === "lifetime") return true;
        return interval === wantInterval;
      })
      .filter((p: any) => {
        if (!q) return true;
        const hay = `${p?.name} ${p?.description ?? ""} ${p?.market?.code ?? ""} ${p?.planType?.code ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .filter((p: any) => {
        const tier = toTierFromMetadata(p?.name, p?.metadata ?? {}, p?.planType?.code ?? null);
        if (typeFilter === "ALL") return true;
        return tier === typeFilter;
      })
      .filter((p: any) => {
        const { isMulti, marketCodes } = deriveMarketCodes(p);
        if (marketFilter === "ALL") return true;
        if (marketFilter === "MULTI") return isMulti;
        return marketCodes.includes(marketFilter);
      });
  }, [rawPlans, search, typeFilter, marketFilter, cycle]);

  // plan preview (from list)
  const selectedPlanPreview =
    (selectedPlanId
      ? filteredPlans.find((p: any) => String(p?.id) === selectedPlanId) ??
        rawPlans.find((p: any) => String(p?.id) === selectedPlanId)
      : null) ?? null;

  // ✅ plan details fetch (UUID string)
  const {
    data: planByIdResp,
    isFetching: isFetchingPlan,
    isError: isPlanError,
    error: planError,
    refetch: refetchPlan,
  } = useGetPlanByIdQuery(selectedPlanId as any, {
    skip: !selectedPlanId,
    refetchOnMountOrArgChange: true,
  });

  // if the details endpoint requires auth and returns 401, gate it
  useEffect(() => {
    if (is401(planError)) {
      openAuthAndRemember();
    }
  }, [planError]);

  const selectedPlanFull = (planByIdResp as any)?.data ?? planByIdResp ?? null;
  const selectedPlan = selectedPlanFull ?? selectedPlanPreview;

  // billing (only inside modal and on ADDRESS step)
  const {
    data: billingResp,
    isFetching: isFetchingBilling,
    isError: isBillingError,
    error: billingError,
    refetch: refetchBilling,
  } = useGetBillingDetailsQuery(undefined, { skip: !(modalOpen && step === "ADDRESS") });

  useEffect(() => {
    if (is401(billingError)) openAuthAndRemember();
  }, [billingError]);

  const [saveBilling, { isLoading: isSavingBilling }] =
    useSaveBillingDetailsMutation();

  const [subscribeToPlan, { isLoading: isSubscribing }] =
    useSubscribeToPlanMutation();

  // prefill address when entering ADDRESS step
  useEffect(() => {
    if (!(modalOpen && step === "ADDRESS")) return;

    const data = (billingResp as any)?.data ?? null;
    if (!data) {
      setEditingAddress(true);
      return;
    }
    setAddressDraft({
      panNumber: data.panNumber ?? null,
      addressLine1: data.addressLine1 ?? "",
      addressLine2: data.addressLine2 ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      pincode: data.pincode ?? "",
    });
    setEditingAddress(false);
  }, [modalOpen, step, billingResp]);

  // reset flow when plan changes
  useEffect(() => {
    setStep("PLAN");
    setAgreed(false);
    setPaymentDone(false);
  }, [selectedPlanId]);

  // ✅ clicking a plan: if unauth -> open auth then resume with modal open + plan selected
  const openModalForPlan = (id: any) => {
    const pid = toPlanId(id);
    if (!pid) return toast.error("Plan id missing from API.");

    if (isUnauthed) {
      openAuthAndRemember({ modalOpen: true, selectedPlanId: pid, step: "PLAN" });
      return;
    }

    setSelectedPlanId(pid);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const goBack = () => {
    if (step === "PLAN") return;
    if (step === "TERMS") return setStep("PLAN");
    if (step === "ADDRESS") return setStep("TERMS");
    if (step === "PAYMENT") return setStep("ADDRESS");
    if (step === "SUBSCRIBE") return setStep("PAYMENT");
  };

  const onNextFromPlan = () => {
    if (!selectedPlan?.id) return toast.info("Please select a plan.");
    if (isUnauthed) return openAuthAndRemember({ modalOpen: true }); // resume same step
    if (currentStatus === "active" || currentStatus === "trialing") {
      return toast.info("You already have an active subscription.");
    }
    setStep("TERMS");
  };

  const onNextFromTerms = () => {
    if (!agreed) return toast.info("Please accept Terms & Conditions to continue.");
    setStep("ADDRESS");
  };

  const onSaveAddress = async () => {
    const err = validateAddress(addressDraft);
    if (err) return toast.error(err);

    try {
      await saveBilling({
        panNumber: addressDraft.panNumber ?? null,
        addressLine1: addressDraft.addressLine1,
        addressLine2: addressDraft.addressLine2 ?? null,
        city: addressDraft.city,
        state: addressDraft.state,
        pincode: addressDraft.pincode,
      }).unwrap();

      toast.success("Address saved.");
      setEditingAddress(false);
      refetchBilling();
    } catch (e: any) {
      if (is401(e)) {
        toast.info("Please login to continue.");
        openAuthAndRemember({ modalOpen: true });
        return;
      }
      notifyError(e, "Failed to save address.");
    }
  };

  const onNextFromAddress = async () => {
    const serverHas = !!((billingResp as any)?.data);
    const formLooksValid = !validateAddress(addressDraft);

    if (!serverHas && !formLooksValid) {
      toast.info("Please add address first.");
      setEditingAddress(true);
      return;
    }

    if (editingAddress) {
      await onSaveAddress();
      if (validateAddress(addressDraft)) return;
    }

    setStep("PAYMENT");
  };

  const onPayNow = async () => {
    setPaymentDone(true);
    toast.success("Payment completed (stub).");
  };

  const onNextFromPayment = () => {
    const priceObj = selectedPlan ? priceInInr(selectedPlan) : { isFree: false, priceInr: null };
    if (!priceObj.isFree && !paymentDone) return toast.info("Please complete payment first.");
    setStep("SUBSCRIBE");
  };

  const onSubscribe = async () => {
    try {
      const pid = toPlanId(selectedPlan?.id);
      if (!pid) return toast.error("Missing planId.");
      await subscribeToPlan({ planId: pid } as any).unwrap();
      toast.success("Subscription activated.");
      closeModal();
    } catch (e: any) {
      if (is401(e)) {
        toast.info("Please login to continue.");
        openAuthAndRemember({ modalOpen: true });
        return;
      }
      notifyError(e, "Failed to subscribe.");
    }
  };

  const selectedTier = selectedPlan
    ? toTierFromMetadata(selectedPlan?.name, selectedPlan?.metadata ?? {}, selectedPlan?.planType?.code ?? null)
    : "BASIC";

  const selectedMarkets = selectedPlan ? deriveMarketCodes(selectedPlan) : { isMulti: false, marketCodes: [] };

  // --------- UI ----------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* ✅ AUTH MODAL */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
        onAuthed={() => {
          setAuthOpen(false);
          // refresh auth-dependent queries, then restore step/modal
          refetchCurrentSub();
          refetch();
          refetchPlan();
          refetchBilling();
          restoreResume();
        }}
      />

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className={`${container} pt-10 md:pt-14 pb-8 relative`}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-300 border border-slate-800 bg-slate-900/40 px-3 py-1 rounded-full">
              <Shield size={14} className="text-emerald-400" />
              Select Plan → (Modal) Terms → Address → Payment → Subscribe
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Subscription <span className="text-emerald-400">Marketplace</span>
            </h1>

            <p className="mt-2 text-slate-400 max-w-2xl">
              Pick a plan. The full step-by-step flow opens in a modal (best for mobile).
            </p>

            {isFetchingCurrentSub ? (
              <p className="mt-2 text-[11px] text-slate-500">Checking session…</p>
            ) : isUnauthed ? (
              <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[11px] text-amber-200 font-semibold">
                  You are not logged in. Please login to continue checkout.
                </p>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <div className={`${container} mt-2 space-y-4`}>
        {/* Filters */}
        <div className={cx(cardBase, "p-4 md:p-5")}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-center">
                <Filter size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Filters</p>
                <p className="text-[11px] text-slate-500">Search + filter by billing, market and tier.</p>
              </div>
            </div>

            <Segmented<BillingCycle>
              label="Billing"
              value={cycle}
              onChange={setCycle}
              options={[
                { value: "MONTHLY", label: "MONTHLY" },
                { value: "YEARLY", label: "YEARLY" },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              <Search size={16} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plans…"
                className="w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500"
              />
              {search.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-lg border border-slate-800 bg-slate-950/30 p-2 hover:bg-slate-900/60 transition"
                  aria-label="Clear search"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              ) : null}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <SelectField<MarketFilter>
                label="Market"
                value={marketFilter}
                onChange={setMarketFilter}
                options={[
                  { value: "ALL", label: "ALL" },
                  { value: "NSE", label: "NSE" },
                  { value: "BSE", label: "BSE" },
                  { value: "FOREX", label: "FOREX" },
                  { value: "CRYPTO", label: "CRYPTO" },
                  { value: "MULTI", label: "ALL (Multi)" },
                ]}
              />

              <SelectField<PlanTier | "ALL">
                label="Tier"
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: "ALL", label: "ALL" },
                  { value: "BASIC", label: "BASIC" },
                  { value: "PRO", label: "PRO" },
                  { value: "ELITE", label: "ELITE" },
                  { value: "BUNDLE", label: "BUNDLE" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Loading/Error */}
        {isLoading ? (
          <div className={`${cardBase} p-4 flex items-center gap-3`}>
            <RefreshCw className="animate-spin text-emerald-400" size={18} />
            <div>
              <p className="text-sm font-semibold text-slate-200">Loading plans…</p>
              <p className="text-[11px] text-slate-500">Fetching from server</p>
            </div>
          </div>
        ) : isError ? (
          <div className={`${cardBase} p-4 flex items-start justify-between gap-3`}>
            <div>
              <p className="text-sm font-semibold text-red-300">Failed to load plans</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {(error as any)?.data?.message || (error as any)?.message || "Unknown error"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : null}

        {/* Plans grid */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300 font-semibold">
            {filteredPlans.length} plan{filteredPlans.length === 1 ? "" : "s"} available
            {isFetching ? <span className="ml-2 text-[11px] text-slate-500">(refreshing…)</span> : null}
          </p>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <Info size={14} />
            Click a plan to open the flow
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPlans.map((p: any, idx: number) => {
            const pid = toPlanId(p?.id);
            const tier = toTierFromMetadata(p?.name, p?.metadata ?? {}, p?.planType?.code ?? null);
            const t = planTypeMeta[tier];
            const mk = deriveMarketCodes(p);

            const interval = planInterval(p);
            const showPrice = interval === "lifetime" || !interval || interval === cycleToInterval(cycle);
            const priceObj = priceInInr(p);

            const isSelected = pid && selectedPlanId === pid;

            return (
              <motion.button
                key={`${String(p?.id ?? "noid")}-${idx}`}
                type="button"
                onClick={() => openModalForPlan(p?.id)}
                whileHover={{ y: -2 }}
                className={cx(
                  "relative text-left",
                  cardBase,
                  "p-5 transition cursor-pointer",
                  isSelected
                    ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 border-emerald-500"
                    : "hover:border-slate-700"
                )}
              >
                <div
                  className={cx(
                    "absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-2",
                    t.cls
                  )}
                >
                  {t.icon}
                  {t.label}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers size={18} className="text-emerald-400" />
                      <h3 className="text-base font-semibold">{p?.name ?? "Unnamed plan"}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{p?.description ?? ""}</p>
                  </div>
                  <ChevronRight className="text-slate-600 mt-1" size={18} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(mk.isMulti ? ALL_MARKETS : mk.marketCodes).map((m) => marketChip(m))}
                  {mk.isMulti ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300">
                      <BadgeCheck size={14} className="text-emerald-400" />
                      Multi-market
                    </span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {!showPrice
                      ? "—"
                      : priceObj.isFree
                      ? "FREE"
                      : priceObj.priceInr != null
                      ? formatINR(priceObj.priceInr)
                      : "—"}
                    <span className="text-xs font-semibold text-slate-400 ml-2">
                      /{interval === "yearly" ? "yr" : interval === "lifetime" ? "life" : "mo"}
                    </span>
                  </div>
                </div>

                {!pid ? (
                  <p className="mt-3 text-[11px] text-red-300">
                    ⚠️ API returned plan without valid <b>id</b>.
                  </p>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ✅ MODAL FLOW */}
      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="w-full md:max-w-2xl bg-slate-950 border border-slate-800 rounded-t-3xl md:rounded-3xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-4 md:p-5 border-b border-slate-800 bg-slate-950/60">
                <div>
                  <p className="text-[11px] text-slate-500">Checkout</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {selectedPlan ? "Selected plan details" : "Loading plan…"}
                  </p>
                  <div className="mt-2">
                    <Stepper step={step} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-2 hover:bg-slate-900/60 transition"
                  aria-label="Close"
                >
                  <X size={16} className="text-slate-300" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[80vh] md:max-h-[75vh] overflow-y-auto p-4 md:p-5">
                {/* Plan details */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  {!selectedPlan ? (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <RefreshCw size={14} className="animate-spin text-emerald-400" />
                      Loading plan details…
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] text-slate-500">Plan</p>
                          <p className="text-base font-semibold text-slate-100">{selectedPlan?.name ?? "—"}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{selectedPlan?.description ?? ""}</p>
                        </div>
                        <span className="text-[10px] rounded-full border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-400">
                          {selectedTier}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedMarkets.isMulti ? ALL_MARKETS : selectedMarkets.marketCodes).map((m) => marketChip(m))}
                      </div>

                      <div className="mt-4">
                        {(() => {
                          const interval = planInterval(selectedPlan);
                          const pObj = priceInInr(selectedPlan);
                          return (
                            <div className="text-2xl font-extrabold text-emerald-400">
                              {pObj.isFree ? "FREE" : pObj.priceInr != null ? formatINR(pObj.priceInr) : "—"}
                              <span className="text-xs font-semibold text-slate-400 ml-2">
                                /{interval === "yearly" ? "yr" : interval === "lifetime" ? "life" : "mo"}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {featurePills(selectedPlan)}

                      {isFetchingPlan ? (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                          <RefreshCw size={14} className="animate-spin text-emerald-400" />
                          Refreshing plan details…
                        </div>
                      ) : isPlanError ? (
                        <div className="mt-4 rounded-xl border border-red-900/40 bg-red-900/10 p-3">
                          <p className="text-[11px] text-red-300 font-semibold">Failed to load plan details</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {(planError as any)?.data?.message || (planError as any)?.message || "Unknown error"}
                          </p>
                          <button
                            type="button"
                            onClick={() => refetchPlan()}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                          >
                            <RefreshCw size={14} />
                            Retry
                          </button>
                        </div>
                      ) : null}

                      <Divider />

                      <div className="space-y-2">
                        <PlanMetric icon={<Wallet size={14} />} label="Market" value={selectedPlan?.market?.code ?? "MULTI"} />
                        <PlanMetric
                          icon={<BarChart3 size={14} />}
                          label="Strategies"
                          value={`${Array.isArray(selectedPlan?.planStrategies) ? selectedPlan.planStrategies.length : 0}`}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Steps */}
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  {step === "PLAN" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">Step 1: Confirm plan selection</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <ChevronLeft size={14} />
                          Back
                        </button>

                        <button
                          type="button"
                          onClick={onNextFromPlan}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={!selectedPlan?.id}
                        >
                          Continue <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === "TERMS" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">Step 2: Terms & Conditions</p>
                      </div>

                      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          By subscribing, you agree to the platform terms, risk disclosures and compliance requirements.
                        </p>

                        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                          <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-200">I agree to Terms & Conditions</p>
                            <p className="text-[11px] text-slate-500">Required to continue.</p>
                          </div>
                        </label>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>

                        <button
                          type="button"
                          onClick={onNextFromTerms}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Continue <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === "ADDRESS" ? (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-400" />
                          <p className="text-sm font-semibold text-slate-200">Step 3: Address</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => refetchBilling()}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <RefreshCw size={14} className={isFetchingBilling ? "animate-spin" : ""} />
                          Refresh
                        </button>
                      </div>

                      {isBillingError ? (
                        <div className="mt-3 rounded-xl border border-red-900/40 bg-red-900/10 p-3">
                          <p className="text-[11px] text-red-300 font-semibold">Failed to load address</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {(billingError as any)?.data?.message || (billingError as any)?.message || "Unknown error"}
                          </p>
                        </div>
                      ) : null}

                      {/* simple: always show form in this version */}
                      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500 flex items-center gap-2">
                              <CreditCard size={12} className="text-emerald-400" />
                              PAN Number (optional)
                            </p>
                            <input
                              value={addressDraft.panNumber ?? ""}
                              onChange={(e) => setAddressDraft((p) => ({ ...p, panNumber: e.target.value || null }))}
                              className={inputBase}
                              placeholder="PAN (optional)"
                            />
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">Pincode *</p>
                            <input
                              value={addressDraft.pincode}
                              onChange={(e) => setAddressDraft((p) => ({ ...p, pincode: e.target.value }))}
                              className={inputBase}
                              placeholder="Pincode"
                            />
                          </div>

                          <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">Address line 1 *</p>
                            <input
                              value={addressDraft.addressLine1}
                              onChange={(e) => setAddressDraft((p) => ({ ...p, addressLine1: e.target.value }))}
                              className={inputBase}
                              placeholder="House / Street / Area"
                            />
                          </div>

                          <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">Address line 2</p>
                            <input
                              value={addressDraft.addressLine2 ?? ""}
                              onChange={(e) => setAddressDraft((p) => ({ ...p, addressLine2: e.target.value || null }))}
                              className={inputBase}
                              placeholder="Landmark / Apartment"
                            />
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">City *</p>
                            <input
                              value={addressDraft.city}
                              onChange={(e) => setAddressDraft((p) => ({ ...p, city: e.target.value }))}
                              className={inputBase}
                              placeholder="City"
                            />
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">State *</p>
                            <input
                              value={addressDraft.state}
                              onChange={(e) => setAddressDraft((p) => ({ ...p, state: e.target.value }))}
                              className={inputBase}
                              placeholder="State"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={onSaveAddress}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isSavingBilling}
                          >
                            {isSavingBilling ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                Saving…
                              </>
                            ) : (
                              <>
                                <CheckCircle size={14} />
                                Save address
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>

                        <button
                          type="button"
                          onClick={onNextFromAddress}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Continue <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === "PAYMENT" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">Step 4: Payment</p>
                      </div>

                      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        {(() => {
                          const pObj = selectedPlan ? priceInInr(selectedPlan) : { isFree: false, priceInr: null };
                          const interval = selectedPlan ? planInterval(selectedPlan) : null;

                          return (
                            <>
                              <p className="text-[11px] text-slate-500">Amount</p>
                              <p className="text-2xl font-extrabold text-emerald-400">
                                {pObj.isFree ? "FREE" : pObj.priceInr != null ? formatINR(pObj.priceInr) : "—"}
                                <span className="text-xs font-semibold text-slate-400 ml-2">
                                  /{interval === "yearly" ? "yr" : interval === "lifetime" ? "life" : "mo"}
                                </span>
                              </p>

                              {pObj.isFree ? (
                                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                  <p className="text-[11px] text-emerald-200 font-semibold">
                                    This plan is FREE — no payment required.
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                                  <p className="text-[11px] text-slate-500">
                                    Integrate Razorpay/Stripe here. This button is a stub.
                                  </p>

                                  <button
                                    type="button"
                                    onClick={onPayNow}
                                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition"
                                  >
                                    <Wallet size={14} />
                                    Pay now
                                  </button>

                                  {paymentDone ? (
                                    <p className="mt-2 text-[11px] text-emerald-200 font-semibold">
                                      Payment done ✅
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>

                        <button
                          type="button"
                          onClick={onNextFromPayment}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Continue <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === "SUBSCRIBE" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">Step 5: Subscribe</p>
                      </div>

                      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <button
                          type="button"
                          onClick={onSubscribe}
                          disabled={isSubscribing}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-[12px] font-extrabold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubscribing ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Activating…
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Activate Subscription
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <ChevronLeft size={14} /> Back
                        </button>

                        <button
                          type="button"
                          onClick={() => setStep("PLAN")}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          Start over
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 text-[11px] text-slate-500">
                  ✅ Auth resume: after login, we restore modal + step + selected plan.
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={`${container} mt-6 ${cardBase} p-5 flex items-start gap-3`}>
        <Info className="text-emerald-400 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold">Important notes</p>
          <p className={subtle}>
            • Plan IDs are UUID strings — never convert to Number(). <br />
            • Your list API shape is <b>data: [[plans], count]</b>. <br />
            • If any call returns 401, auth modal opens and resumes after auth.
          </p>
        </div>
      </div>
    </div>
  );
}
