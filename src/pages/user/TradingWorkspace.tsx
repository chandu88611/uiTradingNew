// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Layers,
//   Search,
//   RefreshCw,
//   XCircle,
//   CandlestickChart,
//   History,
//   Bell,
//   Menu,
//   X,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   ChevronLeft as PagePrev,
//   ChevronRight as PageNext,
// } from "lucide-react";
// import Modal from "../../components/Model";
// import { toast } from "react-toastify";

// import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";
// import { useGetMyForexTraderDetailsQuery } from "../../services/forexTraderUserDetails.api";
// import type { ForexAccountRow } from "../../services/forexTraderUserDetails.api";

// import {
//   useGetAllTradesQuery,
//   useGetTradesHistoryQuery,
//   useCloseTradesMutation,
// } from "../../services/trades.api";

// /** If you already export this elsewhere, remove this enum here and import it */
// export enum MarketType {
//   FOREX = "FOREX",
//   CRYPTO = "CRYPTO",
//   INDIAN = "INDIAN",
// }

// function clsx(...parts: Array<string | false | null | undefined>) {
//   return parts.filter(Boolean).join(" ");
// }

// /** ---------- theme ---------- */
// const panel =
//   "rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur " +
//   "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

// const softBtn =
//   "inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm hover:bg-slate-900/70 transition disabled:opacity-60 disabled:cursor-not-allowed";

// const inputBase =
//   "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none " +
//   "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed";

// function Chip({
//   label,
//   active,
//   onClick,
//   title,
//   disabled,
// }: {
//   label: string;
//   active?: boolean;
//   onClick?: () => void;
//   title?: string;
//   disabled?: boolean;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       title={title}
//       disabled={disabled}
//       className={clsx(
//         "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed",
//         active
//           ? "bg-emerald-500 text-slate-950 border-emerald-500"
//           : "border-slate-800 bg-slate-950/25 text-slate-200 hover:bg-slate-950/40 hover:border-slate-700"
//       )}
//     >
//       {label}
//     </button>
//   );
// }

// function SegTab({
//   active,
//   label,
//   icon,
//   onClick,
//   disabled,
// }: {
//   active: boolean;
//   label: string;
//   icon: React.ReactNode;
//   onClick: () => void;
//   disabled?: boolean;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       disabled={disabled}
//       className={clsx(
//         "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition disabled:opacity-60 disabled:cursor-not-allowed",
//         active
//           ? "bg-emerald-500 text-slate-950 border-emerald-500"
//           : "bg-slate-900/35 text-slate-300 border-slate-800 hover:border-slate-700"
//       )}
//     >
//       {icon}
//       {label}
//     </button>
//   );
// }

// /** ---------- helpers ---------- */
// function safeNum(v: any, fallback = 0) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : fallback;
// }

// function asArray<T = any>(maybe: any): T[] {
//   if (Array.isArray(maybe)) return maybe as T[];
//   if (maybe && typeof maybe === "object") {
//     const numericKeys = Object.keys(maybe)
//       .filter((k) => /^\d+$/.test(k))
//       .sort((a, b) => Number(a) - Number(b));
//     if (numericKeys.length)
//       return numericKeys.map((k) => maybe[k]).filter(Boolean) as T[];
//   }
//   return [];
// }

// function fmtTime(iso: any) {
//   const s = String(iso ?? "").trim();
//   if (!s) return "—";
//   const d = new Date(s);
//   if (Number.isNaN(d.getTime())) return s;
//   return d.toLocaleString();
// }

// function pickTradeStatus(row: any): string {
//   const v =
//     row?.status?.status ??
//     row?.statusV2 ??
//     row?.status_v2 ??
//     row?.status ??
//     "pending";
//   return String(v).toUpperCase();
// }

// function statusPillClass(status: string) {
//   const s = status.toUpperCase();
//   if (["EXECUTED", "FILLED", "DONE", "SUCCESS"].includes(s))
//     return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
//   if (["PENDING", "NEW", "QUEUED"].includes(s))
//     return "border-amber-400/30 bg-amber-500/10 text-amber-200";
//   if (["REJECTED", "FAILED", "CANCELED", "CANCELLED", "ERROR"].includes(s))
//     return "border-rose-400/30 bg-rose-500/10 text-rose-200";
//   return "border-slate-700 bg-slate-900/40 text-slate-200";
// }

// /** ---------- view models ---------- */
// type SubPlanVM = {
//   id: number;
//   planId: string;
//   name: string;
//   status:
//     | "ACTIVE"
//     | "PAUSED"
//     | "CANCELED"
//     | "EXPIRED"
//     | "TRIALING"
//     | "PAST_DUE"
//     | "LIQUIDATE_ONLY";
// };

// type AccountVM = {
//   id: number;
//   planId: string | null;
//   label: string;
//   broker: string;
//   status: string;
//   openTrades?: number;
//   accountMeta?: Record<string, any> | null;
// };

// type TabKey = "trades" | "history";

// /** ---------- table helpers ---------- */
// function TableShell({ children }: { children: React.ReactNode }) {
//   return (
//     <div className={clsx(panel, "bg-slate-950/20 overflow-hidden")}>
//       {children}
//     </div>
//   );
// }
// function Th({
//   children,
//   align = "left",
// }: {
//   children: React.ReactNode;
//   align?: "left" | "right";
// }) {
//   return (
//     <th
//       className={clsx(
//         "px-4 py-3 text-xs font-semibold text-slate-300 bg-slate-900/55 border-b border-slate-800/80",
//         align === "right" && "text-right"
//       )}
//     >
//       {children}
//     </th>
//   );
// }
// function Td({
//   children,
//   align = "left",
// }: {
//   children: React.ReactNode;
//   align?: "left" | "right";
// }) {
//   return (
//     <td
//       className={clsx(
//         "px-4 py-3 text-sm text-slate-200 border-b border-slate-800/50",
//         align === "right" && "text-right"
//       )}
//     >
//       {children}
//     </td>
//   );
// }

// /** ---------- Alerts models ---------- */
// type AlertRow = {
//   id: string;
//   severity: "INFO" | "WARN" | "CRITICAL";
//   message: string;
//   at: string;
// };

// function AlertsPanel({
//   planLabel,
//   planId,
//   q,
//   onChangeQ,
//   rows,
//   onRefresh,
//   loading,
// }: {
//   planLabel: string;
//   planId: string;
//   q: string;
//   onChangeQ: (v: string) => void;
//   rows: AlertRow[];
//   onRefresh: () => void;
//   loading?: boolean;
// }) {
//   const s = q.trim().toLowerCase();
//   const filtered = !s
//     ? rows
//     : rows.filter(
//         (r) =>
//           r.message.toLowerCase().includes(s) || r.id.toLowerCase().includes(s)
//       );

//   const sevCls = (sev: AlertRow["severity"]) =>
//     sev === "INFO"
//       ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
//       : sev === "WARN"
//       ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
//       : "border-rose-400/30 bg-rose-500/10 text-rose-200";

//   return (
//     <div className={clsx(panel, "h-[calc(100vh-260px)] flex flex-col overflow-hidden")}>
//       <div className="p-4 border-b border-slate-800/70 bg-slate-900/35">
//         <div className="flex items-start justify-between gap-2">
//           <div className="min-w-0">
//             <div className="flex items-center gap-2">
//               <div className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-200">
//                 <Bell size={16} />
//               </div>
//               <div className="min-w-0">
//                 <div className="text-sm font-semibold text-slate-100">
//                   Plan Alerts
//                 </div>
//                 <div className="text-[11px] text-slate-400 truncate">
//                   Common alerts for{" "}
//                   <b className="text-slate-200">{planLabel}</b>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-2 text-[11px] text-slate-500">
//               Scope:{" "}
//               <span className="text-emerald-300">All accounts</span> in this plan
//               {planId ? <span className="ml-2">• planId: {planId}</span> : null}
//             </div>
//           </div>

//           <button
//             className={clsx(softBtn, "px-3 py-2 text-xs")}
//             onClick={onRefresh}
//             disabled={loading}
//           >
//             <RefreshCw size={14} />
//             Refresh
//           </button>
//         </div>

//         <div className="mt-3 relative">
//           <Search
//             size={16}
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
//           />
//           <input
//             value={q}
//             onChange={(e) => onChangeQ(e.target.value)}
//             placeholder="Search alerts"
//             className={clsx(inputBase, "pl-9")}
//             disabled={loading}
//           />
//         </div>
//       </div>

//       <div className="p-3 overflow-auto min-h-0">
//         {!filtered.length ? (
//           <div className="p-3 text-sm text-slate-400">No alerts found.</div>
//         ) : (
//           <div className="space-y-2">
//             {filtered.map((a) => (
//               <div
//                 key={a.id}
//                 className="rounded-2xl border border-slate-800 bg-slate-950/20 p-3 hover:bg-slate-950/30 transition"
//               >
//                 <div className="flex items-start justify-between gap-2">
//                   <span
//                     className={clsx(
//                       "rounded-full border px-3 py-1 text-[11px] font-semibold",
//                       sevCls(a.severity)
//                     )}
//                   >
//                     {a.severity}
//                   </span>
//                   <div className="text-[11px] text-slate-500">{a.at}</div>
//                 </div>
//                 <div className="mt-2 text-sm text-slate-100">{a.message}</div>
//                 <div className="mt-1 text-[11px] text-slate-500">#{a.id}</div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /** ---------- main ---------- */
// export default function TradingWorkspaceFixed() {
//   const [tab, setTab] = useState<TabKey>("trades");

