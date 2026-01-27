// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Settings2,
//   RefreshCw,
//   ShieldCheck,
//   ArrowRight,
//   ExternalLink,
//   CandlestickChart,
//   Building2,
//   Bitcoin,
//   Copy,
//   SlidersHorizontal,
//   Activity,
//   Layers,
//   User,
//   FileText,
//   ScrollText,
//   BookOpen,
//   PauseCircle,
//   PlayCircle,
//   AlertTriangle,
//   X,
//   Check,
//   ChevronRight,
// } from "lucide-react";
// import { toast } from "react-toastify";

// import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";
// import { useGetMyForexTraderDetailsQuery } from "../../services/forexTraderUserDetails.api";

// /**
//  * ✅ UI design mode:
//  * Set true to hide all "locked / upgrade" states while you polish UI.
//  * (Still shows real limits where available.)
//  */
// const UI_DEBUG_UNLOCK_ALL = false;

// type Market = "FOREX" | "INDIA" | "CRYPTO" | "COPY";
// type TabKey = "TRADING" | "RISK" | "STRATEGIES" | "USAGE" | "ACCOUNT";

// type MarketLimits = {
//   hasPlan: boolean;
//   plansCount: number;

//   executionAllowed: boolean;
//   earliestEndDate?: string | null;

//   maxConnectedAccounts?: number;
//   maxActiveStrategies?: number;
//   maxDailyTrades?: number;
//   maxLotPerTrade?: number;
// };

// type MarketSummary = Record<Market, MarketLimits>;

// type PlanPref = {
//   mode: "AUTO_MAX" | "SPECIFIC";
//   planId?: string | null;
// };

// type PlanPrefs = Record<Market, PlanPref>;

// type RiskGuard = {
//   enabled: boolean;

//   // stop-trading rules
//   pauseTrading: boolean; // blocks new orders when triggered
//   closePositions: boolean; // optional: close everything (dangerous) - UI only
//   notify: boolean;

//   // thresholds (interpreted as absolute account currency)
//   dailyMaxLoss?: number | null; // stop when realized PnL <= -dailyMaxLoss
//   dailyProfitTarget?: number | null; // stop when realized PnL >= dailyProfitTarget
//   minGainPerDay?: number | null; // synonym of profit target for UI (we keep separate but mirror)
// };

// type RiskSettings = {
//   masterPause: boolean;
//   pauseUntil?: string | null; // datetime-local string
//   pauseReason?: string;

//   executionMode: "EXECUTION" | "SIGNALS_ONLY" | "PAPER";
//   allowedMarkets: Record<Market, boolean>;

//   globalGuards: RiskGuard;

//   // exposure and behavior
//   maxTradesPerDay?: number | null;
//   maxOpenPositions?: number | null;
//   maxLotPerTrade?: number | null;
//   maxDrawdownPct?: number | null;

//   cooldownAfterLossMins?: number | null;
//   maxConsecutiveLosses?: number | null;
//   pauseAfterConsecutiveLossesMins?: number | null;

//   // session control
//   sessionEnabled: boolean;
//   sessionDays: number[]; // 0-6
//   sessionStart?: string; // HH:MM
//   sessionEnd?: string; // HH:MM

//   // per-market overrides (optional)
//   perMarketOverride: Record<
//     Market,
//     {
//       enabled: boolean;
//       guards: RiskGuard;
//       maxLotPerTrade?: number | null;
//       maxTradesPerDay?: number | null;
//     }
//   >;

//   // alerts (UI only)
//   alerts: {
//     email: boolean;
//     telegram: boolean;
//     telegramBotToken?: string;
//     telegramChatId?: string;
//   };
// };

// type PlanInstance = {
//   market: Market;
//   planId: string;
//   planName: string;
//   categoryRaw?: any;
//   endDate?: string | null;
//   executionAllowed: boolean;
//   limits: {
//     maxConnectedAccounts?: number;
//     maxActiveStrategies?: number;
//     maxDailyTrades?: number;
//     maxLotPerTrade?: number;
//   };
// };

// function clsx(...parts: Array<string | false | null | undefined>) {
//   return parts.filter(Boolean).join(" ");
// }

// /** styles */
// const pageWrap = "w-full";
// const card =
//   "rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
// const soft =
//   "rounded-2xl border border-white/5 bg-slate-950/30 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
// const btn =
//   "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition";
// const btnGhost = "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";
// const btnPrimary =
//   "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20";
// const btnDanger =
//   "border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15";
// const input =
//   "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40";
// const label = "text-xs font-semibold text-slate-300";

// function isExpired(endDate?: string | null) {
//   if (!endDate) return false;
//   const t = new Date(endDate).getTime();
//   if (!Number.isFinite(t)) return false;
//   return t < Date.now();
// }

// function normalizeSubs(subRes: any): any[] {
//   const raw = subRes?.data ?? subRes ?? null;
//   if (!raw) return [];
//   if (Array.isArray(raw)) return raw.filter(Boolean);
//   return [raw].filter(Boolean);
// }

// function toMarketKey(categoryRaw: any): Market | null {
//   const c = String(categoryRaw ?? "").trim().toUpperCase();
//   if (!c) return null;

//   if (["FOREX", "FX"].includes(c)) return "FOREX";
//   if (["INDIA", "NSE", "BSE", "INDIAN"].includes(c)) return "INDIA";
//   if (["CRYPTO", "COIN", "DELTA"].includes(c)) return "CRYPTO";
//   if (["COPY", "COPYTRADING", "COPY_TRADING"].includes(c)) return "COPY";
//   return null;
// }

// function planMarkets(plan: any): Market[] {
//   // primary
//   const direct =
//     toMarketKey(plan?.category) ||
//     toMarketKey(plan?.market) ||
//     toMarketKey(plan?.market_category) ||
//     toMarketKey(plan?.metadata?.market);

//   if (direct) return [direct];

//   // included markets (bundle/multi)
//   const inc =
//     plan?.included_markets ??
//     plan?.includedMarkets ??
//     plan?.metadata?.included_markets ??
//     plan?.metadata?.includedMarkets ??
//     null;

//   if (Array.isArray(inc)) {
//     const mk = inc.map(toMarketKey).filter(Boolean) as Market[];
//     if (mk.length) return Array.from(new Set(mk));
//   }

//   // bundle heuristics
//   const tier = String(plan?.metadata?.tier ?? "").toLowerCase();
//   const includes = String(plan?.metadata?.includes ?? "").toLowerCase();
//   if (tier === "bundle" || includes === "multi") {
//     return ["FOREX", "INDIA", "CRYPTO", "COPY"];
//   }

//   return [];
// }

// function maxNum(a?: number, b?: number) {
//   const aa = Number(a ?? 0);
//   const bb = Number(b ?? 0);
//   if (!Number.isFinite(aa)) return bb;
//   if (!Number.isFinite(bb)) return aa;
//   return Math.max(aa, bb);
// }

// function buildMarketSummary(subs: any[]): MarketSummary {
//   const base: MarketSummary = {
//     FOREX: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
//     INDIA: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
//     CRYPTO: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
//     COPY: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
//   };

//   for (const s of subs || []) {
//     const plan = s?.plan ?? s ?? null;
//     if (!plan) continue;
//     if (isExpired(s?.endDate)) continue;

//     const markets = planMarkets(plan);
//     if (!markets.length) continue;

//     const exec = Boolean(
//       s?.executionEnabled ?? s?.allowTrade ?? plan?.executionEnabled ?? plan?.allowTrade
//     );

//     for (const market of markets) {
//       base[market].hasPlan = true;
//       base[market].plansCount += 1;

//       base[market].executionAllowed = base[market].executionAllowed || exec;

//       base[market].maxConnectedAccounts = maxNum(
//         base[market].maxConnectedAccounts,
//         plan?.maxConnectedAccounts ?? plan?.limits?.maxConnectedAccounts
//       );
//       base[market].maxActiveStrategies = maxNum(
//         base[market].maxActiveStrategies,
//         plan?.maxActiveStrategies ?? plan?.limits?.maxActiveStrategies
//       );
//       base[market].maxDailyTrades = maxNum(
//         base[market].maxDailyTrades,
//         plan?.maxDailyTrades ?? plan?.limits?.maxDailyTrades
//       );
//       base[market].maxLotPerTrade = maxNum(
//         base[market].maxLotPerTrade,
//         plan?.maxLotPerTrade ?? plan?.limits?.maxLotPerTrade
//       );

//       // earliest end date per market
//       const endDate = s?.endDate ? String(s.endDate) : null;
//       if (endDate) {
//         if (!base[market].earliestEndDate) base[market].earliestEndDate = endDate;
//         else {
//           const a = new Date(base[market].earliestEndDate).getTime();
//           const b = new Date(endDate).getTime();
//           if (Number.isFinite(a) && Number.isFinite(b) && b < a) {
//             base[market].earliestEndDate = endDate;
//           }
//         }
//       }
//     }
//   }

//   if (UI_DEBUG_UNLOCK_ALL) {
//     (Object.keys(base) as Market[]).forEach((m) => {
//       base[m].hasPlan = true;
//       base[m].executionAllowed = true;
//       base[m].plansCount = Math.max(base[m].plansCount, 1);
//       base[m].maxConnectedAccounts = Math.max(base[m].maxConnectedAccounts ?? 0, 10);
//       base[m].maxActiveStrategies = Math.max(base[m].maxActiveStrategies ?? 0, 10);
//       base[m].maxDailyTrades = Math.max(base[m].maxDailyTrades ?? 0, 200);
//       base[m].maxLotPerTrade = Math.max(base[m].maxLotPerTrade ?? 0, 5);
//     });
//   }

//   return base;
// }

// function buildPlansByMarket(subs: any[]): Record<Market, PlanInstance[]> {
//   const out: Record<Market, PlanInstance[]> = { FOREX: [], INDIA: [], CRYPTO: [], COPY: [] };

//   for (const s of subs || []) {
//     const plan = s?.plan ?? s ?? null;
//     if (!plan) continue;
//     if (isExpired(s?.endDate)) continue;

//     const markets = planMarkets(plan);
//     if (!markets.length) continue;

