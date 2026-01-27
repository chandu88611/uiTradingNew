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

import { dummyForexPlans, dummyForexPlanStrategies, dummyForexSafetyDefaults } from "./forex.dummy";

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
  const plans = useMemo(() => dummyForexPlans, []);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("copy.fx.trader.selectedPlanId.v1", plans[0]?.planId ?? ""));

  const selectedPlan: ForexCopyPlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  useEffect(() => setLS("copy.fx.trader.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

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
  const [safety, setSafety] = useState<ForexSafetySettings>(() => getLS("copy.fx.trader.safety.v1", dummyForexSafetyDefaults));
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
        strategyDefs={dummyForexPlanStrategies}
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
