// src/pages/copytrading/forex/components/ForexPlanBar.tsx
import React from "react";
import { ShieldCheck, SlidersHorizontal, Webhook, Layers } from "lucide-react";
import { btn, btnOutline, chip, clsx, input, soft } from "../ui";
import { ForexCopyPlanInstance, ForexPlanSignalSettings } from "../forex.types";

export default function ForexPlanBar({
  plans,
  selectedPlanId,
  onChangePlan,
  accountsUsed,
  enabledStrategyCount,
  planSignals,
  onOpenWebhook,
  onOpenStrategies,
  onOpenSafety,
}: {
  plans: ForexCopyPlanInstance[];
  selectedPlanId: string;
  onChangePlan: (id: string) => void;

  accountsUsed: number;
  enabledStrategyCount: number;

  planSignals: ForexPlanSignalSettings;

  onOpenWebhook: () => void;
  onOpenStrategies: () => void;
  onOpenSafety: () => void;
}) {
  const plan = plans.find((p) => p.planId === selectedPlanId) ?? null;
  const sig = plan ? planSignals[plan.planId] : undefined;

  const strategiesEnabled = !!sig?.strategiesEnabled;
  const webhookEnabled = !!sig?.webhookEnabled;

  const maxAccounts = plan?.limits.maxConnectedAccounts ?? 0;
  const maxStrategies = plan?.limits.maxActiveStrategies ?? 0;

  return (
    <div className={clsx(soft, "p-5")}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100">Plan in use</div>
          <div className="text-xs text-slate-400 mt-1">
            Select plan → limits apply per plan. Webhook + Strategies are configured per plan.
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-300">Selected Plan</div>
              <select
                className={input.replace("mt-2", "mt-2")}
                value={selectedPlanId}
                onChange={(e) => onChangePlan(e.target.value)}
                disabled={plans.length <= 1}
              >
                {plans.map((p) => (
                  <option key={p.planId} value={p.planId}>
                    {p.planName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <span className={clsx(chip, "text-slate-200 bg-white/5 border-white/10")}>
                Accounts: <b className="text-slate-100">{accountsUsed}</b> /{" "}
                <b className="text-slate-100">{maxAccounts || "—"}</b>
              </span>

              <span
                className={clsx(
                  chip,
                  strategiesEnabled ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20" : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                Strategies: {strategiesEnabled ? "ON" : "OFF"}{" "}
                <span className="text-slate-300">({enabledStrategyCount}/{maxStrategies || "—"})</span>
              </span>

              <span
                className={clsx(
                  chip,
                  webhookEnabled ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20" : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                Webhook: {webhookEnabled ? "ON" : "OFF"}
              </span>

              <span
                className={clsx(
                  chip,
                  plan?.executionAllowed ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20" : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                <ShieldCheck size={14} />
                {plan?.executionAllowed ? "Execution Enabled" : "Execution Disabled"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button type="button" className={clsx(btn, btnOutline)} onClick={onOpenSafety} disabled={!plan}>
            <SlidersHorizontal size={14} />
            Safety
          </button>
          <button type="button" className={clsx(btn, btnOutline)} onClick={onOpenWebhook} disabled={!plan}>
            <Webhook size={14} />
            Webhook
          </button>
          <button type="button" className={clsx(btn, btnOutline)} onClick={onOpenStrategies} disabled={!plan}>
            <Layers size={14} />
            Strategies
          </button>
        </div>
      </div>
    </div>
  );
}
