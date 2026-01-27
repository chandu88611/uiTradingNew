import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Check, Info, Lock } from "lucide-react";

import { Market, MarketSummary, PlanInstance, PlanPrefs, PlanStrategyDef, StrategySelections } from "../types";
import { clsx } from "../utils";
import { soft, btn, btnGhost, btnPrimary, input } from "../style";
import { Toggle } from "../Toggle";
import { StatusPill } from "../StatusPill";

export function StrategiesTab({
  summary,
  plansByMarket,
  planPrefs,
  setPlanPrefs,
  strategyDefs,
  selections,
  setSelections,
}: {
  summary: MarketSummary;
  plansByMarket: Record<Market, PlanInstance[]>;
  planPrefs: PlanPrefs;
  setPlanPrefs: (p: PlanPrefs) => void;

  strategyDefs: PlanStrategyDef[];
  selections: StrategySelections;
  setSelections: (s: StrategySelections) => void;
}) {
  const markets: Market[] = ["FOREX", "INDIA", "CRYPTO", "COPY"];
  const availableMarkets = markets.filter((m) => summary[m].hasPlan);

  const [activeMarket, setActiveMarket] = useState<Market>(availableMarkets[0] ?? "FOREX");

  const plans = plansByMarket[activeMarket] ?? [];
  const pref = planPrefs[activeMarket];

  // ✅ In AUTO_MAX we *cannot* decide strategy entitlements (plan-owned),
  // so we force a specific plan selection for Strategies tab.
  const selectedPlanId =
    pref.mode === "SPECIFIC" && pref.planId ? pref.planId : null;

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null;
    return plans.find((p) => p.planId === selectedPlanId) ?? null;
  }, [plans, selectedPlanId]);

  const maxActive = selectedPlan?.limits?.maxActiveStrategies ?? 0;

  const planStrategies = useMemo(() => {
    if (!selectedPlanId) return [];
    return strategyDefs.filter(
      (s) => s.planId === selectedPlanId && s.market === activeMarket
    );
  }, [strategyDefs, selectedPlanId, activeMarket]);

  const enabledIds = selections[selectedPlanId ?? ""] ?? [];
  const enabledCount = enabledIds.length;

  const setEnabledForPlan = (planId: string, ids: string[]) => {
    setSelections({ ...selections, [planId]: ids });
  };

  const toggleStrategy = (strategyId: string) => {
    if (!selectedPlanId || !selectedPlan) return;

    // no entitlements
    if (maxActive <= 0) {
      toast.error("Your plan does not allow strategies.");
      return;
    }

    const isOn = enabledIds.includes(strategyId);

    // OFF
    if (isOn) {
      setEnabledForPlan(selectedPlanId, enabledIds.filter((x) => x !== strategyId));
      return;
    }

    // ON
    if (maxActive === 1) {
      // ✅ "choose any one": auto-disable others
      setEnabledForPlan(selectedPlanId, [strategyId]);
      return;
    }

    if (enabledCount >= maxActive) {
      toast.warning(`Max ${maxActive} strategies allowed for this plan.`);
      return;
    }

    setEnabledForPlan(selectedPlanId, [...enabledIds, strategyId]);
  };

  const forceSpecificPlan = (planId: string) => {
    setPlanPrefs({
      ...planPrefs,
      [activeMarket]: { mode: "SPECIFIC", planId },
    });
  };

  const isLockedMarket = !summary[activeMarket].hasPlan;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Strategies</h2>
        <p className="text-xs text-slate-400 mt-1">
          Strategies are <span className="text-slate-200 font-semibold">owned by your plan</span>. You can only enable/disable
          the strategies included in the selected plan. No adding/moving strategies.
        </p>
      </div>

      {/* Market picker */}
      <div className="flex flex-wrap gap-2">
        {markets.map((m) => {
          const on = m === activeMarket;
          const has = summary[m].hasPlan;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMarket(m)}
              className={clsx(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                on
                  ? "bg-emerald-500 text-slate-950 border-emerald-500"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500",
                !has && "opacity-60"
              )}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-100">Plan context</div>
            <div className="text-xs text-slate-400 mt-1">
              Strategy entitlement is per-plan, so this tab needs a specific plan (not Auto MAX).
            </div>
          </div>

          {isLockedMarket ? (
            <span className="inline-flex items-center gap-2 text-xs text-amber-200 border border-amber-500/20 bg-amber-500/10 rounded-full px-3 py-1.5">
              <Lock size={14} /> No active plan in this market
            </span>
          ) : selectedPlan ? (
            <StatusPill
              tone={selectedPlan.executionAllowed ? "emerald" : "slate"}
              text={`${selectedPlan.planName} • max ${maxActive || 0} active`}
            />
          ) : (
            <StatusPill tone="amber" text="Select a specific plan" />
          )}
        </div>

        {!isLockedMarket && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {pref.mode === "AUTO_MAX" ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-sm font-semibold text-amber-100 flex items-center gap-2">
                  <Info size={16} /> Auto MAX cannot be used here
                </div>
                <div className="text-xs text-amber-200/80 mt-1">
                  Because strategies belong to a plan, choose which plan the engine should use for this market.
                </div>

                <div className="mt-3">
                  <div className="text-xs text-slate-200 font-semibold">Pick plan</div>
                  <select
                    className={input}
                    defaultValue={plans[0]?.planId ?? ""}
                    onChange={(e) => forceSpecificPlan(e.target.value)}
                  >
                    {plans.map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.planName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
                <div className="text-sm font-semibold text-slate-100">Selected plan</div>
                <div className="text-xs text-slate-400 mt-1">This plan controls which strategies you can enable.</div>

                <select
                  className={input}
                  value={selectedPlanId ?? ""}
                  onChange={(e) => forceSpecificPlan(e.target.value)}
                >
                  {plans.map((p) => (
                    <option key={p.planId} value={p.planId}>
                      {p.planName}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-[11px] text-slate-500">
                  Enabled: <span className="text-slate-200 font-semibold">{enabledCount}</span> /{" "}
                  <span className="text-slate-200 font-semibold">{maxActive || 0}</span>
                  {maxActive === 1 ? " • only one can be active" : ""}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
              <div className="text-sm font-semibold text-slate-100">Rule</div>
              <div className="text-xs text-slate-400 mt-1">
                You <span className="text-slate-200 font-semibold">cannot add</span> strategies, and you{" "}
                <span className="text-slate-200 font-semibold">cannot move</span> a strategy to another plan.
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Later: connect API to fetch plan strategies + save enabled IDs.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strategy list */}
      <div className={clsx(soft, "p-5")}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-100">Available strategies</div>
            <div className="text-xs text-slate-400 mt-1">
              Showing strategies for <span className="text-slate-200 font-semibold">{activeMarket}</span>
              {selectedPlan ? (
                <>
                  {" "}
                  • <span className="text-slate-200 font-semibold">{selectedPlan.planName}</span>
                </>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className={clsx(btn, btnPrimary)}
            onClick={() => toast.success("Saved (dummy)")}
            disabled={!selectedPlanId || isLockedMarket}
          >
            <Check size={16} /> Save
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {isLockedMarket ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              No strategies because there is no active plan for this market.
            </div>
          ) : !selectedPlanId ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              Select a plan to view strategies.
            </div>
          ) : planStrategies.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              This plan has no strategies in this market (dummy data).
            </div>
          ) : (
            planStrategies.map((s) => {
              const on = enabledIds.includes(s.id);
              const disabled =
                maxActive <= 0 ||
                (!on && maxActive > 0 && enabledCount >= maxActive && maxActive !== 1);

              return (
                <div key={s.id} className={clsx(disabled && "opacity-70")}>
                  <Toggle
                    checked={on}
                    onChange={() => {
                      if (disabled) {
                        toast.warning(`Max ${maxActive} strategies allowed for this plan.`);
                        return;
                      }
                      toggleStrategy(s.id);
                    }}
                    label={s.name}
                    hint={`${s.description}${s.riskHint ? ` • ${s.riskHint}` : ""}`}
                  />
                  {s.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 pl-1">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] rounded-full border border-white/10 bg-white/5 text-slate-300 px-2 py-1"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
