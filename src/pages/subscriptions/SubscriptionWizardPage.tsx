// import React, { useEffect, useMemo, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   BadgeCheck,
//   BarChart3,
//   CheckCircle,
//   ChevronRight,
//   Crown,
//   Filter,
//   Flame,
//   Gauge,
//   Info,
//   Layers,
//   Shield,
//   Sparkles,
//   Star,
//   Users,
//   Wallet,
//   X,
//   Zap,
//   Search,
//   RefreshCw,
// } from "lucide-react";

// import {
//   useGetPlanByIdQuery,
//   useListActivePlansQuery,
// } from "../../services/plansApi";

// type BillingCycle = "MONTHLY" | "YEARLY";
// type PlanTier = "BASIC" | "PRO" | "ELITE" | "BUNDLE";
// type MarketCodeUI = "NSE" | "BSE" | "FOREX" | "CRYPTO";
// type MarketFilter = "ALL" | "MULTI" | MarketCodeUI;

// const container = "max-w-6xl mx-auto px-5 md:px-8";
// const cardBase =
//   "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
// const subtle = "text-slate-400 text-xs md:text-sm leading-relaxed";
// const pill =
//   "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300";

// const ALL_MARKETS: MarketCodeUI[] = ["NSE", "BSE", "FOREX", "CRYPTO"];

// const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
// const formatPct = (n: number) => `${Number.isFinite(n) ? n.toFixed(1) : "—"}%`;
// const cx = (...cls: Array<string | false | undefined | null>) => cls.filter(Boolean).join(" ");

// const boolish = (v: any) => v === true || v === "true" || v === 1 || v === "1";
// const numish = (v: any, fallback = 0) => {
//   const n = typeof v === "number" ? v : Number(v);
//   return Number.isFinite(n) ? n : fallback;
// };

// const planTypeMeta: Record<
//   PlanTier,
//   { label: string; cls: string; icon: React.ReactNode }
// > = {
//   BASIC: { label: "BASIC", cls: "bg-slate-200 text-slate-950", icon: <Zap size={14} /> },
//   PRO: { label: "PRO", cls: "bg-emerald-400 text-slate-950", icon: <Star size={14} /> },
//   ELITE: { label: "ELITE", cls: "bg-amber-400 text-slate-950", icon: <Crown size={14} /> },
//   BUNDLE: { label: "BUNDLE", cls: "bg-sky-400 text-slate-950", icon: <Sparkles size={14} /> },
// };

// const marketChip = (code: MarketCodeUI) => (
//   <span key={code} className={pill}>
//     <Layers size={14} className="text-emerald-400" />
//     {code}
//   </span>
// );

// const Divider = () => <div className="h-px w-full bg-slate-800/80" />;

// const PlanMetric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
//   icon,
//   label,
//   value,
// }) => (
//   <div className="flex items-center gap-2 text-xs text-slate-300">
//     <span className="text-emerald-400">{icon}</span>
//     <span className="text-slate-500">{label}:</span>
//     <span className="font-semibold text-slate-200">{value}</span>
//   </div>
// );

// // ---- helpers to interpret backend plan ----
// function featuresToMap(features: Array<{ featureKey: string; featureValue: string }>) {
//   const m: Record<string, string> = {};
//   for (const f of features ?? []) m[f.featureKey] = String(f.featureValue);
//   return m;
// }

// function toTierFromMetadata(name: string, metadata: any, planTypeCode?: string | null): PlanTier {
//   const tier = String(metadata?.tier ?? "").toUpperCase();
//   if (tier === "BASIC" || tier === "PRO" || tier === "ELITE" || tier === "BUNDLE") return tier;
//   if (planTypeCode === "BUNDLE") return "BUNDLE";
//   const n = String(name || "").toLowerCase();
//   if (n.includes("elite")) return "ELITE";
//   if (n.includes("pro")) return "PRO";
//   if (n.includes("bundle")) return "BUNDLE";
//   return "BASIC";
// }

// function deriveMarketCodes(plan: any): { isMulti: boolean; marketCodes: MarketCodeUI[] } {
//   const md = plan?.metadata ?? {};
//   const looksMulti =
//     plan?.marketId == null ||
//     md?.includes === "multi" ||
//     /bundle|all/i.test(String(plan?.name ?? ""));
//   if (looksMulti) return { isMulti: true, marketCodes: ALL_MARKETS };

//   const code = plan?.market?.code;
//   if (code === "FOREX") return { isMulti: false, marketCodes: ["FOREX"] };
//   if (code === "CRYPTO") return { isMulti: false, marketCodes: ["CRYPTO"] };
//   if (code === "INDIAN") return { isMulti: false, marketCodes: ["NSE", "BSE"] };

//   return { isMulti: false, marketCodes: [] };
// }

// function pricingForCycle(pricing: any | null, cycle: BillingCycle) {
//   if (!pricing) return null;
//   const interval = String(pricing.interval || "").toLowerCase();
//   if (cycle === "MONTHLY" && interval !== "monthly") return null;
//   if (cycle === "YEARLY" && interval !== "yearly") return null;
//   return pricing;
// }

// function strategyMeta(s: any) {
//   return s?.metadata ?? s?.defaultParams ?? s?.default_params ?? {};
// }

// function planStrategiesToUI(plan: any) {
//   const ps = Array.isArray(plan?.planStrategies) ? plan.planStrategies : [];

//   // When backend joins: ps[i].strategy exists
//   const joinedStrategies = ps.map((x: any) => x?.strategy).filter(Boolean);

//   // When backend does NOT join: we still have strategyId(s)
//   const ids = ps
//     .map((x: any) => x?.strategyId ?? x?.strategy_id ?? x?.strategy?.id)
//     .filter((x: any) => x != null)
//     .map((x: any) => String(x));

//   const uniqueIds = Array.from(new Set(ids));

//   return {
//     count: ps.length,
//     strategyIds: uniqueIds,
//     strategies: joinedStrategies,
//     hasJoined: joinedStrategies.length > 0,
//   };
// }

// function summaryFromStrategies(strategies: any[]) {
//   const count = strategies.length;

//   const catsAll = Array.from(new Set(strategies.map((s) => s?.category).filter(Boolean)));
//   const cats = catsAll.slice(0, 3);

//   const metas = strategies.map((s) => strategyMeta(s));
//   const avgReturn = count ? metas.reduce((a, m) => a + numish(m.avgMonthlyReturnPct, 0), 0) / count : 0;
//   const avgWin = count ? metas.reduce((a, m) => a + numish(m.winRatePct, 0), 0) / count : 0;
//   const avgDd = count ? metas.reduce((a, m) => a + numish(m.maxDrawdownPct, 0), 0) / count : 0;

//   return { count, cats, catsAllCount: catsAll.length, avgReturn, avgWin, avgDd };
// }

// const featurePills = (plan: any, stratCount: number) => {
//   const f = featuresToMap(plan?.features ?? []);
//   const copyTrading = boolish(f.copy_trading);
//   const priority = boolish(f.priority_support);

//   const maxAccounts =
//     plan?.limits?.maxConnectedAccounts ??
//     (f.max_accounts ? numish(f.max_accounts, 0) : 0) ??
//     0;

//   const items: { ok: boolean; label: string; icon: React.ReactNode }[] = [
//     { ok: true, label: `${stratCount} Strategies`, icon: <Flame size={14} className="text-emerald-400" /> },
//     { ok: copyTrading, label: "Copy Trading", icon: <Users size={14} className="text-emerald-400" /> },
//     { ok: priority, label: "Priority", icon: <Star size={14} className="text-emerald-400" /> },
//     { ok: true, label: `Accounts: ${maxAccounts || 0}`, icon: <Layers size={14} className="text-emerald-400" /> },
//   ];

//   return (
//     <div className="mt-3 flex flex-wrap gap-2">
//       {items.map((it) => (
//         <span
//           key={it.label}
//           className={cx(
//             "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
//             it.ok
//               ? "border-emerald-500/30 bg-emerald-500/10 text-slate-200"
//               : "border-slate-800 bg-slate-950/30 text-slate-500"
//           )}
//         >
//           {it.icon}
//           {it.label}
//         </span>
//       ))}
//     </div>
//   );
// };

