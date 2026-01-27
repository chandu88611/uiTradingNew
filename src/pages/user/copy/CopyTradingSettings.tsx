import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Shield,
  FileText,
  BookOpen,
  CreditCard,
} from "lucide-react";

import {
  Market,
  PlanInstance,
  PlanSignalSettings,
  MarketPlanSelection,
  UsageByMarket,
  GlobalRiskSettings,
} from "./settingsHub.types";

import {
  dummyPlans,
  dummyPlanSignals,
  dummySelections,
  dummyUsage,
  dummyGlobalRisk,
} from "./settingsHub.dummy";

import { clsx, getLS, setLS } from "./ui";

const LS_KEYS = {
  selections: "hub.marketSelection.v1",
  signals: "hub.planSignals.v1",
  usage: "hub.usage.v1",
  global: "hub.globalRisk.v1",
};

const routesByMarket: Record<Market, string> = {
  FOREX: "/forex-trading",
  INDIA: "/indian-trading",
  CRYPTO: "/crypto-trading",
  COPY: "/copy-trading",
};

const wrap = "w-full";
const panel = "rounded-2xl border border-slate-800 bg-slate-900/60";
const panelPad = "p-5 md:p-6";
const subtle = "rounded-2xl border border-slate-800 bg-slate-950/40";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
const btnOutline =
  "border border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-900/60";
const btnPrimary =
  "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20";
const input =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40";

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 rounded-full border transition",
        checked ? "bg-emerald-500/90 border-emerald-400" : "bg-slate-800 border-slate-700"
      )}
      aria-pressed={checked}
    >
      <span
        className={clsx(
          "absolute top-[3px] h-4 w-4 rounded-full bg-slate-950 transition",
          checked ? "left-6" : "left-[3px]"
        )}
      />
    </button>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={clsx(
        "inline-block h-2 w-2 rounded-full",
        ok ? "bg-emerald-400" : "bg-slate-500"
      )}
    />
  );
}

