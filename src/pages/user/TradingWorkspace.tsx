// TradingWorkspaceFixed.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Search,
  RefreshCw,
  XCircle,
  CandlestickChart,
  History,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronLeft as PagePrev,
  ChevronRight as PageNext,
} from "lucide-react";
import Modal from "../../components/Model";
import { toast } from "react-toastify";

import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";
import { useGetMyForexTraderDetailsQuery } from "../../services/forexTraderUserDetails.api";
import type { ForexAccountRow } from "../../services/forexTraderUserDetails.api";

import {
  useGetAllTradesQuery,
  useGetTradesHistoryQuery,
  type TradeDto,
} from "../../services/trades.api";

/** If you already export this elsewhere, remove this enum here and import it */
export enum MarketType {
  FOREX = "FOREX",
  CRYPTO = "CRYPTO",
  INDIAN = "INDIAN",
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** ---------- theme ---------- */
const panel =
  "rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur " +
  "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

const softBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm hover:bg-slate-900/70 transition disabled:opacity-60 disabled:cursor-not-allowed";

const inputBase =
  "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none " +
  "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed";

function Chip({
  label,
  active,
  onClick,
  title,
  disabled,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed",
        active
          ? "bg-emerald-500 text-slate-950 border-emerald-500"
          : "border-slate-800 bg-slate-950/25 text-slate-200 hover:bg-slate-950/40 hover:border-slate-700"
      )}
    >
      {label}
    </button>
  );
}

function SegTab({
  active,
  label,
  icon,
  onClick,
  disabled,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition disabled:opacity-60 disabled:cursor-not-allowed",
        active
          ? "bg-emerald-500 text-slate-950 border-emerald-500"
          : "bg-slate-900/35 text-slate-300 border-slate-800 hover:border-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** ---------- helpers ---------- */
function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asArray<T = any>(maybe: any): T[] {
  if (Array.isArray(maybe)) return maybe as T[];
  if (maybe && typeof maybe === "object") {
    const numericKeys = Object.keys(maybe)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b));
    if (numericKeys.length) return numericKeys.map((k) => maybe[k]).filter(Boolean) as T[];
  }
  return [];
}

/** ---------- view models ---------- */
type SubPlanVM = {
  id: number; // user_subscription.id OR -1
  planId: string; // plan uuid/string
  name: string;
  status:
    | "ACTIVE"
    | "PAUSED"
    | "CANCELED"
    | "EXPIRED"
    | "TRIALING"
    | "PAST_DUE"
    | "LIQUIDATE_ONLY";
};

type AccountVM = {
  id: number;
  planId: string | null;
  label: string;
  broker: string;
  status: string;
  openTrades?: number;
  accountMeta?: Record<string, any> | null;
};

type TabKey = "trades" | "history";

/** ---------- table helpers ---------- */
function TableShell({ children }: { children: React.ReactNode }) {
  return <div className={clsx(panel, "bg-slate-950/20 overflow-hidden")}>{children}</div>;
}
function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={clsx(
        "px-4 py-3 text-xs font-semibold text-slate-300 bg-slate-900/55 border-b border-slate-800/80",
        align === "right" && "text-right"
      )}
    >
      {children}
    </th>
  );
}
function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td
      className={clsx(
        "px-4 py-3 text-sm text-slate-200 border-b border-slate-800/50",
        align === "right" && "text-right"
      )}
    >
      {children}
    </td>
  );
}

/** ---------- Alerts models ---------- */
type AlertRow = {
  id: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  message: string;
  at: string;
};

