import React, { useEffect, useMemo, useState } from "react";
import ApiAccountsManager, { ApiAccountItem, ApiTypeOption } from "../ApiAccountsManager";

import CryptoStrategiesDrawer from "./components/CryptoStrategiesDrawer";
import CryptoWebhookDrawer from "./components/CryptoWebhookDrawer";

import { useGetMyCurrentSubscriptionQuery, UserSubscription, SubscriptionPlan } from "../../../services/profileSubscription.api";
import { useListMyTradingAccountsQuery } from "../../../services/tradingAccounts.api";
import { CryptoPlanInstance, CryptoPlanSignalSettings, CryptoPlanStrategyDef, CryptoStrategySelections } from "./crypto.types";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const UI_DEBUG_UNLOCK_ALL = false;

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

function toCryptoPlan(sub: UserSubscription, plan: SubscriptionPlan | null | undefined): CryptoPlanInstance {
  return {
    planId: String(sub.id),
    planName: plan?.name ?? `Plan #${sub.planId}`,
    endDate: sub.endDate ?? null,
    executionAllowed: sub.executionEnabled,
    limits: {
      maxConnectedAccounts: plan?.maxConnectedAccounts ?? 0,
      maxActiveStrategies: plan?.maxActiveStrategies ?? 0,
      maxDailyTrades: plan?.maxDailyTrades ?? undefined,
      maxLotPerTrade: plan?.maxLotPerTrade ? Number(plan.maxLotPerTrade) : undefined,
    },
  };
}

function toCryptoStrategyDefs(plan: SubscriptionPlan | null | undefined, planId: string): CryptoPlanStrategyDef[] {
  const raw: any[] = plan?.metadata?.strategies ?? plan?.featureFlags?.strategies ?? [];
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map((s: any, i: number) => ({
    id: String(s.id ?? `${planId}-strat-${i}`),
    planId,
    market: "CRYPTO" as const,
    name: String(s.name ?? `Strategy ${i + 1}`),
    description: String(s.description ?? ""),
    tags: Array.isArray(s.tags) ? s.tags : [],
  }));
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
  const { data: subData, isLoading: subLoading } = useGetMyCurrentSubscriptionQuery();
  const sub = subData?.data ?? null;
  const plan = sub ? (sub as any).plan as SubscriptionPlan | null : null;

  const { data: accounts = [], isLoading: accountsLoading } = useListMyTradingAccountsQuery();
  const cryptoAccounts = useMemo(
    () => accounts.filter((a) => ["DELTA", "BINANCE_FUTURE", "COINDCX"].includes(String(a.broker ?? "").toUpperCase())),
    [accounts]
  );

  const items: ApiAccountItem[] = useMemo(
    () => cryptoAccounts.map((a) => ({
      id: a.id,
      type: String(a.broker ?? ""),
      apiName: a.label ?? a.accountLabel ?? `Account ${a.id}`,
      enabled: a.status === "verified",
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      meta: {},
    })),
    [cryptoAccounts]
  );

  const plans: CryptoPlanInstance[] = useMemo(
    () => (sub && plan?.category === "CRYPTO" ? [toCryptoPlan(sub, plan)] : []),
    [sub, plan]
  );
  const hasPlan = plans.length > 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() =>
    getLS("crypto.selectedPlanId.v1", plans[0]?.planId ?? "")
  );
  useEffect(() => setLS("crypto.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

  // Keep selectedPlanId in sync when plans load
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].planId);
    }
  }, [plans, selectedPlanId]);

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

  const maxAccounts = selectedPlan?.limits?.maxConnectedAccounts ?? 0;
  const maxStrategies = selectedPlan?.limits?.maxActiveStrategies ?? 0;

  const limitReached = maxAccounts > 0 && items.length >= maxAccounts;
  const locked = !hasPlan || !selectedPlan;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Forex-style header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Crypto APIs</h1>
        {(subLoading || accountsLoading) && <p className="text-xs text-slate-400 mt-2">Loading…</p>}

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

      {/* MAIN: Accounts */}
      <ApiAccountsManager
        title="Crypto APIs"
        typeLabel="API TYPE"
        typeOptions={CRYPTO_TYPES}
        maxAccounts={maxAccounts || 10}
        locked={false}
        lockedReason="Upgrade to add more crypto APIs."
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
        items={items}
        onItemsChange={() => {}}
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
        strategyDefs={toCryptoStrategyDefs(plan, selectedPlanId)}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={strategySelections}
        setSelections={setStrategySelections}
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
      />
    </div>
  );
}
