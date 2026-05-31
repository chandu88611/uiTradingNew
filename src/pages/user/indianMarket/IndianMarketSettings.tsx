import React, { useEffect, useMemo, useState } from "react";
import ApiAccountsManager, { ApiAccountItem, ApiTypeOption } from "../ApiAccountsManager";

import StrategiesDrawer from "./components/StrategiesDrawer";
import WebhookDrawer from "./components/WebhookDrawer";
import ZebuAuthModal from "./components/ZebuAuthModal";

import { PlanInstance, PlanSignalSettings, PlanStrategyDef, StrategySelections } from "./india.types";
import { clsx, btn, btnGhost } from "./ui";
import { useListMyTradingAccountsQuery } from "../../../services/tradingAccounts.api";
import {
  useGetMyCurrentSubscriptionQuery,
  UserSubscription,
  SubscriptionPlan,
} from "../../../services/profileSubscription.api";

const INDIAN_TYPES: ApiTypeOption[] = [
  {
    value: "ZEBU",
    label: "Zebu (Shoonya)",
    fields: [
      { key: "apiName",     label: "Display Name",   placeholder: "e.g. My Zebu Account", required: true },
      { key: "uid",         label: "Zebu User ID",    placeholder: "Your Zebu login ID",   required: true },
      { key: "password",    label: "Password",        placeholder: "Zebu login password",  required: true, type: "password" },
      { key: "vendorCode",  label: "Vendor Code",     placeholder: "Vendor / VC code",     required: true },
      { key: "imei",        label: "IMEI / Device ID", placeholder: "Device identifier",   required: false },
    ],
  },
  {
    value: "KITE",
    label: "Kite",
    fields: [
      { key: "apiName",    label: "Api Name",        placeholder: "Api Name",            required: true },
      { key: "apiKey",     label: "Kite Api Key",    placeholder: "Kite Api Key",        required: true },
      { key: "apiSecret",  label: "Kite Api Secret", placeholder: "Kite Api Secret Key", required: true, type: "password" },
    ],
  },
  {
    value: "DHAN",
    label: "Dhan",
    fields: [
      { key: "apiName",  label: "Api Name",      placeholder: "Api Name",      required: true },
      { key: "clientId", label: "Client Id",     placeholder: "Client Id",     required: true },
      { key: "token",    label: "Access Token",  placeholder: "Access Token",  required: true, type: "password" },
    ],
  },
  {
    value: "ANGEL",
    label: "Angel",
    fields: [
      { key: "apiName",   label: "Api Name",   placeholder: "Api Name",   required: true },
      { key: "clientId",  label: "Client Id",  placeholder: "Client Id",  required: true },
      { key: "apiKey",    label: "Api Key",    placeholder: "Api Key",    required: true },
      { key: "apiSecret", label: "Api Secret", placeholder: "Api Secret", required: true, type: "password" },
    ],
  },
  {
    value: "UPSTOX",
    label: "Upstox",
    fields: [
      { key: "apiName",   label: "Api Name",   placeholder: "Api Name",   required: true },
      { key: "apiKey",    label: "Api Key",    placeholder: "Api Key",    required: true },
      { key: "apiSecret", label: "Api Secret", placeholder: "Api Secret", required: true, type: "password" },
    ],
  },
  { value: "FYERS",     label: "Fyers",     fields: [{ key: "apiName", label: "Api Name", placeholder: "Api Name", required: true }] },
  { value: "SHOONYA",   label: "Shoonya",   fields: [{ key: "apiName", label: "Api Name", placeholder: "Api Name", required: true }] },
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
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function ensurePlanSignalDefaults(planId: string, map: PlanSignalSettings): PlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

/** Map a UserSubscription + its plan into the UI PlanInstance shape */
function toPlanInstance(sub: UserSubscription, plan: SubscriptionPlan | null | undefined): PlanInstance {
  return {
    planId: String(sub.id),
    planName: plan?.name ?? `Plan #${sub.planId}`,
    endDate: sub.endDate ?? null,
    executionAllowed: sub.executionEnabled,
    limits: {
      maxConnectedAccounts: plan?.maxConnectedAccounts ?? 0,
      maxActiveStrategies:  plan?.maxActiveStrategies ?? 0,
      maxDailyTrades:       plan?.maxDailyTrades ?? undefined,
      maxLotPerTrade:       plan?.maxLotPerTrade ? Number(plan.maxLotPerTrade) : undefined,
    },
  };
}

/** Extract strategy definitions from plan metadata (field: metadata.strategies[]) */
function toPlanStrategyDefs(plan: SubscriptionPlan | null | undefined, planId: string): PlanStrategyDef[] {
  const raw: any[] = plan?.metadata?.strategies ?? plan?.featureFlags?.strategies ?? [];
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map((s: any, i: number) => ({
    id:          String(s.id ?? `${planId}-strat-${i}`),
    planId,
    market:      "INDIA" as const,
    name:        String(s.name ?? `Strategy ${i + 1}`),
    description: String(s.description ?? ""),
    tags:        Array.isArray(s.tags) ? s.tags : [],
  }));
}

const pillBase = "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap";
const pillOff  = "border-white/10 bg-white/5 text-slate-200";
const pillOn   = "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";

export default function IndianTradingPage() {
  // ── Real API: current subscription ──────────────────────────────
  const { data: subData, isLoading: subLoading } = useGetMyCurrentSubscriptionQuery();
  const sub  = subData?.data ?? null;
  const plan = sub ? (sub as any).plan as SubscriptionPlan | null : null;

  // ── Real API: user's trading accounts (filter India brokers) ────
  const { data: accounts = [], isLoading: accountsLoading } = useListMyTradingAccountsQuery();
  const indiaAccounts = useMemo(
    () => accounts.filter((a) => ["ZEBU", "DHAN", "KITE", "ANGEL", "UPSTOX", "FYERS", "SHOONYA", "ALICEBLUE"].includes(String(a.broker ?? a.market ?? "").toUpperCase())),
    [accounts],
  );

  // Map to ApiAccountItem shape expected by ApiAccountsManager
  const items: ApiAccountItem[] = useMemo(
    () =>
      indiaAccounts.map((a) => ({
        id:        a.id,
        type:      String(a.broker ?? ""),
        apiName:   a.label ?? a.accountLabel ?? `Account ${a.id}`,
        enabled:   a.status === "verified",
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        meta:      {},
      })),
    [indiaAccounts],
  );

  // Plans derived from subscription (one active plan at a time)
  const plans: PlanInstance[] = useMemo(
    () => (sub && plan?.category === "INDIA" ? [toPlanInstance(sub, plan)] : []),
    [sub, plan],
  );
  const hasPlan = plans.length > 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const saved = getLS<string | null>("india.selectedPlanId.v1", null);
    return saved ?? plans[0]?.planId ?? "";
  });

  useEffect(() => {
    if (plans[0]?.planId && !selectedPlanId) setSelectedPlanId(plans[0].planId);
  }, [plans]);

  useEffect(() => {
    if (selectedPlanId) setLS("india.selectedPlanId.v1", selectedPlanId);
  }, [selectedPlanId]);

  const selectedPlan: PlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const strategyDefs: PlanStrategyDef[] = useMemo(
    () => toPlanStrategyDefs(plan, selectedPlanId),
    [plan, selectedPlanId],
  );

  // per-plan toggles
  const [planSignals, setPlanSignals] = useState<PlanSignalSettings>(() => getLS("india.planSignals.v1", {}));
  useEffect(() => setLS("india.planSignals.v1", planSignals), [planSignals]);
  useEffect(() => {
    if (selectedPlan?.planId) setPlanSignals((prev) => ensurePlanSignalDefaults(selectedPlan.planId, prev));
  }, [selectedPlan?.planId]);

  const signals            = selectedPlan?.planId ? planSignals[selectedPlan.planId] : undefined;
  const strategiesEnabled  = !!signals?.strategiesEnabled;
  const webhookEnabled     = !!signals?.webhookEnabled;

  const [strategySelections, setStrategySelections] = useState<StrategySelections>(() =>
    getLS("india.strategySelections.v1", {}),
  );
  useEffect(() => setLS("india.strategySelections.v1", strategySelections), [strategySelections]);

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (strategySelections[selectedPlan.planId] ?? []).length;
  }, [strategySelections, selectedPlan]);

  // drawers / modals
  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook,    setOpenWebhook]    = useState(false);
  const [zebuAuthAccountId, setZebuAuthAccountId] = useState<number | null>(null);

  const locked     = !hasPlan || !selectedPlan;
  const maxAccounts = selectedPlan?.limits?.maxConnectedAccounts ?? 0;
  const maxStrategies = selectedPlan?.limits?.maxActiveStrategies ?? 0;
  const limitReached = maxAccounts > 0 && items.length >= maxAccounts;

  const isLoading = subLoading || accountsLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Indian APIs</h1>

        {isLoading && (
          <p className="mt-2 text-xs text-slate-400">Loading subscription &amp; accounts…</p>
        )}

        {!isLoading && !hasPlan && (
          <p className="mt-2 text-xs text-amber-300">
            No active India subscription found. Upgrade to unlock trading accounts and strategies.
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {plans.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Plan:</span>
                <select
                  className={clsx(
                    "h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 outline-none",
                    "focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40",
                  )}
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  {plans.map((p) => (
                    <option key={p.planId} value={p.planId}>{p.planName}</option>
                  ))}
                </select>
              </div>
            )}

            <span className={clsx(pillBase, strategiesEnabled ? pillOn : pillOff)}>
              Strategies: {strategiesEnabled ? "ON" : "OFF"} ({enabledStrategyCount}/{maxStrategies || 0})
            </span>
            <span className={clsx(pillBase, webhookEnabled ? pillOn : pillOff)}>
              Webhook: {webhookEnabled ? "ON" : "OFF"}
            </span>
          </div>

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

        <div className="mt-2 text-xs text-slate-400">
          Accounts used:{" "}
          <span className="text-slate-200 font-semibold">{items.length}</span>
          {maxAccounts > 0 && (
            <> / <span className="text-slate-200 font-semibold">{maxAccounts}</span></>
          )}
          {limitReached && <span className="ml-2 text-amber-300">Plan limit reached</span>}
        </div>
      </div>

      <ApiAccountsManager
        title="Indian APIs"
        typeLabel="API TYPE"
        typeOptions={INDIAN_TYPES}
        maxAccounts={maxAccounts || 10}
        locked={!!locked}
        lockedReason="Upgrade to add Indian broker APIs."
        uiDebugUnlockAll={false}
        items={items}
        onItemsChange={() => {/* mutations handled by RTK Query invalidation */}}
      />

      {/* Zebu accounts needing re-authentication */}
      {indiaAccounts.filter((a) => String(a.broker ?? "").toUpperCase() === "ZEBU").length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-medium text-slate-200">Zebu Session</p>
          <div className="flex flex-col gap-2">
            {indiaAccounts
              .filter((a) => String(a.broker ?? "").toUpperCase() === "ZEBU")
              .map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">
                    {a.label ?? a.accountLabel ?? `Account #${a.id}`}
                    <span className="ml-2 text-xs text-slate-500">{a.externalAccountId ?? ""}</span>
                  </span>
                  <button
                    type="button"
                    className="h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs text-emerald-300 hover:bg-emerald-500/20"
                    onClick={() => setZebuAuthAccountId(a.id)}
                  >
                    {a.status === "verified" ? "Re-authenticate" : "Authenticate"}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

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
        strategyDefs={strategyDefs}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={strategySelections}
        setSelections={setStrategySelections}
        uiDebugUnlockAll={false}
      />

      {zebuAuthAccountId !== null && (
        <ZebuAuthModal
          tradingAccountId={zebuAuthAccountId}
          onClose={() => setZebuAuthAccountId(null)}
        />
      )}
    </div>
  );
}