//   // trades/history search
//   const [q, setQ] = useState("");

//   // alerts search
//   const [alertsQ, setAlertsQ] = useState("");

//   const [plansCollapsed, setPlansCollapsed] = useState(false);
//   const [mobilePlansOpen, setMobilePlansOpen] = useState(false);

//   const [closeAllOpen, setCloseAllOpen] = useState(false);
//   const [confirm, setConfirm] = useState("");

//   const [accountSearch, setAccountSearch] = useState("");
//   const [accountPickerOpen, setAccountPickerOpen] = useState(false);

//   // mobile alerts drawer
//   const [mobileAlertsOpen, setMobileAlertsOpen] = useState(false);

//   const PAGE_SIZE = 25;
//   const [tradesStart, setTradesStart] = useState(0);
//   const [historyStart, setHistoryStart] = useState(0);

//   // ✅ close states (better UX)
//   const [closingId, setClosingId] = useState<number | null>(null);

//   // =========================
//   // ✅ Plans
//   // =========================
//   const currentSubsQ = useGetMyCurrentSubscriptionQuery(
//     { market: MarketType.FOREX } as any,
//     { refetchOnMountOrArgChange: true }
//   );

//   useEffect(() => {
//     if (currentSubsQ.isError) toast.error("Failed to load your plans");
//   }, [currentSubsQ.isError]);

//   const loadingPlans = currentSubsQ.isLoading || currentSubsQ.isFetching;

//   const subscriptions: SubPlanVM[] = useMemo(() => {
//     const root = (currentSubsQ.data as any) ?? null;
//     const list1 = root?.subscription?.data;
//     const list2 = root?.data;
//     const list3 = root;

//     const list =
//       Array.isArray(list1)
//         ? list1
//         : Array.isArray(list2)
//         ? list2
//         : Array.isArray(list2?.data)
//         ? list2.data
//         : Array.isArray(list3)
//         ? list3
//         : Array.isArray(list3?.data)
//         ? list3.data
//         : [];

//     return list
//       .filter(Boolean)
//       .map((s: any) => {
//         const statusV2 = String(
//           s?.statusV2 ?? s?.status_v2 ?? s?.status ?? "ACTIVE"
//         ).toUpperCase();

//         const status = ((): SubPlanVM["status"] => {
//           switch (statusV2) {
//             case "TRIALING":
//               return "TRIALING";
//             case "ACTIVE":
//               return "ACTIVE";
//             case "PAST_DUE":
//               return "PAST_DUE";
//             case "LIQUIDATE_ONLY":
//               return "LIQUIDATE_ONLY";
//             case "PAUSED":
//               return "PAUSED";
//             case "CANCELED":
//             case "CANCELLED":
//               return "CANCELED";
//             case "EXPIRED":
//               return "EXPIRED";
//             default:
//               return "ACTIVE";
//           }
//         })();

//         return {
//           id: safeNum(s?.id, -1),
//           planId: String(
//             s?.planId ?? s?.plan_id ?? s?.plan?.id ?? s?.plan?.uuid ?? ""
//           ),
//           name: String(s?.plan?.name ?? s?.planName ?? s?.name ?? "Plan"),
//           status,
//         };
//       })
//       .filter((x: any) => !!x.planId && x.id !== -1);
//   }, [currentSubsQ.data]);

//   const [subscriptionId, setSubscriptionId] = useState<number | null>(null);

//   useEffect(() => {
//     if (!subscriptions.length) {
//       setSubscriptionId(null);
//       return;
//     }
//     setSubscriptionId((prev) => (prev == null ? subscriptions[0].id : prev));
//   }, [subscriptions.length]);

//   const selectedPlan = useMemo(
//     () =>
//       subscriptionId != null
//         ? subscriptions.find((p) => p.id === subscriptionId) ?? null
//         : null,
//     [subscriptions, subscriptionId]
//   );

//   const selectedPlanIdForAccounts = selectedPlan?.planId || "";

//   // =========================
//   // ✅ Accounts
//   // =========================
//   const accountsQ = useGetMyForexTraderDetailsQuery(
//     selectedPlanIdForAccounts
//       ? ({ planId: selectedPlanIdForAccounts } as any)
//       : (undefined as any),
//     { skip: !selectedPlanIdForAccounts, refetchOnMountOrArgChange: true }
//   );

//   useEffect(() => {
//     if (accountsQ.isError) toast.error("Failed to load your trading accounts");
//   }, [accountsQ.isError]);

//   const loadingAccounts = accountsQ.isLoading || accountsQ.isFetching;
//   const loading = loadingPlans || loadingAccounts;

//   const accounts: AccountVM[] = useMemo(() => {
//     if (!selectedPlanIdForAccounts) return [];
//     const root = (accountsQ.data as any) ?? null;
//     const raw = root?.accounts ?? root?.data?.accounts ?? root?.data ?? root ?? [];
//     const arr = asArray<ForexAccountRow>(raw);

//     return arr.map((a: any) => {
//       const id = safeNum(a?.id);
//       const meta = (a?.accountMeta ?? a?.account_meta ?? null) as any;

//       const label =
//         a?.accountLabel ??
//         a?.account_label ??
//         a?.label ??
//         (meta?.ctraderAccountId ? `cTrader • ${meta.ctraderAccountId}` : null) ??
//         (meta?.mt5LoginId ? `MT5 • ${meta.mt5LoginId}` : null) ??
//         `Account • ${id}`;

//       return {
//         id,
//         planId: selectedPlanIdForAccounts || null,
//         label: String(label),
//         broker: String(a?.broker ?? a?.forexType ?? "—"),
//         status: String(a?.status ?? "pending"),
//         accountMeta: meta,
//         openTrades: safeNum(a?.openTrades ?? a?.open_trades ?? 0),
//       };
//     });
//   }, [accountsQ.data, selectedPlanIdForAccounts]);

//   const planAccounts = useMemo(() => accounts, [accounts]);

//   const [accountId, setAccountId] = useState<number | null>(null);

//   useEffect(() => {
//     if (!planAccounts.length) {
//       setAccountId(null);
//       return;
//     }
//     setAccountId((prev) => (prev == null ? planAccounts[0].id : prev));
//   }, [planAccounts.length]);

//   useEffect(() => {
//     if (accountId == null) return;
//     if (!planAccounts.some((a) => a.id === accountId)) {
//       setAccountId(planAccounts[0]?.id ?? null);
//     }
//   }, [planAccounts, accountId]);

//   const selectedAccount = useMemo(
//     () => (accountId ? planAccounts.find((a) => a.id === accountId) ?? null : null),
//     [planAccounts, accountId]
//   );

//   // =========================
//   // ✅ Trades APIs
//   // =========================
//   const accountIdStr = selectedAccount ? String(selectedAccount.id) : "";

//   const tradesQ = useGetAllTradesQuery(
//     {
//       accountId: accountIdStr,
//       start: tradesStart,
//       count: PAGE_SIZE,
//       searchParams: q?.trim() || undefined,
//     } as any,
//     { skip: !accountIdStr, refetchOnMountOrArgChange: true }
//   );

//   const historyQ = useGetTradesHistoryQuery(
//     {
//       accountId: accountIdStr,
//       start: historyStart,
//       count: PAGE_SIZE,
//       searchParams: q?.trim() || undefined,
//     } as any,
//     { skip: !accountIdStr, refetchOnMountOrArgChange: true }
//   );

//   useEffect(() => {
//     if (tradesQ.isError) toast.error("Failed to load trades");
//   }, [tradesQ.isError]);

//   useEffect(() => {
//     if (historyQ.isError) toast.error("Failed to load trade history");
//   }, [historyQ.isError]);

//   useEffect(() => {
//     setTradesStart(0);
//     setHistoryStart(0);
//   }, [accountId]);

//   const tradesRows: any[] = useMemo(() => {
//     const root = (tradesQ.data as any) ?? null;
//     const raw = root?.data ?? root?.trades ?? root ?? [];
//     return asArray<any>(raw);
//   }, [tradesQ.data]);

//   const historyRows: any[] = useMemo(() => {
//     const root = (historyQ.data as any) ?? null;
//     const raw = root?.data ?? root?.history ?? root ?? [];
//     return asArray<any>(raw);
//   }, [historyQ.data]);

//   // =========================
//   // ✅ Close API (NEW unified endpoint)
//   // =========================
//   const [closeTrades, closeTradesState] = useCloseTradesMutation();

//   const canCloseAll = tradesRows.length > 0;

//   async function handleCloseAll() {
//     if (!selectedAccount) return;
//     if (confirm.trim().toUpperCase() !== "CLOSE") return;

//     try {
//       // ✅ new api: close all
//       await closeTrades({ signalIds: [], isCloseAll: true } as any).unwrap();
//       toast.success("Close all requested");
//       setCloseAllOpen(false);
//       setConfirm("");
//       tradesQ.refetch();
//       historyQ.refetch();
//     } catch (e: any) {
//       toast.error(e?.data?.message ?? e?.message ?? "Close all failed");
//     }
//   }
// function isPendingStatus(status: string) {
//   const s = String(status || "").toUpperCase();
//   return ["PENDING", "NEW", "QUEUED"].includes(s);
// }
//  async function handleCloseOne(tradeSignalId: number, statusText?: string) {
//   if (!selectedAccount) return;

