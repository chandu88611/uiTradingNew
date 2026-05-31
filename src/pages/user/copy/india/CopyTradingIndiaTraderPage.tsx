import React, { useEffect, useMemo, useState } from "react";
import { page } from "../shared/ui";
import { getLS, setLS } from "../shared/storage";

import IndiaPlanHeader from "./components/IndiaPlanHeader";
import IndiaWebhookDrawer from "./components/IndiaWebhookDrawer";
import IndiaStrategiesDrawer from "./components/IndiaStrategiesDrawer";
import IndiaMasterAccountsSection from "./components/IndiaMasterAccountsSection";
import IndiaFollowerRequestsSection from "./components/IndiaFollowerRequestsSection";

import { useGetMyCurrentSubscriptionQuery } from "../../../../services/profileSubscription.api";
import { useGetMyMasterQuery, useListMyFollowersQuery } from "../../../../services/copyTrading.api";
import type { CopyPlanInstance, PlanSignalSettings, StrategySelections, StrategyDef, IndiaMasterSlot, IndiaFollowRequest } from "./copyIndia.types";

function ensureSignals(planId: string, map: PlanSignalSettings): PlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

export default function CopyTradingIndiaTraderPage() {
  const { data: subData, isLoading: subLoading } = useGetMyCurrentSubscriptionQuery();
  const subRoot: any =
    (subData as any)?.data?.subscription ??
    (subData as any)?.subscription ??
    (subData as any)?.data ??
    subData;
  const sub: any = Array.isArray(subRoot) ? subRoot[0] : subRoot;
  const planRaw: any = sub?.plan ?? null;

  const plans = useMemo<CopyPlanInstance[]>(() => {
    if (!sub || !planRaw) return [];
    return [
      {
        planId: String(sub.id),
        planName: planRaw.name ?? "Plan #" + sub.planId,
        executionAllowed: !!sub.executionEnabled,
        limits: {
          maxMasterAccounts: planRaw.maxConnectedAccounts ?? 2,
          maxFollowers: planRaw.metadata?.maxFollowers ?? 20,
          maxStrategies: planRaw.maxActiveStrategies ?? 1,
        },
      },
    ];
  }, [sub, planRaw]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("ct.india.selectedPlanId.v1", plans[0]?.planId ?? ""));
  useEffect(() => setLS("ct.india.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);
  useEffect(() => {
    if (!selectedPlanId && plans[0]?.planId) setSelectedPlanId(plans[0].planId);
  }, [plans, selectedPlanId]);

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

  // MASTER SLOTS (TRADER) — derived from API
  const { data: masterRes, isLoading: masterLoading } = useGetMyMasterQuery();
  const master: any = (masterRes as any)?.data ?? masterRes ?? null;
  const slots = useMemo<IndiaMasterSlot[]>(
    () =>
      master
        ? [
            {
              id: String(master.id),
              masterId: String(master.id),
              broker: "DHAN",
              nickname: master.name ?? "My Master",
              enabled: master.isActive ?? true,
              createdAt: master.createdAt ?? "",
              updatedAt: master.updatedAt ?? "",
            },
          ]
        : [],
    [master]
  );

  // FOLLOW REQUESTS (TRADER) — derived from API
  const { data: followersRes, isLoading: followersLoading } = useListMyFollowersQuery({} as any);
  const requests = useMemo<IndiaFollowRequest[]>(() => {
    const root: any =
      (followersRes as any)?.data?.rows ??
      (followersRes as any)?.items ??
      (followersRes as any)?.data ??
      followersRes;
    const arr = Array.isArray(root) ? root : [];
    return arr.map((f: any) => ({
      id: String(f.id),
      masterId: String(f.masterId ?? ""),
      followerName: String(f.followerUser?.name ?? f.followerUserId ?? ""),
      status: (f.status === "active" ? "APPROVED" : f.status === "pending" ? "PENDING" : "REJECTED") as IndiaFollowRequest["status"],
      createdAt: f.createdAt ?? "",
      updatedAt: f.updatedAt ?? "",
    }));
  }, [followersRes]);

  // strategies (derived from plan metadata)
  const strategies = useMemo<StrategyDef[]>(() => {
    const raw: any[] = planRaw?.metadata?.strategies ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((s: any, i: number) => ({
      id: String(s.id ?? s.key ?? i),
      name: String(s.name ?? s.title ?? "Strategy " + (i + 1)),
      description: String(s.description ?? ""),
    }));
  }, [planRaw]);

  // drawers
  const [openWebhook, setOpenWebhook] = useState(false);
  const [openStrategies, setOpenStrategies] = useState(false);

  const maxAccounts = plan?.limits?.maxMasterAccounts ?? 0;
  const maxStrategies = plan?.limits?.maxStrategies ?? 0;
  const limitReached = maxAccounts > 0 && slots.length >= maxAccounts;

  return (
    <div className={page}>
      {(subLoading || masterLoading || followersLoading) && (
        <p className="text-xs text-slate-500 mb-3">Loading your copy trading data…</p>
      )}

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
          <IndiaMasterAccountsSection slots={slots} setSlots={() => {}} maxAccounts={maxAccounts} />
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <IndiaFollowerRequestsSection requests={requests} setRequests={() => {}} />
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
        strategies={strategies}
        selections={selections}
        setSelections={setSelections}
      />
    </div>
  );
}
