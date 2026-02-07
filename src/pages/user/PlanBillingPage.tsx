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
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
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

function isExpired(endDate?: string | null) {
  if (!endDate) return false;
  const t = new Date(endDate).getTime();
  return Number.isFinite(t) ? t < Date.now() : false;
}

function normStatusV2(v?: string | null) {
  return String(v ?? "").trim().toUpperCase() || "UNKNOWN";
}

function getSubStatus(sub: any) {
  const expired = isExpired(sub?.endDate);
  const statusV2 = normStatusV2(sub?.statusV2);
  const exec = Boolean(sub?.executionEnabled);

  if (expired) {
    return {
      label: "EXPIRED",
      tone: "text-rose-200 bg-rose-500/10 border-rose-500/20",
    };
  }

  if (statusV2 === "CANCELED" || statusV2 === "CANCELLED") {
    return {
      label: "CANCELED",
      tone: "text-rose-200 bg-rose-500/10 border-rose-500/20",
    };
  }

  if (statusV2 === "PAST_DUE") {
    return {
      label: "PAST_DUE",
      tone: "text-amber-200 bg-amber-500/10 border-amber-500/20",
    };
  }

  // default ACTIVE-like
  return exec
    ? {
        label: `${statusV2} • EXECUTION ON`,
        tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
      }
    : {
        label: `${statusV2} • EXECUTION OFF`,
        tone: "text-slate-200 bg-white/5 border-white/10",
      };
}