//     const planId = String(plan?.id ?? plan?.planId ?? plan?.plan_id ?? s?.planId ?? s?.plan_id ?? "");
//     const planName = String(plan?.name ?? plan?.planName ?? plan?.plan_name ?? "Plan");
//     const exec = Boolean(
//       s?.executionEnabled ?? s?.allowTrade ?? plan?.executionEnabled ?? plan?.allowTrade
//     );

//     const limits = {
//       maxConnectedAccounts: Number(plan?.maxConnectedAccounts ?? plan?.limits?.maxConnectedAccounts ?? 0) || undefined,
//       maxActiveStrategies: Number(plan?.maxActiveStrategies ?? plan?.limits?.maxActiveStrategies ?? 0) || undefined,
//       maxDailyTrades: Number(plan?.maxDailyTrades ?? plan?.limits?.maxDailyTrades ?? 0) || undefined,
//       maxLotPerTrade: Number(plan?.maxLotPerTrade ?? plan?.limits?.maxLotPerTrade ?? 0) || undefined,
//     };

//     for (const market of markets) {
//       if (!planId) continue;
//       out[market].push({
//         market,
//         planId,
//         planName,
//         categoryRaw: plan?.category,
//         endDate: s?.endDate ? String(s.endDate) : null,
//         executionAllowed: exec,
//         limits,
//       });
//     }
//   }

//   // de-dupe by planId per market
//   (Object.keys(out) as Market[]).forEach((m) => {
//     const seen = new Set<string>();
//     out[m] = out[m].filter((p) => {
//       if (seen.has(p.planId)) return false;
//       seen.add(p.planId);
//       return true;
//     });
//   });

//   return out;
// }

// function applyPlanPrefs(base: MarketSummary, plansByMarket: Record<Market, PlanInstance[]>, prefs: PlanPrefs) {
//   const out: MarketSummary = JSON.parse(JSON.stringify(base));

//   (Object.keys(out) as Market[]).forEach((m) => {
//     const plans = plansByMarket[m] || [];
//     if (!plans.length) return;

//     const pref = prefs[m];
//     if (!pref || pref.mode !== "SPECIFIC" || !pref.planId) return;

//     const chosen = plans.find((p) => p.planId === pref.planId);
//     if (!chosen) return;

//     out[m].hasPlan = true;
//     out[m].plansCount = plans.length;
//     out[m].executionAllowed = chosen.executionAllowed;
//     out[m].earliestEndDate = chosen.endDate ?? out[m].earliestEndDate ?? null;

//     out[m].maxConnectedAccounts = chosen.limits.maxConnectedAccounts;
//     out[m].maxActiveStrategies = chosen.limits.maxActiveStrategies;
//     out[m].maxDailyTrades = chosen.limits.maxDailyTrades;
//     out[m].maxLotPerTrade = chosen.limits.maxLotPerTrade;
//   });

//   return out;
// }

// /** local storage hook (so user settings stay after refresh) */
// function useLocalStorageState<T>(key: string, initialValue: T) {
//   const [state, setState] = useState<T>(() => {
//     try {
//       const raw = localStorage.getItem(key);
//       if (!raw) return initialValue;
//       return JSON.parse(raw) as T;
//     } catch {
//       return initialValue;
//     }
//   });

//   useEffect(() => {
//     try {
//       localStorage.setItem(key, JSON.stringify(state));
//     } catch {
//       // ignore
//     }
//   }, [key, state]);

//   return [state, setState] as const;
// }

// /** UI atoms */
// function StatusPill({
//   tone,
//   text,
// }: {
//   tone: "emerald" | "amber" | "rose" | "slate";
//   text: string;
// }) {
//   const cls =
//     tone === "emerald"
//       ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
//       : tone === "amber"
//       ? "text-amber-200 bg-amber-500/10 border-amber-500/20"
//       : tone === "rose"
//       ? "text-rose-200 bg-rose-500/10 border-rose-500/20"
//       : "text-slate-200 bg-white/5 border-white/10";

//   return (
//     <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs", cls)}>
//       <ShieldCheck size={14} />
//       {text}
//     </span>
//   );
// }

// function SectionTabs({
//   value,
//   onChange,
// }: {
//   value: TabKey;
//   onChange: (v: TabKey) => void;
// }) {
//   const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
//     { key: "TRADING", label: "Trading", icon: <Layers size={16} /> },
//     { key: "RISK", label: "Risk", icon: <SlidersHorizontal size={16} /> },
//     { key: "STRATEGIES", label: "Strategies", icon: <Activity size={16} /> },
//     { key: "USAGE", label: "Plan Usage", icon: <Settings2 size={16} /> },
//     { key: "ACCOUNT", label: "Account", icon: <User size={16} /> },
//   ];

//   return (
//     <div className="flex flex-wrap gap-2">
//       {tabs.map((t) => (
//         <button
//           key={t.key}
//           type="button"
//           onClick={() => onChange(t.key)}
//           className={clsx(
//             "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
//             value === t.key
//               ? "bg-emerald-500 text-slate-950 border-emerald-500"
//               : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
//           )}
//         >
//           {t.icon}
//           {t.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// function Modal({
//   open,
//   title,
//   onClose,
//   children,
//   footer,
// }: {
//   open: boolean;
//   title: string;
//   onClose: () => void;
//   children: React.ReactNode;
//   footer?: React.ReactNode;
// }) {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/60" onClick={onClose} />
//       <div className="absolute inset-0 flex items-center justify-center p-4">
//         <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur shadow-xl">
//           <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
//             <div className="text-base font-semibold text-white">{title}</div>
//             <button type="button" onClick={onClose} className={clsx(btn, btnGhost, "px-3 py-2")}>
//               <X size={16} />
//             </button>
//           </div>
//           <div className="p-5">{children}</div>
//           {footer ? <div className="p-5 border-t border-white/10">{footer}</div> : null}
//         </div>
//       </div>
//     </div>
//   );
// }

// function Toggle({
//   checked,
//   onChange,
//   label: text,
//   hint,
//   danger,
// }: {
//   checked: boolean;
//   onChange: (v: boolean) => void;
//   label: string;
//   hint?: string;
//   danger?: boolean;
// }) {
//   return (
//     <div className={clsx("flex items-start justify-between gap-4 rounded-xl border p-4", danger ? "border-rose-500/20 bg-rose-500/5" : "border-white/5 bg-slate-950/25")}>
//       <div className="min-w-0">
//         <div className={clsx("text-sm font-semibold", danger ? "text-rose-100" : "text-slate-100")}>{text}</div>
//         {hint ? <div className={clsx("text-xs mt-1", danger ? "text-rose-200/70" : "text-slate-400")}>{hint}</div> : null}
//       </div>
//       <button
//         type="button"
//         onClick={() => onChange(!checked)}
//         className={clsx(
//           "relative inline-flex h-7 w-12 items-center rounded-full border transition",
//           checked
//             ? danger
//               ? "bg-rose-500/30 border-rose-500/30"
//               : "bg-emerald-500/30 border-emerald-500/30"
//             : "bg-white/5 border-white/10"
//         )}
//       >
//         <span
//           className={clsx(
//             "inline-block h-5 w-5 transform rounded-full bg-white transition",
//             checked ? "translate-x-6" : "translate-x-1"
//           )}
//         />
//       </button>
//     </div>
//   );
// }

// function Field({
//   label: l,
//   hint,
//   children,
// }: {
//   label: string;
//   hint?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <div className={label}>{l}</div>
//       {hint ? <div className="text-[11px] text-slate-500 mt-1">{hint}</div> : null}
//       {children}
//     </div>
//   );
// }

// function UsageRow({
//   label: rowLabel,
//   used,
//   max,
// }: {
//   label: string;
//   used: number | null;
//   max: number | null;
// }) {
//   const pct =
//     used != null && max != null && max > 0 ? Math.min(100, Math.round((used / max) * 100)) : null;

//   return (
//     <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
//       <div className="flex items-center justify-between gap-3">
//         <div className="text-sm font-semibold text-slate-100">{rowLabel}</div>
//         <div className="text-xs text-slate-300">
//           {used == null ? "—" : used}
//           {" / "}
//           {max == null || max === 0 ? "—" : max}
//         </div>
//       </div>

//       <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
//         <div className="h-2 rounded-full bg-emerald-500/60" style={{ width: `${pct ?? 0}%` }} />
//       </div>

//       <div className="mt-2 text-[11px] text-slate-500">
//         {pct == null ? "Usage counters not connected yet (showing plan limits)." : `${pct}% used`}
//       </div>
//     </div>
//   );
// }

// function MarketCard({
//   title,
//   subtitle,
//   icon,
//   accent,
//   info,
//   locked,
//   onOpen,
// }: {
//   title: string;
//   subtitle: string;
//   icon: React.ReactNode;
//   accent: "emerald" | "indigo" | "yellow" | "violet";
//   info: MarketLimits;
//   locked: boolean;
//   onOpen: () => void;
// }) {
//   const badge = locked
//     ? { tone: "amber" as const, text: "Locked" }
//     : info.executionAllowed
//     ? { tone: "emerald" as const, text: "Active • Execution Enabled" }
//     : { tone: "slate" as const, text: "Active • Execution Disabled" };

//   const accentBox =
//     accent === "indigo"
//       ? "bg-indigo-500/15 border-indigo-400/20 text-indigo-200"
//       : accent === "yellow"
//       ? "bg-yellow-500/15 border-yellow-400/20 text-yellow-200"
//       : accent === "violet"
//       ? "bg-violet-500/15 border-violet-400/20 text-violet-200"
//       : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200";

//   return (
//     <div className={clsx(soft, "p-5")}>
//       <div className="flex items-start justify-between gap-4 flex-wrap">
//         <div className="flex items-start gap-3">
//           <div className={clsx("h-10 w-10 rounded-xl border flex items-center justify-center", accentBox)}>
//             {icon}
//           </div>
//           <div className="min-w-0">
//             <div className="flex items-center gap-2 flex-wrap">
//               <p className="text-base font-semibold text-slate-100">{title}</p>
//               <StatusPill tone={badge.tone} text={badge.text} />
//             </div>
//             <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
//             <p className="text-[11px] text-slate-500 mt-2">
//               Active plans: <span className="text-slate-200 font-semibold">{info.plansCount}</span>
//               {info.earliestEndDate ? (
//                 <>
//                   {" "}
//                   • valid until (soonest):{" "}
//                   <span className="text-slate-200 font-semibold">
//                     {new Date(info.earliestEndDate).toLocaleString()}
//                   </span>
//                 </>
//               ) : null}
//             </p>
//           </div>
//         </div>

