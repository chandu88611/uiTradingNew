import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Wallet } from "lucide-react";

import { useGetUserDashboardQuery } from "../../services/userDashboard.api";
import {
  useCreateSubscriptionCheckoutMutation,
  useVerifySubscriptionPaymentMutation,
} from "../../services/billing.api";
import {
  useGetZebuFundsQuery,
  useGetDhanFundsQuery,
  useGetMt5FundsQuery,
  useGetCtraderFundsQuery,
} from "../../services/zebu.api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(d);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getStatusClasses(status?: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized === "active" ||
    normalized === "verified" ||
    normalized === "connected" ||
    normalized === "enabled"
  ) {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
  }

  if (
    normalized === "pending" ||
    normalized === "expired" ||
    normalized === "canceled" ||
    normalized === "cancelled" ||
    normalized === "paused"
  ) {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
  }

  if (
    normalized === "failed" ||
    normalized === "error" ||
    normalized === "disabled" ||
    normalized === "inactive"
  ) {
    return "bg-red-500/10 text-red-300 border border-red-500/20";
  }

  return "bg-slate-800 text-slate-300 border border-slate-700";
}

function getApiErrorMessage(error: any) {
  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function notifyError(err: any, fallback = "Something went wrong") {
  const msg =
    err?.data?.message ||
    err?.data?.error ||
    err?.error ||
    err?.message ||
    fallback;

  toast.error(String(msg));
}

function loadRazorpayScript(): Promise<boolean> {
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
}

function getPlanId(subscription: any): number | null {
  const raw =
    subscription?.planId ??
    subscription?.plan?.id ??
    subscription?.plan?.planId ??
    null;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getPlanName(subscriptionOrPlan: any): string {
  const plan = subscriptionOrPlan?.plan ?? subscriptionOrPlan;
  return String(plan?.name || subscriptionOrPlan?.planName || "");
}

function getPlanTier(subscriptionOrPlan: any): string {
  const plan = subscriptionOrPlan?.plan ?? subscriptionOrPlan;

  const metadataTier = String(plan?.metadata?.tier || "").toUpperCase();
  if (
    metadataTier === "BASIC" ||
    metadataTier === "PREMIUM" ||
    metadataTier === "PRO" ||
    metadataTier === "ELITE" ||
    metadataTier === "BUNDLE"
  ) {
    return metadataTier;
  }

  const name = getPlanName(subscriptionOrPlan).toLowerCase();

  if (name.includes("elite")) return "ELITE";
  if (name.includes("premium")) return "PREMIUM";
  if (name.includes("pro")) return "PRO";
  if (name.includes("bundle")) return "BUNDLE";
  if (name.includes("basic")) return "BASIC";

  const planTypeCode = String(plan?.planType?.code || "").toUpperCase();
  const planTypeName = String(plan?.planType?.name || "").toUpperCase();

  if (
    planTypeCode === "BASIC" ||
    planTypeCode === "PREMIUM" ||
    planTypeCode === "PRO" ||
    planTypeCode === "ELITE" ||
    planTypeCode === "BUNDLE"
  ) {
    return planTypeCode;
  }

  if (
    planTypeName === "BASIC" ||
    planTypeName === "PREMIUM" ||
    planTypeName === "PRO" ||
    planTypeName === "ELITE" ||
    planTypeName === "BUNDLE"
  ) {
    return planTypeName;
  }

  return "UNKNOWN";
}

function isPremiumLikePlan(subscriptionOrPlan: any) {
  const tier = getPlanTier(subscriptionOrPlan);

  return (
    tier === "PREMIUM" ||
    tier === "PRO" ||
    tier === "ELITE" ||
    tier === "BUNDLE"
  );
}

function isBasicPlan(subscriptionOrPlan: any) {
  return getPlanTier(subscriptionOrPlan) === "BASIC";
}

function getMarketKey(subscriptionOrPlan: any): string {
  const plan = subscriptionOrPlan?.plan ?? subscriptionOrPlan;
  const name = getPlanName(subscriptionOrPlan).toLowerCase();

  if (name.includes("forex")) return "FOREX";
  if (name.includes("crypto")) return "CRYPTO";
  if (name.includes("indian") || name.includes("nse") || name.includes("bse")) {
    return "INDIAN";
  }

  const raw =
    plan?.market?.code ??
    plan?.market?.name ??
    plan?.market?.brokerCategory ??
    plan?.broker?.marketCategory ??
    plan?.category ??
    plan?.metadata?.market ??
    "";

  const value = String(raw || "").trim().toUpperCase();

  if (value === "INDIA") return "INDIAN";
  if (value === "NSE" || value === "BSE") return "INDIAN";
  if (value.includes("INDIAN")) return "INDIAN";
  if (value.includes("FOREX")) return "FOREX";
  if (value.includes("CRYPTO")) return "CRYPTO";

  return value || "UNKNOWN";
}

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  accent?: boolean;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  accent = false,
}) => {
  return (
    <div
      className={`rounded-2xl p-5 ${
        accent
          ? "border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl shadow-emerald-500/10"
          : "border border-slate-800 bg-slate-900/70"
      }`}
    >
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <div className="text-2xl font-semibold text-slate-100">{value}</div>
      {subtext ? (
        <div className="mt-2 text-xs text-slate-400">{subtext}</div>
      ) : null}
    </div>
  );
};