function AlertsPanel({
  planLabel,
  planId,
  q,
  onChangeQ,
  rows,
  onRefresh,
  loading,
}: {
  planLabel: string;
  planId: string;
  q: string;
  onChangeQ: (v: string) => void;
  rows: AlertRow[];
  onRefresh: () => void;
  loading?: boolean;
}) {
  const s = q.trim().toLowerCase();
  const filtered = !s
    ? rows
    : rows.filter((r) => r.message.toLowerCase().includes(s) || r.id.toLowerCase().includes(s));

  const sevCls = (sev: AlertRow["severity"]) =>
    sev === "INFO"
      ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
      : sev === "WARN"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
      : "border-rose-400/30 bg-rose-500/10 text-rose-200";

  return (
    <div className={clsx(panel, "h-[calc(100vh-260px)] flex flex-col overflow-hidden")}>
      <div className="p-4 border-b border-slate-800/70 bg-slate-900/35">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-200">
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100">Plan Alerts</div>
                <div className="text-[11px] text-slate-400 truncate">
                  Common alerts for <b className="text-slate-200">{planLabel}</b>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              Scope: <span className="text-emerald-300">All accounts</span> in this plan
              {planId ? <span className="ml-2">• planId: {planId}</span> : null}
            </div>
          </div>

          <button className={clsx(softBtn, "px-3 py-2 text-xs")} onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => onChangeQ(e.target.value)}
            placeholder="Search alerts"
            className={clsx(inputBase, "pl-9")}
            disabled={loading}
          />
        </div>
      </div>

      <div className="p-3 overflow-auto min-h-0">
        {!filtered.length ? (
          <div className="p-3 text-sm text-slate-400">No alerts found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/20 p-3 hover:bg-slate-950/30 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={clsx("rounded-full border px-3 py-1 text-[11px] font-semibold", sevCls(a.severity))}>
                    {a.severity}
                  </span>
                  <div className="text-[11px] text-slate-500">{a.at}</div>
                </div>
                <div className="mt-2 text-sm text-slate-100">{a.message}</div>
                <div className="mt-1 text-[11px] text-slate-500">#{a.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------- main ---------- */
export default function TradingWorkspaceFixed() {
  const [tab, setTab] = useState<TabKey>("trades");

  // trades/history search
  const [q, setQ] = useState("");

  // alerts search (separate because plan-wide)
  const [alertsQ, setAlertsQ] = useState("");

  const [plansCollapsed, setPlansCollapsed] = useState(false);
  const [mobilePlansOpen, setMobilePlansOpen] = useState(false);

  const [closeAllOpen, setCloseAllOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const [accountSearch, setAccountSearch] = useState("");
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  // mobile alerts drawer
  const [mobileAlertsOpen, setMobileAlertsOpen] = useState(false);

  const PAGE_SIZE = 25;
  const [tradesStart, setTradesStart] = useState(0);
  const [historyStart, setHistoryStart] = useState(0);

  // =========================
  // ✅ Plans
  // =========================
  const currentSubsQ = useGetMyCurrentSubscriptionQuery(
    { market: MarketType.FOREX } as any,
    { refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (currentSubsQ.isError) toast.error("Failed to load your plans");
  }, [currentSubsQ.isError]);

  const loadingPlans = currentSubsQ.isLoading || currentSubsQ.isFetching;

  const subscriptions: SubPlanVM[] = useMemo(() => {
    const all: SubPlanVM = {
      id: -1,
      planId: "ALL",
      name: "All Plans",
      status: "ACTIVE",
    };

    const root = (currentSubsQ.data as any) ?? null;
    const raw = root?.data ?? root ?? null;

    const list = asArray<any>(raw);
    const rows = list.length ? list : raw && typeof raw === "object" ? [raw] : [];

    const mapped = rows
      .filter(Boolean)
      .map((s) => {
        const statusV2 = String(s?.statusV2 ?? s?.status_v2 ?? s?.status ?? "ACTIVE").toUpperCase();
        const status = ((): SubPlanVM["status"] => {
          switch (statusV2) {
            case "TRIALING":
              return "TRIALING";
            case "ACTIVE":
              return "ACTIVE";
            case "PAST_DUE":
              return "PAST_DUE";
            case "LIQUIDATE_ONLY":
              return "LIQUIDATE_ONLY";
            case "PAUSED":
              return "PAUSED";
            case "CANCELED":
              return "CANCELED";
            case "EXPIRED":
              return "EXPIRED";
            default:
              return "ACTIVE";
          }
        })();

        return {
          id: safeNum(s?.id, -1),
          planId: String(s?.planId ?? s?.plan_id ?? s?.plan?.id ?? s?.plan?.uuid ?? ""),
          name: String(s?.plan?.name ?? s?.planName ?? s?.name ?? "Plan"),
          status,
        };
      })
      .filter((x) => !!x.planId);

    return [all, ...mapped];
  }, [currentSubsQ.data]);

  const [subscriptionId, setSubscriptionId] = useState<number>(-1);

  useEffect(() => {
    if (!subscriptions.length) return;
    setSubscriptionId((prev) => (prev == null ? -1 : prev));
  }, [subscriptions.length]);

  const selectedPlan = useMemo(
    () => subscriptions.find((p) => p.id === subscriptionId) ?? null,
    [subscriptions, subscriptionId]
  );

  const selectedPlanIdForAccounts = selectedPlan?.id === -1 ? "" : selectedPlan?.planId || "";

  // =========================
  // ✅ Accounts (requires planId)
  // =========================
  const accountsQ = useGetMyForexTraderDetailsQuery(
    selectedPlanIdForAccounts ? ({ planId: selectedPlanIdForAccounts } as any) : (undefined as any),
    {
      skip: subscriptionId === -1 || !selectedPlanIdForAccounts,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (accountsQ.isError) toast.error("Failed to load your trading accounts");
  }, [accountsQ.isError]);

  const loadingAccounts = accountsQ.isLoading || accountsQ.isFetching;
  const loading = loadingPlans || loadingAccounts;

  const accounts: AccountVM[] = useMemo(() => {
    if (subscriptionId === -1) return [];
    const root = (accountsQ.data as any) ?? null;
    const raw = root?.accounts ?? root?.data?.accounts ?? root?.data ?? root ?? [];
    const arr = asArray<ForexAccountRow>(raw);

    return arr.map((a: any) => {
      const id = safeNum(a?.id);
      const meta = (a?.accountMeta ?? a?.account_meta ?? null) as any;

      const label =
        a?.accountLabel ??
        a?.account_label ??
        a?.label ??
        (meta?.ctraderAccountId ? `cTrader • ${meta.ctraderAccountId}` : null) ??
        (meta?.mt5LoginId ? `MT5 • ${meta.mt5LoginId}` : null) ??
        `Account • ${id}`;

      return {
        id,
        planId: selectedPlanIdForAccounts || null,
        label: String(label),
        broker: String(a?.broker ?? a?.forexType ?? "—"),
        status: String(a?.status ?? "pending"),
        accountMeta: meta,
        openTrades: safeNum(a?.openTrades ?? a?.open_trades ?? 0),
      };
    });
  }, [accountsQ.data, subscriptionId, selectedPlanIdForAccounts]);

  const planAccounts = useMemo(() => accounts, [accounts]);

  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (!planAccounts.length) {
      setAccountId(null);
      return;
    }
    setAccountId((prev) => (prev == null ? planAccounts[0].id : prev));
  }, [subscriptionId, planAccounts.length]);

  useEffect(() => {
    if (accountId == null) return;
    if (!planAccounts.some((a) => a.id === accountId)) {
      setAccountId(planAccounts[0]?.id ?? null);
    }
  }, [planAccounts, accountId]);

  const selectedAccount = useMemo(
    () => (accountId ? planAccounts.find((a) => a.id === accountId) ?? null : null),
    [planAccounts, accountId]
  );

  // =========================
  // ✅ Trades APIs (account scoped)
  // =========================
  const accountIdStr = selectedAccount ? String(selectedAccount.id) : "";

  const tradesQ = useGetAllTradesQuery(
    {
      accountId: accountIdStr,
      start: tradesStart,
      count: PAGE_SIZE,
      searchParams: q?.trim() ? q.trim() : undefined,
    } as any,
    {
      skip: !accountIdStr,
      refetchOnMountOrArgChange: true,
    }
  );

  const historyQ = useGetTradesHistoryQuery(
    {
      accountId: accountIdStr,
      start: historyStart,
      count: PAGE_SIZE,
      searchParams: q?.trim() ? q.trim() : undefined,
    } as any,
    {
      skip: !accountIdStr,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (tradesQ.isError) toast.error("Failed to load trades");
  }, [tradesQ.isError]);

  useEffect(() => {
    if (historyQ.isError) toast.error("Failed to load trade history");
  }, [historyQ.isError]);

  useEffect(() => {
    setTradesStart(0);
    setHistoryStart(0);
  }, [accountId]);

  const tradesRows: TradeDto[] = useMemo(() => {
    const root = (tradesQ.data as any) ?? null;
    const raw = root?.data ?? root?.trades ?? root ?? [];
    return asArray<TradeDto>(raw);
  }, [tradesQ.data]);

  const historyRows: TradeDto[] = useMemo(() => {
    const root = (historyQ.data as any) ?? null;
    const raw = root?.data ?? root?.history ?? root ?? [];
    return asArray<TradeDto>(raw);
  }, [historyQ.data]);

  // =========================
  // ✅ Alerts (PLAN WIDE) - mock for now
  // =========================
  const alerts: AlertRow[] = useMemo(() => {
    const pid = selectedPlanIdForAccounts || "—";
    return [
      {
        id: `al-${pid}-1`,
        severity: "WARN",
        message: `Plan-wide alerts are common for ALL accounts in plan (${pid}). (mock)`,
        at: "—",
      },
      {
        id: `al-${pid}-2`,
        severity: "INFO",
        message: "Webhook / broker connectivity / execution alerts will appear here. (mock)",
        at: "—",
      },
    ];
  }, [selectedPlanIdForAccounts]);

  // =========================
  // Filtering + quick accounts
  // =========================
  const filteredAccounts = useMemo(() => {
    const s = accountSearch.trim().toLowerCase();
    if (!s) return planAccounts;
    return planAccounts.filter((a) => {
      const hay = `${a.label} ${a.broker} ${a.status} ${a.id}`.toLowerCase();
      return hay.includes(s);
    });
  }, [planAccounts, accountSearch]);

  const quickAccounts = useMemo(() => {
    if (!planAccounts.length) return [];
    const selected = selectedAccount ? [selectedAccount] : [];
    const rest = planAccounts.filter((a) => a.id !== selectedAccount?.id);
    rest.sort(
      (a, b) =>
        safeNum(b.openTrades ?? 0) - safeNum(a.openTrades ?? 0) ||
        a.label.localeCompare(b.label)
    );
    return [...selected, ...rest].slice(0, 6);
  }, [planAccounts, selectedAccount]);

  const canCloseAll = (selectedAccount?.openTrades ?? 0) > 0;

  const selectPlan = (id: number) => {
    setSubscriptionId(id);
    setMobilePlansOpen(false);
    setAccountPickerOpen(false);
    setTradesStart(0);
    setHistoryStart(0);
    setAccountId(null);
    setQ("");
    setAlertsQ("");
  };

  const selectAccount = (id: number) => {
    setAccountId(id);
    setTab("trades");
    setQ("");
    setTradesStart(0);
    setHistoryStart(0);
  };

  const onRefresh = () => {
    currentSubsQ.refetch();
    if (subscriptionId !== -1 && selectedPlanIdForAccounts) accountsQ.refetch();
    if (accountIdStr) {
      tradesQ.refetch();
      historyQ.refetch();
    }
    toast.info("Refreshing workspace…");
  };

  const onRefreshAlerts = () => {
    // when you wire alerts API, call alertsQ.refetch() here
    toast.info("Refreshing plan alerts…");
  };

  const planLabel =
    subscriptionId === -1 ? "Select a plan" : selectedPlan?.name ?? "Plan";
  const planIdLabel = subscriptionId === -1 ? "" : selectedPlanIdForAccounts;

  return (
    <div className="relative">
      {/* top header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_55%)]" />
        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Trading <span className="text-emerald-400">Workspace</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Plan (left) → Accounts (top) → Trades/History (center) • Alerts (right, plan-wide)
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPlan ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    {selectedPlan.name} • {selectedPlan.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-200">
                    {loadingPlans ? "Loading plans…" : "No plan found"}
                  </span>
                )}

                {selectedAccount ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-200">
                    {selectedAccount.label} • {selectedAccount.broker} • {selectedAccount.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-400">
                    {subscriptionId === -1
                      ? "Select a plan to load accounts"
                      : loadingAccounts
                      ? "Loading accounts…"
                      : "No account selected"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className={clsx(softBtn, "md:hidden")} onClick={() => setMobilePlansOpen(true)}>
                <Menu size={16} />
                Plans
              </button>

              {/* Mobile alerts button */}
              <button className={clsx(softBtn, "md:hidden")} onClick={() => setMobileAlertsOpen(true)}>
                <Bell size={16} />
                Alerts
              </button>

              <button className={softBtn} onClick={onRefresh} disabled={loading}>
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                disabled={!canCloseAll}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition disabled:opacity-60 disabled:cursor-not-allowed",
                  !canCloseAll
                    ? "bg-slate-900/30 text-slate-500 border-slate-800"
                    : "bg-rose-500 text-slate-950 border-rose-500 hover:bg-rose-400"
                )}
                onClick={() => setCloseAllOpen(true)}
              >
                <XCircle size={16} />
                Close all
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* layout */}
      <div className="mt-5 grid gap-5 grid-cols-12 min-w-0">
        {/* plans sidebar */}
        <aside
          className={clsx(
            panel,
            "hidden md:flex flex-col overflow-hidden col-span-12 md:col-span-3 xl:col-span-2",
            "h-[calc(100vh-260px)]",
            plansCollapsed ? "md:col-span-1" : ""
          )}
        >
          <div className="p-3 border-b border-slate-800/70 flex items-center justify-between">
            <div className={clsx("min-w-0", plansCollapsed && "hidden")}>
              <div className="text-sm font-semibold text-slate-100">Plans</div>
              <div className="text-xs text-slate-400">Select plan</div>
            </div>

            <button
              className="rounded-lg p-2 hover:bg-white/5 transition"
              onClick={() => setPlansCollapsed((s) => !s)}
              aria-label="Toggle plans sidebar"
              title={plansCollapsed ? "Expand" : "Collapse"}
            >
              {plansCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <div className="p-2 overflow-auto min-h-0">
            {!subscriptions.length ? (
              <div className="p-3 text-sm text-slate-400">{loadingPlans ? "Loading plans…" : "No plans found"}</div>
            ) : (
              <div className="space-y-2">
                {subscriptions.map((p) => {
                  const active = p.id === subscriptionId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectPlan(p.id)}
                      title={p.name}
                      className={clsx(
                        "w-full rounded-xl border transition text-left flex items-center gap-3",
                        plansCollapsed ? "p-2 justify-center" : "p-3",
                        active
                          ? "border-emerald-400/35 bg-emerald-500/10"
                          : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/35 hover:border-slate-700"
                      )}
                    >
                      <div
                        className={clsx(
                          "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
                          active
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-800 bg-slate-900/40 text-slate-300"
                        )}
                      >
                        <Layers size={18} />
                      </div>

                      {!plansCollapsed ? (
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100 truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {p.id === -1 ? "All plans (accounts needs planId)" : p.status}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* center (account-scoped) */}
        <main
          className={clsx(
            panel,
            "col-span-12 md:col-span-6 xl:col-span-7 overflow-hidden h-[calc(100vh-260px)] flex flex-col"
          )}
        >
          {/* accounts header */}
          <div className="border-b border-slate-800/70 p-4 bg-slate-900/35">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100">Accounts</div>
                <div className="text-xs text-slate-400">
                  {subscriptionId === -1 ? "Select a plan to load accounts" : "Account-scoped workspace"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-400">
                  Total: <b className="text-slate-200">{planAccounts.length}</b>
                </div>

                <button
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs hover:bg-slate-900/70 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setAccountPickerOpen(true)}
                  disabled={loading || subscriptionId === -1}
                >
                  <Menu size={14} />
                  Browse
                </button>
              </div>
            </div>

            {/* quick chips */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {quickAccounts.map((a) => (
                <Chip
                  key={a.id}
                  label={a.label}
                  active={a.id === accountId}
                  onClick={() => {
                    selectAccount(a.id);
                    setAccountSearch("");
                  }}
                  title={`${a.broker} • ${a.status}`}
                  disabled={loading || subscriptionId === -1}
                />
              ))}

              <button
                type="button"
                onClick={() => setAccountPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-950/40 hover:border-slate-700 transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading || subscriptionId === -1}
              >
                <Search size={14} className="text-slate-300" />
                Find account
              </button>
            </div>

            {/* search + tabs */}
            <div className="mt-4 grid gap-3 xl:grid-cols-[1fr,auto,auto] items-center">
              <div className="relative min-w-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search symbol / id"
                  className={clsx(inputBase, "pl-9")}
                  disabled={loading || !accountId || subscriptionId === -1}
                />
              </div>

              <button
                className={clsx(softBtn, "justify-center")}
                onClick={() => toast.info("Filters (todo)")}
                disabled={loading || !accountId || subscriptionId === -1}
              >
                <Filter size={16} />
                Filters
              </button>

              <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
                <SegTab
                  active={tab === "trades"}
                  onClick={() => setTab("trades")}
                  icon={<CandlestickChart size={16} />}
                  label="Trades"
                  disabled={loading || subscriptionId === -1}
                />
                <SegTab
                  active={tab === "history"}
                  onClick={() => setTab("history")}
                  icon={<History size={16} />}
                  label="History"
                  disabled={loading || subscriptionId === -1}
                />
              </div>
            </div>

            {/* paging */}
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="min-w-0 truncate">
                {subscriptionId === -1
                  ? "Select a plan"
                  : !accountId
                  ? "Select an account"
                  : tab === "trades"
                  ? tradesQ.isFetching
                    ? "Loading trades…"
                    : `Trades start: ${tradesStart}`
                  : historyQ.isFetching
                  ? "Loading history…"
                  : `History start: ${historyStart}`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={clsx(softBtn, "px-3 py-1.5 text-xs")}
                  disabled={!accountId || (tab === "trades" ? tradesStart <= 0 : historyStart <= 0)}
                  onClick={() => {
                    if (!accountId) return;
                    if (tab === "trades") setTradesStart((s) => Math.max(0, s - PAGE_SIZE));
                    else setHistoryStart((s) => Math.max(0, s - PAGE_SIZE));
                  }}
                >
                  <PagePrev size={14} />
                  Prev
                </button>

                <button
                  className={clsx(softBtn, "px-3 py-1.5 text-xs")}
                  disabled={!accountId}
                  onClick={() => {
                    if (!accountId) return;
                    if (tab === "trades") setTradesStart((s) => s + PAGE_SIZE);
                    else setHistoryStart((s) => s + PAGE_SIZE);
                  }}
                >
                  Next
                  <PageNext size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* content */}
          <div className="p-4 md:p-5 flex-1 min-h-0 overflow-auto">
            <div className="mb-4">
              <div className="text-base font-semibold text-slate-100 truncate">
                {selectedAccount?.label ?? (subscriptionId === -1 ? "Select plan" : "Select account")}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {subscriptionId === -1
                  ? "Accounts API needs planId"
                  : selectedAccount
                  ? `${selectedAccount.broker} • ${selectedAccount.status}`
                  : loadingAccounts
                  ? "Loading…"
                  : "—"}
              </div>
            </div>

            {subscriptionId === -1 ? (
              <div className="text-sm text-slate-400">
                Accounts API needs <b className="text-slate-200">planId</b>. Select a plan from the left.
              </div>
            ) : !planAccounts.length && !loadingAccounts ? (
              <div className="text-sm text-slate-400">No accounts found for this plan.</div>
            ) : !accountId ? (
              <div className="text-sm text-slate-400">Select an account to view trades.</div>
            ) : tab === "trades" ? (
              <TradesTable rows={tradesRows} loading={tradesQ.isFetching} />
            ) : (
              <HistoryTable rows={historyRows} loading={historyQ.isFetching} />
            )}
          </div>
        </main>

        {/* right (PLAN-WIDE ALERTS) */}
        <div className="hidden md:block col-span-12 md:col-span-3 xl:col-span-3">
          <AlertsPanel
            planLabel={planLabel}
            planId={planIdLabel}
            q={alertsQ}
            onChangeQ={setAlertsQ}
            rows={subscriptionId === -1 ? [] : alerts}
            onRefresh={onRefreshAlerts}
            loading={loadingPlans}
          />
        </div>
      </div>

      {/* account picker modal */}
      <Modal open={accountPickerOpen} onClose={() => setAccountPickerOpen(false)}>
        <div className="text-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Select account</h3>
              <p className="text-xs text-slate-400 mt-1">
                Showing <b className="text-slate-200">{filteredAccounts.length}</b> of{" "}
                <b className="text-slate-200">{planAccounts.length}</b> accounts
              </p>
            </div>

            <button
              onClick={() => setAccountPickerOpen(false)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs hover:bg-slate-900/80 transition"
            >
              Close
            </button>
          </div>

          <div className="mt-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="Search by label / broker / status"
              className={clsx(inputBase, "pl-9")}
              autoFocus
            />
          </div>

          <div className="mt-4 max-h-[55vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-950/25">
            {filteredAccounts.length ? (
              <div className="divide-y divide-slate-800/70">
                {filteredAccounts.map((a) => {
                  const active = a.id === accountId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        selectAccount(a.id);
                        setAccountPickerOpen(false);
                        setAccountSearch("");
                      }}
                      className={clsx(
                        "w-full text-left px-4 py-3 hover:bg-slate-900/40 transition flex items-center gap-3",
                        active && "bg-emerald-500/10"
                      )}
                    >
                      <div
                        className={clsx(
                          "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
                          active
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-800 bg-slate-900/40 text-slate-300"
                        )}
                      >
                        <Layers size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-100 truncate">{a.label}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {a.broker} • {a.status}
                        </div>
                      </div>

                      {active ? (
                        <span className="text-[11px] font-semibold text-emerald-200 border border-emerald-400/30 bg-emerald-500/10 rounded-full px-3 py-1">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 text-sm text-slate-400">No accounts match your search.</div>
            )}
          </div>
        </div>
      </Modal>

      {/* mobile plans drawer */}
      {mobilePlansOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobilePlansOpen(false)} />
          <div className={clsx("absolute inset-y-0 left-0 w-80 max-w-[92vw] p-3", panel, "bg-[#070b16]")}>
            <div className="flex items-center justify-between px-2 py-2 border-b border-white/5">
              <p className="text-sm font-semibold text-slate-100">Plans</p>
              <button className="rounded-lg p-2 hover:bg-white/5" onClick={() => setMobilePlansOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 space-y-2 overflow-auto h-[calc(100vh-90px)] pr-1">
              {subscriptions.length ? (
                subscriptions.map((p) => {
                  const active = p.id === subscriptionId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectPlan(p.id)}
                      className={clsx(
                        "w-full rounded-2xl border px-3 py-3 flex items-center gap-3 transition text-left",
                        active
                          ? "border-emerald-400/35 bg-emerald-500/10"
                          : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/35 hover:border-slate-700"
                      )}
                    >
                      <div
                        className={clsx(
                          "h-10 w-10 rounded-xl border flex items-center justify-center",
                          active
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-800 bg-slate-900/40 text-slate-300"
                        )}
                      >
                        <Layers size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-100 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {p.id === -1 ? "All plans (accounts needs planId)" : p.status}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-sm text-slate-400">{loadingPlans ? "Loading plans…" : "No plans found"}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* mobile alerts drawer */}
      {mobileAlertsOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileAlertsOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-96 max-w-[92vw] p-3">
            <div className={clsx(panel, "bg-[#070b16] h-full overflow-hidden flex flex-col")}>
              <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <p className="text-sm font-semibold text-slate-100">Plan Alerts</p>
                </div>
                <button className="rounded-lg p-2 hover:bg-white/5" onClick={() => setMobileAlertsOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 min-h-0 flex-1">
                <AlertsPanel
                  planLabel={planLabel}
                  planId={planIdLabel}
                  q={alertsQ}
                  onChangeQ={setAlertsQ}
                  rows={subscriptionId === -1 ? [] : alerts}
                  onRefresh={onRefreshAlerts}
                  loading={loadingPlans}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* close all modal */}
      <Modal open={closeAllOpen} onClose={() => setCloseAllOpen(false)}>
        <div className="text-slate-100">
          <h3 className="text-lg font-semibold mb-1">Close all trades</h3>
          <p className="text-xs text-slate-400 mb-5">
            Type <b className="text-emerald-300">CLOSE</b> to confirm for <b>{selectedAccount?.label ?? "selected account"}</b>.
          </p>

          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={clsx(inputBase, "mt-1")}
            placeholder="Type CLOSE"
            autoFocus
          />

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setCloseAllOpen(false)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80 transition"
            >
              Cancel
            </button>

            <button
              disabled={confirm.trim().toUpperCase() !== "CLOSE" || !canCloseAll}
              onClick={() => {
                toast.success("Mock: close all requested (wire close endpoint)");
                setCloseAllOpen(false);
                setConfirm("");
              }}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-slate-950 font-semibold hover:bg-rose-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Close all
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** ---------- views ---------- */
function TradesTable({ rows, loading }: { rows: TradeDto[]; loading?: boolean }) {
  if (loading) return <div className="text-sm text-slate-400">Loading trades…</div>;
  if (!rows.length) return <div className="text-sm text-slate-400">No trades found.</div>;

  return (
    <TableShell>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>Qty</Th>
              <Th>Price</Th>
              <Th>Time</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t: any, idx) => {
              const id = String(t.id ?? idx);
              const symbol = String(t.symbol ?? "—");
              const side = String(t.side ?? "—").toUpperCase();
              const qty = t.quantity ?? t.qty ?? "—";
              const price = t.price ?? t.entry ?? "—";
              const time = t.createdAt ?? t.openedAt ?? t.time ?? "—";
              const status = String(t.status ?? "OPEN").toUpperCase();

              return (
                <tr key={id} className="hover:bg-slate-950/25">
                  <Td>
                    <div className="font-semibold text-slate-100">{symbol}</div>
                    <div className="text-[11px] text-slate-500">#{id}</div>
                  </Td>
                  <Td>
                    <span
                      className={clsx(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold",
                        side === "BUY"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                      )}
                    >
                      {side}
                    </span>
                  </Td>
                  <Td>{String(qty)}</Td>
                  <Td>{String(price)}</Td>
                  <Td>{String(time)}</Td>
                  <Td>
                    <span className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-[11px] font-semibold text-slate-200">
                      {status}
                    </span>
                  </Td>
                  <Td align="right">
                    <button
                      onClick={() => toast.info(`Close trade not wired yet (tradeId=${id})`)}
                      className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs hover:bg-slate-900/60 transition"
                    >
                      Close
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

function HistoryTable({ rows, loading }: { rows: TradeDto[]; loading?: boolean }) {
  if (loading) return <div className="text-sm text-slate-400">Loading history…</div>;
  if (!rows.length) return <div className="text-sm text-slate-400">No history found.</div>;

  return (
    <TableShell>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>Qty</Th>
              <Th>Price</Th>
              <Th>Time</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h: any, idx) => {
              const id = String(h.id ?? idx);
              const symbol = String(h.symbol ?? "—");
              const side = String(h.side ?? "—").toUpperCase();
              const qty = h.quantity ?? h.qty ?? "—";
              const price = h.price ?? "—";
              const time = h.closedAt ?? h.updatedAt ?? h.time ?? "—";

              return (
                <tr key={id} className="hover:bg-slate-950/25">
                  <Td>
                    <div className="font-semibold text-slate-100">{symbol}</div>
                    <div className="text-[11px] text-slate-500">#{id}</div>
                  </Td>
                  <Td>{side}</Td>
                  <Td>{String(qty)}</Td>
                  <Td>{String(price)}</Td>
                  <Td>{String(time)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}
