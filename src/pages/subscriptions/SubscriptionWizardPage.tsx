import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  BadgeCheck,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  CreditCard,
  FileText,
  Gift,
  Info,
  Layers,
  MapPin,
  Percent,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Timer,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import AuthModal from "../../pages/auth/AuthModel";

import {
  useGetMyCurrentSubscriptionQuery,
  useListActivePlansQuery,
  useGetPlanByIdQuery,
} from "../../services/profileSubscription.api";

import {
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
} from "../../services/userApi";

import {
  useCreateSubscriptionCheckoutMutation,
  useVerifySubscriptionPaymentMutation,
} from "../../services/billing.api";

type BillingCycle = "MONTHLY" | "YEARLY";
type PlanTier = "BASIC" | "PREMIUM" | "PRO" | "ELITE" | "BUNDLE";
type MarketCodeUI = "NSE" | "BSE" | "FOREX" | "CRYPTO";
type Step = "PLAN" | "TERMS" | "ADDRESS" | "PAYMENT";
type MarketFamily = "FOREX" | "CRYPTO" | "INDIAN" | "MULTI" | "UNKNOWN";

type DisplayFeature = {
  label: string;
  tone?: "positive" | "neutral" | "premium";
};

type PriceDisplayInfo = {
  isFree: boolean;
  launchPriceInr: number | null;
  realPriceInr: number | null;
  saveAmountInr: number | null;
  savePercent: number | null;
  intervalLabel: string;
  shortIntervalLabel: string;
  hasLaunchOffer: boolean;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const container = "max-w-7xl mx-auto px-4 sm:px-5 md:px-8";
const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const pill =
  "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300";
const inputBase =
  "mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600";

const ALL_MARKETS: MarketCodeUI[] = ["NSE", "BSE", "FOREX", "CRYPTO"];
const FAMILY_ORDER: MarketFamily[] = ["INDIAN", "FOREX", "CRYPTO", "MULTI"];

const REAL_MONTHLY_PRICE_BY_TIER: Partial<Record<PlanTier, number>> = {
  BASIC: 1999,
  PREMIUM: 2999,
  PRO: 2999,
  ELITE: 2999,
};

const cx = (...cls: Array<string | false | undefined | null>) =>
  cls.filter(Boolean).join(" ");

const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatNum = (v: any) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : String(v ?? "—");
};

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
  return s.length ? s : null;
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

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const planTypeMeta: Record<
  PlanTier,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  BASIC: {
    label: "BASIC",
    cls: "bg-slate-200 text-slate-950",
    icon: <Zap size={14} />,
  },
  PREMIUM: {
    label: "PREMIUM",
    cls: "bg-emerald-400 text-slate-950",
    icon: <Crown size={14} />,
  },
  PRO: {
    label: "PRO",
    cls: "bg-emerald-400 text-slate-950",
    icon: <Star size={14} />,
  },
  ELITE: {
    label: "ELITE",
    cls: "bg-amber-400 text-slate-950",
    icon: <Crown size={14} />,
  },
  BUNDLE: {
    label: "BUNDLE",
    cls: "bg-sky-400 text-slate-950",
    icon: <Sparkles size={14} />,
  },
};

const Divider = () => <div className="my-4 h-px w-full bg-slate-800/80" />;