//         <button type="button" onClick={onOpen} className={clsx(btn, locked ? btnGhost : btnPrimary)}>
//           {locked ? (
//             <>
//               Upgrade <ExternalLink size={16} />
//             </>
//           ) : (
//             <>
//               Open <ChevronRight size={16} />
//             </>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

// /** ---------------------------
//  *  Tab: Trading (inline managers)
//  *  --------------------------- */
// function TradingTab({
//   summary,
//   plansByMarket,
//   planPrefs,
//   setPlanPrefs,
//   locked,
//   forexRows,
// }: {
//   summary: MarketSummary;
//   plansByMarket: Record<Market, PlanInstance[]>;
//   planPrefs: PlanPrefs;
//   setPlanPrefs: (v: PlanPrefs) => void;
//   locked: (m: Market) => boolean;
//   forexRows: any[];
// }) {
//   const [activeMarket, setActiveMarket] = useState<Market | null>(null);

//   const openMarket = (m: Market) => {
//     if (locked(m)) return;
//     setActiveMarket(m);
//   };

//   const closeMarket = () => setActiveMarket(null);

//   const marketTitle: Record<Market, string> = {
//     FOREX: "Forex",
//     INDIA: "Indian Market",
//     CRYPTO: "Crypto",
//     COPY: "Copy Trading",
//   };

//   return (
//     <div className="space-y-5">
//       <div>
//         <h2 className="text-lg font-semibold text-white">Trading Accounts</h2>
//         <p className="text-xs text-slate-400 mt-1">
//           Everything is managed here: pick which plan to use, control execution mode, and manage accounts.
//         </p>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2">
//         <MarketCard
//           title="Forex"
//           subtitle="MT5 / cTrader accounts • execution + signals"
//           icon={<CandlestickChart size={18} />}
//           accent="emerald"
//           info={summary.FOREX}
//           locked={locked("FOREX")}
//           onOpen={() => openMarket("FOREX")}
//         />
//         <MarketCard
//           title="Indian Market"
//           subtitle="Broker accounts • NSE/BSE execution"
//           icon={<Building2 size={18} />}
//           accent="indigo"
//           info={summary.INDIA}
//           locked={locked("INDIA")}
//           onOpen={() => openMarket("INDIA")}
//         />
//         <MarketCard
//           title="Crypto"
//           subtitle="Exchange API keys • spot/futures execution"
//           icon={<Bitcoin size={18} />}
//           accent="yellow"
//           info={summary.CRYPTO}
//           locked={locked("CRYPTO")}
//           onOpen={() => openMarket("CRYPTO")}
//         />
//         <MarketCard
//           title="Copy Trading"
//           subtitle="Master/Child mapping • copy rows"
//           icon={<Copy size={18} />}
//           accent="violet"
//           info={summary.COPY}
//           locked={locked("COPY")}
//           onOpen={() => openMarket("COPY")}
//         />
//       </div>

//       <div className={clsx(soft, "p-5")}>
//         <div className="flex items-start justify-between gap-3 flex-wrap">
//           <div>
//             <div className="text-sm font-semibold text-slate-100">Quick insights</div>
//             <div className="text-xs text-slate-400 mt-1">
//               Forex connected accounts:{" "}
//               <span className="text-slate-100 font-semibold">{forexRows.length}</span>
//             </div>
//           </div>
//           <div className="text-[11px] text-slate-500">
//             Tip: In each market, you can pick a specific plan (if you have multiple).
//           </div>
//         </div>
//       </div>

//       <Modal
//         open={Boolean(activeMarket)}
//         title={activeMarket ? `${marketTitle[activeMarket]} • Settings` : "Market Settings"}
//         onClose={closeMarket}
//         footer={
//           <div className="flex items-center justify-between gap-3 flex-wrap">
//             <div className="text-[11px] text-slate-500">
//               This UI saves preferences locally (wire server mutation later if needed).
//             </div>
//             <div className="flex gap-2">
//               <button type="button" onClick={closeMarket} className={clsx(btn, btnGhost)}>
//                 Close
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   toast.success("Saved market preferences");
//                   closeMarket();
//                 }}
//                 className={clsx(btn, btnPrimary)}
//               >
//                 <Check size={16} /> Save
//               </button>
//             </div>
//           </div>
//         }
//       >
//         {activeMarket ? (
//           <MarketInlineManager
//             market={activeMarket}
//             summary={summary[activeMarket]}
//             plans={plansByMarket[activeMarket] ?? []}
//             pref={planPrefs[activeMarket]}
//             onChangePref={(next) => setPlanPrefs({ ...planPrefs, [activeMarket]: next })}
//             forexRows={activeMarket === "FOREX" ? forexRows : []}
//           />
//         ) : null}
//       </Modal>
//     </div>
//   );
// }

// function MarketInlineManager({
//   market,
//   summary,
//   plans,
//   pref,
//   onChangePref,
//   forexRows,
// }: {
//   market: Market;
//   summary: MarketLimits;
//   plans: PlanInstance[];
//   pref: PlanPref;
//   onChangePref: (p: PlanPref) => void;
//   forexRows: any[];
// }) {
//   const planMode = pref?.mode ?? "AUTO_MAX";
//   const selectedPlanId = pref?.planId ?? null;

//   const chosen = useMemo(() => {
//     if (planMode !== "SPECIFIC" || !selectedPlanId) return null;
//     return plans.find((p) => p.planId === selectedPlanId) ?? null;
//   }, [planMode, selectedPlanId, plans]);

//   const effective = useMemo(() => {
//     // In AUTO_MAX we use summary (max across plans).
//     // In SPECIFIC we display chosen limits.
//     if (planMode === "SPECIFIC" && chosen) {
//       return {
//         executionAllowed: chosen.executionAllowed,
//         maxConnectedAccounts: chosen.limits.maxConnectedAccounts ?? null,
//         maxActiveStrategies: chosen.limits.maxActiveStrategies ?? null,
//         maxDailyTrades: chosen.limits.maxDailyTrades ?? null,
//         maxLotPerTrade: chosen.limits.maxLotPerTrade ?? null,
//       };
//     }

//     return {
//       executionAllowed: summary.executionAllowed,
//       maxConnectedAccounts: summary.maxConnectedAccounts ?? null,
//       maxActiveStrategies: summary.maxActiveStrategies ?? null,
//       maxDailyTrades: summary.maxDailyTrades ?? null,
//       maxLotPerTrade: summary.maxLotPerTrade ?? null,
//     };
//   }, [planMode, chosen, summary]);

//   const hasMultiplePlans = plans.length > 1;

//   return (
//     <div className="space-y-5">
//       <div className={clsx(soft, "p-5")}>
//         <div className="flex items-start justify-between gap-3 flex-wrap">
//           <div>
//             <div className="text-base font-semibold text-slate-100">Plan selection</div>
//             <div className="text-xs text-slate-400 mt-1">
//               If you have multiple plans for this market, choose what the engine should use.
//             </div>
//           </div>
//           <StatusPill
//             tone={effective.executionAllowed ? "emerald" : "slate"}
//             text={effective.executionAllowed ? "Execution Enabled" : "Execution Disabled"}
//           />
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Toggle
//             checked={planMode === "AUTO_MAX"}
//             onChange={(v) => onChangePref({ mode: v ? "AUTO_MAX" : "SPECIFIC", planId: selectedPlanId })}
//             label="Auto pick best limits (MAX across active plans)"
//             hint="Best for users who own multiple plans and want the highest limits."
//           />
//           <Toggle
//             checked={planMode === "SPECIFIC"}
//             onChange={(v) => onChangePref({ mode: v ? "SPECIFIC" : "AUTO_MAX", planId: selectedPlanId })}
//             label="Use a specific plan"
//             hint="Best if you want to restrict usage to a particular plan (compliance / accounting)."
//           />
//         </div>

//         {planMode === "SPECIFIC" ? (
//           <div className="mt-4">
//             {hasMultiplePlans ? (
//               <div className="grid gap-3">
//                 {plans.map((p) => (
//                   <button
//                     key={p.planId}
//                     type="button"
//                     onClick={() => onChangePref({ mode: "SPECIFIC", planId: p.planId })}
//                     className={clsx(
//                       "text-left rounded-xl border p-4 transition",
//                       selectedPlanId === p.planId
//                         ? "border-emerald-500/30 bg-emerald-500/10"
//                         : "border-white/10 bg-white/5 hover:bg-white/10"
//                     )}
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="min-w-0">
//                         <div className="text-sm font-semibold text-slate-100">{p.planName}</div>
//                         <div className="text-xs text-slate-400 mt-1">
//                           Valid until:{" "}
//                           <span className="text-slate-200">
//                             {p.endDate ? new Date(p.endDate).toLocaleString() : "—"}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="text-xs text-slate-300">
//                         {p.executionAllowed ? "Exec ON" : "Exec OFF"}
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-xs text-slate-500">
//                 You have only one active plan in this market.
//               </div>
//             )}
//           </div>
//         ) : null}
//       </div>

//       <div className={clsx(soft, "p-5")}>
//         <div className="text-base font-semibold text-slate-100">Effective limits</div>
//         <div className="text-xs text-slate-400 mt-1">
//           These are the limits the engine should enforce (based on your plan selection above).
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <UsageRow label="Connected Accounts" used={market === "FOREX" ? forexRows.length : null} max={effective.maxConnectedAccounts} />
//           <UsageRow label="Max Active Strategies" used={null} max={effective.maxActiveStrategies} />
//           <UsageRow label="Max Daily Trades" used={null} max={effective.maxDailyTrades} />
//           <UsageRow label="Max Lot Per Trade" used={null} max={effective.maxLotPerTrade} />
//         </div>

