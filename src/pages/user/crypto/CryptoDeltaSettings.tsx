import React, { useEffect, useMemo, useState } from "react";
import ApiAccountsManager, { ApiAccountItem, ApiTypeOption } from "../ApiAccountsManager";

import CryptoStrategiesDrawer from "./components/CryptoStrategiesDrawer";
import CryptoWebhookDrawer from "./components/CryptoWebhookDrawer";

import { dummyCryptoPlans, dummyCryptoPlanStrategies } from "./crypto.dummy";
import { CryptoPlanInstance, CryptoPlanSignalSettings, CryptoStrategySelections } from "./crypto.types";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const UI_DEBUG_UNLOCK_ALL = true;

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition";
const btnGhost = "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

const selectInline =
  "h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 outline-none " +
  "focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40";

const pillBase =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap";
const pillOff = "border-white/10 bg-white/5 text-slate-200";
const pillOn = "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";

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
function ensurePlanDefaults(planId: string, map: CryptoPlanSignalSettings): CryptoPlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

const CRYPTO_TYPES: ApiTypeOption[] = [
  {
    value: "DELTA",
    label: "Delta",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "apiKey", label: "Delta Api Key", placeholder: "Delta Api Key", required: true },
      { key: "apiSecret", label: "Delta Api Secret Key", placeholder: "Delta Api Secret Key", required: true, type: "password" },
    ],
  },
  {
    value: "BINANCE_FUTURE",
    label: "Binance Future",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "apiKey", label: "API Key", placeholder: "Binance API Key", required: true },
      { key: "apiSecret", label: "API Secret", placeholder: "Binance API Secret", required: true, type: "password" },
    ],
  },
  {
    value: "COINDCX",
    label: "CoinDCX",
    fields: [
      { key: "apiName", label: "Api Name", placeholder: "Api Name", required: true },
      { key: "apiKey", label: "API Key", placeholder: "CoinDCX API Key", required: true },
      { key: "apiSecret", label: "API Secret", placeholder: "CoinDCX API Secret", required: true, type: "password" },
    ],
  },
];

export default function CryptoTradingPage() {
  const plans = useMemo(() => dummyCryptoPlans, []);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() =>
    getLS("crypto.selectedPlanId.v1", plans[0]?.planId ?? "")
  );
  useEffect(() => setLS("crypto.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

  const selectedPlan: CryptoPlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const [planSignals, setPlanSignals] = useState<CryptoPlanSignalSettings>(() =>
    getLS("crypto.planSignals.v1", {})
  );
  useEffect(() => setLS("crypto.planSignals.v1", planSignals), [planSignals]);

  useEffect(() => {
    if (selectedPlan?.planId) setPlanSignals((prev) => ensurePlanDefaults(selectedPlan.planId, prev));
  }, [selectedPlan?.planId]);

  const [strategySelections, setStrategySelections] = useState<CryptoStrategySelections>(() =>
    getLS("crypto.strategySelections.v1", {})
  );
  useEffect(() => setLS("crypto.strategySelections.v1", strategySelections), [strategySelections]);

  const signals = selectedPlan?.planId ? planSignals[selectedPlan.planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;
  const webhookEnabled = !!signals?.webhookEnabled;

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (strategySelections[selectedPlan.planId] ?? []).length;
  }, [selectedPlan, strategySelections]);

  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook, setOpenWebhook] = useState(false);

  const [items, setItems] = useState<ApiAccountItem[]>([]);
  useEffect(() => {
    setItems([
      {
        id: 9001,
        type: "DELTA",
        apiName: "Main Delta",
        enabled: true,
        createdAt: "2026-01-10T10:00:00.000Z",
        updatedAt: "2026-01-20T12:30:00.000Z",
        meta: { apiKey: "****", apiSecret: "****" },
      },
    ]);
  }, []);

  const maxAccounts = selectedPlan?.limits?.maxConnectedAccounts ?? 0;
  const maxStrategies = selectedPlan?.limits?.maxActiveStrategies ?? 0;

  const limitReached = maxAccounts > 0 && items.length >= maxAccounts;
  const locked = (!selectedPlan && !UI_DEBUG_UNLOCK_ALL) || !selectedPlan;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* ✅ Forex-style header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Crypto APIs</h1>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          {/* left: plan + pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Plan:</span>
              <select
                className={selectInline}
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

          {/* right: drawer buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className={clsx(btn, btnGhost)} onClick={() => setOpenWebhook(true)} disabled={locked}>
              Webhook
            </button>
            <button type="button" className={clsx(btn, btnGhost)} onClick={() => setOpenStrategies(true)} disabled={locked}>
              Strategies
            </button>
          </div>
        </div>

        {/* Accounts used line (Forex-style) */}
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

      {/* ✅ MAIN: Accounts */}
      <ApiAccountsManager
        title="Crypto APIs"
        typeLabel="API TYPE"
        typeOptions={CRYPTO_TYPES}
        maxAccounts={maxAccounts || 10}
        locked={false}
        lockedReason="Upgrade to add more crypto APIs."
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
        items={items}
        onItemsChange={setItems}
      />

      {/* Drawers */}
      <CryptoWebhookDrawer
        open={openWebhook}
        onClose={() => setOpenWebhook(false)}
        plan={selectedPlan}
        accounts={items}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
      />

      <CryptoStrategiesDrawer
        open={openStrategies}
        onClose={() => setOpenStrategies(false)}
        plan={selectedPlan}
        strategyDefs={dummyCryptoPlanStrategies}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={strategySelections}
        setSelections={setStrategySelections}
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
      />
    </div>
  );
}