export default function SettingsHubPage() {
  const navigate = useNavigate();

  // dummy now (later from API)
  const plans: PlanInstance[] = useMemo(() => dummyPlans, []);

  const plansByMarket = useMemo(() => {
    const map: Record<Market, PlanInstance[]> = { FOREX: [], INDIA: [], CRYPTO: [], COPY: [] };
    for (const p of plans) map[p.market].push(p);
    return map;
  }, [plans]);

  const activeMarkets = useMemo(() => {
    return (Object.keys(plansByMarket) as Market[]).filter((m) => plansByMarket[m].length > 0);
  }, [plansByMarket]);

  const [selections, setSelections] = useState<MarketPlanSelection>(() =>
    getLS<MarketPlanSelection>(LS_KEYS.selections, dummySelections)
  );

  const [planSignals, setPlanSignals] = useState<PlanSignalSettings>(() =>
    getLS<PlanSignalSettings>(LS_KEYS.signals, dummyPlanSignals)
  );

  const [usageByMarket] = useState<UsageByMarket>(() =>
    getLS<UsageByMarket>(LS_KEYS.usage, dummyUsage)
  );

  const [globalRisk, setGlobalRisk] = useState<GlobalRiskSettings>(() =>
    getLS<GlobalRiskSettings>(LS_KEYS.global, dummyGlobalRisk)
  );

  // persist
  useEffect(() => setLS(LS_KEYS.selections, selections), [selections]);
  useEffect(() => setLS(LS_KEYS.signals, planSignals), [planSignals]);
  useEffect(() => setLS(LS_KEYS.global, globalRisk), [globalRisk]);

  // ensure selection exists
  useEffect(() => {
    setSelections((prev) => {
      const next = { ...prev };
      (Object.keys(plansByMarket) as Market[]).forEach((m) => {
        const list = plansByMarket[m];
        if (list.length === 0) next[m] = null;
        else if (!next[m] || !list.some((p) => p.planId === next[m])) next[m] = list[0].planId;
      });
      return next;
    });
  }, [plansByMarket]);

  // ensure signal defaults exist
  useEffect(() => {
    const allPlanIds = plans.map((p) => p.planId);
    setPlanSignals((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of allPlanIds) {
        if (!next[id]) {
          next[id] = { strategiesEnabled: true, webhookEnabled: false };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [plans]);

  const pausedNow =
    globalRisk.paused &&
    (!globalRisk.pauseUntil ||
      (Number.isFinite(new Date(globalRisk.pauseUntil).getTime()) &&
        new Date(globalRisk.pauseUntil).getTime() > Date.now()));

  if (activeMarkets.length === 0) {
    return (
      <div className={wrap}>
        <div className="mb-5">
          <div className="text-xl md:text-2xl font-semibold text-white">Settings</div>
          <div className="text-sm text-slate-400 mt-1">No active plans.</div>
        </div>

        <div className={clsx(panel, panelPad)}>
          <div className="text-base font-semibold text-slate-100">No active plans</div>
          <div className="text-sm text-slate-400 mt-1">
            Buy a plan to unlock trading modules.
          </div>
          <button className={clsx(btn, btnOutline, "mt-4")} onClick={() => navigate("/plan")}>
            Open Plans <ExternalLink size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      {/* Top header like Forex page */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Simple hub to open the right module. Full setup happens inside each market page.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className={clsx(btn, btnOutline)} onClick={() => navigate("/plan")}>
            Plans <ExternalLink size={16} />
          </button>

          <button className={clsx(btn, btnOutline)} onClick={() => navigate("/user/logs/trades")}>
            <FileText size={16} /> Trades
          </button>

          <button className={clsx(btn, btnOutline)} onClick={() => navigate("/user/logs/orders")}>
            <BookOpen size={16} /> Positions
          </button>

          <button className={clsx(btn, btnOutline)} onClick={() => navigate("/subscriptions/invoices")}>
            <CreditCard size={16} /> Invoices
          </button>
        </div>
      </div>

      {/* Global simple controls (NOT heavy) */}
      <div className={clsx(panel, panelPad, "mb-5")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-amber-300" />
              <div className="text-base font-semibold text-slate-100">Global Safety</div>
              <span
                className={clsx(
                  "ml-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                  pausedNow
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                )}
              >
                {pausedNow ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                {pausedNow ? "Paused" : "Active"}
              </span>
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Keep this simple. Pause everything or apply daily limits.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300">Pause All</div>
            <Toggle
              checked={globalRisk.paused}
              onChange={(v) => setGlobalRisk((p) => ({ ...p, paused: v }))}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400">Pause until (optional)</div>
            <input
              className={input}
              type="datetime-local"
              value={globalRisk.pauseUntil ? toLocal(globalRisk.pauseUntil) : ""}
              onChange={(e) =>
                setGlobalRisk((p) => ({
                  ...p,
                  pauseUntil: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </div>

          <div>
            <div className="text-xs text-slate-400">Max loss/day (₹)</div>
            <input
              className={input}
              placeholder="e.g. 2500"
              value={globalRisk.maxLossAmount ?? ""}
              onChange={(e) => setGlobalRisk((p) => ({ ...p, maxLossAmount: toNum(e.target.value) }))}
            />
          </div>

          <div>
            <div className="text-xs text-slate-400">Min gain/day (₹)</div>
            <input
              className={input}
              placeholder="e.g. 800"
              value={globalRisk.minGainAmount ?? ""}
              onChange={(e) => setGlobalRisk((p) => ({ ...p, minGainAmount: toNum(e.target.value) }))}
            />
          </div>

          <div>
            <div className="text-xs text-slate-400">Max trades/day</div>
            <input
              className={input}
              placeholder="e.g. 25"
              value={globalRisk.maxTradesPerDay ?? ""}
              onChange={(e) => setGlobalRisk((p) => ({ ...p, maxTradesPerDay: toNum(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      {/* Markets grid (clean cards) */}
      <div className="mb-3 flex items-end justify-between gap-2 flex-wrap">
        <div>
          <div className="text-base font-semibold text-slate-100">Your Markets</div>
          <div className="text-sm text-slate-400 mt-1">
            Accounts + strategies/webhook are configured inside each market page.
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(plansByMarket) as Market[])
          .filter((m) => plansByMarket[m].length > 0)
          .map((market) => {
            const list = plansByMarket[market];
            const selectedId = selections[market] ?? list[0]?.planId ?? null;
            const selectedPlan = list.find((p) => p.planId === selectedId) ?? list[0];

            const sig = selectedPlan ? planSignals[selectedPlan.planId] : undefined;

            const strategiesOn = !!selectedPlan?.strategiesAvailable && !!sig?.strategiesEnabled;
            const webhookOn = !!selectedPlan?.webhookAvailable && !!sig?.webhookEnabled;

            const usage = usageByMarket[market];
            const accountsUsed = usage?.accountsUsed ?? null;

            return (
              <div key={market} className={clsx(panel, panelPad)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-100">
                      {marketTitle(market)}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Accounts used:{" "}
                      <span className="text-slate-100 font-semibold">
                        {accountsUsed ?? "—"}
                      </span>
                      {selectedPlan?.limits?.maxConnectedAccounts ? (
                        <>
                          {" "}
                          /{" "}
                          <span className="text-slate-100 font-semibold">
                            {selectedPlan.limits.maxConnectedAccounts}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={clsx(btn, btnPrimary)}
                    onClick={() => navigate(routesByMarket[market])}
                  >
                    Open <ArrowRight size={16} />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-400">Plan</div>
                    <select
                      className={input}
                      value={selectedPlan?.planId ?? ""}
                      onChange={(e) => setSelections((p) => ({ ...p, [market]: e.target.value }))}
                      disabled={list.length <= 1}
                    >
                      {list.map((p) => (
                        <option key={p.planId} value={p.planId}>
                          {p.planName}
                        </option>
                      ))}
                    </select>
                    <div className="text-[12px] text-slate-500 mt-2">
                      Valid until: <span className="text-slate-200">{fmt(selectedPlan?.expiresAt)}</span>
                    </div>
                  </div>

                  <div className={clsx(subtle, "p-4")}>
                    <div className="text-xs text-slate-400">Status</div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Execution</span>
                        <span className="inline-flex items-center gap-2">
                          <Dot ok={!!selectedPlan?.executionAllowed} />
                          <span className="text-slate-200">
                            {selectedPlan?.executionAllowed ? "Enabled" : "Disabled"}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Strategies</span>
                        <span className="inline-flex items-center gap-2">
                          <Dot ok={strategiesOn} />
                          <span className="text-slate-200">{strategiesOn ? "ON" : "OFF"}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Webhook</span>
                        <span className="inline-flex items-center gap-2">
                          <Dot ok={webhookOn} />
                          <span className="text-slate-200">{webhookOn ? "ON" : "OFF"}</span>
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[12px] text-slate-400">
                        Limits: {selectedPlan?.limits?.maxActiveStrategies ?? "—"} strategies •{" "}
                        {selectedPlan?.limits?.maxDailyTrades ?? "—"} trades/day
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional: small note (no extra chips) */}
                <div className="mt-4 text-[12px] text-slate-500">
                  Configure accounts + strategies/webhook inside{" "}
                  <span className="text-slate-200 font-semibold">{marketTitle(market)}</span> page.
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function marketTitle(m: Market) {
  if (m === "FOREX") return "Forex Trading";
  if (m === "INDIA") return "Indian Trading";
  if (m === "CRYPTO") return "Crypto Trading";
  return "Copy Trading";
}

function toNum(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// ISO -> datetime-local
function toLocal(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