//         {market === "FOREX" ? (
//           <div className="mt-5">
//             <div className="flex items-center justify-between gap-3 flex-wrap">
//               <div>
//                 <div className="text-sm font-semibold text-slate-100">Forex accounts</div>
//                 <div className="text-xs text-slate-400 mt-1">
//                   Inline view (you can wire add/edit/delete later if you want).
//                 </div>
//               </div>
//               <button
//                 type="button"
//                 className={clsx(btn, btnGhost)}
//                 onClick={() => toast.info("Hook this button to your Add Account modal / API")}
//               >
//                 Add Account <ArrowRight size={16} />
//               </button>
//             </div>

//             <div className="mt-3 grid gap-2">
//               {forexRows.length === 0 ? (
//                 <div className="text-xs text-slate-500 rounded-xl border border-white/10 bg-white/5 p-4">
//                   No Forex accounts connected yet.
//                 </div>
//               ) : (
//                 forexRows.map((r: any, idx: number) => (
//                   <div
//                     key={String(r?.id ?? idx)}
//                     className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-3"
//                   >
//                     <div className="min-w-0">
//                       <div className="text-sm font-semibold text-slate-100">
//                         {r?.accountName ?? r?.name ?? `Account #${idx + 1}`}
//                       </div>
//                       <div className="text-xs text-slate-400 mt-1">
//                         Broker: {r?.broker ?? r?.platform ?? "—"} • Login: {r?.login ?? r?.accountId ?? "—"}
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                       <button
//                         type="button"
//                         className={clsx(btn, btnGhost, "px-3 py-2")}
//                         onClick={() => toast.info("Wire edit")}
//                       >
//                         Edit
//                       </button>
//                       <button
//                         type="button"
//                         className={clsx(btn, btnDanger, "px-3 py-2")}
//                         onClick={() => toast.info("Wire delete")}
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         ) : (
//           <div className="mt-5 text-[11px] text-slate-500">
//             Add inline account manager here for {market} when you connect its API (keys, broker logins, etc.).
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /** ---------------------------
//  *  Tab: Risk (advanced retail controls)
//  *  --------------------------- */
// function RiskTab({
//   risk,
//   setRisk,
//   summary,
// }: {
//   risk: RiskSettings;
//   setRisk: (r: RiskSettings) => void;
//   summary: MarketSummary;
// }) {
//   const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//   const setGuard = (patch: Partial<RiskGuard>) => {
//     const next: RiskSettings = {
//       ...risk,
//       globalGuards: { ...risk.globalGuards, ...patch },
//     };

//     // Keep minGainPerDay mirrored with profit target if user edits one.
//     if (patch.dailyProfitTarget != null) next.globalGuards.minGainPerDay = patch.dailyProfitTarget;
//     if (patch.minGainPerDay != null) next.globalGuards.dailyProfitTarget = patch.minGainPerDay;

//     setRisk(next);
//   };

//   const canTradeMarkets = (Object.keys(summary) as Market[]).filter((m) => summary[m].hasPlan);

//   return (
//     <div className="space-y-5">
//       <div>
//         <h2 className="text-lg font-semibold text-white">Risk Management</h2>
//         <p className="text-xs text-slate-400 mt-1">
//           Built for real retail behavior: pause trading, cap daily loss, stop after reaching profit, and control sessions.
//         </p>
//       </div>

//       {/* Master controls */}
//       <div className={clsx(soft, "p-5")}>
//         <div className="flex items-start justify-between gap-3 flex-wrap">
//           <div>
//             <div className="text-base font-semibold text-slate-100">Master trading switch</div>
//             <div className="text-xs text-slate-400 mt-1">
//               If you want to stop trading completely for some time, use this. It blocks new executions.
//             </div>
//           </div>
//           <StatusPill
//             tone={risk.masterPause ? "amber" : "emerald"}
//             text={risk.masterPause ? "Trading Paused" : "Trading Active"}
//           />
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Toggle
//             checked={risk.masterPause}
//             onChange={(v) => setRisk({ ...risk, masterPause: v })}
//             label={risk.masterPause ? "Paused (no new trades)" : "Active (execution allowed)"}
//             hint="This is the fastest emergency stop. It should override everything else."
//             danger={risk.masterPause}
//           />

//           <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
//             <div className="text-sm font-semibold text-slate-100">Pause until (optional)</div>
//             <div className="text-xs text-slate-400 mt-1">Auto-resume after this time.</div>
//             <input
//               className={input}
//               type="datetime-local"
//               value={risk.pauseUntil ?? ""}
//               onChange={(e) => setRisk({ ...risk, pauseUntil: e.target.value || null })}
//             />
//             <div className="text-[11px] text-slate-500 mt-2">
//               If pauseUntil is set, your backend can automatically switch off pause when time passes.
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Field label="Reason / Notes (optional)" hint="Helpful for you or support when reviewing why trading was paused.">
//             <input
//               className={input}
//               value={risk.pauseReason ?? ""}
//               onChange={(e) => setRisk({ ...risk, pauseReason: e.target.value })}
//               placeholder="e.g. traveling, drawdown, market uncertainty…"
//             />
//           </Field>

//           <Field label="Execution mode" hint="Lets traders switch to signals-only (common retail workflow).">
//             <select
//               className={input}
//               value={risk.executionMode}
//               onChange={(e) => setRisk({ ...risk, executionMode: e.target.value as any })}
//             >
//               <option value="EXECUTION">Execution (place orders)</option>
//               <option value="SIGNALS_ONLY">Signals only (no orders)</option>
//               <option value="PAPER">Paper (simulate)</option>
//             </select>
//           </Field>
//         </div>

//         <div className="mt-4">
//           <div className="text-sm font-semibold text-slate-100">Allowed markets</div>
//           <div className="text-xs text-slate-400 mt-1">
//             If you want to disable a market temporarily (but keep others running), toggle here.
//           </div>
//           <div className="mt-3 grid gap-3 md:grid-cols-2">
//             {(Object.keys(risk.allowedMarkets) as Market[]).map((m) => {
//               const active = Boolean(summary[m].hasPlan) || UI_DEBUG_UNLOCK_ALL;
//               const label = m === "FOREX" ? "Forex" : m === "INDIA" ? "India" : m === "CRYPTO" ? "Crypto" : "Copy";
//               return (
//                 <Toggle
//                   key={m}
//                   checked={risk.allowedMarkets[m]}
//                   onChange={(v) => setRisk({ ...risk, allowedMarkets: { ...risk.allowedMarkets, [m]: v } })}
//                   label={label}
//                   hint={!active ? "No active plan in this market." : "Market is available."}
//                   danger={!risk.allowedMarkets[m]}
//                 />
//               );
//             })}
//           </div>

//           {canTradeMarkets.length === 0 ? (
//             <div className="mt-3 text-[11px] text-amber-200/80 flex items-start gap-2">
//               <AlertTriangle size={14} className="mt-0.5" />
//               No active market plans found. Risk settings will still save, but execution won’t run until plans exist.
//             </div>
//           ) : null}
//         </div>
//       </div>

//       {/* Daily guards */}
//       <div className={clsx(soft, "p-5")}>
//         <div className="text-base font-semibold text-slate-100">Daily guardrails</div>
//         <div className="text-xs text-slate-400 mt-1">
//           Retail-friendly: “max loss per day” and “stop after reaching daily target”. These typically prevent revenge trading.
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Toggle
//             checked={risk.globalGuards.enabled}
//             onChange={(v) => setGuard({ enabled: v })}
//             label="Enable daily guardrails"
//             hint="When enabled, the engine should monitor realized PnL and enforce your limits."
//           />
//           <Toggle
//             checked={risk.globalGuards.pauseTrading}
//             onChange={(v) => setGuard({ pauseTrading: v })}
//             label="When triggered: pause new trades"
//             hint="Recommended. This blocks new orders but does not touch existing positions."
//           />
//         </div>

//         <div className="mt-3 grid gap-3 md:grid-cols-2">
//           <Toggle
//             checked={risk.globalGuards.closePositions}
//             onChange={(v) => setGuard({ closePositions: v })}
//             label="When triggered: auto-close positions"
//             hint="High risk. You may want this only for extreme protection."
//             danger={risk.globalGuards.closePositions}
//           />
//           <Toggle
//             checked={risk.globalGuards.notify}
//             onChange={(v) => setGuard({ notify: v })}
//             label="Send alert when triggered"
//             hint="Email/Telegram (configure below)."
//           />
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-3">
//           <Field label="Max loss per day" hint="Stop trading when daily realized PnL reaches this loss.">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.globalGuards.dailyMaxLoss ?? ""}
//               onChange={(e) => setGuard({ dailyMaxLoss: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 2000"
//             />
//           </Field>

//           <Field label="Daily profit target" hint="Stop trading after reaching profit (locks your day).">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.globalGuards.dailyProfitTarget ?? ""}
//               onChange={(e) => setGuard({ dailyProfitTarget: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 1500"
//             />
//           </Field>

//           <Field label="Minimum gain per day" hint="Same as profit target (UI alias).">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.globalGuards.minGainPerDay ?? ""}
//               onChange={(e) => setGuard({ minGainPerDay: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 1500"
//             />
//           </Field>
//         </div>

//         <div className="mt-3 text-[11px] text-slate-500">
//           Backend wiring note: You’ll need daily realized PnL per account/market. Once you have it, enforcing these is straightforward.
//         </div>
//       </div>

//       {/* Exposure & behavior */}
//       <div className={clsx(soft, "p-5")}>
//         <div className="text-base font-semibold text-slate-100">Exposure & behavior controls</div>
//         <div className="text-xs text-slate-400 mt-1">
//           Useful when traders want to “reduce risk” without stopping completely.
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Field label="Max trades per day" hint="Hard cap of executions per day.">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.maxTradesPerDay ?? ""}
//               onChange={(e) => setRisk({ ...risk, maxTradesPerDay: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 20"
//             />
//           </Field>

//           <Field label="Max open positions" hint="Prevent too many simultaneous positions.">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.maxOpenPositions ?? ""}
//               onChange={(e) => setRisk({ ...risk, maxOpenPositions: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 6"
//             />
//           </Field>

