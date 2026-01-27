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
  Receipt,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { useGetBillingDetailsQuery } from "../../services/userApi";
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const shell = "w-full";
const card =
  "rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const soft =
  "rounded-2xl border border-white/5 bg-slate-950/30 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const btn =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition";
const btnGhost = "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";
const btnPrimary =
  "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20";

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
      label: "Active • Execution ON",
      tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
    };

  return {
    label: "Active • Execution OFF",
    tone: "text-slate-200 bg-white/5 border-white/10",
  };
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
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

  const raw = (subRes as any)?.data ?? null;

  const subs: any[] = useMemo(() => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return [raw];
  }, [raw]);

  const billing = (billingRes as any)?.data ?? null;

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

    const hasEnabled = subs.some(
      (s) => Boolean(s?.executionEnabled ?? s?.allowTrade) && !isExpired(s?.endDate)
    );
    const hasExpired = subs.some((s) => isExpired(s?.endDate));

    if (hasEnabled)
      return {
        label: `${subs.length} Plan(s) • Some Execution Enabled`,
        tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
      };

    if (hasExpired)
      return {
        label: `${subs.length} Plan(s) • Some Expired`,
        tone: "text-rose-200 bg-rose-500/10 border-rose-500/20",
      };

    return {
      label: `${subs.length} Plan(s) • Execution Disabled`,
      tone: "text-slate-200 bg-white/5 border-white/10",
    };
  }, [subs]);

  const refreshing = subLoading || subFetching || billingLoading || billingFetching;

  return (
    <div className={shell}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-white">
            Plans & Billing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage active plans across Forex / India / Crypto / Copy + invoice billing details.
          </p>

          <div
            className={clsx(
              "mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
              overall.tone
            )}
          >
            <ShieldCheck size={14} />
            <span>{overall.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchSub();
              refetchBilling();
            }}
            className={clsx(btn, btnGhost)}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <a href="/subscriptions/dashboard" className={clsx(btn, btnPrimary)}>
            <Receipt size={16} />
            Subscription Dashboard
          </a>
        </div>
      </div>

      {/* Category Filter (better segmented control) */}
      {categories.length > 1 ? (
        <div className="mb-6">
          <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-white/5 bg-slate-950/25 p-2">
            {categories.map((c) => {
              const active = activeCat === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm border transition",
                    active
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "bg-transparent text-slate-300 border-white/5 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <Layers size={16} />
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plans */}
        <section className={card}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-yellow-300" />
                <h2 className="text-lg font-semibold text-white">Active Plans</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                You can have multiple active plans in parallel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a href="/pricing" className={clsx(btn, btnGhost)}>
                Explore Plans <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {subs.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              No active plans found. Purchase a plan to enable features.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredSubs.map((sub, idx) => {
                const plan = sub?.plan ?? null;
                const st = getPlanStatus(sub);

                return (
                  <div
                    key={sub?.id ?? `${plan?.planCode ?? "plan"}-${idx}`}
                    className={clsx(soft, "p-4")}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-slate-100 truncate">
                          {plan?.name || plan?.planCode || "—"}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {plan?.category || "—"} • {plan?.interval || "—"} •{" "}
                          {plan?.executionFlow || "—"}
                        </div>
                      </div>

                      <div
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                          st.tone
                        )}
                      >
                        <ShieldCheck size={14} />
                        <span>{st.label}</span>
                      </div>
                    </div>

                    {/* Price + Validity */}
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <StatPill
                        icon={<CreditCard size={14} />}
                        label="Price"
                        value={`${moneyINRFromCents(plan?.priceCents)} / ${plan?.interval || "—"}`}
                      />
                      <StatPill
                        icon={<CalendarClock size={14} />}
                        label="Valid until"
                        value={fmtDate(sub?.endDate)}
                      />
                    </div>

                    {/* Limits grid (clean) */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <LimitPill label="Max Accounts" value={plan?.maxConnectedAccounts} />
                      <LimitPill label="Max Strategies" value={plan?.maxActiveStrategies} />
                      <LimitPill label="Max Daily Trades" value={plan?.maxDailyTrades} />
                      <LimitPill label="Max Lot/Trade" value={plan?.maxLotPerTrade} />
                      <LimitPill label="Plan Code" value={plan?.planCode} mono />
                      <LimitPill label="Category" value={plan?.category} />
                    </div>

                    {/* Footer actions */}
                    <div className="mt-4 flex items-center justify-between gap-2 flex-wrap rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Hash size={14} />
                        Subscription ID:{" "}
                        <span className="text-slate-200 font-semibold">
                          {sub?.id ?? "—"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <a href="/subscriptions/dashboard" className={clsx(btn, btnGhost, "py-2 text-xs")}>
                          Manage
                        </a>
                        <a href="/subscriptions/invoices" className={clsx(btn, btnGhost, "py-2 text-xs")}>
                          Invoices
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Billing */}
        <section className={card}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-300" />
                <h2 className="text-lg font-semibold text-white">Billing Details</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Used for invoices (PAN + address).
              </p>
            </div>

            <a href="/profile" className={clsx(btn, btnGhost, "text-xs")}>
              Edit in Profile <ArrowRight size={16} />
            </a>
          </div>

          {billingLoading || billingFetching ? (
            <div className="mt-5 text-sm text-slate-400">Loading billing…</div>
          ) : (
            <div className="mt-5 space-y-3">
              <InfoRow
                icon={<Hash size={16} />}
                label="PAN Number"
                value={billing?.panNumber || "—"}
              />

              <div className="rounded-2xl border border-white/5 bg-slate-950/25 p-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <MapPin size={16} />
                  <p className="text-sm font-semibold">Address</p>
                </div>

                {billing ? (
                  <div className="mt-3 text-sm text-slate-100 space-y-1">
                    <div>{billing.addressLine1 || "—"}</div>
                    {billing.addressLine2 ? <div>{billing.addressLine2}</div> : null}
                    <div className="text-slate-300">
                      {[billing.city, billing.state].filter(Boolean).join(", ")}
                    </div>
                    <div className="font-semibold">{billing.pincode || "—"}</div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-300">—</div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
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

/* ---------- small UI blocks ---------- */

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/25 p-3">
      <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-100 truncate">{value}</div>
      </div>
    </div>
  );
}

function LimitPill({
  label,
  value,
  mono,
}: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/25 p-3">
      <div className="flex items-center gap-2 text-slate-300">
        <Settings2 size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <div className={clsx("text-sm font-semibold text-slate-100", mono && "font-mono")}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/25 p-3">
      <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-100 truncate">{value}</div>
      </div>
    </div>
  );
}