//   if (statusText && isPendingStatus(statusText)) {
//     toast.info("This trade is pending. You can't close it yet.");
//     return;
//   }

//   try {
//     setClosingId(tradeSignalId);
//     await closeTrades({ signalIds: [tradeSignalId], isCloseAll: false } as any).unwrap();
//     toast.success(`Close requested (#${tradeSignalId})`);
//     tradesQ.refetch();
//     historyQ.refetch();
//   } catch (e: any) {
//     toast.error(e?.data?.message ?? e?.message ?? "Close failed");
//   } finally {
//     setClosingId(null);
//   }
// }


//   // =========================
//   // ✅ Alerts (mock)
//   // =========================
//   const alerts: AlertRow[] = useMemo(() => {
//     const pid = selectedPlanIdForAccounts || "—";
//     return [
//       {
//         id: `al-${pid}-1`,
//         severity: "WARN",
//         message: `Plan-wide alerts are common for ALL accounts in plan (${pid}). (mock)`,
//         at: "—",
//       },
//       {
//         id: `al-${pid}-2`,
//         severity: "INFO",
//         message: "Webhook / broker connectivity / execution alerts will appear here. (mock)",
//         at: "—",
//       },
//     ];
//   }, [selectedPlanIdForAccounts]);

//   // =========================
//   // Filtering + quick accounts
//   // =========================
//   const filteredAccounts = useMemo(() => {
//     const s = accountSearch.trim().toLowerCase();
//     if (!s) return planAccounts;
//     return planAccounts.filter((a) => {
//       const hay = `${a.label} ${a.broker} ${a.status} ${a.id}`.toLowerCase();
//       return hay.includes(s);
//     });
//   }, [planAccounts, accountSearch]);

//   const quickAccounts = useMemo(() => {
//     if (!planAccounts.length) return [];
//     const selected = selectedAccount ? [selectedAccount] : [];
//     const rest = planAccounts.filter((a) => a.id !== selectedAccount?.id);
//     rest.sort(
//       (a, b) =>
//         safeNum(b.openTrades ?? 0) - safeNum(a.openTrades ?? 0) ||
//         a.label.localeCompare(b.label)
//     );
//     return [...selected, ...rest].slice(0, 6);
//   }, [planAccounts, selectedAccount]);

//   const selectPlan = (id: number) => {
//     setSubscriptionId(id);
//     setMobilePlansOpen(false);
//     setAccountPickerOpen(false);
//     setTradesStart(0);
//     setHistoryStart(0);
//     setAccountId(null);
//     setQ("");
//     setAlertsQ("");
//   };

//   const selectAccount = (id: number) => {
//     setAccountId(id);
//     setTab("trades");
//     setQ("");
//     setTradesStart(0);
//     setHistoryStart(0);
//   };

//   const onRefresh = () => {
//     currentSubsQ.refetch();
//     if (selectedPlanIdForAccounts) accountsQ.refetch();
//     if (accountIdStr) {
//       tradesQ.refetch();
//       historyQ.refetch();
//     }
//     toast.info("Refreshing workspace…");
//   };

//   const onRefreshAlerts = () => toast.info("Refreshing plan alerts…");

//   const planLabel = selectedPlan ? selectedPlan.name : "Select a plan";
//   const planIdLabel = selectedPlanIdForAccounts;

//   return (
//     <div className="relative">
//       {/* top header */}
//       <div className="relative overflow-hidden rounded-2xl">
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_55%)]" />
//         <div className="relative p-5 md:p-6">
//           <div className="flex items-start justify-between gap-3 flex-wrap">
//             <div className="min-w-0">
//               <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
//                 Trading <span className="text-emerald-400">Workspace</span>
//               </h1>
//               <p className="mt-1 text-sm text-slate-400">
//                 Plan (left) → Accounts (top) → Trades/History (center) • Alerts
//                 (right, plan-wide)
//               </p>

//               <div className="mt-4 flex flex-wrap gap-2">
//                 {selectedPlan ? (
//                   <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
//                     {selectedPlan.name} • {selectedPlan.status}
//                   </span>
//                 ) : (
//                   <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-200">
//                     {loadingPlans ? "Loading plans…" : "No plan found"}
//                   </span>
//                 )}

//                 {selectedAccount ? (
//                   <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-200">
//                     {selectedAccount.label} • {selectedAccount.broker} •{" "}
//                     {selectedAccount.status}
//                   </span>
//                 ) : (
//                   <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-400">
//                     {!selectedPlan
//                       ? "Select a plan to load accounts"
//                       : loadingAccounts
//                       ? "Loading accounts…"
//                       : "No account selected"}
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 className={clsx(softBtn, "md:hidden")}
//                 onClick={() => setMobilePlansOpen(true)}
//               >
//                 <Menu size={16} />
//                 Plans
//               </button>

//               <button
//                 className={clsx(softBtn, "md:hidden")}
//                 onClick={() => setMobileAlertsOpen(true)}
//               >
//                 <Bell size={16} />
//                 Alerts
//               </button>

//               <button className={softBtn} onClick={onRefresh} disabled={loading}>
//                 <RefreshCw size={16} />
//                 Refresh
//               </button>

//               <button
//                 disabled={!canCloseAll}
//                 className={clsx(
//                   "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition disabled:opacity-60 disabled:cursor-not-allowed",
//                   !canCloseAll
//                     ? "bg-slate-900/30 text-slate-500 border-slate-800"
//                     : "bg-rose-500 text-slate-950 border-rose-500 hover:bg-rose-400"
//                 )}
//                 onClick={() => setCloseAllOpen(true)}
//               >
//                 <XCircle size={16} />
//                 Close all
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* layout */}
//       <div className="mt-5 grid gap-5 grid-cols-12 min-w-0">
//         {/* plans sidebar */}
//         <aside
//           className={clsx(
//             panel,
//             "hidden md:flex flex-col overflow-hidden col-span-12 md:col-span-3 xl:col-span-2",
//             "h-[calc(100vh-260px)]",
//             plansCollapsed ? "md:col-span-1" : ""
//           )}
//         >
//           <div className="p-3 border-b border-slate-800/70 flex items-center justify-between">
//             <div className={clsx("min-w-0", plansCollapsed && "hidden")}>
//               <div className="text-sm font-semibold text-slate-100">Plans</div>
//               <div className="text-xs text-slate-400">Select plan</div>
//             </div>

//             <button
//               className="rounded-lg p-2 hover:bg-white/5 transition"
//               onClick={() => setPlansCollapsed((s) => !s)}
//               aria-label="Toggle plans sidebar"
//               title={plansCollapsed ? "Expand" : "Collapse"}
//             >
//               {plansCollapsed ? (
//                 <ChevronRight size={18} />
//               ) : (
//                 <ChevronLeft size={18} />
//               )}
//             </button>
//           </div>

//           <div className="p-2 overflow-auto min-h-0">
//             {!subscriptions.length ? (
//               <div className="p-3 text-sm text-slate-400">
//                 {loadingPlans ? "Loading plans…" : "No plans found"}
//               </div>
//             ) : (
//               <div className="space-y-2">
//                 {subscriptions.map((p) => {
//                   const active = p.id === subscriptionId;
//                   return (
//                     <button
//                       key={p.id}
//                       onClick={() => selectPlan(p.id)}
//                       title={p.name}
//                       className={clsx(
//                         "w-full rounded-xl border transition text-left flex items-center gap-3",
//                         plansCollapsed ? "p-2 justify-center" : "p-3",
//                         active
//                           ? "border-emerald-400/35 bg-emerald-500/10"
//                           : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/35 hover:border-slate-700"
//                       )}
//                     >
//                       <div
//                         className={clsx(
//                           "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
//                           active
//                             ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
//                             : "border-slate-800 bg-slate-900/40 text-slate-300"
//                         )}
//                       >
//                         <Layers size={18} />
//                       </div>

//                       {!plansCollapsed ? (
//                         <div className="min-w-0">
//                           <div className="text-sm font-semibold text-slate-100 truncate">
//                             {p.name}
//                           </div>
//                           <div className="text-[11px] text-slate-400 mt-1">
//                             {p.status}
//                           </div>
//                         </div>
//                       ) : null}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </aside>

//         {/* center */}
//         <main
//           className={clsx(
//             panel,
//             "col-span-12 md:col-span-6 xl:col-span-7 overflow-hidden h-[calc(100vh-260px)] flex flex-col"
//           )}
//         >
//           {/* accounts header */}
//           <div className="border-b border-slate-800/70 p-4 bg-slate-900/35">
//             <div className="flex items-start justify-between gap-3 flex-wrap">
//               <div className="min-w-0">
//                 <div className="text-sm font-semibold text-slate-100">
//                   Accounts
//                 </div>
//                 <div className="text-xs text-slate-400">
//                   {!selectedPlan
//                     ? "Select a plan to load accounts"
//                     : "Account-scoped workspace"}
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 <div className="text-xs text-slate-400">
//                   Total: <b className="text-slate-200">{planAccounts.length}</b>
//                 </div>