//           <Field label="Max lot per trade" hint="Global cap, independent of plan limits (extra safety).">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               step="0.01"
//               value={risk.maxLotPerTrade ?? ""}
//               onChange={(e) => setRisk({ ...risk, maxLotPerTrade: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 0.5"
//             />
//           </Field>

//           <Field label="Max drawdown (%)" hint="Pause when account equity drawdown exceeds this % (requires equity tracking).">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               step="0.1"
//               value={risk.maxDrawdownPct ?? ""}
//               onChange={(e) => setRisk({ ...risk, maxDrawdownPct: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 8"
//             />
//           </Field>
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-3">
//           <Field label="Cooldown after loss (mins)" hint="After a loss, pause for X minutes (anti-revenge).">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.cooldownAfterLossMins ?? ""}
//               onChange={(e) => setRisk({ ...risk, cooldownAfterLossMins: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 10"
//             />
//           </Field>

//           <Field label="Max consecutive losses" hint="After N consecutive losses, trigger pause.">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.maxConsecutiveLosses ?? ""}
//               onChange={(e) => setRisk({ ...risk, maxConsecutiveLosses: e.target.value ? Number(e.target.value) : null })}
//               placeholder="e.g. 3"
//             />
//           </Field>

//           <Field label="Pause after losses (mins)" hint="How long to pause when consecutive losses hit.">
//             <input
//               className={input}
//               type="number"
//               min={0}
//               value={risk.pauseAfterConsecutiveLossesMins ?? ""}
//               onChange={(e) =>
//                 setRisk({ ...risk, pauseAfterConsecutiveLossesMins: e.target.value ? Number(e.target.value) : null })
//               }
//               placeholder="e.g. 60"
//             />
//           </Field>
//         </div>
//       </div>

//       {/* Session control */}
//       <div className={clsx(soft, "p-5")}>
//         <div className="text-base font-semibold text-slate-100">Trading session window</div>
//         <div className="text-xs text-slate-400 mt-1">
//           Many retail users prefer “trade only between certain hours”.
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Toggle
//             checked={risk.sessionEnabled}
//             onChange={(v) => setRisk({ ...risk, sessionEnabled: v })}
//             label="Enable session restriction"
//             hint="When enabled, the engine should place trades only within the chosen window."
//           />

//           <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
//             <div className="text-sm font-semibold text-slate-100">Days</div>
//             <div className="mt-2 flex flex-wrap gap-2">
//               {days.map((d, i) => {
//                 const on = risk.sessionDays.includes(i);
//                 return (
//                   <button
//                     key={d}
//                     type="button"
//                     onClick={() => {
//                       const next = on
//                         ? risk.sessionDays.filter((x) => x !== i)
//                         : [...risk.sessionDays, i].sort((a, b) => a - b);
//                       setRisk({ ...risk, sessionDays: next });
//                     }}
//                     className={clsx(
//                       "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
//                       on
//                         ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
//                         : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
//                     )}
//                   >
//                     {d}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Field label="Session start (HH:MM)">
//             <input
//               className={input}
//               type="time"
//               value={risk.sessionStart ?? ""}
//               onChange={(e) => setRisk({ ...risk, sessionStart: e.target.value })}
//               disabled={!risk.sessionEnabled}
//             />
//           </Field>
//           <Field label="Session end (HH:MM)">
//             <input
//               className={input}
//               type="time"
//               value={risk.sessionEnd ?? ""}
//               onChange={(e) => setRisk({ ...risk, sessionEnd: e.target.value })}
//               disabled={!risk.sessionEnabled}
//             />
//           </Field>
//         </div>
//       </div>

//       {/* Per-market overrides */}
//       <div className={clsx(soft, "p-5")}>
//         <div className="text-base font-semibold text-slate-100">Per-market overrides</div>
//         <div className="text-xs text-slate-400 mt-1">
//           Example: stricter max loss on Crypto, looser on Forex.
//         </div>

//         <div className="mt-4 grid gap-4 md:grid-cols-2">
//           {(Object.keys(risk.perMarketOverride) as Market[]).map((m) => {
//             const labelM = m === "FOREX" ? "Forex" : m === "INDIA" ? "India" : m === "CRYPTO" ? "Crypto" : "Copy";
//             const ov = risk.perMarketOverride[m];

//             return (
//               <div key={m} className="rounded-2xl border border-white/10 bg-white/5 p-5">
//                 <div className="flex items-start justify-between gap-3">
//                   <div>
//                     <div className="text-sm font-semibold text-slate-100">{labelM}</div>
//                     <div className="text-xs text-slate-400 mt-1">Override global guardrails.</div>
//                   </div>
//                   <button
//                     type="button"
//                     className={clsx(btn, ov.enabled ? btnPrimary : btnGhost, "px-3 py-2")}
//                     onClick={() =>
//                       setRisk({
//                         ...risk,
//                         perMarketOverride: {
//                           ...risk.perMarketOverride,
//                           [m]: { ...ov, enabled: !ov.enabled },
//                         },
//                       })
//                     }
//                   >
//                     {ov.enabled ? "Enabled" : "Disabled"}
//                   </button>
//                 </div>

//                 <div className="mt-4 grid gap-3">
//                   <Field label="Max loss per day">
//                     <input
//                       className={input}
//                       type="number"
//                       min={0}
//                       disabled={!ov.enabled}
//                       value={ov.guards.dailyMaxLoss ?? ""}
//                       onChange={(e) =>
//                         setRisk({
//                           ...risk,
//                           perMarketOverride: {
//                             ...risk.perMarketOverride,
//                             [m]: {
//                               ...ov,
//                               guards: { ...ov.guards, dailyMaxLoss: e.target.value ? Number(e.target.value) : null },
//                             },
//                           },
//                         })
//                       }
//                       placeholder="e.g. 1000"
//                     />
//                   </Field>

//                   <div className="grid gap-3 md:grid-cols-2">
//                     <Field label="Max lot per trade">
//                       <input
//                         className={input}
//                         type="number"
//                         min={0}
//                         step="0.01"
//                         disabled={!ov.enabled}
//                         value={ov.maxLotPerTrade ?? ""}
//                         onChange={(e) =>
//                           setRisk({
//                             ...risk,
//                             perMarketOverride: {
//                               ...risk.perMarketOverride,
//                               [m]: { ...ov, maxLotPerTrade: e.target.value ? Number(e.target.value) : null },
//                             },
//                           })
//                         }
//                         placeholder="e.g. 0.3"
//                       />
//                     </Field>

//                     <Field label="Max trades per day">
//                       <input
//                         className={input}
//                         type="number"
//                         min={0}
//                         disabled={!ov.enabled}
//                         value={ov.maxTradesPerDay ?? ""}
//                         onChange={(e) =>
//                           setRisk({
//                             ...risk,
//                             perMarketOverride: {
//                               ...risk.perMarketOverride,
//                               [m]: { ...ov, maxTradesPerDay: e.target.value ? Number(e.target.value) : null },
//                             },
//                           })
//                         }
//                         placeholder="e.g. 10"
//                       />
//                     </Field>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Alerts */}
//       <div className={clsx(soft, "p-5")}>
//         <div className="text-base font-semibold text-slate-100">Alerts</div>
//         <div className="text-xs text-slate-400 mt-1">
//           Get notified when trading pauses or daily limits are hit.
//         </div>

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <Toggle
//             checked={risk.alerts.email}
//             onChange={(v) => setRisk({ ...risk, alerts: { ...risk.alerts, email: v } })}
//             label="Email alerts"
//             hint="Wire to your backend email notification pipeline."
//           />
//           <Toggle
//             checked={risk.alerts.telegram}
//             onChange={(v) => setRisk({ ...risk, alerts: { ...risk.alerts, telegram: v } })}
//             label="Telegram alerts"
//             hint="Common retail preference. Requires bot token + chat id."
//           />
//         </div>

//         {risk.alerts.telegram ? (
//           <div className="mt-4 grid gap-3 md:grid-cols-2">
//             <Field label="Telegram bot token">
//               <input
//                 className={input}
//                 value={risk.alerts.telegramBotToken ?? ""}
//                 onChange={(e) => setRisk({ ...risk, alerts: { ...risk.alerts, telegramBotToken: e.target.value } })}
//                 placeholder="123456:ABCDEF..."
//               />
//             </Field>
//             <Field label="Telegram chat id">
//               <input
//                 className={input}
//                 value={risk.alerts.telegramChatId ?? ""}
//                 onChange={(e) => setRisk({ ...risk, alerts: { ...risk.alerts, telegramChatId: e.target.value } })}
//                 placeholder="-100xxxxxxxxxx"
//               />
//             </Field>
//           </div>
//         ) : null}
//       </div>

//       {/* Save */}
//       <div className="flex items-center justify-end gap-2 flex-wrap">
//         <button
//           type="button"
//           className={clsx(btn, btnGhost)}
//           onClick={() => {
//             // Reset (reasonable defaults)
//             const def: RiskSettings = defaultRiskSettings();
//             setRisk(def);
//             toast.success("Risk settings reset to defaults");
//           }}
//         >
//           Reset
//         </button>
//         <button
//           type="button"
//           className={clsx(btn, btnPrimary)}
//           onClick={() => toast.success("Risk settings saved")}
//         >
//           <Check size={16} /> Save Risk Settings
//         </button>
//       </div>
//     </div>
//   );
// }

// /** ---------------------------
//  *  Tab: Strategies (inline, useful)
//  *  --------------------------- */
// type Strategy = {
//   id: string;
//   name: string;
//   description: string;
//   enabled: boolean;
//   markets: Market[];
//   maxRiskPerTrade?: number | null;
//   dailyMaxLoss?: number | null;
// };

// function StrategiesTab({
//   summary,
//   strategies,
//   setStrategies,
// }: {
//   summary: MarketSummary;
//   strategies: Strategy[];
//   setStrategies: (s: Strategy[]) => void;
// }) {
//   const [activeId, setActiveId] = useState<string>(strategies[0]?.id ?? "s1");
//   const active = strategies.find((s) => s.id === activeId) ?? strategies[0];

//   const toggleStrategy = (id: string, enabled: boolean) => {
//     setStrategies(strategies.map((s) => (s.id === id ? { ...s, enabled } : s)));
//   };