const riskMeta: Record<string, { label: string; cls: string }> = {
  LOW: {
    label: "LOW",
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  MEDIUM: {
    label: "MEDIUM",
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  HIGH: {
    label: "HIGH",
    cls: "border-red-500/30 bg-red-500/10 text-red-200",
  },
};

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

const FeatureBullet: React.FC<{ item: DisplayFeature }> = ({ item }) => {
  const tone =
    item.tone === "premium"
      ? "text-emerald-200"
      : item.tone === "neutral"
      ? "text-slate-300"
      : "text-slate-200";

  return (
    <div className="flex items-start gap-3">
      <div
        className={cx(
          "mt-0.5 rounded-full p-1",
          item.tone === "premium"
            ? "bg-emerald-500/15 text-emerald-300"
            : item.tone === "neutral"
            ? "bg-slate-800 text-slate-300"
            : "bg-cyan-500/15 text-cyan-300"
        )}
      >
        {item.tone === "neutral" ? <Info size={12} /> : <CheckCircle size={12} />}
      </div>
      <span className={cx("text-sm leading-5", tone)}>{item.label}</span>
    </div>
  );
};

function featuresToMap(
  features: Array<{ featureKey: string; featureValue: string }>
) {
  const m: Record<string, string> = {};
  for (const f of features ?? []) m[f.featureKey] = String(f.featureValue);
  return m;
}

function getFeatureFlags(plan: any): Record<string, any> {
  if (Array.isArray(plan?.features)) return featuresToMap(plan.features);
  if (plan?.featureFlags && typeof plan.featureFlags === "object")
    return plan.featureFlags;
  return {};
}

function toTierFromMetadata(
  name: string,
  metadata: any,
  planTypeCode?: string | null
): PlanTier {
  const tier = String(metadata?.tier ?? "").toUpperCase();

  if (
    tier === "BASIC" ||
    tier === "PREMIUM" ||
    tier === "PRO" ||
    tier === "ELITE" ||
    tier === "BUNDLE"
  ) {
    return tier as PlanTier;
  }

  if (planTypeCode === "BUNDLE") return "BUNDLE";

  const n = String(name || "").toLowerCase();
  if (n.includes("premium")) return "PREMIUM";
  if (n.includes("elite")) return "ELITE";
  if (n.includes("pro")) return "PRO";
  if (n.includes("bundle")) return "BUNDLE";
  return "BASIC";
}

function isBasicTier(tier: PlanTier | null | undefined) {
  return tier === "BASIC";
}

function isPremiumLikeTier(tier: PlanTier | null | undefined) {
  return tier === "PREMIUM" || tier === "PRO" || tier === "ELITE";
}

function tierRank(tier: PlanTier | null | undefined) {
  switch (tier) {
    case "BASIC":
      return 1;
    case "PREMIUM":
      return 2;
    case "PRO":
      return 3;
    case "ELITE":
      return 4;
    case "BUNDLE":
      return 5;
    default:
      return 0;
  }
}

function deriveMarketCodes(plan: any): {
  isMulti: boolean;
  marketCodes: MarketCodeUI[];
} {
  const md = plan?.metadata ?? {};
  const looksMulti =
    plan?.marketId == null ||
    md?.includes === "multi" ||
    /bundle|all/i.test(String(plan?.name ?? ""));

  if (looksMulti) return { isMulti: true, marketCodes: ALL_MARKETS };

  const code = String(plan?.market?.code || plan?.category || md?.market || "")
    .toUpperCase()
    .trim();

  if (code === "FOREX") return { isMulti: false, marketCodes: ["FOREX"] };
  if (code === "CRYPTO") return { isMulti: false, marketCodes: ["CRYPTO"] };
  if (code === "INDIAN" || code === "INDIA")
    return { isMulti: false, marketCodes: ["NSE", "BSE"] };

  return { isMulti: false, marketCodes: [] };
}

function getPlanMarketFamily(plan: any): MarketFamily {
  const md = plan?.metadata ?? {};
  const looksMulti =
    plan?.marketId == null ||
    md?.includes === "multi" ||
    /bundle|all/i.test(String(plan?.name ?? ""));

  if (looksMulti) return "MULTI";

  const code = String(plan?.market?.code || plan?.category || md?.market || "")
    .toUpperCase()
    .trim();

  if (code === "FOREX") return "FOREX";
  if (code === "CRYPTO") return "CRYPTO";
  if (code === "INDIAN" || code === "INDIA") return "INDIAN";

  return "UNKNOWN";
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
    return {
      isFree: !!plan?.pricing?.isFree,
      priceInr: Number.isFinite(p) ? p : null,
    };
  }

  const cents = Number(plan?.priceCents);
  const isFree = cents === 0 || plan?.isFree === true;
  if (!Number.isFinite(cents)) return { isFree, priceInr: null };
  return { isFree, priceInr: cents / 100 };
}

function pickFirstNumber(...values: any[]) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function getApiRealPrice(plan: any): number | null {
  const pricing = plan?.pricing ?? {};
  const metadata = plan?.metadata ?? {};

  return pickFirstNumber(
    pricing.realPriceInr,
    pricing.originalPriceInr,
    pricing.actualPriceInr,
    pricing.regularPriceInr,
    pricing.mrpInr,
    pricing.strikePriceInr,
    pricing.compareAtPriceInr,
    pricing.priceBeforeDiscountInr,
    plan?.realPriceInr,
    plan?.originalPriceInr,
    plan?.actualPriceInr,
    plan?.regularPriceInr,
    plan?.mrpInr,
    plan?.strikePriceInr,
    plan?.compareAtPriceInr,
    plan?.priceBeforeDiscountInr,
    metadata.realPriceInr,
    metadata.originalPriceInr,
    metadata.actualPriceInr,
    metadata.regularPriceInr,
    metadata.mrpInr,
    metadata.strikePriceInr
  );
}

function getPriceDisplayInfo(plan: any): PriceDisplayInfo {
  const tier = toTierFromMetadata(
    plan?.name,
    plan?.metadata ?? {},
    plan?.planType?.code ?? null
  );

  const interval = planInterval(plan);
  const pObj = priceInInr(plan);

  const intervalLabel =
    interval === "yearly" ? "year" : interval === "lifetime" ? "life" : "month";
  const shortIntervalLabel =
    interval === "yearly" ? "yr" : interval === "lifetime" ? "life" : "mo";

  if (pObj.isFree) {
    return {
      isFree: true,
      launchPriceInr: 0,
      realPriceInr: null,
      saveAmountInr: null,
      savePercent: null,
      intervalLabel,
      shortIntervalLabel,
      hasLaunchOffer: false,
    };
  }

  const launchPriceInr = pObj.priceInr;

  const apiRealPrice = getApiRealPrice(plan);
  const fallbackMonthlyRealPrice = REAL_MONTHLY_PRICE_BY_TIER[tier] ?? null;
  const fallbackRealPrice =
    fallbackMonthlyRealPrice == null
      ? null
      : interval === "yearly"
      ? fallbackMonthlyRealPrice * 12
      : fallbackMonthlyRealPrice;

  const realPriceInr =
    apiRealPrice != null && apiRealPrice > Number(launchPriceInr ?? 0)
      ? apiRealPrice
      : fallbackRealPrice != null && fallbackRealPrice > Number(launchPriceInr ?? 0)
      ? fallbackRealPrice
      : null;

  const saveAmountInr =
    realPriceInr != null && launchPriceInr != null
      ? Math.max(0, realPriceInr - launchPriceInr)
      : null;

  const savePercent =
    realPriceInr != null && launchPriceInr != null && realPriceInr > 0
      ? Math.round(((realPriceInr - launchPriceInr) / realPriceInr) * 100)
      : null;

  return {
    isFree: false,
    launchPriceInr,
    realPriceInr,
    saveAmountInr,
    savePercent,
    intervalLabel,
    shortIntervalLabel,
    hasLaunchOffer:
      !!launchPriceInr && !!realPriceInr && realPriceInr > launchPriceInr,
  };
}

function cycleToInterval(cycle: BillingCycle) {
  return cycle === "MONTHLY" ? "monthly" : "yearly";
}

function pickStrategies(plan: any) {
  const raw = Array.isArray(plan?.planStrategies) ? plan.planStrategies : [];
  const list = raw.map((ps: any) => ps?.strategy ?? ps).filter(Boolean);

  const seen = new Set<string>();
  const out: any[] = [];
  for (const s of list) {
    const key = String(s?.id ?? s?.strategyCode ?? s?.strategyId ?? "");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(s);
  }
  return out;
}

function getMaxAccounts(plan: any) {
  const f = getFeatureFlags(plan);
  return (
    plan?.limits?.maxConnectedAccounts ??
    plan?.maxConnectedAccounts ??
    (f.max_accounts != null ? numish(f.max_accounts, 0) : undefined) ??
    (f.accounts != null ? numish(f.accounts, 0) : undefined) ??
    3
  );
}

function getExecutionLabel(family: MarketFamily) {
  if (family === "FOREX") return "MT5 / cTrader execution";
  if (family === "CRYPTO") return "Exchange API execution";
  if (family === "INDIAN") return "Broker execution for NSE / BSE";
  return "Multi-market execution";
}

function getRowTitle(family: MarketFamily) {
  if (family === "INDIAN") return "Indian Market";
  if (family === "FOREX") return "Forex";
  if (family === "CRYPTO") return "Crypto";
  return "All Markets";
}

function getRowSubtitle(family: MarketFamily) {
  if (family === "INDIAN")
    return "Webhook and execution plans for NSE / BSE traders";
  if (family === "FOREX")
    return "Webhook and execution plans for MT5 / cTrader users";
  if (family === "CRYPTO")
    return "Webhook and execution plans for exchange API traders";
  return "Combined plans across multiple markets";
}

function getPlanDisplayFeatures(plan: any): DisplayFeature[] {
  const tier = toTierFromMetadata(
    plan?.name,
    plan?.metadata ?? {},
    plan?.planType?.code ?? null
  );
  const family = getPlanMarketFamily(plan);
  const flags = getFeatureFlags(plan);
  const strategies = pickStrategies(plan);
  const strategyCount = strategies.length;
  const maxAccounts = getMaxAccounts(plan);

  const webhookSignals =
    boolish(flags.webhook) ||
    boolish(flags.webhooks) ||
    boolish(flags.tv_webhook) ||
    boolish(flags.telegram_webhook) ||
    true;

  const hedging =
    boolish(flags.hedging) ||
    boolish(flags.edging) ||
    boolish(flags.hedging_support) ||
    boolish(flags.hedge_mode) ||
    true;

  const lowDelay =
    boolish(flags.low_latency) ||
    boolish(flags.less_delay) ||
    boolish(flags.lowDelay) ||
    boolish(flags.fast_execution) ||
    true;

  const advancedSettings =
    boolish(flags.advanced_settings) ||
    boolish(flags.advancedSettings) ||
    boolish(flags.advanced_mode) ||
    isPremiumLikeTier(tier);

  const features: DisplayFeature[] = [
    {
      label: `Up to ${maxAccounts} active account${maxAccounts === 1 ? "" : "s"}`,
      tone: "positive",
    },
    {
      label: webhookSignals
        ? "TradingView / Chartink / Telegram webhook support"
        : "Webhook support",
      tone: "positive",
    },
    {
      label: getExecutionLabel(family),
      tone: "positive",
    },
    {
      label: hedging ? "Hedging support" : "Hedging optional",
      tone: "positive",
    },
    {
      label: lowDelay ? "Low-delay order execution" : "Execution ready",
      tone: "positive",
    },
  ];

  if (isBasicTier(tier) && strategyCount === 0) {
    features.push({
      label: "Webhook only • no built-in strategy",
      tone: "neutral",
    });
  } else {
    features.push({
      label:
        strategyCount > 0
          ? `${strategyCount} built-in strateg${strategyCount === 1 ? "y" : "ies"} included`
          : "Built-in strategy access",
      tone: "premium",
    });
  }

  features.push({
    label: advancedSettings ? "Advanced settings" : "Simple standard settings",
    tone: advancedSettings ? "premium" : "positive",
  });

  return features;
}

const marketChip = (code: MarketCodeUI) => (
  <span key={code} className={pill}>
    <Layers size={14} className="text-emerald-400" />
    {code}
  </span>
);

function LaunchOfferHero() {
  return (
    <div className="mt-8 max-w-5xl mx-auto rounded-[2rem] border border-amber-400/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(16,185,129,0.12),rgba(15,23,42,0.75))] p-4 md:p-5 shadow-[0_20px_80px_rgba(245,158,11,0.12)]">
      <div className="grid gap-4 md:grid-cols-[1.3fr_0.9fr_0.9fr] items-stretch">
        <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[11px] font-extrabold text-amber-200">
            <Gift size={14} />
            Launch Offer Live
          </div>

          <h2 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
            Start now at almost half price.
          </h2>

          <p className="mt-2 text-sm text-slate-300 leading-6">
            Real pricing will be enabled later based on sales. For launch users,
            the plan price coming from API is shown as the special launch price.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-black text-slate-950">
              <Timer size={14} />
              Early user benefit
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-200">
              + GST/tax applicable
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
            Basic
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black text-white">₹999</span>
            <span className="pb-1 text-xs font-semibold text-slate-400">
              + tax / month
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real price{" "}
            <span className="text-slate-500 line-through">₹1,999 + tax</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-extrabold text-emerald-200">
            <Percent size={13} />
            Save 50%
          </div>
        </div>

        <div className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200">
            Premium
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black text-white">₹1,499</span>
            <span className="pb-1 text-xs font-semibold text-slate-400">
              + tax / month
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real price{" "}
            <span className="text-slate-500 line-through">₹2,999 + tax</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-extrabold text-amber-200">
            <Percent size={13} />
            Save 50%
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceBlock({
  plan,
  size = "card",
}: {
  plan: any;
  size?: "card" | "modal" | "payment";
}) {
  const price = getPriceDisplayInfo(plan);

  if (price.isFree) {
    return (
      <div>
        <div
          className={cx(
            "font-extrabold text-white",
            size === "card" ? "text-4xl" : "text-2xl"
          )}
        >
          FREE
        </div>
        <p className="mt-1 text-xs font-semibold text-emerald-300">
          No payment required
        </p>
      </div>
    );
  }

  return (
    <div>
      {price.hasLaunchOffer ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-200">
            <Gift size={12} />
            Launch Offer
          </span>
          {price.savePercent ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-200">
              <Percent size={12} />
              Save {price.savePercent}%
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <div
          className={cx(
            "font-black tracking-tight text-white",
            size === "card"
              ? "text-4xl"
              : size === "payment"
              ? "text-3xl"
              : "text-2xl"
          )}
        >
          {price.launchPriceInr != null ? formatINR(price.launchPriceInr) : "—"}
        </div>

        <div className="pb-1 text-xs font-semibold text-slate-400">
          + tax / {price.intervalLabel}
        </div>
      </div>

      {price.realPriceInr ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Real price</span>
          <span className="font-semibold text-slate-500 line-through decoration-red-400/80 decoration-2">
            {formatINR(price.realPriceInr)} + tax
          </span>
          {price.saveAmountInr ? (
            <span className="font-bold text-emerald-300">
              You save {formatINR(price.saveAmountInr)}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Launch price from API + tax
        </p>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ k: Step; label: string }> = [
    { k: "PLAN", label: "Plan" },
    { k: "TERMS", label: "Terms" },
    { k: "ADDRESS", label: "Address" },
    { k: "PAYMENT", label: "Payment" },
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
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                done ? "bg-emerald-400" : active ? "bg-slate-300" : "bg-slate-700"
              )}
            />
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

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

type ResumeState = {
  modalOpen: boolean;
  step: Step;
  selectedPlanId: string | null;
  agreed: boolean;
  paymentDone: boolean;
  addressDraft: AddressDraft;
  editingAddress: boolean;
};

function ParamsInline({ params }: { params?: Record<string, any> }) {
  const entries = Object.entries(params ?? {});
  if (!entries.length) return null;

  const shown = entries.slice(0, 4).map(([k, v]) => `${k}: ${String(v)}`);
  const more = entries.length > 4 ? ` +${entries.length - 4} more` : "";

  return (
    <p className="mt-2 text-[11px] text-slate-500">
      <span className="text-slate-400 font-semibold">Default params:</span>{" "}
      {shown.join(" • ")}
      {more}
    </p>
  );
}

function StrategySection({ plan }: { plan: any }) {
  const [expanded, setExpanded] = useState(false);

  const strategies = useMemo(() => pickStrategies(plan), [plan]);

  if (!strategies.length) {
    return (
      <div className="mt-4">
        <p className="text-[11px] text-slate-500">
          No strategies added to this plan yet.
        </p>
      </div>
    );
  }

  const visible = expanded ? strategies : strategies.slice(0, 2);
  const hiddenCount = Math.max(0, strategies.length - visible.length);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-400" />
          <p className="text-sm font-semibold text-slate-200">
            Included Strategies
          </p>
        </div>

        {strategies.length > 2 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-extrabold text-slate-300 hover:text-slate-100 transition"
          >
            {expanded ? "Show less" : `Show all (${strategies.length})`}
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        {visible.map((s: any, idx: number) => {
          const risk = String(s?.riskProfile ?? "").toUpperCase();
          const r = riskMeta[risk] ?? {
            label: risk || "—",
            cls: "border-slate-800 bg-slate-950/30 text-slate-400",
          };

          return (
            <div
              key={String(s?.id ?? s?.strategyCode ?? s?.strategyId ?? idx)}
              className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-500">Strategy</p>
                  <p className="text-sm font-semibold text-slate-100">
                    {s?.name ?? "Unnamed strategy"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {s?.strategyCode ? (
                      <span className="font-semibold text-slate-400">
                        {s.strategyCode}
                      </span>
                    ) : null}
                    {s?.strategyCode && s?.description ? " • " : null}
                    {s?.description ?? ""}
                  </p>
                </div>

                <span
                  className={cx(
                    "text-[10px] rounded-full border px-2 py-1 font-extrabold",
                    r.cls
                  )}
                >
                  {r.label}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {s?.category ? (
                  <span className="text-[10px] rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-slate-400">
                    {String(s.category)}
                  </span>
                ) : null}

                {s?.capitalRequirement != null ? (
                  <span className="text-[10px] rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-slate-400">
                    Capital req: {formatNum(s.capitalRequirement)}
                  </span>
                ) : null}

                {s?.version != null ? (
                  <span className="text-[10px] rounded-full border border-slate-800 bg-slate-950/30 px-2 py-1 text-slate-400">
                    v{String(s.version)}
                  </span>
                ) : null}
              </div>

              <ParamsInline params={s?.defaultParams} />
            </div>
          );
        })}
      </div>

      {!expanded && hiddenCount > 0 ? (
        <p className="mt-2 text-[11px] text-slate-500">
          +{hiddenCount} more strategy{hiddenCount === 1 ? "" : "ies"} hidden
        </p>
      ) : null}
    </div>
  );
}

function getPlanState(
  plan: any,
  activePlanIdSet: Set<string>,
  activePlanByMarket: Record<string, any>
) {
  const pid = toPlanId(plan?.id);
  const tier = toTierFromMetadata(
    plan?.name,
    plan?.metadata ?? {},
    plan?.planType?.code ?? null
  );
  const marketFamily = getPlanMarketFamily(plan);

  const isCurrent =
    (!!pid && activePlanIdSet.has(pid)) || plan?.subscriberAlreadyHasPlan === true;

  const currentInMarket =
    marketFamily !== "UNKNOWN" && marketFamily !== "MULTI"
      ? activePlanByMarket[marketFamily] ?? null
      : null;

  const currentInMarketId = toPlanId(currentInMarket?.id);

  const currentInMarketTier = currentInMarket
    ? toTierFromMetadata(
        currentInMarket?.name,
        currentInMarket?.metadata ?? {},
        currentInMarket?.planType?.code ?? null
      )
    : null;

  const isUpgradeTarget =
    !isCurrent &&
    !!currentInMarket &&
    currentInMarketId !== pid &&
    isBasicTier(currentInMarketTier) &&
    isPremiumLikeTier(tier);

  const isDowngradeBlocked =
    !isCurrent &&
    !!currentInMarket &&
    currentInMarketId !== pid &&
    isPremiumLikeTier(currentInMarketTier) &&
    isBasicTier(tier);

  const ctaLabel = isCurrent
    ? "Current Plan"
    : isUpgradeTarget
    ? "Upgrade to Premium"
    : isDowngradeBlocked
    ? "Premium Active"
    : "View Details";

  const badgeLabel = isCurrent
    ? "Current Plan"
    : isUpgradeTarget
    ? "Upgrade Available"
    : isDowngradeBlocked
    ? "Premium Active"
    : null;

  const badgeClass = isCurrent
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : isUpgradeTarget
    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
    : isDowngradeBlocked
    ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
    : "";

  return {
    tier,
    marketFamily,
    isCurrent,
    isUpgradeTarget,
    isDowngradeBlocked,
    currentInMarket,
    currentInMarketTier,
    ctaLabel,
    badgeLabel,
    badgeClass,
  };
}

export default function SubscriptionPlansMarketplaceV3() {
  const navigate = useNavigate();

  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("PLAN");

  const [agreed, setAgreed] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);
  const [editingAddress, setEditingAddress] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "signup">(
    "login"
  );
  const resumeRef = useRef<ResumeState | null>(null);

  const [paymentMode, setPaymentMode] = useState<"REAL" | "TEST">("REAL");
  const [paymentMeta, setPaymentMeta] = useState<{
    invoiceId?: number | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  }>({});
  const [isLaunchingRazorpay, setIsLaunchingRazorpay] = useState(false);

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

  const {
    data: currentSubResp,
    isFetching: isFetchingCurrentSub,
    error: currentSubError,
    refetch: refetchCurrentSub,
  } = useGetMyCurrentSubscriptionQuery(undefined as any);

  const isUnauthed = is401(currentSubError);

  const {
    data: listResp,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useListActivePlansQuery(undefined);

  const listPayload = useMemo(() => {
    return (listResp as any)?.data ?? listResp ?? {};
  }, [listResp]);

  const rawPlans: any[] = useMemo(() => {
    const payload: any = listPayload;

    if (Array.isArray(payload) && Array.isArray(payload[0])) return payload[0];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
    if (Array.isArray(payload?.data?.[0])) return payload.data[0];
    if (Array.isArray(payload?.data)) return payload.data;

    return [];
  }, [listPayload]);

  const subscriberHasAnyActivePlan = useMemo(() => {
    return !!(
      listPayload?.subscriberHasAnyActivePlan ||
      rawPlans.some((p) => p?.subscriberAlreadyHasPlan)
    );
  }, [listPayload, rawPlans]);

  const subscriberActivePlanIds = useMemo(() => {
    const ids = Array.isArray(listPayload?.subscriberActivePlanIds)
      ? listPayload.subscriberActivePlanIds
      : [];
    return ids.map((id: any) => String(id));
  }, [listPayload]);

  const activePlanIdSet = useMemo(() => {
    const s = new Set<string>(subscriberActivePlanIds);
    rawPlans.forEach((p: any) => {
      const pid = toPlanId(p?.id);
      if (p?.subscriberAlreadyHasPlan && pid) s.add(pid);
    });
    return s;
  }, [subscriberActivePlanIds, rawPlans]);

  const activePlansByMarket = useMemo(() => {
    const out: Record<string, any> = {};

    for (const plan of rawPlans) {
      const pid = toPlanId(plan?.id);
      const isActive =
        (!!pid && activePlanIdSet.has(pid)) || plan?.subscriberAlreadyHasPlan === true;

      if (!isActive) continue;

      const marketFamily = getPlanMarketFamily(plan);
      if (marketFamily === "UNKNOWN" || marketFamily === "MULTI") continue;

      const prev = out[marketFamily];
      if (!prev) {
        out[marketFamily] = plan;
        continue;
      }

      const prevTier = toTierFromMetadata(
        prev?.name,
        prev?.metadata ?? {},
        prev?.planType?.code ?? null
      );
      const currTier = toTierFromMetadata(
        plan?.name,
        plan?.metadata ?? {},
        plan?.planType?.code ?? null
      );

      if (tierRank(currTier) > tierRank(prevTier)) {
        out[marketFamily] = plan;
      }
    }

    return out;
  }, [rawPlans, activePlanIdSet]);

  const activePlanSummary = useMemo(() => {
    return Object.values(activePlansByMarket).map((plan: any) => {
      const tier = toTierFromMetadata(
        plan?.name,
        plan?.metadata ?? {},
        plan?.planType?.code ?? null
      );
      const family = getPlanMarketFamily(plan);
      return `${family} ${tier}`;
    });
  }, [activePlansByMarket]);

  const filteredPlans = useMemo(() => {
    const wantInterval = cycleToInterval(cycle);

    return rawPlans
      .filter((p: any) => p?.isActive !== false)
      .filter((p: any) => {
        const interval = planInterval(p);
        if (!interval) return true;
        if (interval === "lifetime") return true;
        return interval === wantInterval;
      });
  }, [rawPlans, cycle]);

  const groupedRows = useMemo(() => {
    return FAMILY_ORDER.map((family) => {
      const plans = filteredPlans
        .filter((p: any) => getPlanMarketFamily(p) === family)
        .sort((a: any, b: any) => {
          const aTier = toTierFromMetadata(
            a?.name,
            a?.metadata ?? {},
            a?.planType?.code ?? null
          );
          const bTier = toTierFromMetadata(
            b?.name,
            b?.metadata ?? {},
            b?.planType?.code ?? null
          );
          return tierRank(aTier) - tierRank(bTier);
        });

      return {
        family,
        title: getRowTitle(family),
        subtitle: getRowSubtitle(family),
        plans,
      };
    }).filter((row) => row.plans.length > 0);
  }, [filteredPlans]);

  const selectedPlanPreview =
    (selectedPlanId
      ? filteredPlans.find((p: any) => String(p?.id) === selectedPlanId) ??
        rawPlans.find((p: any) => String(p?.id) === selectedPlanId)
      : null) ?? null;

  const {
    data: planByIdResp,
    isFetching: isFetchingPlan,
    isError: isPlanError,
    error: planError,
    refetch: refetchPlan,
  } = useGetPlanByIdQuery(selectedPlanId as any, {
    skip: !selectedPlanId || isUnauthed,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!isUnauthed && is401(planError)) {
      openAuthAndRemember({ modalOpen: true });
    }
  }, [planError, isUnauthed]);

  const selectedPlanFull = (planByIdResp as any)?.data ?? planByIdResp ?? null;
  const selectedPlan = selectedPlanFull ?? selectedPlanPreview;

  const selectedPlanState = useMemo(() => {
    if (!selectedPlan) return null;
    return getPlanState(selectedPlan, activePlanIdSet, activePlansByMarket);
  }, [selectedPlan, activePlanIdSet, activePlansByMarket]);

  const selectedPlanFeatures = useMemo(() => {
    return selectedPlan ? getPlanDisplayFeatures(selectedPlan) : [];
  }, [selectedPlan]);

  const {
    data: billingResp,
    isFetching: isFetchingBilling,
    isError: isBillingError,
    error: billingError,
    refetch: refetchBilling,
  } = useGetBillingDetailsQuery(undefined, {
    skip: !(modalOpen && step === "ADDRESS") || isUnauthed,
  });

  useEffect(() => {
    if (!isUnauthed && is401(billingError))
      openAuthAndRemember({ modalOpen: true });
  }, [billingError, isUnauthed]);

  const [saveBilling, { isLoading: isSavingBilling }] =
    useSaveBillingDetailsMutation();

  const [createCheckout, { isLoading: isCreatingCheckout }] =
    useCreateSubscriptionCheckoutMutation();

  const [verifyPayment, { isLoading: isVerifyingPayment }] =
    useVerifySubscriptionPaymentMutation();

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

  useEffect(() => {
    setStep("PLAN");
    setAgreed(false);
    setPaymentDone(false);
    setPaymentMeta({});
    setPaymentMode("REAL");
  }, [selectedPlanId]);

  const openModalForPlan = (id: any) => {
    const pid = toPlanId(id);
    if (!pid) return toast.error("Plan id missing from API.");
    setSelectedPlanId(pid);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const goBack = () => {
    if (step === "PLAN") return;
    if (step === "TERMS") return setStep("PLAN");
    if (step === "ADDRESS") return setStep("TERMS");
    if (step === "PAYMENT") return setStep("ADDRESS");
  };

  const onNextFromPlan = () => {
    if (!selectedPlan?.id) return toast.info("Please select a plan.");

    if (selectedPlanState?.isCurrent) {
      return toast.info("This is already your current plan.");
    }

    if (selectedPlanState?.isDowngradeBlocked) {
      return toast.info("You already have a Premium plan for this market.");
    }

    if (isUnauthed) {
      toast.info("Please login to continue checkout.");
      openAuthAndRemember({ modalOpen: true, step: "TERMS" });
      return;
    }

    setStep("TERMS");
  };

  const onNextFromTerms = () => {
    if (isUnauthed) {
      toast.info("Please login to continue.");
      openAuthAndRemember({ modalOpen: true, step: "TERMS" });
      return;
    }
    if (!agreed) return toast.info("Please accept Terms & Conditions to continue.");
    setStep("ADDRESS");
  };

  const onSaveAddress = async () => {
    if (isUnauthed) {
      toast.info("Please login to continue.");
      openAuthAndRemember({ modalOpen: true, step: "ADDRESS" });
      return;
    }

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
      refetchBilling?.();
    } catch (e: any) {
      if (is401(e)) {
        toast.info("Please login to continue.");
        openAuthAndRemember({ modalOpen: true, step: "ADDRESS" });
        return;
      }
      notifyError(e, "Failed to save address.");
    }
  };

  const onNextFromAddress = async () => {
    if (isUnauthed) {
      toast.info("Please login to continue.");
      openAuthAndRemember({ modalOpen: true, step: "ADDRESS" });
      return;
    }

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
    if (isUnauthed) {
      toast.info("Please login to continue.");
      openAuthAndRemember({ modalOpen: true, step: "PAYMENT" });
      return;
    }

    if (!selectedPlan?.id) {
      toast.error("Missing selected plan.");
      return;
    }

    const pObj = selectedPlan
      ? priceInInr(selectedPlan)
      : { isFree: false, priceInr: null };

    if (pObj.isFree) {
      toast.success("Free plan selected.");
      closeModal();
      refetchCurrentSub?.();
      refetch?.();
      navigate("/profile");
      return;
    }

    try {
      setIsLaunchingRazorpay(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Failed to load Razorpay checkout.");
        return;
      }

      const checkoutResp = await createCheckout({
        planId: Number(selectedPlan.id),
      }).unwrap();

      const checkout = checkoutResp?.data;
      if (!checkout?.orderId || !checkout?.keyId || !checkout?.invoiceId) {
        toast.error("Invalid checkout response from server.");
        return;
      }

      setPaymentMeta({
        invoiceId: checkout.invoiceId,
        razorpayOrderId: checkout.orderId,
      });

      const rzp = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "Trade Platform",
        description:
          checkout.planName ||
          selectedPlan?.name ||
          "Subscription Payment",
        order_id: checkout.orderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: checkout.invoiceId,
            }).unwrap();

            setPaymentMeta({
              invoiceId: checkout.invoiceId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });

            setPaymentDone(true);
            setPaymentMode("REAL");
            toast.success("Payment verified successfully.");

            refetchCurrentSub?.();
            refetch?.();
            refetchPlan?.();

            closeModal();
            navigate("/profile");
          } catch (err: any) {
            notifyError(err, "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment popup closed.");
          },
        },
        prefill: {},
        notes: {
          invoiceId: String(checkout.invoiceId),
          planId: String(checkout.planId),
        },
        theme: {
          color: "#10b981",
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        const msg =
          resp?.error?.description ||
          resp?.error?.reason ||
          "Payment failed.";
        toast.error(msg);
      });

      rzp.open();
    } catch (e: any) {
      if (is401(e)) {
        toast.info("Please login to continue.");
        openAuthAndRemember({ modalOpen: true, step: "PAYMENT" });
        return;
      }
      notifyError(e, "Failed to create checkout.");
    } finally {
      setIsLaunchingRazorpay(false);
    }
  };

  const onTestingPayment = async () => {
    const pObj = selectedPlan
      ? priceInInr(selectedPlan)
      : { isFree: false, priceInr: null };

    if (pObj.isFree) {
      toast.success("Free plan selected.");
      closeModal();
      refetchCurrentSub?.();
      refetch?.();
      navigate("/profile");
      return;
    }

    setPaymentMode("TEST");
    setPaymentDone(true);
    toast.success("Test payment marked as completed.");

    closeModal();
    navigate("/profile");
  };

  const selectedTier: PlanTier = selectedPlan
    ? toTierFromMetadata(
        selectedPlan?.name,
        selectedPlan?.metadata ?? {},
        selectedPlan?.planType?.code ?? null
      )
    : "BASIC";

  const selectedMarkets = selectedPlan
    ? deriveMarketCodes(selectedPlan)
    : { isMulti: false, marketCodes: [] };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
        onAuthed={() => {
          setAuthOpen(false);
          refetchCurrentSub?.();
          refetch?.();
          refetchPlan?.();
          refetchBilling?.();
          restoreResume();
        }}
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className={`${container} pt-10 md:pt-14 pb-8 relative`}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 text-[11px] text-slate-300 border border-slate-800 bg-slate-900/40 px-3 py-1 rounded-full">
                <Shield size={14} className="text-emerald-400" />
                Retail Pricing
              </div>
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-center">
              Launch Offer Pricing for
              <span className="block text-white">Every Market</span>
            </h1>

            <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-center">
              Start with our limited launch offer. The discounted price comes
              directly from the API, while the real price is shown clearly so
              users understand the value before subscribing.
            </p>

            <LaunchOfferHero />

            <div className="mt-6 flex justify-center">
              <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-950/40 p-1">
                <button
                  type="button"
                  onClick={() => setCycle("MONTHLY")}
                  className={cx(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    cycle === "MONTHLY"
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setCycle("YEARLY")}
                  className={cx(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    cycle === "YEARLY"
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900"
                  )}
                >
                  Yearly
                </button>
              </div>
            </div>

            {subscriberHasAnyActivePlan ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 max-w-3xl mx-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeCheck size={16} className="text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-200">
                    Active plan{activePlanSummary.length === 1 ? "" : "s"} detected
                  </p>
                </div>
                {activePlanSummary.length ? (
                  <p className="mt-2 text-[12px] text-slate-300">
                    {activePlanSummary.join(" • ")}
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-slate-300">
                    You already have an active subscription.
                  </p>
                )}
              </div>
            ) : null}

            {isFetchingCurrentSub ? (
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Checking session…
              </p>
            ) : isUnauthed ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 max-w-3xl mx-auto">
                <p className="text-[11px] text-amber-200 font-semibold text-center">
                  You are not logged in. You can still view plans — login will be
                  asked only when you continue checkout.
                </p>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <div className={`${container} mt-2 space-y-6`}>
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
                {(error as any)?.data?.message ||
                  (error as any)?.message ||
                  "Unknown error"}
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300 font-semibold">
            {filteredPlans.length} plan{filteredPlans.length === 1 ? "" : "s"} available
            {isFetching ? (
              <span className="ml-2 text-[11px] text-slate-500">(refreshing…)</span>
            ) : null}
          </p>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <Info size={14} />
            Launch prices are shown from API
          </div>
        </div>

        {groupedRows.map((row, rowIndex) => (
          <motion.section
            key={row.family}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * 0.04 }}
            className="space-y-4"
          >
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-white">
                  {row.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{row.subtitle}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {row.family === "INDIAN" && (
                  <>
                    {marketChip("NSE")}
                    {marketChip("BSE")}
                  </>
                )}
                {row.family === "FOREX" && marketChip("FOREX")}
                {row.family === "CRYPTO" && marketChip("CRYPTO")}
                {row.family === "MULTI" && (
                  <span className={pill}>
                    <BadgeCheck size={14} className="text-emerald-400" />
                    Multi-market
                  </span>
                )}
              </div>
            </div>

            <div
              className={cx(
                "grid gap-4",
                row.plans.length === 1
                  ? "grid-cols-1"
                  : row.plans.length === 2
                  ? "grid-cols-1 lg:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {row.plans.map((p: any, idx: number) => {
                const pid = toPlanId(p?.id);
                const planState = getPlanState(p, activePlanIdSet, activePlansByMarket);
                const tier = planState.tier;
                const t = planTypeMeta[tier];
                const isSelected = pid && selectedPlanId === pid;
                const displayFeatures = getPlanDisplayFeatures(p);
                const strategyCount = pickStrategies(p).length;
                const priceDisplay = getPriceDisplayInfo(p);

                return (
                  <motion.button
                    key={`${String(p?.id ?? "noid")}-${idx}`}
                    type="button"
                    onClick={() => openModalForPlan(p?.id)}
                    whileHover={{ y: -2 }}
                    className={cx(
                      "relative text-left p-6 transition cursor-pointer overflow-hidden",
                      cardBase,
                      tier === "PREMIUM" || tier === "PRO" || tier === "ELITE"
                        ? "bg-[linear-gradient(180deg,rgba(8,47,73,0.65),rgba(15,23,42,0.9))]"
                        : "bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.95))]",
                      isSelected
                        ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 border-emerald-500"
                        : planState.isCurrent
                        ? "border-emerald-500/40"
                        : planState.isUpgradeTarget
                        ? "border-amber-500/30"
                        : "hover:border-slate-700"
                    )}
                  >
                    {tier === "PREMIUM" || tier === "PRO" || tier === "ELITE" ? (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_55%)]" />
                    ) : null}

                    {priceDisplay.hasLaunchOffer ? (
                      <div className="absolute right-0 top-0 z-10 rounded-bl-3xl border-b border-l border-amber-300/25 bg-amber-400 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-950">
                        Launch Price
                      </div>
                    ) : null}

                    <div
                      className={cx(
                        "absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-2 z-10",
                        t.cls
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </div>

                    {planState.badgeLabel ? (
                      <div
                        className={cx(
                          "absolute top-10 right-5 px-3 py-1 rounded-full text-[10px] font-extrabold border z-10",
                          planState.badgeClass
                        )}
                      >
                        {planState.badgeLabel}
                      </div>
                    ) : null}

                    <div className="relative z-10 flex items-start justify-between gap-3 mt-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
                          {row.title}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {p?.name ?? "Unnamed plan"}
                        </h3>
                        <p className="mt-2 text-sm text-slate-400">
                          {p?.description ?? ""}
                        </p>
                      </div>
                      <ChevronRight className="text-slate-600 mt-1" size={18} />
                    </div>

                    <div className="relative z-10 mt-5 rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                      <PriceBlock plan={p} />
                    </div>

                    <div className="relative z-10 mt-5 space-y-3">
                      {displayFeatures.map((item, featureIdx) => (
                        <FeatureBullet
                          key={`${String(p?.id ?? "p")}-${featureIdx}-${item.label}`}
                          item={item}
                        />
                      ))}
                    </div>

                    <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-[11px] text-slate-300">
                        <Layers size={13} className="text-emerald-400" />
                        {getMaxAccounts(p)} accounts
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-[11px] text-slate-300">
                        <BarChart3 size={13} className="text-emerald-400" />
                        {strategyCount} strateg{strategyCount === 1 ? "y" : "ies"}
                      </span>
                    </div>

                    {planState.isUpgradeTarget && planState.currentInMarket ? (
                      <p className="relative z-10 mt-4 text-[11px] text-amber-300">
                        Upgrade from{" "}
                        <span className="font-semibold text-amber-200">
                          {planState.currentInMarket?.name}
                        </span>
                      </p>
                    ) : null}

                    {planState.isDowngradeBlocked ? (
                      <p className="relative z-10 mt-4 text-[11px] text-sky-300">
                        Premium already active for this market
                      </p>
                    ) : null}

                    <div className="relative z-10 mt-6">
                      <div
                        className={cx(
                          "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-extrabold border transition",
                          planState.isCurrent
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : planState.isUpgradeTarget
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                            : planState.isDowngradeBlocked
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
                            : "border-emerald-400/30 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                        )}
                      >
                        {planState.ctaLabel}
                      </div>
                    </div>

                    {!pid ? (
                      <p className="relative z-10 mt-3 text-[11px] text-red-300">
                        ⚠️ API returned plan without valid <b>id</b>.
                      </p>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

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

              <div className="max-h-[80vh] md:max-h-[75vh] overflow-y-auto p-4 md:p-5">
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
                          <p className="text-base font-semibold text-slate-100">
                            {selectedPlan?.name ?? "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {selectedPlan?.description ?? ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] rounded-full border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-400">
                            {selectedTier}
                          </span>

                          {selectedPlanState?.badgeLabel ? (
                            <span
                              className={cx(
                                "text-[10px] rounded-full border px-2 py-1 font-extrabold",
                                selectedPlanState.badgeClass
                              )}
                            >
                              {selectedPlanState.badgeLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedMarkets.isMulti
                          ? ALL_MARKETS
                          : selectedMarkets.marketCodes
                        ).map((m) => marketChip(m))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(16,185,129,0.08))] p-4">
                        <PriceBlock plan={selectedPlan} size="modal" />
                      </div>

                      {selectedPlanState?.isUpgradeTarget &&
                      selectedPlanState?.currentInMarket ? (
                        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                          <p className="text-sm font-semibold text-amber-200">
                            Upgrade available
                          </p>
                          <p className="mt-1 text-[12px] text-slate-300">
                            You are currently on{" "}
                            <span className="font-semibold text-amber-200">
                              {selectedPlanState.currentInMarket?.name}
                            </span>{" "}
                            for this market. You can upgrade this market to Premium.
                          </p>
                        </div>
                      ) : null}

                      {selectedPlanState?.isCurrent ? (
                        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                          <p className="text-sm font-semibold text-emerald-200">
                            This is your current plan
                          </p>
                          <p className="mt-1 text-[12px] text-slate-300">
                            {isBasicTier(selectedTier)
                              ? "You are currently on the Basic plan for this market."
                              : "You already have the highest active plan for this market."}
                          </p>
                        </div>
                      ) : null}

                      {selectedPlanState?.isDowngradeBlocked ? (
                        <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                          <p className="text-sm font-semibold text-sky-200">
                            Premium already active
                          </p>
                          <p className="mt-1 text-[12px] text-slate-300">
                            You already have a Premium plan for this market, so switching to
                            Basic is not needed.
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-emerald-400" />
                          <p className="text-sm font-semibold text-slate-200">
                            Included Features
                          </p>
                        </div>

                        <div className="mt-4 space-y-3">
                          {selectedPlanFeatures.map((item, idx) => (
                            <FeatureBullet
                              key={`${selectedPlan?.id ?? "selected"}-${idx}-${item.label}`}
                              item={item}
                            />
                          ))}
                        </div>
                      </div>

                      <StrategySection plan={selectedPlan} />

                      {!isUnauthed && isFetchingPlan ? (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                          <RefreshCw size={14} className="animate-spin text-emerald-400" />
                          Refreshing plan details…
                        </div>
                      ) : !isUnauthed && isPlanError ? (
                        <div className="mt-4 rounded-xl border border-red-900/40 bg-red-900/10 p-3">
                          <p className="text-[11px] text-red-300 font-semibold">
                            Failed to load plan details
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {(planError as any)?.data?.message ||
                              (planError as any)?.message ||
                              "Unknown error"}
                          </p>
                          <button
                            type="button"
                            onClick={() => refetchPlan?.()}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                          >
                            <RefreshCw size={14} />
                            Retry
                          </button>
                        </div>
                      ) : null}

                      <Divider />

                      <div className="space-y-2">
                        <PlanMetric
                          icon={<Wallet size={14} />}
                          label="Market"
                          value={selectedPlan?.market?.code ?? "MULTI"}
                        />
                        <PlanMetric
                          icon={<BarChart3 size={14} />}
                          label="Strategies"
                          value={`${pickStrategies(selectedPlan).length}`}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  {step === "PLAN" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">
                          Step 1: Confirm plan selection
                        </p>
                      </div>

                      {isUnauthed ? (
                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                          <p className="text-[11px] text-amber-200 font-semibold">
                            You can view details without login. Login will be asked when you
                            click Continue.
                          </p>
                        </div>
                      ) : null}

                      {selectedPlanState?.isCurrent ? (
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <p className="text-[11px] text-emerald-200 font-semibold">
                            This is already your current plan.
                          </p>
                        </div>
                      ) : null}

                      {selectedPlanState?.isUpgradeTarget ? (
                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                          <p className="text-[11px] text-amber-200 font-semibold">
                            This will upgrade your current Basic plan to Premium for the same market.
                          </p>
                        </div>
                      ) : null}

                      {selectedPlanState?.isDowngradeBlocked ? (
                        <div className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                          <p className="text-[11px] text-sky-200 font-semibold">
                            Premium is already active for this market.
                          </p>
                        </div>
                      ) : null}

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
                          disabled={
                            !selectedPlan?.id ||
                            !!selectedPlanState?.isCurrent ||
                            !!selectedPlanState?.isDowngradeBlocked
                          }
                        >
                          {selectedPlanState?.isUpgradeTarget
                            ? "Upgrade"
                            : selectedPlanState?.isCurrent
                            ? "Current Plan"
                            : selectedPlanState?.isDowngradeBlocked
                            ? "Premium Active"
                            : "Continue"}
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === "TERMS" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">
                          Step 2: Terms & Conditions
                        </p>
                      </div>

                      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          By subscribing, you agree to the platform terms, risk disclosures and
                          compliance requirements.
                        </p>

                        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                          <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              I agree to Terms & Conditions
                            </p>
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
                          <p className="text-sm font-semibold text-slate-200">
                            Step 3: Address
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => refetchBilling?.()}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          <RefreshCw
                            size={14}
                            className={isFetchingBilling ? "animate-spin" : ""}
                          />
                          Refresh
                        </button>
                      </div>

                      {isBillingError ? (
                        <div className="mt-3 rounded-xl border border-red-900/40 bg-red-900/10 p-3">
                          <p className="text-[11px] text-red-300 font-semibold">
                            Failed to load address
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {(billingError as any)?.data?.message ||
                              (billingError as any)?.message ||
                              "Unknown error"}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500 flex items-center gap-2">
                              <CreditCard size={12} className="text-emerald-400" />
                              PAN Number (optional)
                            </p>
                            <input
                              value={addressDraft.panNumber ?? ""}
                              onChange={(e) =>
                                setAddressDraft((p) => ({
                                  ...p,
                                  panNumber: e.target.value || null,
                                }))
                              }
                              className={inputBase}
                              placeholder="PAN (optional)"
                            />
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">Pincode *</p>
                            <input
                              value={addressDraft.pincode}
                              onChange={(e) =>
                                setAddressDraft((p) => ({ ...p, pincode: e.target.value }))
                              }
                              className={inputBase}
                              placeholder="Pincode"
                            />
                          </div>

                          <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">Address line 1 *</p>
                            <input
                              value={addressDraft.addressLine1}
                              onChange={(e) =>
                                setAddressDraft((p) => ({
                                  ...p,
                                  addressLine1: e.target.value,
                                }))
                              }
                              className={inputBase}
                              placeholder="House / Street / Area"
                            />
                          </div>

                          <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">Address line 2</p>
                            <input
                              value={addressDraft.addressLine2 ?? ""}
                              onChange={(e) =>
                                setAddressDraft((p) => ({
                                  ...p,
                                  addressLine2: e.target.value || null,
                                }))
                              }
                              className={inputBase}
                              placeholder="Landmark / Apartment"
                            />
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">City *</p>
                            <input
                              value={addressDraft.city}
                              onChange={(e) =>
                                setAddressDraft((p) => ({ ...p, city: e.target.value }))
                              }
                              className={inputBase}
                              placeholder="City"
                            />
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                            <p className="text-[10px] text-slate-500">State *</p>
                            <input
                              value={addressDraft.state}
                              onChange={(e) =>
                                setAddressDraft((p) => ({ ...p, state: e.target.value }))
                              }
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
                          const pObj = selectedPlan
                            ? priceInInr(selectedPlan)
                            : { isFree: false, priceInr: null };

                          return (
                            <>
                              <p className="text-[11px] text-slate-500">Amount</p>

                              {selectedPlan ? (
                                <div className="mt-2 rounded-3xl border border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(16,185,129,0.08))] p-4">
                                  <PriceBlock plan={selectedPlan} size="payment" />
                                </div>
                              ) : null}

                              {selectedPlanState?.isUpgradeTarget ? (
                                <p className="mt-2 text-[11px] text-amber-300">
                                  You are paying for an upgrade to Premium for this market.
                                </p>
                              ) : null}

                              {pObj.isFree ? (
                                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                  <p className="text-[11px] text-emerald-200 font-semibold">
                                    This plan is FREE — no payment required.
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                                  <p className="text-[11px] text-slate-500">
                                    Use Razorpay for real payment, or use the test flow below for
                                    local/manual testing.
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={onPayNow}
                                      disabled={
                                        isCreatingCheckout ||
                                        isVerifyingPayment ||
                                        isLaunchingRazorpay
                                      }
                                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {isCreatingCheckout ||
                                      isVerifyingPayment ||
                                      isLaunchingRazorpay ? (
                                        <>
                                          <RefreshCw size={14} className="animate-spin" />
                                          Processing…
                                        </>
                                      ) : (
                                        <>
                                          <Wallet size={14} />
                                          Pay with Razorpay
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={onTestingPayment}
                                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900 transition"
                                    >
                                      <CheckCircle size={14} />
                                      Mark paid for testing
                                    </button>
                                  </div>

                                  {paymentDone ? (
                                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                      <p className="text-[11px] text-emerald-200 font-semibold">
                                        Payment done ✅ ({paymentMode === "REAL" ? "Razorpay" : "Test flow"})
                                      </p>
                                      {paymentMeta?.invoiceId ? (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                          Invoice ID: {paymentMeta.invoiceId}
                                        </p>
                                      ) : null}
                                      {paymentMeta?.razorpayPaymentId ? (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                          Payment ID: {paymentMeta.razorpayPaymentId}
                                        </p>
                                      ) : null}
                                    </div>
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
                          onClick={closeModal}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 text-[11px] text-slate-500">
                  ✅ Login is requested only when you try to continue checkout. After
                  successful payment verification, user is redirected to profile.
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}