// Account Funds Display Component
const AccountFunds: React.FC<{ account: any }> = ({ account }) => {
  const brokerCode = String(account.broker?.code ?? "").toUpperCase();
  const isCtrader = brokerCode === "CT" || brokerCode === "CTRADER";

  // Use the appropriate funds hook based on broker
  const zebuQuery = useGetZebuFundsQuery(
    { tradingAccountId: account.id },
    { skip: brokerCode !== "ZEBU" }
  );
  const dhanQuery = useGetDhanFundsQuery(
    { tradingAccountId: account.id },
    { skip: brokerCode !== "DHAN" }
  );
  const mt5Query = useGetMt5FundsQuery(
    { tradingAccountId: account.id },
    { skip: brokerCode !== "MT5" }
  );
  const ctraderQuery = useGetCtraderFundsQuery(
    { tradingAccountId: account.id },
    { skip: !isCtrader }
  );

  const query =
    brokerCode === "DHAN"
      ? dhanQuery
      : brokerCode === "MT5"
        ? mt5Query
        : isCtrader
          ? ctraderQuery
          : zebuQuery;

  const funds = query.data;
  const isLoading = query.isLoading || query.isFetching;

  return (
    <div className="mt-4">
      <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        <Wallet size={12} />
        Account Funds
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-900/80 p-3">
          <p className="text-[11px] text-slate-400">Available Cash</p>
          <p className="mt-1 text-sm font-semibold text-emerald-400">
            {isLoading ? "…" : formatCurrency(funds?.availableCash ?? 0)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-3">
          <p className="text-[11px] text-slate-400">Margin Used</p>
          <p className="mt-1 text-sm font-semibold text-amber-400">
            {isLoading ? "…" : formatCurrency(funds?.marginUsed ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

const UserDashboard: React.FC = () => {
  const {
    data: dashboard,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetUserDashboardQuery(undefined, { pollingInterval: 5000 });

  const [createCheckout, { isLoading: isCreatingCheckout }] =
    useCreateSubscriptionCheckoutMutation();

  const [verifyPayment, { isLoading: isVerifyingPayment }] =
    useVerifySubscriptionPaymentMutation();

  const [renewingPlanId, setRenewingPlanId] = useState<number | null>(null);

  const user = dashboard?.user;
  const tradeStats = dashboard?.stats?.trades;
  const activePlans = dashboard?.plans?.active || [];
  const pastPlans = dashboard?.plans?.past || [];
  const accounts = dashboard?.accounts || [];

  const enabledAccountsCount = useMemo(
    () => accounts.filter((account: any) => account.isEnabled).length,
    [accounts]
  );

  const linkedAccountsCount = useMemo(
    () =>
      accounts.filter((account: any) => account.subscriptionId !== null).length,
    [accounts]
  );

  const verifiedAccountsCount = useMemo(
    () =>
      accounts.filter(
        (account: any) => account.status?.toLowerCase() === "verified"
      ).length,
    [accounts]
  );

  const executionEnabledCount = useMemo(
    () => activePlans.filter((plan: any) => plan.executionEnabled).length,
    [activePlans]
  );

  const webhookEnabledCount = useMemo(
    () => activePlans.filter((plan: any) => plan.isWebhookEnabled).length,
    [activePlans]
  );

  const activePremiumMarketSet = useMemo(() => {
    const set = new Set<string>();

    for (const subscription of activePlans) {
      if (!isPremiumLikePlan(subscription)) continue;

      const marketKey = getMarketKey(subscription);

      if (marketKey && marketKey !== "UNKNOWN") {
        set.add(marketKey);
      }
    }

    return set;
  }, [activePlans]);

  const hasActivePremiumForPastPlan = (subscription: any) => {
    const marketKey = getMarketKey(subscription);
    return activePremiumMarketSet.has(marketKey);
  };

  const shouldShowRenewButton = (subscription: any) => {
    if (!getPlanId(subscription)) return false;

    if (isBasicPlan(subscription)) return false;

    if (!isPremiumLikePlan(subscription)) return false;

    if (hasActivePremiumForPastPlan(subscription)) return false;

    return true;
  };

  const getPastPlanActionLabel = (subscription: any) => {
    if (hasActivePremiumForPastPlan(subscription)) return "Active";

    if (isBasicPlan(subscription)) return "";

    if (!getPlanId(subscription)) return "Plan missing";

    if (!isPremiumLikePlan(subscription)) return "";

    return "";
  };

  const handleRenewPlan = async (subscription: any) => {
    const planId = getPlanId(subscription);

    if (!planId) {
      toast.error("Plan id missing. Cannot renew this plan.");
      return;
    }

    if (!shouldShowRenewButton(subscription)) {
      toast.info("Renewal is not available for this plan.");
      return;
    }

    try {
      setRenewingPlanId(planId);

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Failed to load Razorpay checkout.");
        return;
      }

      const checkoutResp = await createCheckout({
        planId,
      }).unwrap();

      const checkout = checkoutResp?.data ?? checkoutResp;

      if (!checkout?.orderId || !checkout?.keyId || !checkout?.invoiceId) {
        toast.error("Invalid checkout response from server.");
        return;
      }

      const planName =
        checkout?.planName ||
        subscription?.plan?.name ||
        getPlanName(subscription) ||
        "Subscription Renewal";

      const rzp = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency || "INR",
        name: "TradeBro",
        description: `Renew ${planName}`,
        order_id: checkout.orderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: checkout.invoiceId,
            }).unwrap();

            toast.success("Plan renewed successfully.");
            refetch?.();
          } catch (err: any) {
            notifyError(err, "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment popup closed.");
          },
        },
        notes: {
          invoiceId: String(checkout.invoiceId),
          planId: String(checkout.planId ?? planId),
          purpose: "subscription_renewal",
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
    } catch (err: any) {
      notifyError(err, "Failed to start renewal payment.");
    } finally {
      setRenewingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-slate-800" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl border border-slate-800 bg-slate-900/70"
              />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/70 lg:col-span-3" />
            <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/70 lg:col-span-2" />
          </div>
          <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/70" />
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-slate-900/70 p-6 text-center">
          <p className="text-lg font-semibold text-red-300">
            Failed to load dashboard
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {getApiErrorMessage(error)}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isRenewLoading = isCreatingCheckout || isVerifyingPayment;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-emerald-400">
            Trading Dashboard
          </p>
          <h1 className="text-2xl font-semibold md:text-3xl">
            Welcome back, {user?.name || "Trader"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Live overview of your account, plans and linked broker accounts.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
              {user?.email}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs ${getStatusClasses(
                user?.isEmailVerified ? "verified" : "pending"
              )}`}
            >
              {user?.isEmailVerified ? "Email Verified" : "Email Pending"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs ${getStatusClasses(
                user?.isActive ? "active" : "inactive"
              )}`}
            >
              {user?.isActive ? "User Active" : "User Inactive"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                isFetching ? "bg-amber-400" : "animate-pulse bg-emerald-400"
              }`}
            />
            <span className="text-xs font-medium text-slate-200">
              Dashboard:{" "}
              <span
                className={isFetching ? "text-amber-300" : "text-emerald-400"}
              >
                {isFetching ? "Refreshing" : "Live"}
              </span>
            </span>
          </div>

          <div className="text-right text-xs text-slate-400">
            <p>Last login: {formatDateTime(user?.lastLoginAt)}</p>
          </div>

          <button
            onClick={() => refetch()}
            className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Trades"
          value={tradeStats?.total ?? 0}
          subtext={
            <span>
              Active:{" "}
              <span className="text-emerald-400">
                {tradeStats?.active ?? 0}
              </span>
              {" • "}
              Closed:{" "}
              <span className="text-slate-200">
                {tradeStats?.closed ?? 0}
              </span>
              {" • "}
              Failed:{" "}
              <span className="text-red-300">
                {tradeStats?.failed ?? 0}
              </span>
            </span>
          }
          accent
        />

        <StatCard
          label="Active Plans"
          value={activePlans.length}
          subtext={
            <span>
              Execution enabled:{" "}
              <span className="text-emerald-400">{executionEnabledCount}</span>
              {" • "}
              Webhook enabled:{" "}
              <span className="text-slate-200">{webhookEnabledCount}</span>
            </span>
          }
        />

        <StatCard
          label="Broker Accounts"
          value={accounts.length}
          subtext={
            <span>
              Verified:{" "}
              <span className="text-emerald-400">
                {verifiedAccountsCount}
              </span>
              {" • "}
              Enabled:{" "}
              <span className="text-slate-200">{enabledAccountsCount}</span>
            </span>
          }
        />

        <StatCard
          label="Permissions"
          value={
            <div className="flex flex-wrap gap-2 pt-1">
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${getStatusClasses(
                  user?.allowTrade ? "enabled" : "disabled"
                )}`}
              >
                Trade {user?.allowTrade ? "Allowed" : "Blocked"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${getStatusClasses(
                  user?.allowCopyTrade ? "enabled" : "disabled"
                )}`}
              >
                Copy Trade {user?.allowCopyTrade ? "Allowed" : "Blocked"}
              </span>
            </div>
          }
          subtext={
            <span>
              Linked accounts:{" "}
              <span className="text-emerald-400">{linkedAccountsCount}</span>
              {" • "}
              Past plans:{" "}
              <span className="text-slate-200">{pastPlans.length}</span>
            </span>
          }
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                Plans
              </p>
              <h2 className="text-sm font-semibold text-slate-100">
                Active Subscriptions
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {activePlans.length} active
            </span>
          </div>

          <div className="space-y-3">
            {activePlans.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-5 text-sm text-slate-400">
                No active plans found.
              </div>
            ) : (
              activePlans.map((subscription: any) => (
                <div
                  key={subscription.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-100">
                          {subscription.plan?.name || "Unnamed Plan"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${getStatusClasses(
                            subscription.status
                          )}`}
                        >
                          {subscription.status}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                          {subscription.plan?.market?.name || getMarketKey(subscription)}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                          {getPlanTier(subscription)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {subscription.plan?.description ||
                          "No description available."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                        <span className="rounded-full bg-slate-800 px-2 py-1">
                          Price:{" "}
                          <span className="font-semibold text-slate-100">
                            {subscription.plan?.pricing?.isFree
                              ? "Free"
                              : formatCurrency(
                                  subscription.plan?.pricing?.priceInr
                                )}
                          </span>
                        </span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">
                          Interval:{" "}
                          <span className="font-semibold text-slate-100">
                            {subscription.plan?.pricing?.interval || "—"}
                          </span>
                        </span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">
                          Start:{" "}
                          <span className="font-semibold text-slate-100">
                            {formatDate(subscription.startDate)}
                          </span>
                        </span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">
                          End:{" "}
                          <span className="font-semibold text-slate-100">
                            {formatDate(subscription.endDate)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:max-w-[240px] md:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] ${
                          subscription.executionEnabled
                            ? getStatusClasses("enabled")
                            : getStatusClasses("disabled")
                        }`}
                      >
                        Execution{" "}
                        {subscription.executionEnabled ? "Enabled" : "Disabled"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] ${
                          subscription.isWebhookEnabled
                            ? getStatusClasses("enabled")
                            : getStatusClasses("disabled")
                        }`}
                      >
                        Webhook {subscription.isWebhookEnabled ? "On" : "Off"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] ${
                          subscription.autoRenew
                            ? getStatusClasses("enabled")
                            : getStatusClasses("paused")
                        }`}
                      >
                        Auto Renew {subscription.autoRenew ? "On" : "Off"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pastPlans.length > 0 ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">
                  Past Plans
                </h3>
                <span className="text-[11px] text-slate-400">
                  {pastPlans.length} records
                </span>
              </div>

              <div className="space-y-3">
                {pastPlans.map((subscription: any) => {
                  const planId = getPlanId(subscription);
                  const showRenew = shouldShowRenewButton(subscription);
                  const actionLabel = getPastPlanActionLabel(subscription);
                  const marketKey = getMarketKey(subscription);
                  const tier = getPlanTier(subscription);
                  const isThisRenewing =
                    !!planId && renewingPlanId === planId && isRenewLoading;

                  return (
                    <div
                      key={subscription.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 transition hover:border-slate-700"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-100">
                              {subscription.plan?.name || "Unnamed Plan"}
                            </p>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClasses(
                                subscription.status
                              )}`}
                            >
                              {subscription.status}
                            </span>

                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {marketKey}
                            </span>

                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {tier}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {subscription.plan?.market?.name || marketKey} •{" "}
                            {formatDate(subscription.startDate)} to{" "}
                            {formatDate(subscription.endDate)}
                          </p>

                          {hasActivePremiumForPastPlan(subscription) ? (
                            <p className="mt-2 text-[11px] font-medium text-emerald-300">
                              Same market premium plan is already active.
                            </p>
                          ) : null}

                          {isBasicPlan(subscription) ? (
                            <p className="mt-2 text-[11px] text-slate-500">
                              Basic past plan renewal is disabled.
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-start md:justify-end">
                          {showRenew ? (
                            <button
                              type="button"
                              disabled={isRenewLoading}
                              onClick={() => handleRenewPlan(subscription)}
                              className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                            >
                              {isThisRenewing ? "Opening..." : "Renew Plan"}
                            </button>
                          ) : actionLabel === "Active" ? (
                            <span className="inline-flex min-w-[90px] items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-[11px] font-extrabold text-emerald-300">
                              Active
                            </span>
                          ) : actionLabel ? (
                            <span className="inline-flex min-w-[110px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-[11px] font-semibold text-slate-400">
                              {actionLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                Account Overview
              </p>
              <h2 className="text-sm font-semibold text-slate-100">
                User Access Summary
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Trading Access</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {user?.allowTrade ? "Allowed" : "Blocked"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Copy Trading</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {user?.allowCopyTrade ? "Allowed" : "Blocked"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Active Plans</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {activePlans.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Linked Accounts</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {linkedAccountsCount}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
              User Details
            </p>

            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">User ID</span>
                <span className="font-medium text-slate-100">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Updated At</span>
                <span className="font-medium text-slate-100">
                  {formatDateTime(user?.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Admin Access</span>
                <span className="font-medium text-slate-100">
                  {user?.isAdmin ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
              Accounts
            </p>
            <h2 className="text-sm font-semibold text-slate-100">
              Connected Broker Accounts
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {accounts.length} total
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-center text-sm text-slate-400">
            No broker accounts linked yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {accounts.map((account: any) => (
              <div
                key={account.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-100">
                        {account.accountLabel || account.accountId}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${getStatusClasses(
                          account.status
                        )}`}
                      >
                        {account.status}
                      </span>
                      {account.isMaster ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                          Master
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {account.broker?.name || "Unknown Broker"} •{" "}
                      {account.accountId}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] ${
                        account.isEnabled
                          ? getStatusClasses("enabled")
                          : getStatusClasses("disabled")
                      }`}
                    >
                      {account.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-900/80 p-3">
                    <p className="text-[11px] text-slate-400">Market</p>
                    <p className="mt-1 text-sm text-slate-100">
                      {account.market?.name ||
                        account.market?.brokerCategory ||
                        account.broker?.marketCategory ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 p-3">
                    <p className="text-[11px] text-slate-400">Linked Plan</p>
                    <p className="mt-1 text-sm text-slate-100">
                      {account.subscription?.planName || "Not linked"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 p-3">
                    <p className="text-[11px] text-slate-400">
                      Subscription Status
                    </p>
                    <p className="mt-1 text-sm text-slate-100">
                      {account.subscription?.status || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 p-3">
                    <p className="text-[11px] text-slate-400">Last Verified</p>
                    <p className="mt-1 text-sm text-slate-100">
                      {formatDateTime(account.lastVerifiedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    Trade Counts
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                      <p className="text-[11px] text-slate-400">Active</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        {account.tradeCounts?.active ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                      <p className="text-[11px] text-slate-400">Closed</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {account.tradeCounts?.closed ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                      <p className="text-[11px] text-slate-400">Failed</p>
                      <p className="mt-1 text-sm font-semibold text-red-300">
                        {account.tradeCounts?.failed ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                      <p className="text-[11px] text-slate-400">Total</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {account.tradeCounts?.total ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                <AccountFunds account={account} />

                {account.subscription?.planName ? (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
                    Subscription ID:{" "}
                    <span className="font-semibold text-slate-100">
                      {account.subscription?.id ?? "—"}
                    </span>
                    {" • "}
                    Plan ID:{" "}
                    <span className="font-semibold text-slate-100">
                      {account.subscription?.planId ?? "—"}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