//                 <button
//                   className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs hover:bg-slate-900/70 transition disabled:opacity-60 disabled:cursor-not-allowed"
//                   onClick={() => setAccountPickerOpen(true)}
//                   disabled={loading || !selectedPlan}
//                 >
//                   <Menu size={14} />
//                   Browse
//                 </button>
//               </div>
//             </div>

//             {/* quick chips */}
//             <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
//               {quickAccounts.map((a) => (
//                 <Chip
//                   key={a.id}
//                   label={a.label}
//                   active={a.id === accountId}
//                   onClick={() => {
//                     selectAccount(a.id);
//                     setAccountSearch("");
//                   }}
//                   title={`${a.broker} • ${a.status}`}
//                   disabled={loading || !selectedPlan}
//                 />
//               ))}

//               <button
//                 type="button"
//                 onClick={() => setAccountPickerOpen(true)}
//                 className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/25 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-950/40 hover:border-slate-700 transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
//                 disabled={loading || !selectedPlan}
//               >
//                 <Search size={14} className="text-slate-300" />
//                 Find account
//               </button>
//             </div>

//             {/* search + tabs */}
//             <div className="mt-4 grid gap-3 xl:grid-cols-[1fr,auto,auto] items-center">
//               <div className="relative min-w-0">
//                 <Search
//                   size={16}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
//                 />
//                 <input
//                   value={q}
//                   onChange={(e) => setQ(e.target.value)}
//                   placeholder="Search symbol / id"
//                   className={clsx(inputBase, "pl-9")}
//                   disabled={loading || !accountId || !selectedPlan}
//                 />
//               </div>

//               <button
//                 className={clsx(softBtn, "justify-center")}
//                 onClick={() => toast.info("Filters (todo)")}
//                 disabled={loading || !accountId || !selectedPlan}
//               >
//                 <Filter size={16} />
//                 Filters
//               </button>

//               <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
//                 <SegTab
//                   active={tab === "trades"}
//                   onClick={() => setTab("trades")}
//                   icon={<CandlestickChart size={16} />}
//                   label="Trades"
//                   disabled={loading || !selectedPlan}
//                 />
//                 <SegTab
//                   active={tab === "history"}
//                   onClick={() => setTab("history")}
//                   icon={<History size={16} />}
//                   label="History"
//                   disabled={loading || !selectedPlan}
//                 />
//               </div>
//             </div>

//             {/* paging */}
//             <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
//               <div className="min-w-0 truncate">
//                 {!selectedPlan
//                   ? "Select a plan"
//                   : !accountId
//                   ? "Select an account"
//                   : tab === "trades"
//                   ? tradesQ.isFetching
//                     ? "Loading trades…"
//                     : `Trades start: ${tradesStart}`
//                   : historyQ.isFetching
//                   ? "Loading history…"
//                   : `History start: ${historyStart}`}
//               </div>

//               <div className="flex items-center gap-2">
//                 <button
//                   className={clsx(softBtn, "px-3 py-1.5 text-xs")}
//                   disabled={
//                     !accountId ||
//                     (tab === "trades"
//                       ? tradesStart <= 0
//                       : historyStart <= 0)
//                   }
//                   onClick={() => {
//                     if (!accountId) return;
//                     if (tab === "trades")
//                       setTradesStart((s) => Math.max(0, s - PAGE_SIZE));
//                     else setHistoryStart((s) => Math.max(0, s - PAGE_SIZE));
//                   }}
//                 >
//                   <PagePrev size={14} />
//                   Prev
//                 </button>

//                 <button
//                   className={clsx(softBtn, "px-3 py-1.5 text-xs")}
//                   disabled={!accountId}
//                   onClick={() => {
//                     if (!accountId) return;
//                     if (tab === "trades") setTradesStart((s) => s + PAGE_SIZE);
//                     else setHistoryStart((s) => s + PAGE_SIZE);
//                   }}
//                 >
//                   Next
//                   <PageNext size={14} />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* content */}
//           <div className="p-4 md:p-5 flex-1 min-h-0 overflow-auto">
//             <div className="mb-4">
//               <div className="text-base font-semibold text-slate-100 truncate">
//                 {selectedAccount?.label ??
//                   (!selectedPlan ? "Select plan" : "Select account")}
//               </div>
//               <div className="text-xs text-slate-400 mt-1">
//                 {!selectedPlan
//                   ? "Select a plan from the left"
//                   : selectedAccount
//                   ? `${selectedAccount.broker} • ${selectedAccount.status}`
//                   : loadingAccounts
//                   ? "Loading…"
//                   : "—"}
//               </div>
//             </div>

//             {!selectedPlan ? (
//               <div className="text-sm text-slate-400">
//                 Select a plan from the left to load accounts.
//               </div>
//             ) : !planAccounts.length && !loadingAccounts ? (
//               <div className="text-sm text-slate-400">
//                 No accounts found for this plan.
//               </div>
//             ) : !accountId ? (
//               <div className="text-sm text-slate-400">
//                 Select an account to view trades.
//               </div>
//             ) : tab === "trades" ? (
//               <TradesTable
//                 rows={tradesRows}
//                 loading={tradesQ.isFetching}
//                 onCloseOne={handleCloseOne}
//                 closingId={closingId}
//                 closingAny={closeTradesState.isLoading}
//               />
//             ) : (
//               <HistoryTable rows={historyRows} loading={historyQ.isFetching} />
//             )}
//           </div>
//         </main>

//         {/* right */}
//         <div className="hidden md:block col-span-12 md:col-span-3 xl:col-span-3">
//           <AlertsPanel
//             planLabel={planLabel}
//             planId={planIdLabel}
//             q={alertsQ}
//             onChangeQ={setAlertsQ}
//             rows={!selectedPlan ? [] : alerts}
//             onRefresh={onRefreshAlerts}
//             loading={loadingPlans}
//           />
//         </div>
//       </div>

//       {/* account picker modal */}
//       <Modal open={accountPickerOpen} onClose={() => setAccountPickerOpen(false)}>
//         <div className="text-slate-100">
//           <div className="flex items-start justify-between gap-3">
//             <div>
//               <h3 className="text-lg font-semibold">Select account</h3>
//               <p className="text-xs text-slate-400 mt-1">
//                 Showing <b className="text-slate-200">{filteredAccounts.length}</b>{" "}
//                 of <b className="text-slate-200">{planAccounts.length}</b>{" "}
//                 accounts
//               </p>
//             </div>

//             <button
//               onClick={() => setAccountPickerOpen(false)}
//               className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs hover:bg-slate-900/80 transition"
//             >
//               Close
//             </button>
//           </div>

//           <div className="mt-4 relative">
//             <Search
//               size={16}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
//             />
//             <input
//               value={accountSearch}
//               onChange={(e) => setAccountSearch(e.target.value)}
//               placeholder="Search by label / broker / status"
//               className={clsx(inputBase, "pl-9")}
//               autoFocus
//             />
//           </div>

//           <div className="mt-4 max-h-[55vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-950/25">
//             {filteredAccounts.length ? (
//               <div className="divide-y divide-slate-800/70">
//                 {filteredAccounts.map((a) => {
//                   const active = a.id === accountId;
//                   return (
//                     <button
//                       key={a.id}
//                       onClick={() => {
//                         selectAccount(a.id);
//                         setAccountPickerOpen(false);
//                         setAccountSearch("");
//                       }}
//                       className={clsx(
//                         "w-full text-left px-4 py-3 hover:bg-slate-900/40 transition flex items-center gap-3",
//                         active && "bg-emerald-500/10"
//                       )}
//                     >
//                       <div
//                         className={clsx(
//                           "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
//                           active
//                             ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
//                             : "border-slate-800 bg-slate-900/40 text-slate-300"
//                         )}
//                       >
//                         <Layers size={18} />
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <div className="text-sm font-semibold text-slate-100 truncate">
//                           {a.label}
//                         </div>
//                         <div className="text-[11px] text-slate-400 mt-1">
//                           {a.broker} • {a.status}
//                         </div>
//                       </div>

//                       {active ? (
//                         <span className="text-[11px] font-semibold text-emerald-200 border border-emerald-400/30 bg-emerald-500/10 rounded-full px-3 py-1">
//                           Selected
//                         </span>
//                       ) : null}
//                     </button>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="p-5 text-sm text-slate-400">
//                 No accounts match your search.
//               </div>
//             )}
//           </div>
//         </div>
//       </Modal>

