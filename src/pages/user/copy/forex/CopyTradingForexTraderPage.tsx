// src/pages/copytrading/forex/pages/CopyTradingForexTraderPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { pageWrap, clsx } from "./ui";
import {
  ForexCopyAccount,
  ForexCopyPlanInstance,
  ForexPlanSignalSettings,
  ForexSafetySettings,
  ForexStrategySelections,
} from "./forex.types";

import {
  useGetMyCurrentSubscriptionQuery,
  UserSubscription,
  SubscriptionPlan,
} from "../../../../services/profileSubscription.api";
import { useListMyTradingAccountsQuery } from "../../../../services/tradingAccounts.api";

import ForexCopyAccountsPanel from "./components/ForexCopyAccountsPanel";
import ForexPlanBar from "./components/ForexPlanBar";
import ForexWebhookDrawer from "./components/ForexWebhookDrawer";
import ForexStrategiesDrawer from "./components/ForexStrategiesDrawer";
import ForexSafetyDrawer from "./components/ForexSafetyDrawer";

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
function ensureSignalDefaults(planId: string, map: ForexPlanSignalSettings): ForexPlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

function toForexCopyPlan(sub: UserSubscription, plan: SubscriptionPlan | null | undefined): ForexCopyPlanInstance {
  return {
    planId: String(sub.id),
    planName: plan?.name ?? `Plan #${sub.planId}`,
    tier: "PRO" as "FREE" | "PRO" | "ELITE",
    executionAllowed: sub.executionEnabled,
    limits: {
      maxConnectedAccounts: plan?.maxConnectedAccounts ?? 0,
      maxActiveStrategies: plan?.maxActiveStrategies ?? 0,
      maxDailyTrades: plan?.maxDailyTrades ?? 0,
      maxLotPerTrade: plan?.maxLotPerTrade ? Number(plan.maxLotPerTrade) : 0,
    },
    webhook: {
      endpointUrl: sub.webhookUrl ?? "",
      secretMasked: sub.webhookToken ? "****" : "",
    },
  };
}

function toForexStrategyDefs(plan: SubscriptionPlan | null | undefined, planId: string): any[] {
  const raw: any[] = plan?.metadata?.strategies ?? plan?.featureFlags?.strategies ?? [];
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map((s: any, i: number) => ({
    id: String(s.id ?? `${planId}-strat-${i}`),
    planId,
    market: "FOREX",
    name: String(s.name ?? `Strategy ${i + 1}`),
    description: String(s.description ?? ""),
    tags: Array.isArray(s.tags) ? s.tags : [],
  }));
}

export default function CopyTradingForexTraderPage() {
  const { data: subData, isLoading: subLoading } = useGetMyCurrentSubscriptionQuery();
  const sub = subData?.data ?? null;
  const planRaw = sub ? (sub as any).plan as SubscriptionPlan | null : null;

  const { data: accounts = [] } = useListMyTradingAccountsQuery();

  const plans = useMemo(() => {
    if (!sub || !planRaw || planRaw.category !== "FOREX") return [];
    return [toForexCopyPlan(sub as UserSubscription, planRaw)];
  }, [sub, planRaw]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("copy.fx.trader.selectedPlanId.v1", plans[0]?.planId ?? ""));

  // keep selectedPlanId in sync when plans load
  useEffect(() => {
    if (plans.length && !selectedPlanId) {
      setSelectedPlanId(plans[0].planId);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan: ForexCopyPlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  useEffect(() => setLS("copy.fx.trader.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

  const strategyDefs = useMemo(() => toForexStrategyDefs(planRaw, selectedPlanId), [planRaw, selectedPlanId]);

  // derived accounts from real trading accounts API
  const forexAccounts: ForexCopyAccount[] = useMemo(
    () =>
      accounts
        .filter((a: any) => ["MT5", "CT", "CTRADER"].includes(String(a.broker ?? "").toUpperCase()))
        .map((a: any) => ({
          id: a.id,
          type: String(a.broker ?? "MT5") as any,
          label: a.accountLabel ?? a.label ?? `Account ${a.id}`,
          enabled: a.status === "verified",
          isMaster: false,
          userId: String(a.externalAccountId ?? a.id),
          createdAt: a.createdAt ?? new Date().toISOString(),
          updatedAt: a.updatedAt ?? new Date().toISOString(),
        })),
    [accounts]
  );

  // signals
  const [planSignals, setPlanSignals] = useState<ForexPlanSignalSettings>(() => getLS("copy.fx.trader.planSignals.v1", {}));
  useEffect(() => setLS("copy.fx.trader.planSignals.v1", planSignals), [planSignals]);

  useEffect(() => {
    if (selectedPlan?.planId) setPlanSignals((prev) => ensureSignalDefaults(selectedPlan.planId, prev));
  }, [selectedPlan?.planId]);

  // strategies selection (per plan)
  const [selections, setSelections] = useState<ForexStrategySelections>(() => getLS("copy.fx.trader.strategySelections.v1", {}));
  useEffect(() => setLS("copy.fx.trader.strategySelections.v1", selections), [selections]);

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (selections[selectedPlan.planId] ?? []).length;
  }, [selectedPlan, selections]);

  // safety (per plan)
  const [safety, setSafety] = useState<ForexSafetySettings>(() =>
    getLS("copy.fx.trader.safety.v1", {} as ForexSafetySettings)
  );
  useEffect(() => setLS("copy.fx.trader.safety.v1", safety), [safety]);

  // drawers
  const [openWebhook, setOpenWebhook] = useState(false);
  const [openStrategies, setOpenStrategies] = useState(false);
  const [openSafety, setOpenSafety] = useState(false);

  const maxAccounts = selectedPlan?.limits.maxConnectedAccounts ?? 0;

  // Simple warning helpers
  useEffect(() => {
    if (!selectedPlan) return;
    const cur = safety[selectedPlan.planId];
    if (cur?.killSwitch) toast.warn("Kill switch is ON (execution disabled)", { autoClose: 2500 });
  }, [selectedPlan, safety]);

  return (
    <div className={pageWrap}>
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Copy Trading • Forex (Trader)</h1>
        <p className="text-sm text-slate-400 mt-1">
          Accounts are priority. Configure plan → webhook/strategies → safety controls.
        </p>
      </div>

      {/* ACCOUNTS FIRST (top priority) */}
      <ForexCopyAccountsPanel
        roleMode="TRADER"
        maxAccounts={maxAccounts || 10}
        value={forexAccounts}
        onChange={() => {}}
      />

      {/* Plan bar (compact) */}
      <div className="mt-5">
        <ForexPlanBar
          plans={plans}
          selectedPlanId={selectedPlanId}
          onChangePlan={setSelectedPlanId}
          accountsUsed={forexAccounts.length}
          enabledStrategyCount={enabledStrategyCount}
          planSignals={planSignals}
          onOpenWebhook={() => setOpenWebhook(true)}
          onOpenStrategies={() => setOpenStrategies(true)}
          onOpenSafety={() => setOpenSafety(true)}
        />
      </div>

      {/* Drawers */}
      <ForexWebhookDrawer
        open={openWebhook}
        onClose={() => setOpenWebhook(false)}
        plan={selectedPlan}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
      />

      <ForexStrategiesDrawer
        open={openStrategies}
        onClose={() => setOpenStrategies(false)}
        plan={selectedPlan}
        strategyDefs={strategyDefs}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={selections}
        setSelections={setSelections}
      />

      <ForexSafetyDrawer
        open={openSafety}
        onClose={() => setOpenSafety(false)}
        plan={selectedPlan}
        safety={safety}
        setSafety={setSafety}
      />
    </div>
  );
}
