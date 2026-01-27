import React, { useMemo } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Market, PlanInstance, PlanSignalSettings, UsageByMarket } from "../settingsHub.types";
import { btn, btnGhost, btnPrimary, chip, clsx, soft, formatDate, input } from "../ui";

const marketMeta: Record<Market, { title: string; subtitle: string }> = {
  FOREX: { title: "Forex", subtitle: "MT5 / cTrader • execution + signals" },
  INDIA: { title: "Indian Market", subtitle: "Broker APIs • NSE/BSE execution" },
  CRYPTO: { title: "Crypto", subtitle: "Delta/Binance/… • exchange execution" },
  COPY: { title: "Copy Trading", subtitle: "Copy rows • approvals • master/followers" },
};

export default function MarketCard({
  market,
  plans,
  selectedPlanId,
  onSelectPlan,
  planSignals,
  usageByMarket,
  onOpen,
  onOpenPlans,
}: {
  market: Market;
  plans: PlanInstance[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  planSignals: PlanSignalSettings;
  usageByMarket: UsageByMarket;
  onOpen: () => void;
  onOpenPlans: () => void;
}) {
  const meta = marketMeta[market];

  const selectedPlan = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId]
  );

  const signals = selectedPlan ? planSignals[selectedPlan.planId] : undefined;

  const strategiesEnabled =
    !!selectedPlan?.strategiesAvailable && !!signals?.strategiesEnabled;
  const webhookEnabled =
    !!selectedPlan?.webhookAvailable && !!signals?.webhookEnabled;

  const usage = usageByMarket[market];

  const accountsUsed = usage?.accountsUsed;
  const strategiesCount = usage?.strategiesEnabledCount;

  const accountsLimit = selectedPlan?.limits?.maxConnectedAccounts ?? null;
  const strategiesLimit = selectedPlan?.limits?.maxActiveStrategies ?? null;

  const executionChip = selectedPlan?.executionAllowed
    ? clsx(chip, "text-emerald-200 bg-emerald-500/10 border-emerald-500/20")
    : clsx(chip, "text-amber-200 bg-amber-500/10 border-amber-500/20");

  return (
    <div className={clsx(soft, "p-5")}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-100">{meta.title}</div>
          <div className="text-xs text-slate-400 mt-1">{meta.subtitle}</div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-300">Plan in use</div>
              <select
                className={input}
                value={selectedPlan?.planId ?? ""}
                onChange={(e) => onSelectPlan(e.target.value)}
                disabled={plans.length <= 1}
              >
                {plans.map((p) => (
                  <option key={p.planId} value={p.planId}>
                    {p.planName}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 mt-2">
                {selectedPlan?.expiresAt ? <>Valid until: <b className="text-slate-200">{formatDate(selectedPlan.expiresAt)}</b></> : "—"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <span className={executionChip}>
                {selectedPlan?.executionAllowed ? "Execution Enabled" : "Execution Disabled"}
              </span>

              <span className={clsx(chip, "text-slate-200 bg-white/5 border-white/10")}>
                Accounts:{" "}
                <b className="text-slate-100">{accountsUsed ?? "—"}</b> /{" "}
                <b className="text-slate-100">{accountsLimit ?? "—"}</b>
              </span>

              <span
                className={clsx(
                  chip,
                  strategiesEnabled
                    ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                Strategies: {strategiesEnabled ? "ON" : "OFF"}{" "}
                <span className="text-slate-300">
                  ({strategiesCount ?? "—"}/{strategiesLimit ?? "—"})
                </span>
              </span>

              <span
                className={clsx(
                  chip,
                  webhookEnabled
                    ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                Webhook: {webhookEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className={clsx(btn, btnGhost)} onClick={onOpenPlans}>
            Plans <ExternalLink size={16} />
          </button>
          <button type="button" className={clsx(btn, btnPrimary)} onClick={onOpen}>
            Open <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
