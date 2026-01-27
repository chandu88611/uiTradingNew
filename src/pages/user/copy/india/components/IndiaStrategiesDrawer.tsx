import React, { useMemo } from "react";
import Drawer from "../../shared/Drawer";
import { btn, btnGhost, clsx, pillBase, pillOff, pillOn, soft } from "../../shared/ui";
import type { CopyPlanInstance, PlanSignalSettings, StrategyDef, StrategySelections } from "../copyIndia.types";
import { setLS } from "../../shared/storage";

export default function IndiaStrategiesDrawer({
  open,
  onClose,
  plan,
  planSignals,
  setPlanSignals,
  strategies,
  selections,
  setSelections,
}: {
  open: boolean;
  onClose: () => void;
  plan: CopyPlanInstance | null;

  planSignals: PlanSignalSettings;
  setPlanSignals: React.Dispatch<React.SetStateAction<PlanSignalSettings>>;

  strategies: StrategyDef[];
  selections: StrategySelections;
  setSelections: React.Dispatch<React.SetStateAction<StrategySelections>>;
}) {
  const planId = plan?.planId ?? "";
  const enabled = !!(planId && planSignals[planId]?.strategiesEnabled);
  const max = plan?.limits?.maxStrategies ?? 0;

  const selected = useMemo(() => (planId ? selections[planId] ?? [] : []), [planId, selections]);

  const toggleStrategy = (id: string) => {
    if (!planId) return;

    setSelections((prev) => {
      const cur = prev[planId] ?? [];
      const exists = cur.includes(id);

      let nextArr = cur;
      if (exists) nextArr = cur.filter((x) => x !== id);
      else {
        if (max > 0 && cur.length >= max) return prev; // limit
        nextArr = [...cur, id];
      }

      const next = { ...prev, [planId]: nextArr };
      setLS("india.strategySelections.v1", next);
      return next;
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Strategies (Built-in)">
      {!plan ? (
        <div className="text-sm text-slate-300">Select a plan first.</div>
      ) : (
        <div className="space-y-4">
          <div className={clsx(soft, "p-4")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">Strategies Toggle</div>
                <div className="text-xs text-slate-400 mt-1">Enable/disable built-in strategies for this plan.</div>
              </div>
              <button
                type="button"
                className={clsx(btn, btnGhost)}
                onClick={() => {
                  setPlanSignals((prev) => {
                    const next = {
                      ...prev,
                      [planId]: {
                        ...(prev[planId] ?? { strategiesEnabled: true, webhookEnabled: false }),
                        strategiesEnabled: !enabled,
                      },
                    };
                    setLS("india.planSignals.v1", next);
                    return next;
                  });
                }}
              >
                {enabled ? "Strategies: ON" : "Strategies: OFF"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={clsx(pillBase, pillOff)}>
              Plan limit: <b className="text-slate-100">{max || 0}</b>
            </span>
            <span className={clsx(pillBase, enabled ? pillOn : pillOff)}>
              Selected: <b className="text-slate-100">{selected.length}</b>
            </span>
          </div>

          <div className="space-y-3">
            {strategies.map((s) => {
              const on = selected.includes(s.id);
              const disabled = !on && max > 0 && selected.length >= max;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!enabled || disabled}
                  onClick={() => toggleStrategy(s.id)}
                  className={clsx(
                    soft,
                    "p-4 w-full text-left transition",
                    on ? "border-emerald-500/20 bg-emerald-500/10" : "hover:bg-white/5",
                    (!enabled || disabled) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{s.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{s.description}</div>
                    </div>
                    <span className={clsx(pillBase, on ? pillOn : pillOff)}>{on ? "Enabled" : "Disabled"}</span>
                  </div>

                  {disabled ? (
                    <div className="text-[11px] text-amber-300 mt-2">Plan strategy limit reached.</div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500">
            Strategies are per-plan. User cannot enable strategies from other plan here.
          </div>
        </div>
      )}
    </Drawer>
  );
}