function shortToken(token?: string | null, keep = 12) {
  if (!token) return "—";
  const s = String(token);
  if (s.length <= keep * 2 + 3) return s;
  return `${s.slice(0, keep)}…${s.slice(-keep)}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

export default function PlanBillingPage() {
  const {
    data: subRes,
    isLoading: subLoading,
    isFetching: subFetching,
    refetch: refetchSub,
    isError: subError,
  } = useGetMyCurrentSubscriptionQuery(undefined as any);
 
  const {
    data: billingRes,
    isLoading: billingLoading,
    isFetching: billingFetching,
    refetch: refetchBilling,
    isError: billingError,
  } = useGetBillingDetailsQuery(undefined as any);

  /**
   * ✅ CORRECT MAPPING (your response)
   * {
   *   message: "...",
   *   data: [ ...subscriptions ]
   * }
   */
  const subs: any[] = useMemo(() => {
    const list = (subRes as any)?.data; // ✅ THIS IS THE ARRAY
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [subRes]);

  const billing = (billingRes as any)?.data ?? null;

  // ✅ categories based on plan.metadata.tier (primary) else plan.planTypeId
  const categories = useMemo(() => {
    const set = new Set<string>();
    subs.forEach((s) => {
      const plan = s?.plan ?? null;
      const tier = plan?.metadata?.tier ? String(plan.metadata.tier).trim() : "";
      const typeId = plan?.planTypeId != null ? `TYPE_${String(plan.planTypeId)}` : "";
      const key = tier || typeId;
      if (key) set.add(key);
    });
    return ["ALL", ...Array.from(set)];
  }, [subs]);

  const [activeCat, setActiveCat] = useState("ALL");
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});

  const filteredSubs = useMemo(() => {
    if (activeCat === "ALL") return subs;
    return subs.filter((s) => {
      const plan = s?.plan ?? null;
      const tier = plan?.metadata?.tier ? String(plan.metadata.tier).trim() : "";
      const typeId = plan?.planTypeId != null ? `TYPE_${String(plan.planTypeId)}` : "";
      const key = tier || typeId;
      return key === activeCat;
    });
  }, [subs, activeCat]);

  const overall = useMemo(() => {
    if (subs.length === 0) {
      return {
        label: "No active plans",
        tone: "text-yellow-200 bg-yellow-500/10 border-yellow-500/20",
      };
    }

    const active = subs.filter((s) => !isExpired(s?.endDate));
    const expired = subs.filter((s) => isExpired(s?.endDate));
    const execOn = active.filter((s) => Boolean(s?.executionEnabled));

    return execOn.length > 0
      ? {
          label: `${subs.length} Plan(s) • ${execOn.length} Execution Enabled • ${expired.length} Expired`,
          tone: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
        }
      : expired.length > 0
      ? {
          label: `${subs.length} Plan(s) • ${expired.length} Expired`,
          tone: "text-rose-200 bg-rose-500/10 border-rose-500/20",
        }
      : {
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
            Multiple subscriptions supported (mapped from API <span className="text-slate-200 font-semibold">data[]</span>).
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

          {subError ? (
            <div className="mt-3 text-xs text-rose-300">Failed to load plans.</div>
          ) : null}
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

      {/* Category Filter */}
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
                <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Each card = one item from response <span className="text-slate-200 font-semibold">data[]</span>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a href="/pricing" className={clsx(btn, btnGhost)}>
                Explore Plans <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {subLoading || subFetching ? (
            <div className="mt-5 text-sm text-slate-400">Loading plans…</div>
          ) : subs.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              No active plans found.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredSubs.map((sub, idx) => {
                const plan = sub?.plan ?? null;
                const st = getSubStatus(sub);

                const subId = String(sub?.id ?? idx);

                const planName = plan?.name ?? "—";
                const planUuid = plan?.id ?? sub?.planId ?? "—";
                const planTypeId = plan?.planTypeId ?? "—";
                const tier = plan?.metadata?.tier ?? "—";
                const includes = plan?.metadata?.includes ?? "—";

                const tokenVisible = !!showToken[subId];

                return (
                  <div
                    key={sub?.id ?? `${planUuid}-${idx}`}
                    className={clsx(soft, "p-4")}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-slate-100 truncate">
                          {planName}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Tier: <span className="text-slate-200 font-semibold">{String(tier)}</span> • Includes:{" "}
                          <span className="text-slate-200 font-semibold">{String(includes)}</span> • PlanTypeId:{" "}
                          <span className="text-slate-200 font-semibold">{String(planTypeId)}</span>
                        </div>

                        {plan?.description ? (
                          <div className="text-xs text-slate-400 mt-2">
                            {String(plan.description)}
                          </div>
                        ) : null}
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

                    {/* Dates */}
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <StatPill icon={<CalendarClock size={14} />} label="Start Date" value={fmtDate(sub?.startDate)} />
                      <StatPill icon={<CalendarClock size={14} />} label="End Date" value={fmtDate(sub?.endDate)} />
                    </div>

                    {/* Subscription fields */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <LimitPill label="Subscription ID" value={sub?.id} mono />
                      <LimitPill label="User ID" value={sub?.userId} mono />
                      <LimitPill label="statusV2" value={String(sub?.statusV2 ?? "—")} />
                      <LimitPill label="executionEnabled" value={String(!!sub?.executionEnabled)} />
                      <LimitPill label="liquidateOnlyUntil" value={fmtDate(sub?.liquidateOnlyUntil)} />
                      <LimitPill label="Plan UUID" value={String(planUuid)} mono />
                    </div>

                    {/* Webhook Token */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">webhookToken</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowToken((p) => ({ ...p, [subId]: !p[subId] }))}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                          >
                            {tokenVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            {tokenVisible ? "Hide" : "Show"}
                          </button>

                          {sub?.webhookToken ? (
                            <button
                              type="button"
                              onClick={() => copyText(String(sub.webhookToken))}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                            >
                              <Copy size={14} />
                              Copy
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-200 font-mono break-all">
                        {sub?.webhookToken
                          ? tokenVisible
                            ? String(sub.webhookToken)
                            : shortToken(String(sub.webhookToken), 12)
                          : "—"}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between gap-2 flex-wrap rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Hash size={14} />
                        <span className="text-slate-200 font-semibold">
                          planId: {String(sub?.planId ?? "—")}
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
              <p className="text-xs text-slate-400 mt-1">Used for invoices (PAN + address).</p>
            </div>

            <a href="/profile" className={clsx(btn, btnGhost, "text-xs")}>
              Edit in Profile <ArrowRight size={16} />
            </a>
          </div>

          {billingError ? (
            <div className="mt-5 text-sm text-rose-300">Failed to load billing.</div>
          ) : billingLoading || billingFetching ? (
            <div className="mt-5 text-sm text-slate-400">Loading billing…</div>
          ) : (
            <div className="mt-5 space-y-3">
              <InfoRow icon={<Hash size={16} />} label="PAN Number" value={billing?.panNumber || "—"} />

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
      <div className={clsx("text-sm font-semibold text-slate-100", mono && "font-mono break-all text-right")}>
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
