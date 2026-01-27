import React, { useEffect, useMemo, useState } from "react";
import { page } from "../shared/ui";
import { getLS, setLS } from "../shared/storage";

import IndiaPlanHeader from "./components/IndiaPlanHeader";
import IndiaWebhookDrawer from "./components/IndiaWebhookDrawer";
import IndiaStrategiesDrawer from "./components/IndiaStrategiesDrawer";
import IndiaMasterAccountsSection from "./components/IndiaMasterAccountsSection";
import IndiaFollowerRequestsSection from "./components/IndiaFollowerRequestsSection";

import { dummyIndiaCopyPlans, dummyIndiaStrategies, seedFollowRequests, seedMasterSlots } from "./copyIndia.dummy";
import type { CopyPlanInstance, PlanSignalSettings, StrategySelections, IndiaMasterSlot, IndiaFollowRequest } from "./copyIndia.types";

function ensureSignals(planId: string, map: PlanSignalSettings): PlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

export default function CopyTradingIndiaTraderPage() {
  const plans = useMemo(() => dummyIndiaCopyPlans, []);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("ct.india.selectedPlanId.v1", plans[0]?.planId ?? ""));
  useEffect(() => setLS("ct.india.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

  const plan: CopyPlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const [planSignals, setPlanSignals] = useState<PlanSignalSettings>(() => getLS("ct.india.planSignals.v1", {}));
  useEffect(() => setLS("ct.india.planSignals.v1", planSignals), [planSignals]);

  useEffect(() => {
    if (plan?.planId) setPlanSignals((prev) => ensureSignals(plan.planId, prev));
  }, [plan?.planId]);

  const signals = plan?.planId ? planSignals[plan.planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;
  const webhookEnabled = !!signals?.webhookEnabled;

  const [selections, setSelections] = useState<StrategySelections>(() => getLS("ct.india.strategySelections.v1", {}));
  useEffect(() => setLS("ct.india.strategySelections.v1", selections), [selections]);

  const enabledStrategyCount = useMemo(() => (plan ? (selections[plan.planId] ?? []).length : 0), [plan, selections]);

  // MASTER SLOTS (TRADER)
  const [slots, setSlots] = useState<IndiaMasterSlot[]>(() => getLS("ct.india.masterSlots.v1", seedMasterSlots));
  useEffect(() => setLS("ct.india.masterSlots.v1", slots), [slots]);

  // FOLLOW REQUESTS (TRADER)
  const [requests, setRequests] = useState<IndiaFollowRequest[]>(() => getLS("ct.india.followRequests.v1", seedFollowRequests));
  useEffect(() => setLS("ct.india.followRequests.v1", requests), [requests]);

  // drawers
  const [openWebhook, setOpenWebhook] = useState(false);
  const [openStrategies, setOpenStrategies] = useState(false);

  const maxAccounts = plan?.limits?.maxMasterAccounts ?? 0;
  const maxStrategies = plan?.limits?.maxStrategies ?? 0;
  const limitReached = maxAccounts > 0 && slots.length >= maxAccounts;

  return (
    <div className={page}>
      <IndiaPlanHeader
        title="Copy Trading • India (Trader)"
        plans={plans}
        selectedPlanId={selectedPlanId}
        onChangePlan={setSelectedPlanId}
        accountsUsed={slots.length}
        maxAccounts={maxAccounts}
        strategiesEnabled={strategiesEnabled}
        enabledStrategyCount={enabledStrategyCount}
        maxStrategies={maxStrategies}
        webhookEnabled={webhookEnabled}
        executionAllowed={!!plan?.executionAllowed}
        limitReached={limitReached}
        onOpenWebhook={() => setOpenWebhook(true)}
        onOpenStrategies={() => setOpenStrategies(true)}
      />

      {/* ✅ ACCOUNTS FIRST */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <IndiaMasterAccountsSection slots={slots} setSlots={setSlots} maxAccounts={maxAccounts} />
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <IndiaFollowerRequestsSection requests={requests} setRequests={setRequests} />
        </div>
      </div>

      {/* Drawers */}
      <IndiaWebhookDrawer
        open={openWebhook}
        onClose={() => setOpenWebhook(false)}
        plan={plan}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
      />

      <IndiaStrategiesDrawer
        open={openStrategies}
        onClose={() => setOpenStrategies(false)}
        plan={plan}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        strategies={dummyIndiaStrategies}
        selections={selections}
        setSelections={setSelections}
      />
    </div>
  );
}