// function Segmented<T extends string>({
//   label,
//   value,
//   options,
//   onChange,
// }: {
//   label: string;
//   value: T;
//   options: { value: T; label: string }[];
//   onChange: (v: T) => void;
// }) {
//   return (
//     <div className="flex items-center gap-2">
//       <span className="text-[11px] text-slate-500">{label}</span>
//       <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/40 p-1">
//         {options.map((opt) => {
//           const active = opt.value === value;
//           return (
//             <button
//               key={opt.value}
//               type="button"
//               onClick={() => onChange(opt.value)}
//               className={cx(
//                 "px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition",
//                 active ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-slate-100"
//               )}
//               aria-pressed={active}
//             >
//               {opt.label}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function ChipGroup<T extends string>({
//   label,
//   value,
//   options,
//   onChange,
// }: {
//   label: string;
//   value: T;
//   options: { value: T; label: string; hint?: string }[];
//   onChange: (v: T) => void;
// }) {
//   return (
//     <div>
//       <p className="mb-2 text-[11px] font-semibold text-slate-400">{label}</p>
//       <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//         {options.map((opt) => {
//           const active = opt.value === value;
//           return (
//             <button
//               key={opt.value}
//               type="button"
//               onClick={() => onChange(opt.value)}
//               className={cx(
//                 "shrink-0 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition",
//                 active
//                   ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
//                   : "border-slate-800 bg-slate-950/35 text-slate-300 hover:border-slate-700 hover:text-slate-100"
//               )}
//               aria-pressed={active}
//               title={opt.hint}
//             >
//               {opt.label}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function PlansFiltersSection({
//   search,
//   setSearch,
//   cycle,
//   setCycle,
//   marketFilter,
//   setMarketFilter,
//   typeFilter,
//   setTypeFilter,
// }: {
//   search: string;
//   setSearch: (v: string) => void;
//   cycle: BillingCycle;
//   setCycle: (v: BillingCycle) => void;
//   marketFilter: MarketFilter;
//   setMarketFilter: (v: MarketFilter) => void;
//   typeFilter: PlanTier | "ALL";
//   setTypeFilter: (v: PlanTier | "ALL") => void;
// }) {
//   const hasActive =
//     search.trim().length > 0 || marketFilter !== "ALL" || typeFilter !== "ALL" || cycle !== "MONTHLY";

//   return (
//     <div className={cx(cardBase, "p-4 md:p-5")}>
//       <div className="flex items-center justify-between gap-3">
//         <div className="flex items-center gap-2">
//           <div className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-center">
//             <Filter size={16} className="text-emerald-400" />
//           </div>
//           <div>
//             <p className="text-sm font-semibold text-slate-200">Filters</p>
//             <p className="text-[11px] text-slate-500">Search and narrow down by billing, market and tier.</p>
//           </div>
//         </div>

//         {hasActive ? (
//           <button
//             type="button"
//             onClick={() => {
//               setSearch("");
//               setCycle("MONTHLY");
//               setMarketFilter("ALL");
//               setTypeFilter("ALL");
//             }}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
//           >
//             <X size={14} className="text-slate-400" />
//             Clear
//           </button>
//         ) : null}
//       </div>

//       <div className="mt-4 grid gap-4">
//         <div className="grid md:grid-cols-[1fr,auto] gap-3 items-center">
//           <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
//             <Search size={16} className="text-slate-500" />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search plans… (e.g. Forex, Bundle, Pro)"
//               className="w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500"
//             />
//             {search.trim().length > 0 ? (
//               <button
//                 type="button"
//                 onClick={() => setSearch("")}
//                 className="rounded-lg border border-slate-800 bg-slate-950/30 p-2 hover:bg-slate-900/60 transition"
//                 aria-label="Clear search"
//               >
//                 <X size={14} className="text-slate-400" />
//               </button>
//             ) : null}
//           </div>

//           <div className="flex md:justify-end">
//             <Segmented<BillingCycle>
//               label="Billing"
//               value={cycle}
//               onChange={setCycle}
//               options={[
//                 { value: "MONTHLY", label: "MONTHLY" },
//                 { value: "YEARLY", label: "YEARLY" },
//               ]}
//             />
//           </div>
//         </div>

//         <div className="grid md:grid-cols-2 gap-4">
//           <ChipGroup<MarketFilter>
//             label="Market"
//             value={marketFilter}
//             onChange={setMarketFilter}
//             options={[
//               { value: "ALL", label: "ALL" },
//               { value: "NSE", label: "NSE" },
//               { value: "BSE", label: "BSE" },
//               { value: "FOREX", label: "FOREX" },
//               { value: "CRYPTO", label: "CRYPTO" },
//               { value: "MULTI", label: "ALL (Multi)", hint: "marketId is NULL / includes=multi" },
//             ]}
//           />

//           <ChipGroup<PlanTier | "ALL">
//             label="Tier"
//             value={typeFilter}
//             onChange={setTypeFilter}
//             options={[
//               { value: "ALL", label: "ALL" },
//               { value: "BASIC", label: "BASIC" },
//               { value: "PRO", label: "PRO" },
//               { value: "ELITE", label: "ELITE" },
//               { value: "BUNDLE", label: "BUNDLE" },
//             ]}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// function StrategiesSlider({
//   plan,
//   psUI,
// }: {
//   plan: any;
//   psUI: ReturnType<typeof planStrategiesToUI>;
// }) {
//   const byId = useMemo(() => {
//     const m = new Map<string, any>();
//     for (const s of psUI.strategies) {
//       const id = String(s?.id ?? "");
//       if (id) m.set(id, s);
//     }
//     return m;
//   }, [psUI.strategies]);

//   const items = useMemo(() => {
//     // Prefer joined strategies if backend includes them.
//     if (psUI.hasJoined && psUI.strategies.length) return psUI.strategies.map((s:any) => ({ id: String(s.id), strategy: s }));

//     // Otherwise, create placeholders from strategyIds so the slider isn't empty.
//     return psUI.strategyIds.map((id:any) => ({ id, strategy: byId.get(id) ?? null }));
//   }, [psUI.hasJoined, psUI.strategies, psUI.strategyIds, byId]);

//   if (psUI.count === 0) {
//     return (
//       <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
//         <p className="text-[11px] text-slate-500 flex items-center gap-2">
//           <Flame size={14} className="text-emerald-400" />
//           Strategies included
//         </p>
//         <p className="mt-2 text-[11px] text-slate-400">No strategies in this plan.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
//       <div className="flex items-center justify-between gap-3">
//         <p className="text-[11px] text-slate-500 flex items-center gap-2">
//           <Flame size={14} className="text-emerald-400" />
//           Strategies included
//         </p>
//         <span className="text-[11px] text-slate-500">
//           {psUI.count} mapped
//           {!psUI.hasJoined ? <span className="ml-2 text-slate-600">(details not joined)</span> : null}
//         </span>
//       </div>

//       <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//         {items.map((it:any) => {
//           const s = it.strategy;
//           const meta = s ? strategyMeta(s) : null;

//           const title = s?.name ?? `Strategy #${it.id}`;
//           const category = s?.category ?? "—";
//           const avgRet = meta ? numish(meta.avgMonthlyReturnPct, NaN) : NaN;
//           const win = meta ? numish(meta.winRatePct, NaN) : NaN;
//           const dd = meta ? numish(meta.maxDrawdownPct, NaN) : NaN;

//           return (
//             <div
//               key={it.id}
//               className="min-w-[260px] snap-start rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
//             >
//               <div className="flex items-start justify-between gap-2">
//                 <div>
//                   <p className="text-sm font-semibold text-slate-100">{title}</p>
//                   <p className="text-[11px] text-slate-500 mt-1">
//                     {s ? `Category: ${category}` : "Mapped, but details not returned by API"}
//                   </p>
//                 </div>
//                 <span className="text-[10px] rounded-full border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-400">
//                   ID {it.id}
//                 </span>
//               </div>

//               <div className="mt-3 grid grid-cols-3 gap-2">
//                 <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
//                   <p className="text-[10px] text-slate-500">Return</p>
//                   <p className="text-sm font-extrabold text-slate-100">
//                     {Number.isFinite(avgRet) ? formatPct(avgRet) : "—"}
//                   </p>
//                 </div>
//                 <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
//                   <p className="text-[10px] text-slate-500">Win</p>
//                   <p className="text-sm font-extrabold text-slate-100">
//                     {Number.isFinite(win) ? formatPct(win) : "—"}
//                   </p>
//                 </div>
//                 <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
//                   <p className="text-[10px] text-slate-500">DD</p>
//                   <p className="text-sm font-extrabold text-slate-100">
//                     {Number.isFinite(dd) ? formatPct(dd) : "—"}
//                   </p>
//                 </div>
//               </div>

//               {!psUI.hasJoined ? (
//                 <p className="mt-3 text-[11px] text-slate-500">
//                   Fix: backend should return <b>planStrategies.strategy</b> (join strategy).
//                 </p>
//               ) : null}
//             </div>
//           );
//         })}
//       </div>