//   const patchActive = (patch: Partial<Strategy>) => {
//     if (!active) return;
//     setStrategies(strategies.map((s) => (s.id === active.id ? { ...s, ...patch } : s)));
//   };

//   const availableMarkets = (Object.keys(summary) as Market[]).filter((m) => summary[m].hasPlan || UI_DEBUG_UNLOCK_ALL);

//   return (
//     <div className="space-y-5">
//       <div>
//         <h2 className="text-lg font-semibold text-white">Strategies</h2>
//         <p className="text-xs text-slate-400 mt-1">
//           Enable/disable strategies, control which markets they can trade, and add per-strategy risk caps.
//         </p>
//       </div>

//       <div className="grid gap-4 lg:grid-cols-3">
//         {/* list */}
//         <div className={clsx(soft, "p-5 lg:col-span-1")}>
//           <div className="flex items-center justify-between gap-2">
//             <div className="text-sm font-semibold text-slate-100">Your strategies</div>
//             <button
//               type="button"
//               className={clsx(btn, btnGhost, "px-3 py-2")}
//               onClick={() => {
//                 const id = `s${Date.now()}`;
//                 setStrategies([
//                   ...strategies,
//                   {
//                     id,
//                     name: "New Strategy",
//                     description: "Describe what this strategy does.",
//                     enabled: false,
//                     markets: availableMarkets.slice(0, 1),
//                     maxRiskPerTrade: null,
//                     dailyMaxLoss: null,
//                   },
//                 ]);
//                 setActiveId(id);
//                 toast.success("Strategy added (UI only)");
//               }}
//             >
//               + Add
//             </button>
//           </div>

//           <div className="mt-4 grid gap-2">
//             {strategies.map((s) => (
//               <button
//                 key={s.id}
//                 type="button"
//                 onClick={() => setActiveId(s.id)}
//                 className={clsx(
//                   "rounded-xl border p-4 text-left transition",
//                   s.id === activeId
//                     ? "border-emerald-500/30 bg-emerald-500/10"
//                     : "border-white/10 bg-white/5 hover:bg-white/10"
//                 )}
//               >
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="min-w-0">
//                     <div className="text-sm font-semibold text-slate-100">{s.name}</div>
//                     <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description}</div>
//                   </div>
//                   <span
//                     className={clsx(
//                       "text-[11px] rounded-full border px-2 py-1",
//                       s.enabled
//                         ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
//                         : "border-white/10 bg-white/5 text-slate-300"
//                     )}
//                   >
//                     {s.enabled ? "ON" : "OFF"}
//                   </span>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* details */}
//         <div className={clsx(soft, "p-5 lg:col-span-2")}>
//           {!active ? (
//             <div className="text-sm text-slate-400">Select a strategy to configure.</div>
//           ) : (
//             <div className="space-y-4">
//               <div className="flex items-start justify-between gap-3 flex-wrap">
//                 <div>
//                   <div className="text-base font-semibold text-slate-100">{active.name}</div>
//                   <div className="text-xs text-slate-400 mt-1">{active.description}</div>
//                 </div>
//                 <button
//                   type="button"
//                   className={clsx(btn, active.enabled ? btnPrimary : btnGhost)}
//                   onClick={() => toggleStrategy(active.id, !active.enabled)}
//                 >
//                   {active.enabled ? (
//                     <>
//                       <PlayCircle size={16} /> Enabled
//                     </>
//                   ) : (
//                     <>
//                       <PauseCircle size={16} /> Disabled
//                     </>
//                   )}
//                 </button>
//               </div>

//               <div className="grid gap-3 md:grid-cols-2">
//                 <Field label="Name">
//                   <input className={input} value={active.name} onChange={(e) => patchActive({ name: e.target.value })} />
//                 </Field>
//                 <Field label="Description">
//                   <input
//                     className={input}
//                     value={active.description}
//                     onChange={(e) => patchActive({ description: e.target.value })}
//                   />
//                 </Field>
//               </div>

//               <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
//                 <div className="text-sm font-semibold text-slate-100">Allowed markets</div>
//                 <div className="text-xs text-slate-400 mt-1">Strategy will only execute in selected markets.</div>
//                 <div className="mt-3 flex flex-wrap gap-2">
//                   {(["FOREX", "INDIA", "CRYPTO", "COPY"] as Market[]).map((m) => {
//                     const can = availableMarkets.includes(m);
//                     const on = active.markets.includes(m);
//                     const labelM = m === "FOREX" ? "Forex" : m === "INDIA" ? "India" : m === "CRYPTO" ? "Crypto" : "Copy";
//                     return (
//                       <button
//                         key={m}
//                         type="button"
//                         disabled={!can}
//                         onClick={() => {
//                           const next = on ? active.markets.filter((x) => x !== m) : [...active.markets, m];
//                           patchActive({ markets: next });
//                         }}
//                         className={clsx(
//                           "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
//                           !can
//                             ? "opacity-40 cursor-not-allowed border-white/10 bg-white/5 text-slate-400"
//                             : on
//                             ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
//                             : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
//                         )}
//                       >
//                         {labelM}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               <div className="grid gap-3 md:grid-cols-2">
//                 <Field label="Max risk per trade" hint="Extra safety: cap risk/position sizing for this strategy.">
//                   <input
//                     className={input}
//                     type="number"
//                     min={0}
//                     step="0.01"
//                     value={active.maxRiskPerTrade ?? ""}
//                     onChange={(e) => patchActive({ maxRiskPerTrade: e.target.value ? Number(e.target.value) : null })}
//                     placeholder="e.g. 0.25"
//                   />
//                 </Field>
//                 <Field label="Daily max loss (strategy)" hint="If strategy hits this, disable it for the day (backend logic).">
//                   <input
//                     className={input}
//                     type="number"
//                     min={0}
//                     value={active.dailyMaxLoss ?? ""}
//                     onChange={(e) => patchActive({ dailyMaxLoss: e.target.value ? Number(e.target.value) : null })}
//                     placeholder="e.g. 800"
//                   />
//                 </Field>
//               </div>

//               <div className="flex items-center justify-end gap-2">
//                 <button
//                   type="button"
//                   className={clsx(btn, btnDanger)}
//                   onClick={() => {
//                     setStrategies(strategies.filter((s) => s.id !== active.id));
//                     setActiveId(strategies.find((s) => s.id !== active.id)?.id ?? "");
//                     toast.success("Strategy removed (UI only)");
//                   }}
//                 >
//                   Remove
//                 </button>
//                 <button type="button" className={clsx(btn, btnPrimary)} onClick={() => toast.success("Strategies saved")}>
//                   <Check size={16} /> Save
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="text-[11px] text-slate-500">
//         Note: Wiring strategy execution + PnL to these settings happens in your execution engine, not in UI.
//       </div>
//     </div>
//   );
// }

// /** ---------------------------
//  *  Tab: Usage (plan usage + selection in one place)
//  *  --------------------------- */
// function UsageTab({
//   summary,
//   forexUsedAccounts,
//   planPrefs,
//   setPlanPrefs,
//   plansByMarket,
// }: {
//   summary: MarketSummary;
//   forexUsedAccounts: number;
//   planPrefs: PlanPrefs;
//   setPlanPrefs: (p: PlanPrefs) => void;
//   plansByMarket: Record<Market, PlanInstance[]>;
// }) {
//   const renderMarketUsage = (m: Market, title: string) => {
//     const s = summary[m];
//     const pref = planPrefs[m];

//     const plans = plansByMarket[m] || [];
//     const chosen =
//       pref.mode === "SPECIFIC" && pref.planId ? plans.find((p) => p.planId === pref.planId) : null;

//     const effective =
//       pref.mode === "SPECIFIC" && chosen
//         ? {
//             maxConnectedAccounts: chosen.limits.maxConnectedAccounts ?? null,
//             maxActiveStrategies: chosen.limits.maxActiveStrategies ?? null,
//             maxDailyTrades: chosen.limits.maxDailyTrades ?? null,
//             maxLotPerTrade: chosen.limits.maxLotPerTrade ?? null,
//           }
//         : {
//             maxConnectedAccounts: s.maxConnectedAccounts ?? null,
//             maxActiveStrategies: s.maxActiveStrategies ?? null,
//             maxDailyTrades: s.maxDailyTrades ?? null,
//             maxLotPerTrade: s.maxLotPerTrade ?? null,
//           };

//     return (
//       <div className={clsx(soft, "p-5")}>
//         <div className="flex items-start justify-between gap-3 flex-wrap">
//           <div>
//             <div className="text-base font-semibold text-slate-100">{title}</div>
//             <div className="text-xs text-slate-400 mt-1">Limits are computed from your plan selection.</div>
//           </div>

//           <div className="flex gap-2 flex-wrap">
//             <button
//               type="button"
//               className={clsx(btn, pref.mode === "AUTO_MAX" ? btnPrimary : btnGhost)}
//               onClick={() => setPlanPrefs({ ...planPrefs, [m]: { ...pref, mode: "AUTO_MAX" } })}
//             >
//               Auto (MAX)
//             </button>
//             <button
//               type="button"
//               className={clsx(btn, pref.mode === "SPECIFIC" ? btnPrimary : btnGhost)}
//               onClick={() =>
//                 setPlanPrefs({
//                   ...planPrefs,
//                   [m]: { mode: "SPECIFIC", planId: pref.planId ?? plans[0]?.planId ?? null },
//                 })
//               }
//             >
//               Specific
//             </button>
//           </div>
//         </div>

//         {pref.mode === "SPECIFIC" ? (
//           <div className="mt-3">
//             {plans.length <= 1 ? (
//               <div className="text-xs text-slate-500">Only one active plan available.</div>
//             ) : (
//               <select
//                 className={input}
//                 value={pref.planId ?? ""}
//                 onChange={(e) => setPlanPrefs({ ...planPrefs, [m]: { mode: "SPECIFIC", planId: e.target.value } })}
//               >
//                 {plans.map((p) => (
//                   <option key={p.planId} value={p.planId}>
//                     {p.planName}
//                   </option>
//                 ))}
//               </select>
//             )}
//           </div>
//         ) : null}

