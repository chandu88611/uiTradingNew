// src/pages/copytrading/forex/pages/CopyTradingForexTraderPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { pageWrap, clsx } from "./ui";
import {
  ForexCopyAccount,
  ForexCopyPlanInstance,
  ForexPlanSignalSettings,
  ForexPlanStrategies,
  ForexSafetySettings,
  ForexStrategySelections,
} from "./forex.types";

import { useGetMyCurrentSubscriptionQuery } from "../../../../services/profileSubscription.api";
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

export default function CopyTradingForexTraderPage() {
  const { data: subData, isLoading: subLoading } = useGetMyCurrentSubscriptionQuery();
  const { data: taccounts = [] } = useListMyTradingAccountsQuery();

  const subRoot: any =
    (subData as any)?.data?.subscription ??
    (subData as any)?.subscription ??
    (subData as any)?.data ??
    subData;
  const sub: any = Array.isArray(subRoot) ? subRoot[0] : subRoot;
  const planRaw: any = sub?.plan ?? null;

  const plans = useMemo<ForexCopyPlanInstance[]>(() => {
    if (!sub || !planRaw) return [];
    const cat = String(planRaw.category ?? planRaw.market?.code ?? "").toUpperCase();
    if (!cat.includes("FOREX")) return [];
    return [
      {
        planId: String(sub.id),
        planName: planRaw.name ?? "Plan #" + sub.planId,
        tier: "PRO",
        executionAllowed: !!sub.executionEnabled,
        limits: {
          maxConnectedAccounts: planRaw.maxConnectedAccounts ?? 0,
          maxActiveStrategies: planRaw.maxActiveStrategies ?? 0,
          maxDailyTrades: planRaw.maxDailyTrades ?? 0,
          maxLotPerTrade: planRaw.maxLotPerTrade ? Number(planRaw.maxLotPerTrade) : 0,
        },
        webhook: {
          endpointUrl: "",
          secretMasked: "",
        },
      },
    ];
  }, [sub, planRaw]);

  const strategyDefs = useMemo<ForexPlanStrategies>(() => {
    if (!sub) return {};
    const raw: any[] = planRaw?.metadata?.strategies ?? planRaw?.featureFlags?.strategies ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return {};
    return {
      [String(sub.id)]: raw.map((s: any, i: number) => ({
        id: String(s.id ?? s.key ?? i),
        name: String(s.name ?? s.title ?? "Strategy " + (i + 1)),
        description: String(s.description ?? ""),
        tags: Array.isArray(s.tags) ? s.tags.map(String) : [],
        risk: (s.risk === "LOW" || s.risk === "HIGH" ? s.risk : "MEDIUM") as "LOW" | "MEDIUM" | "HIGH",
      })),
    };
  }, [sub, planRaw]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("copy.fx.trader.selectedPlanId.v1", plans[0]?.planId ?? ""));

  const selectedPlan: ForexCopyPlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  useEffect(() => setLS("copy.fx.trader.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

  useEffect(() => {
    if (!selectedPlanId && plans[0]?.planId) setSelectedPlanId(plans[0].planId);
  }, [plans, selectedPlanId]);

  // accounts (dummy, local)
  const [accounts, setAccounts] = useState<ForexCopyAccount[]>(() =>
    getLS("copy.fx.trader.accounts.v1", [
      {
        id: 4108,
        type: "MT5",
        label: "Main MT5",
        enabled: true,
        isMaster: true,
        userId: "12345678",
        createdAt: "2026-01-10T10:00:00.000Z",
        updatedAt: "2026-01-20T12:30:00.000Z",
      },
      {
        id: 3748,
        type: "CTRADER",
        label: "cTrader 1",
        enabled: true,
        isMaster: false,
        userId: "10001234",
        hasToken: true,
        createdAt: "2025-12-18T19:07:00.000Z",
        updatedAt: "2026-01-20T08:58:00.000Z",
      },
    ])
  );
  useEffect(() => setLS("copy.fx.trader.accounts.v1", accounts), [accounts]);

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
  const [safety, setSafety] = useState<ForexSafetySettings>(() => getLS("copy.fx.trader.safety.v1", {} as ForexSafetySettings));
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
        {subLoading && <p className="text-xs text-slate-500 mt-1">Loading your plan…</p>}
      </div>

      {/* ✅ ACCOUNTS FIRST (top priority) */}
      <ForexCopyAccountsPanel
        roleMode="TRADER"
        maxAccounts={maxAccounts || 10}
        value={accounts}
        onChange={setAccounts}
      />

      {/* Plan bar (compact) */}
      <div className="mt-5">
        <ForexPlanBar
          plans={plans}
          selectedPlanId={selectedPlanId}
          onChangePlan={setSelectedPlanId}
          accountsUsed={accounts.length}
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
