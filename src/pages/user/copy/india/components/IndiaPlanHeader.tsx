import React from "react";
import { clsx, btn, btnGhost, pillBase, pillOff, pillOn, pillWarn, selectInline } from "../../shared/ui";
import { CopyPlanInstance } from "../copyIndia.types";

export default function IndiaPlanHeader({
  title,
  plans,
  selectedPlanId,
  onChangePlan,
  accountsUsed,
  maxAccounts,
  strategiesEnabled,
  enabledStrategyCount,
  maxStrategies,
  webhookEnabled,
  executionAllowed,
  limitReached,
  onOpenWebhook,
  onOpenStrategies,
}: {
  title: string;
  plans: CopyPlanInstance[];
  selectedPlanId: string;
  onChangePlan: (id: string) => void;

  accountsUsed: number;
  maxAccounts: number;

  strategiesEnabled: boolean;
  enabledStrategyCount: number;
  maxStrategies: number;

  webhookEnabled: boolean;
  executionAllowed: boolean;

  limitReached: boolean;

  onOpenWebhook: () => void;
  onOpenStrategies: () => void;
}) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold text-slate-100">{title}</h1>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Plan:</span>
            <select
              className={selectInline}
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

          <span className={clsx(pillBase, limitReached ? pillWarn : pillOff)}>
            Accounts: <b className="text-slate-100">{accountsUsed}</b> / <b className="text-slate-100">{maxAccounts || 0}</b>
          </span>

          <span className={clsx(pillBase, strategiesEnabled ? pillOn : pillOff)}>
            Strategies: {strategiesEnabled ? "ON" : "OFF"} ({enabledStrategyCount}/{maxStrategies || 0})
          </span>

          <span className={clsx(pillBase, webhookEnabled ? pillOn : pillOff)}>
            Webhook: {webhookEnabled ? "ON" : "OFF"}
          </span>

          <span className={clsx(pillBase, executionAllowed ? pillOn : pillOff)}>
            {executionAllowed ? "Execution Enabled" : "Execution Disabled"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className={clsx(btn, btnGhost)} onClick={onOpenWebhook}>
            Webhook
          </button>
          <button type="button" className={clsx(btn, btnGhost)} onClick={onOpenStrategies}>
            Strategies
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-400">
        Accounts are priority. If follower doesn’t want to share token with trader, share the <b className="text-slate-200">Master ID</b> and approve their request.
      </div>
    </div>
  );
}