//         <div className="mt-4 grid gap-3 md:grid-cols-2">
//           <UsageRow
//             label="Connected Accounts"
//             used={m === "FOREX" ? forexUsedAccounts : null}
//             max={effective.maxConnectedAccounts}
//           />
//           <UsageRow label="Max Active Strategies" used={null} max={effective.maxActiveStrategies} />
//           <UsageRow label="Max Daily Trades" used={null} max={effective.maxDailyTrades} />
//           <UsageRow label="Max Lot Per Trade" used={null} max={effective.maxLotPerTrade} />
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-lg font-semibold text-white">Plan Usage</h2>
//         <p className="text-xs text-slate-400 mt-1">
//           Choose which plan to use per market (if multiple), and see limits + usage (wire counters later).
//         </p>
//       </div>

//       {renderMarketUsage("FOREX", "Forex")}
//       {renderMarketUsage("INDIA", "Indian Market")}
//       {renderMarketUsage("CRYPTO", "Crypto")}
//       {renderMarketUsage("COPY", "Copy Trading")}

//       <div className="text-[11px] text-slate-500">
//         Note: “used” counters need APIs (e.g. active strategies count, daily trades count). UI already supports it.
//       </div>
//     </div>
//   );
// }

// /** ---------------------------
//  *  Tab: Account (inline, no redirects)
//  *  --------------------------- */
// function AccountTab({
//   subs,
//   summary,
// }: {
//   subs: any[];
//   summary: MarketSummary;
// }) {
//   const activeSubs = useMemo(() => {
//     return (subs || []).filter((s) => !isExpired(s?.endDate));
//   }, [subs]);

//   return (
//     <div className="space-y-5">
//       <div>
//         <h2 className="text-lg font-semibold text-white">Account & Billing</h2>
//         <p className="text-xs text-slate-400 mt-1">
//           Inline summary of subscriptions, expiry, and status (no redirect).
//         </p>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2">
//         <div className={clsx(soft, "p-5")}>
//           <div className="text-sm font-semibold text-slate-100">Active plans</div>
//           <div className="text-xs text-slate-400 mt-1">Non-expired subscriptions found from your API.</div>

//           <div className="mt-4 grid gap-2">
//             {activeSubs.length === 0 ? (
//               <div className="text-xs text-slate-500 rounded-xl border border-white/10 bg-white/5 p-4">
//                 No active plans found.
//               </div>
//             ) : (
//               activeSubs.map((s: any, idx: number) => {
//                 const plan = s?.plan ?? s ?? null;
//                 const name = String(plan?.name ?? plan?.planName ?? plan?.plan_name ?? "Plan");
//                 const cat = String(plan?.category ?? plan?.market ?? plan?.market_category ?? "—");
//                 const end = s?.endDate ? new Date(s.endDate).toLocaleString() : "—";
//                 const exec = Boolean(s?.executionEnabled ?? s?.allowTrade ?? plan?.executionEnabled ?? plan?.allowTrade);

//                 return (
//                   <div key={String(plan?.id ?? idx)} className="rounded-xl border border-white/10 bg-white/5 p-4">
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="min-w-0">
//                         <div className="text-sm font-semibold text-slate-100">{name}</div>
//                         <div className="text-xs text-slate-400 mt-1">
//                           Category: {cat} • Valid until: {end}
//                         </div>
//                       </div>
//                       <span
//                         className={clsx(
//                           "text-[11px] rounded-full border px-2 py-1",
//                           exec
//                             ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
//                             : "border-white/10 bg-white/5 text-slate-300"
//                         )}
//                       >
//                         {exec ? "Exec ON" : "Exec OFF"}
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <div className={clsx(soft, "p-5")}>
//           <div className="text-sm font-semibold text-slate-100">Market status</div>
//           <div className="text-xs text-slate-400 mt-1">Computed from active plans.</div>

//           <div className="mt-4 grid gap-2">
//             {(["FOREX", "INDIA", "CRYPTO", "COPY"] as Market[]).map((m) => {
//               const s = summary[m];
//               const label = m === "FOREX" ? "Forex" : m === "INDIA" ? "India" : m === "CRYPTO" ? "Crypto" : "Copy";
//               return (
//                 <div key={m} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
//                   <div>
//                     <div className="text-sm font-semibold text-slate-100">{label}</div>
//                     <div className="text-[11px] text-slate-500 mt-1">
//                       Plans: {s.plansCount} • Exec: {s.executionAllowed ? "Enabled" : "Disabled"}
//                     </div>
//                   </div>
//                   <StatusPill
//                     tone={!s.hasPlan ? "amber" : s.executionAllowed ? "emerald" : "slate"}
//                     text={!s.hasPlan ? "No Plan" : s.executionAllowed ? "Active" : "Active • No Exec"}
//                   />
//                 </div>
//               );
//             })}
//           </div>

//           <div className="mt-4 text-[11px] text-slate-500">
//             If you want invoices / billing details inline too, you can render them here from your existing billing APIs.
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /** ---------------------------
//  *  Defaults
//  *  --------------------------- */
// function defaultRiskGuard(): RiskGuard {
//   return {
//     enabled: true,
//     pauseTrading: true,
//     closePositions: false,
//     notify: true,
//     dailyMaxLoss: null,
//     dailyProfitTarget: null,
//     minGainPerDay: null,
//   };
// }

// function defaultRiskSettings(): RiskSettings {
//   return {
//     masterPause: false,
//     pauseUntil: null,
//     pauseReason: "",

//     executionMode: "EXECUTION",
//     allowedMarkets: { FOREX: true, INDIA: true, CRYPTO: true, COPY: true },

//     globalGuards: defaultRiskGuard(),

//     maxTradesPerDay: null,
//     maxOpenPositions: null,
//     maxLotPerTrade: null,
//     maxDrawdownPct: null,

//     cooldownAfterLossMins: null,
//     maxConsecutiveLosses: null,
//     pauseAfterConsecutiveLossesMins: null,

//     sessionEnabled: false,
//     sessionDays: [1, 2, 3, 4, 5],
//     sessionStart: "09:15",
//     sessionEnd: "15:30",

//     perMarketOverride: {
//       FOREX: { enabled: false, guards: defaultRiskGuard(), maxLotPerTrade: null, maxTradesPerDay: null },
//       INDIA: { enabled: false, guards: defaultRiskGuard(), maxLotPerTrade: null, maxTradesPerDay: null },
//       CRYPTO: { enabled: false, guards: defaultRiskGuard(), maxLotPerTrade: null, maxTradesPerDay: null },
//       COPY: { enabled: false, guards: defaultRiskGuard(), maxLotPerTrade: null, maxTradesPerDay: null },
//     },

//     alerts: {
//       email: true,
//       telegram: false,
//       telegramBotToken: "",
//       telegramChatId: "",
//     },
//   };
// }

// function defaultPlanPrefs(): PlanPrefs {
//   return {
//     FOREX: { mode: "AUTO_MAX", planId: null },
//     INDIA: { mode: "AUTO_MAX", planId: null },
//     CRYPTO: { mode: "AUTO_MAX", planId: null },
//     COPY: { mode: "AUTO_MAX", planId: null },
//   };
// }

// /** ---------------------------
//  *  Main Page
//  *  --------------------------- */
// export default function SettingsHubPage() {
//   const [tab, setTab] = useState<TabKey>("TRADING");

//   const {
//     data: subRes,
//     isLoading,
//     isFetching,
//     refetch,
//   } = useGetMyCurrentSubscriptionQuery();

//   const subs = useMemo(() => normalizeSubs(subRes), [subRes]);

//   const baseSummary = useMemo(() => buildMarketSummary(subs), [subs]);
//   const plansByMarket = useMemo(() => buildPlansByMarket(subs), [subs]);

//   // preferences (plan selection per market)
//   const [planPrefs, setPlanPrefs] = useLocalStorageState<PlanPrefs>(
//     "settings.planPrefs.v1",
//     defaultPlanPrefs()
//   );

//   // effective summary (applies SPECIFIC plan selection if chosen)
//   const summary = useMemo(
//     () => applyPlanPrefs(baseSummary, plansByMarket, planPrefs),
//     [baseSummary, plansByMarket, planPrefs]
//   );

//   // forex rows count (used accounts)
//   const { data: fxRes } = useGetMyForexTraderDetailsQuery(undefined as any);
//   const forexRows = useMemo(() => {
//     const raw = (fxRes as any)?.data ?? fxRes ?? [];
//     return Array.isArray(raw) ? raw : [];
//   }, [fxRes]);

//   // advanced risk settings (saved locally)
//   const [risk, setRisk] = useLocalStorageState<RiskSettings>(
//     "settings.risk.v1",
//     defaultRiskSettings()
//   );

//   // strategies UI (saved locally)
//   const [strategies, setStrategies] = useLocalStorageState<Strategy[]>(
//     "settings.strategies.v1",
//     [
//       {
//         id: "s1",
//         name: "Trend Rider",
//         description: "Follows trend confirmation + risk caps.",
//         enabled: true,
//         markets: ["FOREX"],
//         maxRiskPerTrade: 0.25,
//         dailyMaxLoss: 800,
//       },
//       {
//         id: "s2",
//         name: "Mean Reversion",
//         description: "Range trades with strict stop controls.",
//         enabled: false,
//         markets: ["INDIA"],
//         maxRiskPerTrade: 0.2,
//         dailyMaxLoss: 600,
//       },
//     ]
//   );

//   const overall = useMemo(() => {
//     const markets: Market[] = ["FOREX", "INDIA", "CRYPTO", "COPY"];
//     const activeMarkets = markets.filter((m) => summary[m].hasPlan);
//     const execOn = markets.some((m) => summary[m].hasPlan && summary[m].executionAllowed);

//     if (UI_DEBUG_UNLOCK_ALL) return { tone: "amber" as const, text: "UI Debug: unlocked" };
//     if (activeMarkets.length === 0) return { tone: "amber" as const, text: "No active plans found" };

//     if (risk.masterPause) return { tone: "amber" as const, text: "Trading Paused (Master Switch)" };