//       {/* mobile plans drawer */}
//       {mobilePlansOpen && (
//         <div className="fixed inset-0 z-50 md:hidden">
//           <div
//             className="absolute inset-0 bg-black/60"
//             onClick={() => setMobilePlansOpen(false)}
//           />
//           <div className={clsx("absolute inset-y-0 left-0 w-80 max-w-[92vw] p-3", panel, "bg-[#070b16]")}>
//             <div className="flex items-center justify-between px-2 py-2 border-b border-white/5">
//               <p className="text-sm font-semibold text-slate-100">Plans</p>
//               <button
//                 className="rounded-lg p-2 hover:bg-white/5"
//                 onClick={() => setMobilePlansOpen(false)}
//                 aria-label="Close"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <div className="mt-3 space-y-2 overflow-auto h-[calc(100vh-90px)] pr-1">
//               {subscriptions.length ? (
//                 subscriptions.map((p) => {
//                   const active = p.id === subscriptionId;
//                   return (
//                     <button
//                       key={p.id}
//                       onClick={() => selectPlan(p.id)}
//                       className={clsx(
//                         "w-full rounded-2xl border px-3 py-3 flex items-center gap-3 transition text-left",
//                         active
//                           ? "border-emerald-400/35 bg-emerald-500/10"
//                           : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/35 hover:border-slate-700"
//                       )}
//                     >
//                       <div
//                         className={clsx(
//                           "h-10 w-10 rounded-xl border flex items-center justify-center",
//                           active
//                             ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
//                             : "border-slate-800 bg-slate-900/40 text-slate-300"
//                         )}
//                       >
//                         <Layers size={18} />
//                       </div>

//                       <div className="min-w-0 flex-1">
//                         <div className="text-sm font-semibold text-slate-100 truncate">
//                           {p.name}
//                         </div>
//                         <div className="text-[11px] text-slate-400 mt-1">
//                           {p.status}
//                         </div>
//                       </div>
//                     </button>
//                   );
//                 })
//               ) : (
//                 <div className="p-3 text-sm text-slate-400">
//                   {loadingPlans ? "Loading plans…" : "No plans found"}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* mobile alerts drawer */}
//       {mobileAlertsOpen && (
//         <div className="fixed inset-0 z-50 md:hidden">
//           <div
//             className="absolute inset-0 bg-black/60"
//             onClick={() => setMobileAlertsOpen(false)}
//           />
//           <div className="absolute inset-y-0 right-0 w-96 max-w-[92vw] p-3">
//             <div className={clsx(panel, "bg-[#070b16] h-full overflow-hidden flex flex-col")}>
//               <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
//                 <div className="flex items-center gap-2">
//                   <Bell size={16} />
//                   <p className="text-sm font-semibold text-slate-100">
//                     Plan Alerts
//                   </p>
//                 </div>
//                 <button
//                   className="rounded-lg p-2 hover:bg-white/5"
//                   onClick={() => setMobileAlertsOpen(false)}
//                   aria-label="Close"
//                 >
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="p-3 min-h-0 flex-1">
//                 <AlertsPanel
//                   planLabel={planLabel}
//                   planId={planIdLabel}
//                   q={alertsQ}
//                   onChangeQ={setAlertsQ}
//                   rows={!selectedPlan ? [] : alerts}
//                   onRefresh={onRefreshAlerts}
//                   loading={loadingPlans}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* close all modal */}
//       <Modal open={closeAllOpen} onClose={() => setCloseAllOpen(false)}>
//         <div className="text-slate-100">
//           <h3 className="text-lg font-semibold mb-1">Close all trades</h3>
//           <p className="text-xs text-slate-400 mb-5">
//             Type <b className="text-emerald-300">CLOSE</b> to confirm for{" "}
//             <b>{selectedAccount?.label ?? "selected account"}</b>.
//           </p>

//           <input
//             value={confirm}
//             onChange={(e) => setConfirm(e.target.value)}
//             className={clsx(inputBase, "mt-1")}
//             placeholder="Type CLOSE"
//             autoFocus
//           />

//           <div className="mt-6 flex justify-end gap-2">
//             <button
//               onClick={() => setCloseAllOpen(false)}
//               className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80 transition"
//               disabled={closeTradesState.isLoading}
//             >
//               Cancel
//             </button>

//             <button
//               disabled={
//                 confirm.trim().toUpperCase() !== "CLOSE" ||
//                 !canCloseAll ||
//                 closeTradesState.isLoading
//               }
//               onClick={handleCloseAll}
//               className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-slate-950 font-semibold hover:bg-rose-400 disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {closeTradesState.isLoading ? "Closing…" : "Close all"}
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }

// /** ---------- views ---------- */
// function TradesTable({
//   rows,
//   loading,
//   onCloseOne,
//   closingId,
//   closingAny,
// }: {
//   rows: any[];
//   loading?: boolean;
//   onCloseOne: (tradeSignalId: number, statusText?: string) => void;
//   closingId: number | null;
//   closingAny?: boolean;
// }) {
//   if (loading) return <div className="text-sm text-slate-400">Loading trades…</div>;
//   if (!rows.length) return <div className="text-sm text-slate-400">No trades found.</div>;

// function isPendingStatus(status: string) {
//   const s = String(status || "").toUpperCase();
//   return ["PENDING", "NEW", "QUEUED"].includes(s);
// }

//   return (
//     <TableShell>
//       <div className="overflow-auto">
//         <table className="min-w-full text-sm">
//           <thead>
//             <tr>
//               <Th>Symbol</Th>
//               <Th>Side</Th>
//               <Th>Volume</Th>
//               <Th>Price</Th>
//               <Th>Signal Time</Th>
//               <Th>Status</Th>
//               <Th align="right">Action</Th>
//             </tr>
//           </thead>

//           <tbody>
//             {rows.map((t: any) => {
//               const id = safeNum(t?.id, 0);
//               const symbol = String(t?.symbol ?? "—");
//               const side = String(t?.action ?? t?.side ?? "—").toUpperCase();
//               const vol = String(t?.volume ?? t?.qty ?? t?.quantity ?? "—");
//               const price = String(t?.price ?? "—");
//               const signalTime = fmtTime(t?.signalTime ?? t?.createdAt ?? t?.time);
//               const statusText = pickTradeStatus(t);

//               const isRowClosing = Boolean(closingAny && closingId === id);
//               const isPending = isPendingStatus(statusText);

//               return (
//                 <tr key={String(id)} className="hover:bg-slate-950/25">
//                   <Td>
//                     <div className="font-semibold text-slate-100">{symbol}</div>
//                     <div className="text-[11px] text-slate-500">#{id}</div>
//                   </Td>

//                   <Td>
//                     <span
//                       className={clsx(
//                         "rounded-full border px-3 py-1 text-[11px] font-semibold",
//                         side === "BUY"
//                           ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
//                           : "border-rose-400/30 bg-rose-500/10 text-rose-200"
//                       )}
//                     >
//                       {side}
//                     </span>
//                   </Td>

//                   <Td>{vol}</Td>
//                   <Td>{price}</Td>
//                   <Td>{signalTime}</Td>

//                   <Td>
//                     <span
//                       className={clsx(
//                         "rounded-full border px-3 py-1 text-[11px] font-semibold",
//                         statusPillClass(statusText)
//                       )}
//                     >
//                       {statusText}
//                     </span>
//                   </Td>

//                   <Td align="right">
//                     <button
//                       onClick={() => onCloseOne(id, statusText)}
//                       disabled={isRowClosing || isPending}
//                       title={
//                         isPending
//                           ? "Pending trades can't be closed yet"
//                           : "Close this trade"
//                       }
//                       className={clsx(
//                         "rounded-xl border px-3 py-2 text-xs transition disabled:opacity-60 disabled:cursor-not-allowed",
//                         isPending
//                           ? "border-slate-800 bg-slate-900/20 text-slate-500"
//                           : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60"
//                       )}
//                     >
//                       {isRowClosing ? "Closing…" : "Close"}
//                     </button>
//                   </Td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </TableShell>
//   );
// }


// function HistoryTable({ rows, loading }: { rows: any[]; loading?: boolean }) {
//   if (loading) return <div className="text-sm text-slate-400">Loading history…</div>;
//   if (!rows.length) return <div className="text-sm text-slate-400">No history found.</div>;

//   return (
//     <TableShell>
//       <div className="overflow-auto">
//         <table className="min-w-full text-sm">
//           <thead>
//             <tr>
//               <Th>Symbol</Th>
//               <Th>Side</Th>
//               <Th>Volume</Th>
//               <Th>Price</Th>
//               <Th>Time</Th>
//               <Th>Status</Th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((h: any) => {
//               const id = safeNum(h?.id, 0);
//               const symbol = String(h?.symbol ?? "—");
//               const side = String(h?.action ?? h?.side ?? "—").toUpperCase();
//               const vol = String(h?.volume ?? h?.qty ?? h?.quantity ?? "—");
//               const price = String(h?.price ?? "—");
//               const time = fmtTime(h?.signalTime ?? h?.updatedAt ?? h?.createdAt ?? h?.time);
//               const statusText = pickTradeStatus(h);

//               return (
//                 <tr key={String(id)} className="hover:bg-slate-950/25">
//                   <Td>
//                     <div className="font-semibold text-slate-100">{symbol}</div>
//                     <div className="text-[11px] text-slate-500">#{id}</div>
//                   </Td>
//                   <Td>{side}</Td>
//                   <Td>{vol}</Td>
//                   <Td>{price}</Td>
//                   <Td>{time}</Td>
//                   <Td>
//                     <span
//                       className={clsx(
//                         "rounded-full border px-3 py-1 text-[11px] font-semibold",
//                         statusPillClass(statusText)
//                       )}
//                     >
//                       {statusText}
//                     </span>
//                   </Td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </TableShell>
//   );
// }

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
  AlertTriangle,
} from "lucide-react";
import Modal from "../../components/Model";
import { toast } from "react-toastify";

import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";
import { useGetMyForexTraderDetailsQuery } from "../../services/forexTraderUserDetails.api";
import type { ForexAccountRow } from "../../services/forexTraderUserDetails.api";