//       {!psUI.hasJoined ? (
//         <div className="mt-2 text-[11px] text-slate-500">
//           Right now your API returns only <b>planStrategies.strategyId</b>. That’s why earlier the slider was empty
//           (UI was doing <code>ps.map(x =&gt; x.strategy)</code> → all undefined).
//         </div>
//       ) : null}
//     </div>
//   );
// }

// export default function SubscriptionPlansMarketplaceV3() {
//   const [search, setSearch] = useState("");
//   const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
//   const [typeFilter, setTypeFilter] = useState<PlanTier | "ALL">("ALL");
//   const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

//   const [selectedPlanId, setSelectedPlanId] = useState<string>("");
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   const {
//     data,
//     isLoading,
//     isFetching,
//     isError,
//     error,
//     refetch,
//   } = useListActivePlansQuery({
//     chunkSize: 200,
//     initialOffset: 0,
//     isActive: true,
//   });

//   // ✅ handle multiple API response shapes safely
//   const rawPlans: any[] = useMemo(() => {
//     const d: any = data;
//     if (!d) return [];
//     if (Array.isArray(d.rows)) return d.rows;
//     if (Array.isArray(d.data?.rows)) return d.data.rows;
//     if (Array.isArray(d.data?.[0])) return d.data[0];
//     if (Array.isArray(d?.[0])) return d[0];
//     if (Array.isArray(d.data)) return d.data;
//     return [];
//   }, [data]);

//   // client-side filter + normalize tier/market
//   const filteredPlans = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     return rawPlans
//       .filter((p: any) => p?.isActive)
//       .filter((p: any) => {
//         if (!q) return true;
//         const hay = `${p?.name} ${p?.description ?? ""} ${p?.market?.code ?? ""} ${p?.planType?.code ?? ""}`.toLowerCase();
//         return hay.includes(q);
//       })
//       .filter((p: any) => {
//         const tier = toTierFromMetadata(p?.name, p?.metadata, p?.planType?.code);
//         if (typeFilter === "ALL") return true;
//         return tier === typeFilter;
//       })
//       .filter((p: any) => {
//         const { isMulti, marketCodes } = deriveMarketCodes(p);
//         if (marketFilter === "ALL") return true;
//         if (marketFilter === "MULTI") return isMulti;
//         return marketCodes.includes(marketFilter);
//       });
//   }, [rawPlans, search, typeFilter, marketFilter]);

//   // auto select first plan
//   useEffect(() => {
//     if (!selectedPlanId && filteredPlans.length) setSelectedPlanId(filteredPlans[0].id);
//   }, [filteredPlans, selectedPlanId]);

//   const selectedPlanPreview =
//     filteredPlans.find((p: any) => p?.id === selectedPlanId) ??
//     rawPlans.find((p: any) => p?.id === selectedPlanId) ??
//     null;

//   // ✅ IMPORTANT CHANGE:
//   // Fetch plan details ONLY when drawer is open.
//   // This guarantees you will SEE an API call when opening the drawer, and you get latest mappings.
//   const {
//     data: selectedPlanFull,
//     isFetching: isFetchingPlan,
//     isError: isPlanError,
//     error: planError,
//     refetch: refetchPlan,
//   } = useGetPlanByIdQuery(selectedPlanId, {
//     skip: !drawerOpen || !selectedPlanId,
//     refetchOnMountOrArgChange: true,
//   });

//   // Use full only in drawer, preview elsewhere
//   const selectedPlanForDrawer = selectedPlanFull ?? selectedPlanPreview;

//   const selectedPlanForSidebar = selectedPlanPreview;

//   const selectedTier = selectedPlanForSidebar
//     ? toTierFromMetadata(selectedPlanForSidebar.name, selectedPlanForSidebar.metadata, selectedPlanForSidebar.planType?.code)
//     : "BASIC";

//   const selectedMarkets = selectedPlanForSidebar ? deriveMarketCodes(selectedPlanForSidebar) : { isMulti: false, marketCodes: [] };

//   const selectedPSPreview = selectedPlanForSidebar ? planStrategiesToUI(selectedPlanForSidebar) : { count: 0, strategyIds: [], strategies: [], hasJoined: false };
//   const selectedSummary = selectedPSPreview.strategies.length ? summaryFromStrategies(selectedPSPreview.strategies) : { count: 0, cats: [], catsAllCount: 0, avgReturn: 0, avgWin: 0, avgDd: 0 };

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
//       {/* Header */}
//       <div className="relative overflow-hidden">
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
//         <div className={`${container} pt-14 md:pt-20 pb-8 relative`}>
//           <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
//             <div className="inline-flex items-center gap-2 text-[11px] text-slate-300 border border-slate-800 bg-slate-900/40 px-3 py-1 rounded-full">
//               <Shield size={14} className="text-emerald-400" />
//               Only Plans • Strategies are part of plan
//             </div>

//             <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
//               Choose a <span className="text-emerald-400">Plan</span>
//             </h1>
//             <p className="mt-2 text-slate-400 max-w-2xl">
//               Plans are market-specific (FOREX/CRYPTO/INDIAN) or multi-market (marketId NULL).
//             </p>
//           </motion.div>

//           <div className="mt-6">
//             <PlansFiltersSection
//               search={search}
//               setSearch={setSearch}
//               cycle={cycle}
//               setCycle={setCycle}
//               marketFilter={marketFilter}
//               setMarketFilter={setMarketFilter}
//               typeFilter={typeFilter}
//               setTypeFilter={setTypeFilter}
//             />
//           </div>

//           <div className="mt-4">
//             {isLoading ? (
//               <div className={`${cardBase} p-4 flex items-center gap-3`}>
//                 <RefreshCw className="animate-spin text-emerald-400" size={18} />
//                 <div>
//                   <p className="text-sm font-semibold text-slate-200">Loading plans…</p>
//                   <p className="text-[11px] text-slate-500">Fetching from server</p>
//                 </div>
//               </div>
//             ) : isError ? (
//               <div className={`${cardBase} p-4 flex items-start justify-between gap-3`}>
//                 <div>
//                   <p className="text-sm font-semibold text-red-300">Failed to load plans</p>
//                   <p className="text-[11px] text-slate-500 mt-1">
//                     {(error as any)?.data?.message || (error as any)?.message || "Unknown error"}
//                   </p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => refetch()}
//                   className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
//                 >
//                   <RefreshCw size={14} />
//                   Retry
//                 </button>
//               </div>
//             ) : null}
//           </div>
//         </div>
//       </div>

//       {/* Body */}
//       <div className={`${container} mt-6 grid lg:grid-cols-[1fr,380px] gap-6`}>
//         {/* Plans grid */}
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <p className="text-sm text-slate-300 font-semibold">
//               {filteredPlans.length} plan{filteredPlans.length === 1 ? "" : "s"} available
//               {isFetching ? <span className="ml-2 text-[11px] text-slate-500">(refreshing…)</span> : null}
//             </p>
//             <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
//               <Info size={14} />
//               Click a plan to preview + select
//             </div>
//           </div>

//           <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
//             {filteredPlans.map((p: any) => {
//               const tier = toTierFromMetadata(p.name, p.metadata, p.planType?.code);
//               const t = planTypeMeta[tier];
//               const mk = deriveMarketCodes(p);
//               const price = pricingForCycle(p.pricing, cycle);

//               const ps = planStrategiesToUI(p);
//               const canShowStrategyDetails = ps.strategies.length > 0;
//               const sum = canShowStrategyDetails ? summaryFromStrategies(ps.strategies) : null;

//               const isSelected = selectedPlanPreview?.id === p.id;

//               return (
//                 <motion.button
//                   key={p.id}
//                   type="button"
//                   onClick={() => {
//                     setSelectedPlanId(p.id);
//                     setDrawerOpen(true);
//                   }}
//                   whileHover={{ y: -2 }}
//                   className={cx(
//                     "relative text-left",
//                     cardBase,
//                     "p-5 transition",
//                     isSelected
//                       ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 border-emerald-500"
//                       : "hover:border-slate-700"
//                   )}
//                 >
//                   <div
//                     className={cx(
//                       "absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-2",
//                       t.cls
//                     )}
//                   >
//                     {t.icon}
//                     {t.label}
//                   </div>

//                   <div className="flex items-start justify-between gap-3">
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <Layers size={18} className="text-emerald-400" />
//                         <h3 className="text-base font-semibold">{p.name}</h3>
//                       </div>
//                       <p className="text-xs text-slate-500 mt-1">{p.description ?? ""}</p>
//                     </div>
//                     <ChevronRight className="text-slate-600 mt-1" size={18} />
//                   </div>

//                   <div className="mt-3 flex flex-wrap gap-2">
//                     {(mk.isMulti ? ALL_MARKETS : mk.marketCodes).map((m) => marketChip(m))}
//                     {mk.isMulti ? (
//                       <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300">
//                         <BadgeCheck size={14} className="text-emerald-400" />
//                         Multi-market
//                       </span>
//                     ) : null}
//                   </div>

//                   <div className="mt-4">
//                     <div className="text-2xl font-extrabold text-emerald-400">
//                       {price?.isFree ? "FREE" : price ? formatINR(price.priceInr) : "—"}
//                       <span className="text-xs font-semibold text-slate-400 ml-2">
//                         /{cycle === "MONTHLY" ? "mo" : "yr"}
//                       </span>
//                     </div>
//                   </div>

//                   {featurePills(p, ps.count)}

//                   <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
//                     <p className="text-[11px] text-slate-500 flex items-center gap-2">
//                       <Flame size={14} className="text-emerald-400" />
//                       Strategies included
//                     </p>

//                     {ps.count === 0 ? (
//                       <p className="mt-2 text-[11px] text-slate-400">Not included in this plan.</p>
//                     ) : (
//                       <>
//                         <div className="mt-2 grid grid-cols-3 gap-2">
//                           <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
//                             <p className="text-[10px] text-slate-500">Count</p>
//                             <p className="text-sm font-extrabold text-slate-100">{ps.count}</p>
//                           </div>
//                           <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
//                             <p className="text-[10px] text-slate-500">Avg return</p>
//                             <p className="text-sm font-extrabold text-slate-100">
//                               {canShowStrategyDetails ? formatPct(sum!.avgReturn) : "—"}
//                             </p>
//                           </div>
//                           <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
//                             <p className="text-[10px] text-slate-500">Avg win</p>
//                             <p className="text-sm font-extrabold text-slate-100">
//                               {canShowStrategyDetails ? formatPct(sum!.avgWin) : "—"}
//                             </p>
//                           </div>
//                         </div>
//                         {!canShowStrategyDetails ? (
//                           <p className="mt-2 text-[11px] text-slate-500">
//                             (Backend is not joining strategy details yet — showing only count.)
//                           </p>
//                         ) : null}
//                       </>
//                     )}
//                   </div>

//                   <div className="mt-4 space-y-2">
//                     <PlanMetric icon={<Gauge size={14} />} label="Plan type" value={p.planType?.code ?? "—"} />
//                     <PlanMetric icon={<Wallet size={14} />} label="Market" value={p.market?.code ?? "MULTI"} />
//                   </div>
//                 </motion.button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Right sticky selection */}
//         <div className="lg:sticky lg:top-6 h-fit space-y-4">
//           <div className={`${cardBase} p-5`}>
//             <div className="flex items-center justify-between">
//               <h3 className="text-sm font-semibold text-slate-200">Selected Plan</h3>
//               {selectedPlanForSidebar ? <span className="text-[11px] text-slate-500">{selectedTier}</span> : null}
//             </div>

//             <Divider />

//             {!selectedPlanForSidebar ? (
//               <div className="py-6 text-center">
//                 <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
//                   <Shield className="text-emerald-400" />
//                 </div>
//                 <p className="mt-3 text-sm text-slate-300 font-semibold">Pick a plan</p>
//               </div>
//             ) : (
//               <div className="pt-4 space-y-3">
//                 <div>
//                   <p className="text-xs text-slate-500">Plan</p>
//                   <p className="text-sm font-semibold text-slate-100">{selectedPlanForSidebar.name}</p>
//                   <p className="text-xs text-slate-500 mt-1">{selectedPlanForSidebar.description ?? ""}</p>
//                 </div>

//                 <div className="flex items-end justify-between">
//                   <div>
//                     <p className="text-xs text-slate-500">{cycle === "MONTHLY" ? "Monthly" : "Yearly"}</p>
//                     <p className="text-2xl font-extrabold text-emerald-400">
//                       {pricingForCycle(selectedPlanForSidebar.pricing, cycle)?.isFree
//                         ? "FREE"
//                         : pricingForCycle(selectedPlanForSidebar.pricing, cycle)
//                         ? formatINR(pricingForCycle(selectedPlanForSidebar.pricing, cycle)!.priceInr)
//                         : "—"}
//                       <span className="text-xs font-semibold text-slate-400 ml-2">
//                         /{cycle === "MONTHLY" ? "mo" : "yr"}
//                       </span>
//                     </p>
//                   </div>
//                   <button
//                     className="rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 font-semibold px-3 py-2 hover:bg-slate-900/60 transition text-xs"
//                     onClick={() => setDrawerOpen(true)}
//                   >
//                     View details
//                   </button>
//                 </div>

//                 {featurePills(selectedPlanForSidebar, selectedPSPreview.count)}

//                 <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
//                   <p className="text-[11px] text-slate-500 flex items-center gap-2">
//                     <BarChart3 size={14} className="text-emerald-400" />
//                     Strategy summary (included)
//                   </p>
//                   {selectedPSPreview.count === 0 ? (
//                     <p className="mt-2 text-[11px] text-slate-400">No strategies in this plan.</p>
//                   ) : (
//                     <div className="mt-2 grid grid-cols-3 gap-2">
//                       <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
//                         <p className="text-[10px] text-slate-500">Count</p>
//                         <p className="text-sm font-extrabold text-slate-100">{selectedPSPreview.count}</p>
//                       </div>
//                       <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
//                         <p className="text-[10px] text-slate-500">Avg return</p>
//                         <p className="text-sm font-extrabold text-slate-100">
//                           {selectedPSPreview.strategies.length ? formatPct(selectedSummary.avgReturn) : "—"}
//                         </p>
//                       </div>
//                       <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
//                         <p className="text-[10px] text-slate-500">Avg win</p>
//                         <p className="text-sm font-extrabold text-slate-100">
//                           {selectedPSPreview.strategies.length ? formatPct(selectedSummary.avgWin) : "—"}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <button
//                   className="mt-1 w-full rounded-xl font-extrabold py-3 transition flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
//                   onClick={() => alert(`Continue with: ${selectedPlanForSidebar.name}`)}
//                 >
//                   <CheckCircle size={18} />
//                   Continue
//                 </button>

//                 <div className="mt-2 text-[11px] text-slate-500">
//                   Markets: {selectedMarkets.isMulti ? "ALL" : selectedMarkets.marketCodes.join(", ")}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Drawer */}
//       <AnimatePresence>
//         {drawerOpen && (selectedPlanForDrawer || selectedPlanPreview) && (
//           <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//             <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />

//             <motion.div
//               initial={{ x: 520 }}
//               animate={{ x: 0 }}
//               exit={{ x: 520 }}
//               transition={{ type: "spring", stiffness: 240, damping: 28 }}
//               className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-slate-950 border-l border-slate-800 p-6 overflow-y-auto"
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <h3 className="text-xl font-semibold">{(selectedPlanForDrawer ?? selectedPlanPreview)?.name}</h3>
//                   <p className="text-sm text-slate-400 mt-1">{(selectedPlanForDrawer ?? selectedPlanPreview)?.description ?? ""}</p>
//                 </div>

//                 <button
//                   onClick={() => setDrawerOpen(false)}
//                   className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 hover:bg-slate-900/70"
//                 >
//                   <X />
//                 </button>
//               </div>

//               <div className="mt-4">
//                 {isFetchingPlan ? (
//                   <div className={`${cardBase} p-4 flex items-center gap-3`}>
//                     <RefreshCw className="animate-spin text-emerald-400" size={18} />
//                     <div>
//                       <p className="text-sm font-semibold text-slate-200">Loading plan details…</p>
//                       <p className="text-[11px] text-slate-500">Fetching /plans/{selectedPlanId}</p>
//                     </div>
//                   </div>
//                 ) : isPlanError ? (
//                   <div className={`${cardBase} p-4 flex items-start justify-between gap-3`}>
//                     <div>
//                       <p className="text-sm font-semibold text-red-300">Failed to load plan details</p>
//                       <p className="text-[11px] text-slate-500 mt-1">
//                         {(planError as any)?.data?.message || (planError as any)?.message || "Unknown error"}
//                       </p>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => refetchPlan()}
//                       className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slateopi-900/60 transition"
//                     >
//                       <RefreshCw size={14} />
//                       Retry
//                     </button>
//                   </div>
//                 ) : null}
//               </div>

//               {/* ✅ Slider: never empty (shows placeholders if details are not joined) */}
//               <div className="mt-5">
//                 {(() => {
//                   const planObj = selectedPlanForDrawer ?? selectedPlanPreview;
//                   const psUI = planStrategiesToUI(planObj);
//                   return <StrategiesSlider plan={planObj} psUI={psUI} />;
//                 })()}
//               </div>

//               <div className="mt-6 text-[11px] text-slate-500">
//                 If you want full strategy cards (return/win/DD), update backend to return{" "}
//                 <b>planStrategies.strategy</b> (join strategy). Right now the UI can only reliably show IDs/count.
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className={`${container} mt-10`}>
//         <div className={`${cardBase} p-5 flex items-start gap-3`}>
//           <Info className="text-emerald-400 mt-0.5" size={18} />
//           <div>
//             <p className="text-sm font-semibold">Why the slider was empty + “no API call”</p>
//             <p className={subtle}>
//               Your response has <b>planStrategies</b> with only <b>strategyId</b> (no <b>strategy</b> object). Earlier code
//               did <code>planStrategies.map(x =&gt; x.strategy)</code>, so it produced an empty array → empty slider.
//               Also, your plan-by-id query was running even before opening drawer due to caching, so opening drawer didn’t
//               show a new network call. This version fetches plan details only when the drawer opens.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// SubscriptionPlansMarketplaceV3.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  Flame,
  Gauge,
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

// ✅ Plans + subscribe flow (use these)
import {
  useGetMyCurrentSubscriptionQuery,
  useSubscribeToPlanMutation,
  useListActivePlansQuery,
  useGetPlanByIdQuery,
} from "../../services/profileSubscription.api";

// ✅ Billing must use this service (your message)
import {
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
} from "../../services/userApi";

type BillingCycle = "MONTHLY" | "YEARLY";
type PlanTier = "BASIC" | "PRO" | "ELITE" | "BUNDLE";
type MarketCodeUI = "NSE" | "BSE" | "FOREX" | "CRYPTO";
type MarketFilter = "ALL" | "MULTI" | MarketCodeUI;

type CheckoutStep = "AGREEMENT" | "BILLING" | "SUBSCRIBE";

const STORAGE_KEY = "subscription_marketplace_v3_flow";

const container = "max-w-6xl mx-auto px-5 md:px-8";
const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const subtle = "text-slate-400 text-xs md:text-sm leading-relaxed";
const pill =
  "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300";

const ALL_MARKETS: MarketCodeUI[] = ["NSE", "BSE", "FOREX", "CRYPTO"];

const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const formatPct = (n: number) => `${Number.isFinite(n) ? n.toFixed(1) : "—"}%`;
const cx = (...cls: Array<string | false | undefined | null>) =>
  cls.filter(Boolean).join(" ");

const boolish = (v: any) => v === true || v === "true" || v === 1 || v === "1";
const numish = (v: any, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
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
  BASIC: {
    label: "BASIC",
    cls: "bg-slate-200 text-slate-950",
    icon: <Zap size={14} />,
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

const marketChip = (code: MarketCodeUI) => (
  <span key={code} className={pill}>
    <Layers size={14} className="text-emerald-400" />
    {code}
  </span>
);

const Divider = () => <div className="h-px w-full bg-slate-800/80" />;

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

// ---- helpers ----
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
  if (tier === "BASIC" || tier === "PRO" || tier === "ELITE" || tier === "BUNDLE")
    return tier;
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
    plan?.marketId == null ||
    md?.includes === "multi" ||
    /bundle|all/i.test(String(plan?.name ?? ""));

  if (looksMulti) return { isMulti: true, marketCodes: ALL_MARKETS };

  const codeA = plan?.market?.code; // new schema
  const codeB = plan?.category; // old schema (FOREX/CRYPTO/INDIA)
  const code = codeA || codeB;

  if (code === "FOREX") return { isMulti: false, marketCodes: ["FOREX"] };
  if (code === "CRYPTO") return { isMulti: false, marketCodes: ["CRYPTO"] };
  if (code === "INDIAN" || code === "INDIA")
    return { isMulti: false, marketCodes: ["NSE", "BSE"] };

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
    return {
      isFree: !!plan?.pricing?.isFree,
      priceInr: Number.isFinite(Number(plan?.pricing?.priceInr))
        ? Number(plan.pricing.priceInr)
        : null,
    };
  }
  const cents = Number(plan?.priceCents);
  const isFree = cents === 0 || plan?.isFree === true;
  if (!Number.isFinite(cents)) return { isFree, priceInr: null };
  return { isFree, priceInr: cents / 100 };
}

function cycleToInterval(cycle: BillingCycle) {
  return cycle === "MONTHLY" ? "monthly" : "yearly";
}

function strategyMeta(s: any) {
  return s?.metadata ?? s?.defaultParams ?? s?.default_params ?? {};
}

function planStrategiesToUI(plan: any) {
  const ps = Array.isArray(plan?.planStrategies) ? plan.planStrategies : [];
  const joinedStrategies = ps.map((x: any) => x?.strategy).filter(Boolean);
  const ids = ps
    .map((x: any) => x?.strategyId ?? x?.strategy_id ?? x?.strategy?.id)
    .filter((x: any) => x != null)
    .map((x: any) => String(x));
  const uniqueIds = Array.from(new Set(ids));

  return {
    count: ps.length,
    strategyIds: uniqueIds,
    strategies: joinedStrategies,
    hasJoined: joinedStrategies.length > 0,
  };
}

function summaryFromStrategies(strategies: any[]) {
  const count = strategies.length;
  const catsAll = Array.from(
    new Set(strategies.map((s) => s?.category).filter(Boolean))
  );
  const cats = catsAll.slice(0, 3);

  const metas = strategies.map((s) => strategyMeta(s));
  const avgReturn = count
    ? metas.reduce((a, m) => a + numish(m.avgMonthlyReturnPct, 0), 0) / count
    : 0;
  const avgWin = count
    ? metas.reduce((a, m) => a + numish(m.winRatePct, 0), 0) / count
    : 0;
  const avgDd = count
    ? metas.reduce((a, m) => a + numish(m.maxDrawdownPct, 0), 0) / count
    : 0;

  return { count, cats, catsAllCount: catsAll.length, avgReturn, avgWin, avgDd };
}

const featurePills = (plan: any, stratCount: number) => {
  const f = getFeatureFlags(plan);

  const copyTrading =
    boolish(f.copy_trading) || boolish(f.copyTrading) || boolish(f.isCopyTrading);
  const priority =
    boolish(f.priority_support) || boolish(f.prioritySupport) || boolish(f.priority);

  const maxAccounts =
    plan?.limits?.maxConnectedAccounts ??
    plan?.maxConnectedAccounts ??
    (f.max_accounts ? numish(f.max_accounts, 0) : 0) ??
    0;

  const items: { ok: boolean; label: string; icon: React.ReactNode }[] = [
    {
      ok: true,
      label: `${stratCount} Strategies`,
      icon: <Flame size={14} className="text-emerald-400" />,
    },
    {
      ok: copyTrading,
      label: "Copy Trading",
      icon: <Users size={14} className="text-emerald-400" />,
    },
    {
      ok: priority,
      label: "Priority",
      icon: <Star size={14} className="text-emerald-400" />,
    },
    {
      ok: true,
      label: `Accounts: ${maxAccounts || 0}`,
      icon: <Layers size={14} className="text-emerald-400" />,
    },
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((it) => (
        <span
          key={it.label}
          className={cx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
            it.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-slate-200"
              : "border-slate-800 bg-slate-950/30 text-slate-500"
          )}
        >
          {it.icon}
          {it.label}
        </span>
      ))}
    </div>
  );
};

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
                active
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300 hover:text-slate-100"
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

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold text-slate-400">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cx(
                "shrink-0 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition",
                active
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                  : "border-slate-800 bg-slate-950/35 text-slate-300 hover:border-slate-700 hover:text-slate-100"
              )}
              aria-pressed={active}
              title={opt.hint}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlansFiltersSection({
  search,
  setSearch,
  cycle,
  setCycle,
  marketFilter,
  setMarketFilter,
  typeFilter,
  setTypeFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  cycle: BillingCycle;
  setCycle: (v: BillingCycle) => void;
  marketFilter: MarketFilter;
  setMarketFilter: (v: MarketFilter) => void;
  typeFilter: PlanTier | "ALL";
  setTypeFilter: (v: PlanTier | "ALL") => void;
}) {
  const hasActive =
    search.trim().length > 0 ||
    marketFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    cycle !== "MONTHLY";

  return (
    <div className={cx(cardBase, "p-4 md:p-5")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-center">
            <Filter size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Filters</p>
            <p className="text-[11px] text-slate-500">
              Search and narrow down by billing, market and tier.
            </p>
          </div>
        </div>

        {hasActive ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCycle("MONTHLY");
              setMarketFilter("ALL");
              setTypeFilter("ALL");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
          >
            <X size={14} className="text-slate-400" />
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid md:grid-cols-[1fr,auto] gap-3 items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plans… (e.g. Forex, Bundle, Pro)"
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

          <div className="flex md:justify-end">
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
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <ChipGroup<MarketFilter>
            label="Market"
            value={marketFilter}
            onChange={setMarketFilter}
            options={[
              { value: "ALL", label: "ALL" },
              { value: "NSE", label: "NSE" },
              { value: "BSE", label: "BSE" },
              { value: "FOREX", label: "FOREX" },
              { value: "CRYPTO", label: "CRYPTO" },
              {
                value: "MULTI",
                label: "ALL (Multi)",
                hint: "marketId is NULL / includes=multi",
              },
            ]}
          />

          <ChipGroup<PlanTier | "ALL">
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
  );
}

function StrategiesSlider({
  psUI,
}: {
  psUI: ReturnType<typeof planStrategiesToUI>;
}) {
  const byId = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of psUI.strategies) {
      const id = String(s?.id ?? "");
      if (id) m.set(id, s);
    }
    return m;
  }, [psUI.strategies]);

  const items = useMemo(() => {
    if (psUI.hasJoined && psUI.strategies.length)
      return psUI.strategies.map((s: any) => ({
        id: String(s.id),
        strategy: s,
      }));

    return psUI.strategyIds.map((id: any) => ({
      id,
      strategy: byId.get(id) ?? null,
    }));
  }, [psUI.hasJoined, psUI.strategies, psUI.strategyIds, byId]);

  if (psUI.count === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-[11px] text-slate-500 flex items-center gap-2">
          <Flame size={14} className="text-emerald-400" />
          Strategies included
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          No strategies in this plan.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 flex items-center gap-2">
          <Flame size={14} className="text-emerald-400" />
          Strategies included
        </p>
        <span className="text-[11px] text-slate-500">
          {psUI.count} mapped
          {!psUI.hasJoined ? (
            <span className="ml-2 text-slate-600">(details not joined)</span>
          ) : null}
        </span>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it: any) => {
          const s = it.strategy;
          const meta = s ? strategyMeta(s) : null;

          const title = s?.name ?? `Strategy #${it.id}`;
          const category = s?.category ?? "—";
          const avgRet = meta ? numish(meta.avgMonthlyReturnPct, NaN) : NaN;
          const win = meta ? numish(meta.winRatePct, NaN) : NaN;
          const dd = meta ? numish(meta.maxDrawdownPct, NaN) : NaN;

          return (
            <div
              key={it.id}
              className="min-w-[260px] snap-start rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {s ? `Category: ${category}` : "Mapped, but details not returned by API"}
                  </p>
                </div>
                <span className="text-[10px] rounded-full border border-slate-800 bg-slate-900/40 px-2 py-1 text-slate-400">
                  ID {it.id}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                  <p className="text-[10px] text-slate-500">Return</p>
                  <p className="text-sm font-extrabold text-slate-100">
                    {Number.isFinite(avgRet) ? formatPct(avgRet) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                  <p className="text-[10px] text-slate-500">Win</p>
                  <p className="text-sm font-extrabold text-slate-100">
                    {Number.isFinite(win) ? formatPct(win) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                  <p className="text-[10px] text-slate-500">DD</p>
                  <p className="text-sm font-extrabold text-slate-100">
                    {Number.isFinite(dd) ? formatPct(dd) : "—"}
                  </p>
                </div>
              </div>

              {!psUI.hasJoined ? (
                <p className="mt-3 text-[11px] text-slate-500">
                  Fix: backend should return <b>planStrategies.strategy</b> (join strategy).
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
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
      {label}
    </div>
  );
}

// ✅ Billing payload keys MUST match your userApi BillingDetailsPayload
type BillingDraft = {
  panNumber?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

const emptyBilling: BillingDraft = {
  panNumber: null,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function SubscriptionPlansMarketplaceV3() {
  // filters
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<PlanTier | "ALL">("ALL");
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

  // selection + drawer
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // checkout wizard
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("AGREEMENT");
  const [agreed, setAgreed] = useState(false);

  // billing draft (persisted)
  const [billingDraft, setBillingDraft] = useState<BillingDraft>(emptyBilling);

  // current subscription
  const { data: currentSubResp, isFetching: isFetchingCurrentSub } =
    useGetMyCurrentSubscriptionQuery();
  const currentSub = (currentSubResp as any)?.data ?? null;

  // plans list (envelope)
  const {
    data: listResp,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useListActivePlansQuery(undefined);

  const rawPlans: any[] = useMemo(() => {
    const d: any = listResp;
    if (!d) return [];
    if (Array.isArray(d?.data)) return d.data; // ✅ this api returns {message, data: []}
    if (Array.isArray(d?.rows)) return d.rows;
    return [];
  }, [listResp]);

  // cycle filter (plan.interval)
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
        const hay = `${p?.name} ${p?.description ?? ""} ${p?.category ?? ""} ${
          p?.executionFlow ?? ""
        } ${(p?.planType?.code ?? p?.planTypeCode ?? p?.planCode ?? "")}`.toLowerCase();
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

  // auto select first plan
  useEffect(() => {
    if (!selectedPlanId && filteredPlans.length) setSelectedPlanId(Number(filteredPlans[0].id));
  }, [filteredPlans, selectedPlanId]);

  const selectedPlanPreview =
    filteredPlans.find((p: any) => Number(p?.id) === Number(selectedPlanId)) ??
    rawPlans.find((p: any) => Number(p?.id) === Number(selectedPlanId)) ??
    null;

  // plan details only when drawer open
  const {
    data: planByIdResp,
    isFetching: isFetchingPlan,
    isError: isPlanError,
    error: planError,
    refetch: refetchPlan,
  } = useGetPlanByIdQuery(Number(selectedPlanId ?? 0), {
    skip: !drawerOpen || !selectedPlanId,
    refetchOnMountOrArgChange: true,
  });

  const selectedPlanFull = (planByIdResp as any)?.data ?? planByIdResp ?? null;
  const selectedPlanForDrawer = selectedPlanFull ?? selectedPlanPreview;
  const selectedPlanForSidebar = selectedPlanPreview;

  const selectedTier = selectedPlanForSidebar
    ? toTierFromMetadata(
        selectedPlanForSidebar.name,
        selectedPlanForSidebar.metadata ?? {},
        selectedPlanForSidebar.planType?.code ?? null
      )
    : "BASIC";

  const selectedMarkets = selectedPlanForSidebar
    ? deriveMarketCodes(selectedPlanForSidebar)
    : { isMulti: false, marketCodes: [] };

  const selectedPSPreview = selectedPlanForSidebar
    ? planStrategiesToUI(selectedPlanForSidebar)
    : { count: 0, strategyIds: [], strategies: [], hasJoined: false };

  const selectedSummary = selectedPSPreview.strategies.length
    ? summaryFromStrategies(selectedPSPreview.strategies)
    : { count: 0, cats: [], catsAllCount: 0, avgReturn: 0, avgWin: 0, avgDd: 0 };

  // subscribe mutation
  const [subscribeToPlan, { isLoading: isSubscribing }] =
    useSubscribeToPlanMutation();

  // ✅ Billing APIs (your userApi)
  const {
    data: billingResp,
    isFetching: isFetchingBilling,
    isError: isBillingError,
    error: billingError,
    refetch: refetchBilling,
  } = useGetBillingDetailsQuery(undefined, { skip: !checkoutOpen });

  const [saveBilling, { isLoading: isSavingBilling }] =
    useSaveBillingDetailsMutation();

  // -------------------------
  // LocalStorage restore
  // -------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (typeof saved.search === "string") setSearch(saved.search);
      if (saved.marketFilter) setMarketFilter(saved.marketFilter);
      if (saved.typeFilter) setTypeFilter(saved.typeFilter);
      if (saved.cycle) setCycle(saved.cycle);
      if (saved.selectedPlanId != null) setSelectedPlanId(Number(saved.selectedPlanId));

      if (typeof saved.checkoutOpen === "boolean") setCheckoutOpen(saved.checkoutOpen);
      if (saved.step) setStep(saved.step);
      if (typeof saved.agreed === "boolean") setAgreed(saved.agreed);

      if (saved.billingDraft && typeof saved.billingDraft === "object")
        setBillingDraft((prev) => ({ ...prev, ...saved.billingDraft }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          search,
          marketFilter,
          typeFilter,
          cycle,
          selectedPlanId,
          checkoutOpen,
          step,
          agreed,
          billingDraft,
        })
      );
    } catch {
      // ignore
    }
  }, [search, marketFilter, typeFilter, cycle, selectedPlanId, checkoutOpen, step, agreed, billingDraft]);

  // ✅ When billing exists on backend, show it in form
  useEffect(() => {
    if (!checkoutOpen) return;
    const data = (billingResp as any)?.data ?? null;
    if (!data) return;

    setBillingDraft((prev) => ({
      ...prev,
      panNumber: data.panNumber ?? prev.panNumber ?? null,
      addressLine1: data.addressLine1 ?? prev.addressLine1,
      addressLine2: data.addressLine2 ?? prev.addressLine2 ?? "",
      city: data.city ?? prev.city,
      state: data.state ?? prev.state,
      pincode: data.pincode ?? prev.pincode,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen, billingResp]);

  const openCheckout = () => {
    if (!selectedPlanForSidebar?.id) {
      toast.info("Please select a plan first.");
      return;
    }

    const status = currentSub?.statusV2 ?? currentSub?.status ?? null;
    if (status === "active" || status === "trialing") {
      toast.info("You already have an active subscription.");
      return;
    }

    setStep(agreed ? "BILLING" : "AGREEMENT");
    setCheckoutOpen(true);
  };

  const closeCheckout = () => setCheckoutOpen(false);

  const resetFlow = () => {
    setCheckoutOpen(false);
    setStep("AGREEMENT");
    setAgreed(false);
    setBillingDraft(emptyBilling);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const goBackStep = () => {
    if (step === "SUBSCRIBE") return setStep("BILLING");
    if (step === "BILLING") return setStep("AGREEMENT");
    setCheckoutOpen(false);
  };

  const onAgreeNext = () => {
    if (!agreed) {
      toast.info("Please accept the agreement to continue.");
      return;
    }
    setStep("BILLING");
  };

  const validateBilling = (b: BillingDraft) => {
    if (!b.addressLine1?.trim()) return "Address Line 1 is required";
    if (!b.city?.trim()) return "City is required";
    if (!b.state?.trim()) return "State is required";
    if (!b.pincode?.trim()) return "Pincode is required";
    return null;
  };

  const onSaveBillingNext = async () => {
    const err = validateBilling(billingDraft);
    if (err) return toast.error(err);

    try {
      await saveBilling({
        panNumber: billingDraft.panNumber ?? null,
        addressLine1: billingDraft.addressLine1,
        addressLine2: billingDraft.addressLine2 ?? null,
        city: billingDraft.city,
        state: billingDraft.state,
        pincode: billingDraft.pincode,
      }).unwrap();

      toast.success("Billing details saved.");
      setStep("SUBSCRIBE");
    } catch (e) {
      notifyError(e, "Failed to save billing details.");
    }
  };

  const onConfirmSubscribe = async () => {
    try {
      const planId = Number(selectedPlanForSidebar?.id);
      if (!planId) return toast.error("Missing planId.");

      await subscribeToPlan({ planId } as any).unwrap();
      toast.success("Subscription activated.");
      setCheckoutOpen(false);

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch (e) {
      notifyError(e, "Failed to subscribe.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className={`${container} pt-14 md:pt-20 pb-8 relative`}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-300 border border-slate-800 bg-slate-900/40 px-3 py-1 rounded-full">
              <Shield size={14} className="text-emerald-400" />
              Agreement • Billing (PAN + Address) • Subscribe (with resume)
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Choose a <span className="text-emerald-400">Plan</span>
            </h1>
            <p className="mt-2 text-slate-400 max-w-2xl">
              Select a plan → accept agreement → fill billing → activate subscription.
            </p>
          </motion.div>

          <div className="mt-6">
            <PlansFiltersSection
              search={search}
              setSearch={setSearch}
              cycle={cycle}
              setCycle={setCycle}
              marketFilter={marketFilter}
              setMarketFilter={setMarketFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
            />
          </div>

          <div className="mt-4">
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
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`${container} mt-6 grid lg:grid-cols-[1fr,380px] gap-6`}>
        {/* Plans grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300 font-semibold">
              {filteredPlans.length} plan{filteredPlans.length === 1 ? "" : "s"} available
              {isFetching ? <span className="ml-2 text-[11px] text-slate-500">(refreshing…)</span> : null}
            </p>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <Info size={14} />
              Click a plan to view details
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPlans.map((p: any) => {
              const tier = toTierFromMetadata(p.name, p.metadata ?? {}, p.planType?.code ?? null);
              const t = planTypeMeta[tier];
              const mk = deriveMarketCodes(p);

              const interval = planInterval(p);
              const wantInterval = cycleToInterval(cycle);
              const showPrice = interval === "lifetime" || !interval || interval === wantInterval;

              const priceObj = priceInInr(p);
              const ps = planStrategiesToUI(p);
              const canShowStrategyDetails = ps.strategies.length > 0;
              const sum = canShowStrategyDetails ? summaryFromStrategies(ps.strategies) : null;

              const isSelected = Number(selectedPlanId) === Number(p.id);

              return (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(Number(p.id));
                    setDrawerOpen(true);
                  }}
                  whileHover={{ y: -2 }}
                  className={cx(
                    "relative text-left",
                    cardBase,
                    "p-5 transition",
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
                        <h3 className="text-base font-semibold">{p.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{p.description ?? ""}</p>
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
                    {!showPrice ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        This plan is <b>{String(interval)}</b>. Switch billing filter to view it.
                      </p>
                    ) : null}
                  </div>

                  {featurePills(p, ps.count)}

                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[11px] text-slate-500 flex items-center gap-2">
                      <Flame size={14} className="text-emerald-400" />
                      Strategies included
                    </p>

                    {ps.count === 0 ? (
                      <p className="mt-2 text-[11px] text-slate-400">Not included in this plan.</p>
                    ) : (
                      <>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                            <p className="text-[10px] text-slate-500">Count</p>
                            <p className="text-sm font-extrabold text-slate-100">{ps.count}</p>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                            <p className="text-[10px] text-slate-500">Avg return</p>
                            <p className="text-sm font-extrabold text-slate-100">
                              {canShowStrategyDetails ? formatPct(sum!.avgReturn) : "—"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                            <p className="text-[10px] text-slate-500">Avg win</p>
                            <p className="text-sm font-extrabold text-slate-100">
                              {canShowStrategyDetails ? formatPct(sum!.avgWin) : "—"}
                            </p>
                          </div>
                        </div>
                        {!canShowStrategyDetails ? (
                          <p className="mt-2 text-[11px] text-slate-500">
                            (Backend is not joining strategy details — showing only count.)
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <PlanMetric
                      icon={<Gauge size={14} />}
                      label="Execution"
                      value={p.executionFlow ?? p.planType?.code ?? p.planCode ?? "—"}
                    />
                    <PlanMetric
                      icon={<Wallet size={14} />}
                      label="Market"
                      value={p.market?.code ?? p.category ?? "MULTI"}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right sticky selection */}
        <div className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className={`${cardBase} p-5`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Selected Plan</h3>
              {selectedPlanForSidebar ? (
                <span className="text-[11px] text-slate-500">{selectedTier}</span>
              ) : null}
            </div>

            <Divider />

            {!selectedPlanForSidebar ? (
              <div className="py-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Shield className="text-emerald-400" />
                </div>
                <p className="mt-3 text-sm text-slate-300 font-semibold">Pick a plan</p>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Plan</p>
                  <p className="text-sm font-semibold text-slate-100">{selectedPlanForSidebar.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedPlanForSidebar.description ?? ""}</p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{cycle === "MONTHLY" ? "Monthly" : "Yearly"}</p>
                    {(() => {
                      const interval = planInterval(selectedPlanForSidebar);
                      const want = cycleToInterval(cycle);
                      const showPrice = interval === "lifetime" || !interval || interval === want;
                      const pObj = priceInInr(selectedPlanForSidebar);

                      return (
                        <p className="text-2xl font-extrabold text-emerald-400">
                          {!showPrice
                            ? "—"
                            : pObj.isFree
                            ? "FREE"
                            : pObj.priceInr != null
                            ? formatINR(pObj.priceInr)
                            : "—"}
                          <span className="text-xs font-semibold text-slate-400 ml-2">
                            /{interval === "yearly" ? "yr" : interval === "lifetime" ? "life" : "mo"}
                          </span>
                        </p>
                      );
                    })()}
                  </div>

                  <button
                    className="rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 font-semibold px-3 py-2 hover:bg-slate-900/60 transition text-xs"
                    onClick={() => setDrawerOpen(true)}
                    type="button"
                  >
                    View details
                  </button>
                </div>

                {featurePills(selectedPlanForSidebar, selectedPSPreview.count)}

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-[11px] text-slate-500 flex items-center gap-2">
                    <BarChart3 size={14} className="text-emerald-400" />
                    Strategy summary (included)
                  </p>
                  {selectedPSPreview.count === 0 ? (
                    <p className="mt-2 text-[11px] text-slate-400">No strategies in this plan.</p>
                  ) : (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                        <p className="text-[10px] text-slate-500">Count</p>
                        <p className="text-sm font-extrabold text-slate-100">{selectedPSPreview.count}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                        <p className="text-[10px] text-slate-500">Avg return</p>
                        <p className="text-sm font-extrabold text-slate-100">
                          {selectedPSPreview.strategies.length ? formatPct(selectedSummary.avgReturn) : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                        <p className="text-[10px] text-slate-500">Avg win</p>
                        <p className="text-sm font-extrabold text-slate-100">
                          {selectedPSPreview.strategies.length ? formatPct(selectedSummary.avgWin) : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="mt-1 w-full rounded-xl font-extrabold py-3 transition flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (!selectedPlanForSidebar?.id) return toast.info("Select a plan first.");
                    const status = currentSub?.statusV2 ?? currentSub?.status ?? null;
                    if (status === "active" || status === "trialing")
                      return toast.info("You already have an active subscription.");
                    setStep(agreed ? "BILLING" : "AGREEMENT");
                    setCheckoutOpen(true);
                  }}
                  type="button"
                  disabled={isFetchingCurrentSub}
                >
                  <CheckCircle size={18} />
                  Continue
                </button>

                <div className="mt-2 text-[11px] text-slate-500">
                  Markets: {selectedMarkets.isMulti ? "ALL" : selectedMarkets.marketCodes.join(", ")}
                </div>

                {checkoutOpen ? (
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                  >
                    Reset checkout flow
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (selectedPlanForDrawer || selectedPlanPreview) && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: 520 }}
              animate={{ x: 0 }}
              exit={{ x: 520 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-slate-950 border-l border-slate-800 p-6 overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{(selectedPlanForDrawer ?? selectedPlanPreview)?.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{(selectedPlanForDrawer ?? selectedPlanPreview)?.description ?? ""}</p>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 hover:bg-slate-900/70"
                  type="button"
                >
                  <X />
                </button>
              </div>

              <div className="mt-4">
                {isFetchingPlan ? (
                  <div className={`${cardBase} p-4 flex items-center gap-3`}>
                    <RefreshCw className="animate-spin text-emerald-400" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Loading plan details…</p>
                      <p className="text-[11px] text-slate-500">Fetching /plans/{String(selectedPlanId)}</p>
                    </div>
                  </div>
                ) : isPlanError ? (
                  <div className={`${cardBase} p-4 flex items-start justify-between gap-3`}>
                    <div>
                      <p className="text-sm font-semibold text-red-300">Failed to load plan details</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {(planError as any)?.data?.message || (planError as any)?.message || "Unknown error"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchPlan()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                    >
                      <RefreshCw size={14} />
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-5">
                {(() => {
                  const planObj = selectedPlanForDrawer ?? selectedPlanPreview;
                  const psUI = planStrategiesToUI(planObj);
                  return <StrategiesSlider psUI={psUI} />;
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Checkout Modal */}
      <AnimatePresence>
        {checkoutOpen && selectedPlanForSidebar && (
          <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={closeCheckout} />

            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-500">Checkout</p>
                  <h3 className="text-lg font-semibold text-slate-100">{selectedPlanForSidebar.name}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Flow is saved locally — you can close and resume.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCheckout}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 hover:bg-slate-900/70"
                >
                  <X />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StepPill active={step === "AGREEMENT"} done={agreed} label="Agreement" />
                <StepPill active={step === "BILLING"} done={step === "SUBSCRIBE"} label="Billing" />
                <StepPill active={step === "SUBSCRIBE"} done={false} label="Subscribe" />
              </div>

              <Divider />

              {/* Agreement */}
              {step === "AGREEMENT" ? (
                <div className="pt-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-emerald-400" />
                      <p className="text-sm font-semibold text-slate-200">User Agreement</p>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
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
                        <p className="text-sm font-semibold text-slate-200">I agree to the Terms & Agreement</p>
                        <p className="text-[11px] text-slate-500">Required to continue.</p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goBackStep}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={onAgreeNext}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!agreed}
                    >
                      Continue
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Billing */}
              {step === "BILLING" ? (
                <div className="pt-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-200">Billing Details</p>
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
                        <p className="text-[11px] text-red-300 font-semibold">Failed to load billing details</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {(billingError as any)?.data?.message ||
                            (billingError as any)?.message ||
                            "Unknown error"}
                        </p>
                      </div>
                    ) : null}

                    {(billingResp as any)?.data ? (
                      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-[11px] text-emerald-200 font-semibold">
                          Billing details found — prefilled from server.
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <p className="text-[10px] text-slate-500 flex items-center gap-2">
                          <CreditCard size={12} className="text-emerald-400" />
                          PAN Number (optional)
                        </p>
                        <input
                          value={billingDraft.panNumber ?? ""}
                          onChange={(e) =>
                            setBillingDraft((p) => ({
                              ...p,
                              panNumber: e.target.value || null,
                            }))
                          }
                          className="mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
                          placeholder="PAN (optional)"
                        />
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <p className="text-[10px] text-slate-500">Pincode *</p>
                        <input
                          value={billingDraft.pincode}
                          onChange={(e) => setBillingDraft((p) => ({ ...p, pincode: e.target.value }))}
                          className="mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
                          placeholder="Pincode"
                        />
                      </div>

                      <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <p className="text-[10px] text-slate-500">Address line 1 *</p>
                        <input
                          value={billingDraft.addressLine1}
                          onChange={(e) => setBillingDraft((p) => ({ ...p, addressLine1: e.target.value }))}
                          className="mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
                          placeholder="House / Street / Area"
                        />
                      </div>

                      <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <p className="text-[10px] text-slate-500">Address line 2</p>
                        <input
                          value={billingDraft.addressLine2 ?? ""}
                          onChange={(e) => setBillingDraft((p) => ({ ...p, addressLine2: e.target.value || null }))}
                          className="mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
                          placeholder="Landmark / Apartment"
                        />
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <p className="text-[10px] text-slate-500">City *</p>
                        <input
                          value={billingDraft.city}
                          onChange={(e) => setBillingDraft((p) => ({ ...p, city: e.target.value }))}
                          className="mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
                          placeholder="City"
                        />
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                        <p className="text-[10px] text-slate-500">State *</p>
                        <input
                          value={billingDraft.state}
                          onChange={(e) => setBillingDraft((p) => ({ ...p, state: e.target.value }))}
                          className="mt-2 w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
                          placeholder="State"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goBackStep}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={onSaveBillingNext}
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
                          Save & Continue
                          <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Subscribe */}
              {step === "SUBSCRIBE" ? (
                <div className="pt-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <p className="text-sm font-semibold text-slate-200">Confirm Subscription</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      We will activate this plan on your account.
                    </p>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                      <p className="text-[11px] text-slate-500">Plan</p>
                      <p className="text-base font-semibold text-slate-100">{selectedPlanForSidebar.name}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedMarkets.isMulti ? ALL_MARKETS : selectedMarkets.marketCodes).map((m) => marketChip(m))}
                      </div>

                      <div className="mt-4">
                        {(() => {
                          const interval = planInterval(selectedPlanForSidebar);
                          const pObj = priceInInr(selectedPlanForSidebar);
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
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goBackStep}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={onConfirmSubscribe}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-extrabold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isSubscribing}
                    >
                      {isSubscribing ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Activating…
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Activate Subscription
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={resetFlow}
                    className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-900/60 transition"
                  >
                    Reset flow
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${container} mt-10`}>
        <div className={`${cardBase} p-5 flex items-start gap-3`}>
          <Info className="text-emerald-400 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold">What was fixed</p>
            <p className={subtle}>
              ✅ Restored checkout steps (Agreement → Billing → Subscribe) <br />
              ✅ Billing uses your <b>userApi</b> endpoints: <code>GET /user/billing</code> and <code>PUT /user/billing</code> <br />
              ✅ Prefills billing form if backend already has data <br />
              ✅ LocalStorage restore + persist, and Back button works <br />
              ✅ Removed alerts, using proper <b>react-toastify</b> toasts only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
