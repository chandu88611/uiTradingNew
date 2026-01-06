import React, { useMemo, useState } from "react";
import {
  CreditCard,
  Crown,
  RefreshCw,
  Hash,
  ShieldCheck,
  Settings2,
  MapPin,
  Layers,
} from "lucide-react";
import { useGetBillingDetailsQuery } from "../../services/userApi";
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const cardBase = "rounded-2xl border border-white/5 bg-slate-900/30 p-5 md:p-6";
const pillBase = "flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/30 p-3";

function moneyINRFromCents(cents?: number | null) {
  const n = Number(cents ?? 0);
  if (!Number.isFinite(n)) return "—";
  return `₹${(n / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function isExpired(endDate?: string | null) {
  if (!endDate) return false;
  const t = new Date(endDate).getTime();
  if (!Number.isFinite(t)) return false;
  return t < Date.now();
}

function getPlanStatus(sub: any) {
  const enabled = Boolean(sub?.executionEnabled ?? sub?.allowTrade);
  const expired = isExpired(sub?.endDate);
  if (expired)
    return {
      label: "Expired",
      tone: "text-rose-200 bg-rose-500/10 border-rose-500/20",
    };
  if (enabled)
    return {
      label: "Active • Execution Enabled",
      tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
    };
  return {
    label: "Active • Execution Disabled",
    tone: "text-slate-200 bg-white/5 border-white/10",
  };
}

export default function PlanBillingPage() {
  const {
    data: subRes,
    isLoading: subLoading,
    isFetching: subFetching,
    refetch: refetchSub,
  } = useGetMyCurrentSubscriptionQuery();

  const {
    data: billingRes,
    isLoading: billingLoading,
    isFetching: billingFetching,
    refetch: refetchBilling,
  } = useGetBillingDetailsQuery();

  // ✅ support: subRes.data can be object OR array
  const raw = (subRes as any)?.data ?? null;

  const subs: any[] = useMemo(() => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return [raw];
  }, [raw]);

  const billing = (billingRes as any)?.data ?? null;

  // categories list (from plan.category)
  const categories = useMemo(() => {
    const set = new Set<string>();
    subs.forEach((s) => {
      const cat = String(s?.plan?.category ?? "").trim();
      if (cat) set.add(cat);
    });
    return ["ALL", ...Array.from(set)];
  }, [subs]);

  const [activeCat, setActiveCat] = useState<string>("ALL");

  const filteredSubs = useMemo(() => {
    if (activeCat === "ALL") return subs;
    return subs.filter((s) => String(s?.plan?.category ?? "") === activeCat);
  }, [subs, activeCat]);

  const overall = useMemo(() => {
    if (subs.length === 0) {
      return {
        label: "No active plans",
        tone: "text-yellow-200 bg-yellow-500/10 border-yellow-500/20",
      };
    }
    const hasEnabled = subs.some((s) => Boolean(s?.executionEnabled ?? s?.allowTrade) && !isExpired(s?.endDate));
    const hasExpired = subs.some((s) => isExpired(s?.endDate));
    if (hasEnabled)
      return {
        label: `${subs.length} Active Plan(s) • Some Execution Enabled`,
        tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
      };
    if (hasExpired)
      return {
        label: `${subs.length} Plan(s) • Some Expired`,
        tone: "text-rose-200 bg-rose-500/10 border-rose-500/20",
      };
    return {
      label: `${subs.length} Active Plan(s) • Execution Disabled`,
      tone: "text-slate-200 bg-white/5 border-white/10",
    };
  }, [subs]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Plans & Billing</h1>
          <p className="text-sm text-slate-400 mt-1">
            All active plans (Forex / India / Copy Trading etc.) + invoice billing details.
          </p>
        </div>

        <button
          onClick={() => {
            refetchSub();
            refetchBilling();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          <RefreshCw size={16} />
          {subLoading || subFetching || billingLoading || billingFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Overall status strip */}
      <div className={clsx("mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs", overall.tone)}>
        <ShieldCheck size={14} />
        <span>{overall.label}</span>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
                activeCat === c
                  ? "bg-emerald-500 text-slate-950 border-emerald-500"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
              )}
            >
              <Layers size={16} />
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plans (multi) */}
        <section className={cardBase}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-yellow-300" />
                <h2 className="text-lg font-semibold text-white">Active Plans</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your account can have multiple plans active at the same time.
              </p>
            </div>
          </div>

          {subs.length === 0 ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              No active plans found. Please purchase a plan to enable features.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredSubs.map((sub, idx) => {
                const plan = sub?.plan ?? null;
                const st = getPlanStatus(sub);

                return (
                  <div key={sub?.id ?? `${plan?.planCode ?? "plan"}-${idx}`} className="rounded-2xl border border-white/5 bg-slate-950/20 p-4">
                    {/* Top line */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate">
                          {plan?.name || plan?.planCode || "—"}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {plan?.category || "—"} • {plan?.interval || "—"} • {plan?.executionFlow || "—"}
                        </div>
                      </div>

                      <div className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs", st.tone)}>
                        <ShieldCheck size={14} />
                        <span>{st.label}</span>
                      </div>
                    </div>

                    {/* Pills */}
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Pill icon={<Hash size={14} />} label="Plan Code" value={plan?.planCode || "—"} />
                      <Pill
                        icon={<CreditCard size={14} />}
                        label="Price"
                        value={`${moneyINRFromCents(plan?.priceCents)} / ${plan?.interval || "—"}`}
                      />
                      <Pill icon={<Settings2 size={14} />} label="Max Accounts" value={String(plan?.maxConnectedAccounts ?? "—")} />
                      <Pill icon={<Settings2 size={14} />} label="Max Strategies" value={String(plan?.maxActiveStrategies ?? "—")} />
                      <Pill icon={<Settings2 size={14} />} label="Max Daily Trades" value={String(plan?.maxDailyTrades ?? "—")} />
                      <Pill icon={<Settings2 size={14} />} label="Max Lot/Trade" value={String(plan?.maxLotPerTrade ?? "—")} />
                    </div>

                    {/* Footer line */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-xs text-slate-400">Valid Until</div>
                          <div className="font-medium text-slate-100">
                            {sub?.endDate ? new Date(sub.endDate).toLocaleString() : "—"}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href="/subscriptions/dashboard"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 hover:bg-white/10"
                          >
                            Manage
                          </a>
                          <a
                            href="/subscriptions/invoices"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 hover:bg-white/10"
                          >
                            Invoices
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Billing Details */}
        <section className={cardBase}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-300" />
                <h2 className="text-lg font-semibold text-white">Billing Details</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Used for invoices. PAN + address.</p>
            </div>

            <a
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 hover:bg-white/10"
            >
              Edit in Profile
            </a>
          </div>

          {billingLoading || billingFetching ? (
            <div className="mt-5 text-sm text-slate-400">Loading billing…</div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className={pillBase}>
                <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                  <Hash size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">PAN Number</div>
                  <div className="text-sm font-semibold text-slate-100 truncate">{billing?.panNumber || "—"}</div>
                </div>
              </div>

              <div className={pillBase}>
                <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Address</div>
                  {billing ? (
                    <div className="text-sm text-slate-100">
                      <div>{billing.addressLine1 || "—"}</div>
                      {billing.addressLine2 ? <div>{billing.addressLine2}</div> : null}
                      <div className="text-slate-300">{[billing.city, billing.state].filter(Boolean).join(", ")}</div>
                      <div className="font-medium">{billing.pincode || "—"}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-100">—</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                Tip: If billing details are empty, open{" "}
                <span className="text-slate-100 font-semibold">Profile</span> → Billing tab and save PAN + address.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Pill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/30 p-3">
      <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-100 truncate">{value}</div>
      </div>
    </div>
  );
}