//     return execOn
//       ? { tone: "emerald" as const, text: `${activeMarkets.length} Market(s) Active • Some Execution Enabled` }
//       : { tone: "slate" as const, text: `${activeMarkets.length} Market(s) Active • Execution Disabled` };
//   }, [summary, risk.masterPause]);

//   // locked meaning: no plan for that market (during UI debug, nothing is locked)
//   const locked = (m: Market) => (!UI_DEBUG_UNLOCK_ALL && !summary[m].hasPlan);

//   return (
//     <div className={pageWrap}>
//       {/* Header */}
//       <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
//         <div>
//           <h1 className="text-xl md:text-2xl font-semibold text-white">Settings</h1>
//           <p className="text-sm text-slate-400 mt-1">
//             Advanced settings for retail traders: pause trading, daily caps, plan selection, and strategy controls.
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={() => refetch()}
//           className={clsx(btn, btnGhost, "rounded-full")}
//         >
//           <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
//           {isLoading || isFetching ? "Refreshing…" : "Refresh"}
//         </button>
//       </div>

//       {/* Overall status */}
//       <div className="mb-5 flex items-center gap-2 flex-wrap">
//         <span
//           className={clsx(
//             "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
//             overall.tone === "emerald"
//               ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
//               : overall.tone === "amber"
//               ? "text-amber-200 bg-amber-500/10 border-amber-500/20"
//               : "text-slate-200 bg-white/5 border-white/10"
//           )}
//         >
//           <ShieldCheck size={14} />
//           {overall.text}
//         </span>

//         {risk.masterPause ? (
//           <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-amber-200 bg-amber-500/10 border-amber-500/20">
//             <PauseCircle size={14} />
//             Paused {risk.pauseUntil ? `until ${new Date(risk.pauseUntil).toLocaleString()}` : ""}
//           </span>
//         ) : null}
//       </div>

//       {/* Tabs */}
//       <div className="mb-6">
//         <SectionTabs value={tab} onChange={setTab} />
//       </div>

//       {/* Content */}
//       <div className={card}>
//         {tab === "TRADING" && (
//           <TradingTab
//             summary={summary}
//             plansByMarket={plansByMarket}
//             planPrefs={planPrefs}
//             setPlanPrefs={setPlanPrefs}
//             locked={locked}
//             forexRows={forexRows}
//           />
//         )}

//         {tab === "RISK" && <RiskTab risk={risk} setRisk={setRisk} summary={summary} />}

//         {tab === "STRATEGIES" && (
//           <StrategiesTab summary={summary} strategies={strategies} setStrategies={setStrategies} />
//         )}

//         {tab === "USAGE" && (
//           <UsageTab
//             summary={summary}
//             forexUsedAccounts={forexRows.length}
//             planPrefs={planPrefs}
//             setPlanPrefs={setPlanPrefs}
//             plansByMarket={plansByMarket}
//           />
//         )}

//         {tab === "ACCOUNT" && <AccountTab subs={subs} summary={summary} />}
//       </div>

//       {/* Footer quick hint */}
//       <div className="mt-6 text-xs text-slate-500">
//         Tip: If you want to hide ALL upgrade prompts while you design UI, set{" "}
//         <span className="text-slate-200 font-semibold">UI_DEBUG_UNLOCK_ALL=true</span>.
//       </div>
//     </div>
//   );
// }
import React, { useMemo, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { dummyAccounts, dummyPlanStrategies, dummySubscriptions } from "./dummyData";
import { StrategySelections } from "./types";
// ...

import { Market, PlanPrefs, RiskSettings, TabKey } from "./types";
import { applyPlanPrefs, buildMarketSummary, buildPlansByMarket, clsx } from "./utils";
import { useLocalStorageState } from "./storage";
import { pageWrap, card, btn, btnGhost } from "./style";

import { SectionTabs } from "./SectionTabs";
import { TradingTab } from "./tabs/TradingTab";
import { RiskTab } from "./tabs/RiskTab";
import { StrategiesTab } from "./tabs/StrategiesTab";
import { UsageTab } from "./tabs/UsageTab";
import { AccountTab } from "./tabs/AccountTab";

function defaultPlanPrefs(): PlanPrefs {
  return {
    FOREX: { mode: "AUTO_MAX", planId: null },
    INDIA: { mode: "AUTO_MAX", planId: null },
    CRYPTO: { mode: "AUTO_MAX", planId: null },
    COPY: { mode: "AUTO_MAX", planId: null },
  };
}

function defaultRiskSettings(): RiskSettings {
  const guard = {
    enabled: true,
    pauseTrading: true,
    closePositions: false,
    notify: true,
    dailyMaxLoss: null,
    dailyProfitTarget: null,
    minGainPerDay: null,
  };

  return {
    masterPause: false,
    pauseUntil: null,
    pauseReason: "",
    executionMode: "EXECUTION",
    allowedMarkets: { FOREX: true, INDIA: true, CRYPTO: true, COPY: true },
    globalGuards: guard,

    maxTradesPerDay: null,
    maxOpenPositions: null,
    maxLotPerTrade: null,
    maxDrawdownPct: null,

    cooldownAfterLossMins: null,
    maxConsecutiveLosses: null,
    pauseAfterConsecutiveLossesMins: null,

    sessionEnabled: false,
    sessionDays: [1, 2, 3, 4, 5],
    sessionStart: "09:15",
    sessionEnd: "15:30",

    perMarketOverride: {
      FOREX: { enabled: false, guards: { ...guard }, maxLotPerTrade: null, maxTradesPerDay: null },
      INDIA: { enabled: false, guards: { ...guard }, maxLotPerTrade: null, maxTradesPerDay: null },
      CRYPTO: { enabled: false, guards: { ...guard }, maxLotPerTrade: null, maxTradesPerDay: null },
      COPY: { enabled: false, guards: { ...guard }, maxLotPerTrade: null, maxTradesPerDay: null },
    },

    alerts: {
      email: true,
      telegram: false,
      telegramBotToken: "",
      telegramChatId: "",
    },
  };
}

export default function SettingsHubPage() {
  const [tab, setTab] = useState<TabKey>("TRADING");

  // Dummy refresh
  const [refreshTick, setRefreshTick] = useState(0);

  // dummy "data"
  const subs = useMemo(() => dummySubscriptions, [refreshTick]);
  const accounts = useMemo(() => dummyAccounts, [refreshTick]);

  const baseSummary = useMemo(() => buildMarketSummary(subs), [subs]);
  const plansByMarket = useMemo(() => buildPlansByMarket(subs), [subs]);

  const [planPrefs, setPlanPrefs] = useLocalStorageState<PlanPrefs>("settings.planPrefs.v1", defaultPlanPrefs());
  const [risk, setRisk] = useLocalStorageState<RiskSettings>("settings.risk.v1", defaultRiskSettings());
  // const [strategies, setStrategies] = useLocalStorageState("settings.strategies.v1");
const [strategySelections, setStrategySelections] = useLocalStorageState<StrategySelections>(
  "settings.strategySelections.v1",
  {}
);

  const summary = useMemo(() => applyPlanPrefs(baseSummary, plansByMarket, planPrefs), [baseSummary, plansByMarket, planPrefs]);

  const overall = useMemo(() => {
    const markets: Market[] = ["FOREX", "INDIA", "CRYPTO", "COPY"];
    const activeMarkets = markets.filter((m) => summary[m].hasPlan);
    const execOn = markets.some((m) => summary[m].hasPlan && summary[m].executionAllowed);

    if (risk.masterPause) return { tone: "amber" as const, text: "Trading Paused (Master switch)" };
    if (activeMarkets.length === 0) return { tone: "amber" as const, text: "No active plans found" };
    return execOn
      ? { tone: "emerald" as const, text: `${activeMarkets.length} Market(s) Active • Some Execution Enabled` }
      : { tone: "slate" as const, text: `${activeMarkets.length} Market(s) Active • Execution Disabled` };
  }, [summary, risk.masterPause]);

  const locked = (m: Market) => !summary[m].hasPlan;

  const accountsCountByMarket = useMemo(() => {
    return {
      FOREX: accounts.filter((a) => a.market === "FOREX").length,
      INDIA: accounts.filter((a) => a.market === "INDIA").length,
      CRYPTO: accounts.filter((a) => a.market === "CRYPTO").length,
      COPY: accounts.filter((a) => a.market === "COPY").length,
    };
  }, [accounts]);

  return (
    <div className={pageWrap}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Dummy mode: all settings are local-only. Later you can wire APIs without changing the UI structure.
          </p>
        </div>

        <button type="button" onClick={() => setRefreshTick((x) => x + 1)} className={clsx(btn, btnGhost, "rounded-full")}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mb-5">
        <span
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
            overall.tone === "emerald"
              ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
              : overall.tone === "amber"
              ? "text-amber-200 bg-amber-500/10 border-amber-500/20"
              : "text-slate-200 bg-white/5 border-white/10"
          )}
        >
          <ShieldCheck size={14} />
          {overall.text}
        </span>
      </div>

      <div className="mb-6">
        <SectionTabs value={tab} onChange={setTab} />
      </div>

      <div className={card}>
        {tab === "TRADING" && (
          <TradingTab
            summary={summary}
            plansByMarket={plansByMarket}
            planPrefs={planPrefs}
            setPlanPrefs={setPlanPrefs}
            locked={locked}
            accounts={accounts}
          />
        )}

        {tab === "RISK" && <RiskTab risk={risk} setRisk={setRisk} summary={summary} />}

    {tab === "STRATEGIES" && (
  <StrategiesTab
    summary={summary}
    plansByMarket={plansByMarket}
    planPrefs={planPrefs}
    setPlanPrefs={setPlanPrefs}
    strategyDefs={dummyPlanStrategies}
    selections={strategySelections}
    setSelections={setStrategySelections}
  />
)}


        {tab === "USAGE" && (
          <UsageTab
            summary={summary}
            accountsCountByMarket={accountsCountByMarket}
            planPrefs={planPrefs}
            setPlanPrefs={setPlanPrefs}
            plansByMarket={plansByMarket}
          />
        )}

        {tab === "ACCOUNT" && <AccountTab subs={subs} summary={summary} />}
      </div>
    </div>
  );
}
