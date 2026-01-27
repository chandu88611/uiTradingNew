import React, { useEffect, useMemo, useState } from "react";
import ApiAccountsManager, { ApiAccountItem, ApiTypeOption } from "../ApiAccountsManager";

import StrategiesDrawer from "./components/StrategiesDrawer";
import WebhookDrawer from "./components/WebhookDrawer";

import { dummyIndiaPlans, dummyIndiaPlanStrategies } from "./india.dummy";
import { PlanInstance, PlanSignalSettings, StrategySelections } from "./india.types";
import { clsx, btn, btnGhost, input } from "./ui";

// ✅ UI only debug
const UI_DEBUG_UNLOCK_ALL = true;

const INDIAN_TYPES: ApiTypeOption[] = [
  {
    value: "KITE",
    label: "Kite",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "apiKey", label: "Kite Api Key", placeholder: "Kite Api Key", required: true },
      { key: "apiSecret", label: "Kite Api Secret Key", placeholder: "Kite Api Secret Key", required: true, type: "password" },
    ],
  },
  {
    value: "DHAN",
    label: "Dhan",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "clientId", label: "Client Id", placeholder: "Client Id", required: true },
      { key: "token", label: "Access Token", placeholder: "Access Token", required: true, type: "password" },
    ],
  },
  {
    value: "ANGEL",
    label: "Angel",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "clientId", label: "Client Id", placeholder: "Client Id", required: true },
      { key: "apiKey", label: "Api Key", placeholder: "Api Key", required: true },
      { key: "apiSecret", label: "Api Secret", placeholder: "Api Secret", required: true, type: "password" },
    ],
  },
  {
    value: "UPSTOX",
    label: "Upstox",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "apiKey", label: "Api Key", placeholder: "Api Key", required: true },
      { key: "apiSecret", label: "Api Secret", placeholder: "Api Secret", required: true, type: "password" },
    ],
  },
  { value: "FYERS", label: "Fyers", fields: [{ key: "apiName", label: "Api Name", placeholder: "Api Name", required: true }] },
  { value: "SHOONYA", label: "Shoonya", fields: [{ key: "apiName", label: "Api Name", placeholder: "Api Name", required: true }] },
  { value: "ALICEBLUE", label: "AliceBlue", fields: [{ key: "apiName", label: "Api Name", placeholder: "Api Name", required: true }] },
];

function getLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function setLS(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function ensurePlanSignalDefaults(planId: string, map: PlanSignalSettings): PlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

const pillBase =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap";
const pillOff = "border-white/10 bg-white/5 text-slate-200";
const pillOn = "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";

export default function IndianTradingPage() {
  const plans = useMemo(() => dummyIndiaPlans, []);
  const hasPlan = plans.length > 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const saved = getLS<string | null>("india.selectedPlanId.v1", null);
    return saved ?? plans[0]?.planId ?? "";
  });

  useEffect(() => {
    if (selectedPlanId) setLS("india.selectedPlanId.v1", selectedPlanId);
  }, [selectedPlanId]);

  const selectedPlan: PlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  // per-plan toggles
  const [planSignals, setPlanSignals] = useState<PlanSignalSettings>(() => getLS("india.planSignals.v1", {}));
  useEffect(() => setLS("india.planSignals.v1", planSignals), [planSignals]);

  useEffect(() => {
    if (selectedPlan?.planId) setPlanSignals((prev) => ensurePlanSignalDefaults(selectedPlan.planId, prev));
  }, [selectedPlan?.planId]);

  const signals = selectedPlan?.planId ? planSignals[selectedPlan.planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;
  const webhookEnabled = !!signals?.webhookEnabled;

  const [strategySelections, setStrategySelections] = useState<StrategySelections>(() =>
    getLS("india.strategySelections.v1", {})
  );
  useEffect(() => setLS("india.strategySelections.v1", strategySelections), [strategySelections]);

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (strategySelections[selectedPlan.planId] ?? []).length;
  }, [strategySelections, selectedPlan]);

  // drawers
  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook, setOpenWebhook] = useState(false);

  // accounts
  const [items, setItems] = useState<ApiAccountItem[]>([]);
  useEffect(() => {
    setItems([
      {
        id: 4108,
        type: "DHAN",
        apiName: "Pankaj",
        enabled: true,
        createdAt: "2026-01-20T03:27:00.000Z",
        updatedAt: "2026-01-20T11:44:00.000Z",
        meta: { clientId: "xxxx", token: "****" },
      },
      {
        id: 3748,
        type: "KITE",
        apiName: "Pankaj",
        enabled: false,
        createdAt: "2025-12-18T19:07:00.000Z",
        updatedAt: "2026-01-20T08:58:00.000Z",
        meta: { apiKey: "****", apiSecret: "****" },
      },
    ]);
  }, []);

  const locked = (!hasPlan && !UI_DEBUG_UNLOCK_ALL) || !selectedPlan;

  const maxAccounts = selectedPlan?.limits?.maxConnectedAccounts ?? 0;
  const maxStrategies = selectedPlan?.limits?.maxActiveStrategies ?? 0;

  const limitReached = maxAccounts > 0 && items.length >= maxAccounts;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* ✅ Forex-style header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Indian APIs</h1>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          {/* left controls: plan + pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Plan:</span>
              <select
                className={clsx(
                  "h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 outline-none",
                  "focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40"
                )}
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={plans.length <= 1}
              >
                {plans.map((p) => (
                  <option key={p.planId} value={p.planId}>
                    {p.planName}
                  </option>
                ))}
              </select>
            </div>

            <span className={clsx(pillBase, strategiesEnabled ? pillOn : pillOff)}>
              Strategies: {strategiesEnabled ? "ON" : "OFF"} ({enabledStrategyCount}/{maxStrategies || 0})
            </span>

            <span className={clsx(pillBase, webhookEnabled ? pillOn : pillOff)}>
              Webhook: {webhookEnabled ? "ON" : "OFF"}
            </span>
          </div>

          {/* right buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className={clsx(btn, btnGhost)}
              onClick={() => setOpenWebhook(true)}
              disabled={locked}
            >
              Webhook
            </button>

            <button
              type="button"
              className={clsx(btn, btnGhost)}
              onClick={() => setOpenStrategies(true)}
              disabled={locked}
            >
              Strategies
            </button>
          </div>
        </div>

        {/* Accounts used line (Forex style) */}
        <div className="mt-2 text-xs text-slate-400">
          Accounts used:{" "}
          <span className="text-slate-200 font-semibold">{items.length}</span>
          {maxAccounts > 0 ? (
            <>
              {" "}
              / <span className="text-slate-200 font-semibold">{maxAccounts}</span>
            </>
          ) : null}
          {limitReached ? <span className="ml-2 text-amber-300">Plan limit reached</span> : null}
        </div>
      </div>

      {/* ✅ MAIN PRIORITY: Accounts */}
      <ApiAccountsManager
        title="Indian APIs"
        typeLabel="API TYPE"
        typeOptions={INDIAN_TYPES}
        maxAccounts={maxAccounts || 10}
        locked={!!locked}
        lockedReason="Upgrade to add Indian broker APIs."
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
        items={items}
        onItemsChange={setItems}
      />

      {/* Drawers */}
      <WebhookDrawer
        open={openWebhook}
        onClose={() => setOpenWebhook(false)}
        plan={selectedPlan}
        accounts={items}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
      />

      <StrategiesDrawer
        open={openStrategies}
        onClose={() => setOpenStrategies(false)}
        plan={selectedPlan}
        strategyDefs={dummyIndiaPlanStrategies}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={strategySelections}
        setSelections={setStrategySelections}
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
      />
    </div>
  );
}