import {
  useGetAllTradesQuery,
  useGetTradesHistoryQuery,
  useCloseTradesMutation,
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

const iconBox =
  "h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-200";

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
  hint,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint}
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
    if (numericKeys.length)
      return numericKeys.map((k) => maybe[k]).filter(Boolean) as T[];
  }
  return [];
}

function fmtTime(iso: any) {
  const s = String(iso ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function pickTradeStatus(row: any): string {
  const v =
    row?.status?.status ??
    row?.statusV2 ??
    row?.status_v2 ??
    row?.status ??
    "pending";
  return String(v).toUpperCase();
}

function statusPillClass(status: string) {
  const s = status.toUpperCase();
  if (["EXECUTED", "FILLED", "DONE", "SUCCESS"].includes(s))
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (["PENDING", "NEW", "QUEUED"].includes(s))
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  if (["REJECTED", "FAILED", "CANCELED", "CANCELLED", "ERROR"].includes(s))
    return "border-rose-400/30 bg-rose-500/10 text-rose-200";
  return "border-slate-700 bg-slate-900/40 text-slate-200";
}

function isPendingStatus(status: string) {
  const s = String(status || "").toUpperCase();
  return ["PENDING", "NEW", "QUEUED"].includes(s);
}

function isFailedStatus(status: string) {
  const s = String(status || "").toUpperCase();
  return ["REJECTED", "FAILED", "CANCELED", "CANCELLED", "ERROR"].includes(s);
}

/** ---------- view models ---------- */
type SubPlanVM = {
  id: number;
  planId: string;
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

type WorkspaceTab = "accounts" | "alerts";
type DrawerTab = "trades" | "history" | "failed";

/** ---------- table helpers ---------- */
function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={clsx(panel, "bg-slate-950/20 overflow-hidden")}>
      {children}
    </div>
  );
}
function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={clsx(
        "px-4 py-3 text-xs font-semibold text-slate-300 bg-slate-900/55 border-b border-slate-800/80 whitespace-nowrap",
        align === "right" && "text-right"
      )}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={clsx(
        "px-4 py-3 text-sm text-slate-200 border-b border-slate-800/50 align-top",
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
    : rows.filter(
        (r) =>
          r.message.toLowerCase().includes(s) || r.id.toLowerCase().includes(s)
      );

  const sevCls = (sev: AlertRow["severity"]) =>
    sev === "INFO"
      ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
      : sev === "WARN"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
      : "border-rose-400/30 bg-rose-500/10 text-rose-200";

  return (
    <div className={clsx(panel, "flex flex-col overflow-hidden")}>
      <div className="p-4 border-b border-slate-800/70 bg-slate-900/35">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={iconBox}>
                <Bell size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100">
                  Plan Alerts
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Common alerts for{" "}
                  <b className="text-slate-200">{planLabel}</b>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              Scope: <span className="text-emerald-300">All accounts</span> in
              this plan
              {planId ? <span className="ml-2">• planId: {planId}</span> : null}
            </div>
          </div>

          <button
            className={clsx(softBtn, "px-3 py-2 text-xs")}
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="mt-3 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
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
                  <span
                    className={clsx(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold",
                      sevCls(a.severity)
                    )}
                  >
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

/** ---------- Full-page slider (account workspace) ---------- */
function FullPageSlider({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full md:w-[1200px] max-w-[100vw]">
        <div
          className={clsx(
            panel,
            "h-full rounded-none md:rounded-l-3xl border-l border-slate-800 bg-[#070b16] overflow-hidden flex flex-col"
          )}
        >
          {/* header */}
          <div className="p-4 md:p-5 border-b border-slate-800/70 bg-slate-900/25">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-slate-100 truncate">
                  {title}
                </div>
                {subtitle ? (
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    {subtitle}
                  </div>
                ) : null}
              </div>

              <button
                className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs hover:bg-slate-900/70 transition"
                onClick={onClose}
              >
                <span className="inline-flex items-center gap-2">
                  <X size={16} /> Close
                </span>
              </button>
            </div>
          </div>

          {/* body */}
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** ---------- main ---------- */
export default function TradingWorkspaceRedesign() {
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("accounts");

  // plan alerts search
  const [alertsQ, setAlertsQ] = useState("");

  const [plansCollapsed, setPlansCollapsed] = useState(false);
  const [mobilePlansOpen, setMobilePlansOpen] = useState(false);

  // account drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("trades");

  // drawer search
  const [q, setQ] = useState("");

  const PAGE_SIZE = 25;
  const [tradesStart, setTradesStart] = useState(0);
  const [historyStart, setHistoryStart] = useState(0);

  // close all modal
  const [closeAllOpen, setCloseAllOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  // ✅ close states (better UX)
  const [closingId, setClosingId] = useState<number | null>(null);

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
    const root = (currentSubsQ.data as any) ?? null;
    const list1 = root?.subscription?.data;
    const list2 = root?.data;
    const list3 = root;

    const list =
      Array.isArray(list1)
        ? list1
        : Array.isArray(list2)
        ? list2
        : Array.isArray(list2?.data)
        ? list2.data
        : Array.isArray(list3)
        ? list3
        : Array.isArray(list3?.data)
        ? list3.data
        : [];

    return list
      .filter(Boolean)
      .map((s: any) => {
        const statusV2 = String(
          s?.statusV2 ?? s?.status_v2 ?? s?.status ?? "ACTIVE"
        ).toUpperCase();

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
            case "CANCELLED":
              return "CANCELED";
            case "EXPIRED":
              return "EXPIRED";
            default:
              return "ACTIVE";
          }
        })();

        return {
          id: safeNum(s?.id, -1),
          planId: String(
            s?.planId ?? s?.plan_id ?? s?.plan?.id ?? s?.plan?.uuid ?? ""
          ),
          name: String(s?.plan?.name ?? s?.planName ?? s?.name ?? "Plan"),
          status,
        };
      })
      .filter((x: any) => !!x.planId && x.id !== -1);
  }, [currentSubsQ.data]);

  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);

  useEffect(() => {
    if (!subscriptions.length) {
      setSubscriptionId(null);
      return;
    }
    setSubscriptionId((prev) => (prev == null ? subscriptions[0].id : prev));
  }, [subscriptions.length]);

  const selectedPlan = useMemo(
    () =>
      subscriptionId != null
        ? subscriptions.find((p) => p.id === subscriptionId) ?? null
        : null,
    [subscriptions, subscriptionId]
  );

  const selectedPlanIdForAccounts = selectedPlan?.planId || "";

  // =========================
  // ✅ Accounts
  // =========================
  const accountsQ = useGetMyForexTraderDetailsQuery(
    selectedPlanIdForAccounts
      ? ({ planId: selectedPlanIdForAccounts } as any)
      : (undefined as any),
    { skip: !selectedPlanIdForAccounts, refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (accountsQ.isError) toast.error("Failed to load your trading accounts");
  }, [accountsQ.isError]);

  const loadingAccounts = accountsQ.isLoading || accountsQ.isFetching;
  const loading = loadingPlans || loadingAccounts;

  const accounts: AccountVM[] = useMemo(() => {
    if (!selectedPlanIdForAccounts) return [];
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
  }, [accountsQ.data, selectedPlanIdForAccounts]);

  const planAccounts = useMemo(() => accounts, [accounts]);

  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (!planAccounts.length) {
      setAccountId(null);
      return;
    }
    setAccountId((prev) => (prev == null ? planAccounts[0].id : prev));
  }, [planAccounts.length]);

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
  // ✅ Trades APIs (in drawer)
  // =========================
  const accountIdStr = selectedAccount ? String(selectedAccount.id) : "";

  const tradesQ = useGetAllTradesQuery(
    {
      accountId: accountIdStr,
      start: tradesStart,
      count: PAGE_SIZE,
      searchParams: q?.trim() || undefined,
    } as any,
    { skip: !drawerOpen || !accountIdStr, refetchOnMountOrArgChange: true }
  );

  const historyQ = useGetTradesHistoryQuery(
    {
      accountId: accountIdStr,
      start: historyStart,
      count: PAGE_SIZE,
      searchParams: q?.trim() || undefined,
    } as any,
    { skip: !drawerOpen || !accountIdStr, refetchOnMountOrArgChange: true }
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
  }, [accountId, drawerOpen]);

  const tradesRows: any[] = useMemo(() => {
    const root = (tradesQ.data as any) ?? null;
    const raw = root?.data ?? root?.trades ?? root ?? [];
    return asArray<any>(raw);
  }, [tradesQ.data]);

  const historyRows: any[] = useMemo(() => {
    const root = (historyQ.data as any) ?? null;
    const raw = root?.data ?? root?.history ?? root ?? [];
    return asArray<any>(raw);
  }, [historyQ.data]);

  const failedRows: any[] = useMemo(() => {
    // Prefer history for failures (usually final status). If empty, fallback to trades.
    const fromHistory = historyRows.filter((r) => isFailedStatus(pickTradeStatus(r)));
    const fromTrades = tradesRows.filter((r) => isFailedStatus(pickTradeStatus(r)));
    const merged = [...fromHistory, ...fromTrades];

    // de-dupe by id if present
    const seen = new Set<string>();
    return merged.filter((r) => {
      const id = String(safeNum(r?.id, 0));
      if (!id || id === "0") return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [historyRows, tradesRows]);

  // =========================
  // ✅ Close API
  // =========================
  const [closeTrades, closeTradesState] = useCloseTradesMutation();
  const canCloseAll = tradesRows.length > 0;

  async function handleCloseAll() {
    if (!selectedAccount) return;
    if (confirm.trim().toUpperCase() !== "CLOSE") return;

    try {
      await closeTrades({ signalIds: [], isCloseAll: true } as any).unwrap();
      toast.success("Close all requested");
      setCloseAllOpen(false);
      setConfirm("");
      tradesQ.refetch();
      historyQ.refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Close all failed");
    }
  }

  async function handleCloseOne(tradeSignalId: number, statusText?: string) {
    if (!selectedAccount) return;

    if (statusText && isPendingStatus(statusText)) {
      toast.info("This trade is pending. You can't close it yet.");
      return;
    }

    try {
      setClosingId(tradeSignalId);
      await closeTrades({ signalIds: [tradeSignalId], isCloseAll: false } as any).unwrap();
      toast.success(`Close requested (#${tradeSignalId})`);
      tradesQ.refetch();
      historyQ.refetch();
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Close failed");
    } finally {
      setClosingId(null);
    }
  }

  // =========================
  // ✅ Alerts (mock)
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
  // Accounts list filtering
  // =========================
  const [accountSearch, setAccountSearch] = useState("");
  const filteredAccounts = useMemo(() => {
    const s = accountSearch.trim().toLowerCase();
    if (!s) return planAccounts;
    return planAccounts.filter((a) => {
      const hay = `${a.label} ${a.broker} ${a.status} ${a.id}`.toLowerCase();
      return hay.includes(s);
    });
  }, [planAccounts, accountSearch]);

  const selectPlan = (id: number) => {
    setSubscriptionId(id);
    setMobilePlansOpen(false);
    setDrawerOpen(false);
    setDrawerTab("trades");
    setAccountId(null);
    setQ("");
    setAlertsQ("");
    setTradesStart(0);
    setHistoryStart(0);
  };

  const openAccountDrawer = (id: number) => {
    setAccountId(id);
    setDrawerTab("trades");
    setDrawerOpen(true);
    setQ("");
    setTradesStart(0);
    setHistoryStart(0);
  };

  const onRefresh = () => {
    currentSubsQ.refetch();
    if (selectedPlanIdForAccounts) accountsQ.refetch();
    if (drawerOpen && accountIdStr) {
      tradesQ.refetch();
      historyQ.refetch();
    }
    toast.info("Refreshing…");
  };

  const onRefreshAlerts = () => toast.info("Refreshing plan alerts…");

  const planLabel = selectedPlan ? selectedPlan.name : "Select a plan";
  const planIdLabel = selectedPlanIdForAccounts;

  const drawerTitle = selectedAccount?.label ?? "Account";
  const drawerSubtitle = selectedAccount
    ? `${selectedAccount.broker} • ${selectedAccount.status}`
    : "";

  const drawerCounts = useMemo(() => {
    return {
      trades: tradesRows.length,
      history: historyRows.length,
      failed: failedRows.length,
    };
  }, [tradesRows.length, historyRows.length, failedRows.length]);

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
                Cleaner view: Accounts + Plan Alerts in tabs • Trades open in a full-page slider
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
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={clsx(softBtn, "md:hidden")}
                onClick={() => setMobilePlansOpen(true)}
              >
                <Menu size={16} />
                Plans
              </button>

              <button className={softBtn} onClick={onRefresh} disabled={loading}>
                <RefreshCw size={16} />
                Refresh
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
              {plansCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>

          <div className="p-2 overflow-auto min-h-0">
            {!subscriptions.length ? (
              <div className="p-3 text-sm text-slate-400">
                {loadingPlans ? "Loading plans…" : "No plans found"}
              </div>
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
                          <div className="text-sm font-semibold text-slate-100 truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {p.status}
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

        {/* center (now: Accounts + Alerts as tabs; trades open in slider) */}
        <main
          className={clsx(
            panel,
            "col-span-12 md:col-span-9 xl:col-span-10 overflow-hidden h-[calc(100vh-260px)] flex flex-col"
          )}
        >
          <div className="border-b border-slate-800/70 p-4 md:p-5 bg-slate-900/35">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100">
                  {selectedPlan ? selectedPlan.name : "Workspace"}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {selectedPlan
                    ? "Pick an account → trades open in a clean slider"
                    : "Select a plan from the left"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <SegTab
                  active={workspaceTab === "accounts"}
                  onClick={() => setWorkspaceTab("accounts")}
                  icon={<Layers size={16} />}
                  label="Accounts"
                  disabled={!selectedPlan}
                />
                <SegTab
                  active={workspaceTab === "alerts"}
                  onClick={() => setWorkspaceTab("alerts")}
                  icon={<Bell size={16} />}
                  label="Plan Alerts"
                  disabled={!selectedPlan}
                />
              </div>
            </div>

            {workspaceTab === "accounts" ? (
              <div className="mt-4 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Search account by label / broker / status"
                  className={clsx(inputBase, "pl-9")}
                  disabled={loading || !selectedPlan}
                />
              </div>
            ) : null}
          </div>

          <div className="p-4 md:p-5 flex-1 min-h-0 overflow-auto">
            {!selectedPlan ? (
              <div className="text-sm text-slate-400">
                Select a plan from the left to load accounts and alerts.
              </div>
            ) : workspaceTab === "alerts" ? (
              <div className="max-w-[980px]">
                <AlertsPanel
                  planLabel={planLabel}
                  planId={planIdLabel}
                  q={alertsQ}
                  onChangeQ={setAlertsQ}
                  rows={alerts}
                  onRefresh={onRefreshAlerts}
                  loading={loadingPlans}
                />
              </div>
            ) : (
              <div>
                {/* accounts grid (clean + airy) */}
                {!planAccounts.length && !loadingAccounts ? (
                  <div className="text-sm text-slate-400">
                    No accounts found for this plan.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {(accountSearch ? filteredAccounts : planAccounts).map((a) => {
                      const isSelected = a.id === accountId;
                      return (
                        <button
                          key={a.id}
                          onClick={() => openAccountDrawer(a.id)}
                          className={clsx(
                            "text-left rounded-2xl border p-4 transition",
                            isSelected
                              ? "border-emerald-400/35 bg-emerald-500/10"
                              : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/35 hover:border-slate-700"
                          )}
                          title="Open trades"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-100 truncate">
                                {a.label}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-400 truncate">
                                {a.broker} • {a.status}
                              </div>
                            </div>

                            <div className="shrink-0">
                              <span
                                className={clsx(
                                  "rounded-full border px-3 py-1 text-[11px] font-semibold",
                                  statusPillClass(String(a.status).toUpperCase())
                                )}
                              >
                                {String(a.status).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-slate-400">
                              Open trades:{" "}
                              <b className="text-slate-200">{safeNum(a.openTrades ?? 0)}</b>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-200">
                              View →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MOBILE plans drawer */}
      {mobilePlansOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobilePlansOpen(false)}
          />
          <div
            className={clsx(
              "absolute inset-y-0 left-0 w-80 max-w-[92vw] p-3",
              panel,
              "bg-[#070b16]"
            )}
          >
            <div className="flex items-center justify-between px-2 py-2 border-b border-white/5">
              <p className="text-sm font-semibold text-slate-100">Plans</p>
              <button
                className="rounded-lg p-2 hover:bg-white/5"
                onClick={() => setMobilePlansOpen(false)}
                aria-label="Close"
              >
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
                        <div className="text-sm font-semibold text-slate-100 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {p.status}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-sm text-slate-400">
                  {loadingPlans ? "Loading plans…" : "No plans found"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT FULL PAGE SLIDER */}
      <FullPageSlider
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        subtitle={drawerSubtitle}
      >
        {/* drawer toolbar */}
        <div className="p-4 md:p-5 border-b border-slate-800/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <SegTab
                active={drawerTab === "trades"}
                onClick={() => setDrawerTab("trades")}
                icon={<CandlestickChart size={16} />}
                label={`Trades (${drawerCounts.trades})`}
                disabled={loading || !selectedAccount}
              />
              <SegTab
                active={drawerTab === "history"}
                onClick={() => setDrawerTab("history")}
                icon={<History size={16} />}
                label={`History (${drawerCounts.history})`}
                disabled={loading || !selectedAccount}
              />
              <SegTab
                active={drawerTab === "failed"}
                onClick={() => setDrawerTab("failed")}
                icon={<AlertTriangle size={16} />}
                label={`Failed (${drawerCounts.failed})`}
                hint="Rejected / Failed / Cancelled / Error"
                disabled={loading || !selectedAccount}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className={clsx(softBtn, "px-3 py-2 text-xs")}
                onClick={() => toast.info("Filters (todo)")}
                disabled={loading || !selectedAccount}
              >
                <Filter size={14} />
                Filters
              </button>

              <button
                disabled={!canCloseAll || !selectedAccount}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border transition disabled:opacity-60 disabled:cursor-not-allowed",
                  !canCloseAll
                    ? "bg-slate-900/30 text-slate-500 border-slate-800"
                    : "bg-rose-500 text-slate-950 border-rose-500 hover:bg-rose-400"
                )}
                onClick={() => setCloseAllOpen(true)}
              >
                <XCircle size={14} />
                Close all
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto] items-center">
            <div className="relative min-w-0">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search symbol / id"
                className={clsx(inputBase, "pl-9")}
                disabled={loading || !selectedAccount}
              />
            </div>

            <div className="flex items-center gap-2 justify-start md:justify-end">
              <button
                className={clsx(softBtn, "px-3 py-1.5 text-xs")}
                disabled={
                  !selectedAccount ||
                  (drawerTab === "trades"
                    ? tradesStart <= 0
                    : historyStart <= 0)
                }
                onClick={() => {
                  if (!selectedAccount) return;
                  if (drawerTab === "trades")
                    setTradesStart((s) => Math.max(0, s - PAGE_SIZE));
                  else setHistoryStart((s) => Math.max(0, s - PAGE_SIZE));
                }}
              >
                <PagePrev size={14} />
                Prev
              </button>

              <button
                className={clsx(softBtn, "px-3 py-1.5 text-xs")}
                disabled={!selectedAccount}
                onClick={() => {
                  if (!selectedAccount) return;
                  if (drawerTab === "trades") setTradesStart((s) => s + PAGE_SIZE);
                  else setHistoryStart((s) => s + PAGE_SIZE);
                }}
              >
                Next
                <PageNext size={14} />
              </button>

              <button
                className={clsx(softBtn, "px-3 py-1.5 text-xs")}
                onClick={() => {
                  tradesQ.refetch();
                  historyQ.refetch();
                  toast.info("Refreshing account…");
                }}
                disabled={!selectedAccount}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            {drawerTab === "trades"
              ? tradesQ.isFetching
                ? "Loading trades…"
                : `Trades start: ${tradesStart}`
              : drawerTab === "history"
              ? historyQ.isFetching
                ? "Loading history…"
                : `History start: ${historyStart}`
              : "Failed trades are derived from Trades + History (current page)."}
          </div>
        </div>

        {/* drawer content */}
        <div className="p-4 md:p-5">
          {!selectedAccount ? (
            <div className="text-sm text-slate-400">Select an account.</div>
          ) : drawerTab === "trades" ? (
            <TradesTable
              rows={tradesRows}
              loading={tradesQ.isFetching}
              onCloseOne={handleCloseOne}
              closingId={closingId}
              closingAny={closeTradesState.isLoading}
            />
          ) : drawerTab === "history" ? (
            <HistoryTable rows={historyRows} loading={historyQ.isFetching} />
          ) : (
            <FailedTable rows={failedRows} loading={historyQ.isFetching || tradesQ.isFetching} />
          )}
        </div>
      </FullPageSlider>

      {/* close all modal */}
      <Modal open={closeAllOpen} onClose={() => setCloseAllOpen(false)}>
        <div className="text-slate-100">
          <h3 className="text-lg font-semibold mb-1">Close all trades</h3>
          <p className="text-xs text-slate-400 mb-5">
            Type <b className="text-emerald-300">CLOSE</b> to confirm for{" "}
            <b>{selectedAccount?.label ?? "selected account"}</b>.
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
              disabled={closeTradesState.isLoading}
            >
              Cancel
            </button>

            <button
              disabled={
                confirm.trim().toUpperCase() !== "CLOSE" ||
                !canCloseAll ||
                closeTradesState.isLoading
              }
              onClick={handleCloseAll}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-slate-950 font-semibold hover:bg-rose-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {closeTradesState.isLoading ? "Closing…" : "Close all"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** ---------- views ---------- */
function TradesTable({
  rows,
  loading,
  onCloseOne,
  closingId,
  closingAny,
}: {
  rows: any[];
  loading?: boolean;
  onCloseOne: (tradeSignalId: number, statusText?: string) => void;
  closingId: number | null;
  closingAny?: boolean;
}) {
  if (loading)
    return <div className="text-sm text-slate-400">Loading trades…</div>;
  if (!rows.length)
    return <div className="text-sm text-slate-400">No trades found.</div>;

  return (
    <TableShell>
      <div className="overflow-auto">
        <table className="min-w-[920px] w-full text-sm">
          <thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>Volume</Th>
              <Th>Price</Th>
              <Th>Signal Time</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </tr>
          </thead>

          <tbody>
            {rows.map((t: any) => {
              const id = safeNum(t?.id, 0);
              const symbol = String(t?.symbol ?? "—");
              const side = String(t?.action ?? t?.side ?? "—").toUpperCase();
              const vol = String(t?.volume ?? t?.qty ?? t?.quantity ?? "—");
              const price = String(t?.price ?? "—");
              const signalTime = fmtTime(t?.signalTime ?? t?.createdAt ?? t?.time);
              const statusText = pickTradeStatus(t);

              const isRowClosing = Boolean(closingAny && closingId === id);
              const isPending = isPendingStatus(statusText);

              return (
                <tr key={String(id)} className="hover:bg-slate-950/25">
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

                  <Td>{vol}</Td>
                  <Td>{price}</Td>
                  <Td>{signalTime}</Td>

                  <Td>
                    <span
                      className={clsx(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold",
                        statusPillClass(statusText)
                      )}
                    >
                      {statusText}
                    </span>
                  </Td>

                  <Td align="right">
                    <button
                      onClick={() => onCloseOne(id, statusText)}
                      disabled={isRowClosing || isPending}
                      title={
                        isPending
                          ? "Pending trades can't be closed yet"
                          : "Close this trade"
                      }
                      className={clsx(
                        "rounded-xl border px-3 py-2 text-xs transition disabled:opacity-60 disabled:cursor-not-allowed",
                        isPending
                          ? "border-slate-800 bg-slate-900/20 text-slate-500"
                          : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60"
                      )}
                    >
                      {isRowClosing ? "Closing…" : "Close"}
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

function HistoryTable({ rows, loading }: { rows: any[]; loading?: boolean }) {
  if (loading)
    return <div className="text-sm text-slate-400">Loading history…</div>;
  if (!rows.length)
    return <div className="text-sm text-slate-400">No history found.</div>;

  return (
    <TableShell>
      <div className="overflow-auto">
        <table className="min-w-[860px] w-full text-sm">
          <thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>Volume</Th>
              <Th>Price</Th>
              <Th>Time</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h: any) => {
              const id = safeNum(h?.id, 0);
              const symbol = String(h?.symbol ?? "—");
              const side = String(h?.action ?? h?.side ?? "—").toUpperCase();
              const vol = String(h?.volume ?? h?.qty ?? h?.quantity ?? "—");
              const price = String(h?.price ?? "—");
              const time = fmtTime(
                h?.signalTime ?? h?.updatedAt ?? h?.createdAt ?? h?.time
              );
              const statusText = pickTradeStatus(h);

              return (
                <tr key={String(id)} className="hover:bg-slate-950/25">
                  <Td>
                    <div className="font-semibold text-slate-100">{symbol}</div>
                    <div className="text-[11px] text-slate-500">#{id}</div>
                  </Td>
                  <Td>{side}</Td>
                  <Td>{vol}</Td>
                  <Td>{price}</Td>
                  <Td>{time}</Td>
                  <Td>
                    <span
                      className={clsx(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold",
                        statusPillClass(statusText)
                      )}
                    >
                      {statusText}
                    </span>
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

function FailedTable({ rows, loading }: { rows: any[]; loading?: boolean }) {
  if (loading)
    return <div className="text-sm text-slate-400">Loading failed trades…</div>;
  if (!rows.length)
    return <div className="text-sm text-slate-400">No failed trades found.</div>;

  return (
    <TableShell>
      <div className="overflow-auto">
        <table className="min-w-[920px] w-full text-sm">
          <thead>
            <tr>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>Volume</Th>
              <Th>Price</Th>
              <Th>Time</Th>
              <Th>Status</Th>
              <Th>Reason</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => {
              const id = safeNum(r?.id, 0);
              const symbol = String(r?.symbol ?? "—");
              const side = String(r?.action ?? r?.side ?? "—").toUpperCase();
              const vol = String(r?.volume ?? r?.qty ?? r?.quantity ?? "—");
              const price = String(r?.price ?? "—");
              const time = fmtTime(r?.signalTime ?? r?.updatedAt ?? r?.createdAt ?? r?.time);
              const statusText = pickTradeStatus(r);
              const reason =
                String(
                  r?.reason ??
                    r?.error ??
                    r?.message ??
                    r?.status?.message ??
                    r?.status?.reason ??
                    "—"
                ) || "—";

              return (
                <tr key={String(id)} className="hover:bg-slate-950/25">
                  <Td>
                    <div className="font-semibold text-slate-100">{symbol}</div>
                    <div className="text-[11px] text-slate-500">#{id}</div>
                  </Td>
                  <Td>{side}</Td>
                  <Td>{vol}</Td>
                  <Td>{price}</Td>
                  <Td>{time}</Td>
                  <Td>
                    <span
                      className={clsx(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold",
                        statusPillClass(statusText)
                      )}
                    >
                      {statusText}
                    </span>
                  </Td>
                  <Td>
                    <div className="text-slate-200 max-w-[520px] truncate" title={reason}>
                      {reason}
                    </div>
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

