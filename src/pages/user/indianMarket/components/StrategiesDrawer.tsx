import React, { useMemo } from "react";
import { toast } from "react-toastify";
import SlideOver from "./SlideOver";
import ToggleRow from "./ToggleRow";
import { clsx, soft, chip, btn, btnPrimary } from "../ui";
import { PlanInstance, PlanStrategyDef, PlanSignalSettings, StrategySelections } from "../india.types";

export default function StrategiesDrawer({
  open,
  onClose,
  plan,
  strategyDefs,

  planSignals,
  setPlanSignals,

  selections,
  setSelections,

  uiDebugUnlockAll,
}: {
  open: boolean;
  onClose: () => void;

  plan: PlanInstance | null;
  strategyDefs: PlanStrategyDef[];

  planSignals: PlanSignalSettings;
  setPlanSignals: (v: PlanSignalSettings) => void;

  selections: StrategySelections;
  setSelections: (v: StrategySelections) => void;

  uiDebugUnlockAll: boolean;
}) {
  const planId = plan?.planId ?? "";
  const maxActive = plan?.limits?.maxActiveStrategies ?? 0;

  const signals = planId ? planSignals[planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;

  const strategies = useMemo(() => {
    if (!plan) return [];
    return strategyDefs.filter((s) => s.planId === plan.planId && s.market === "INDIA");
  }, [plan, strategyDefs]);

  const enabledIds = useMemo(() => {
    if (!planId) return [];
    return selections[planId] ?? [];
  }, [selections, planId]);

  const setStrategiesEnabled = (v: boolean) => {
    if (!planId) return;
    setPlanSignals({
      ...planSignals,
      [planId]: { ...(planSignals[planId] ?? {}), strategiesEnabled: v },
    });
  };

  const toggleStrategy = (id: string) => {
    if (!plan) return;

    if (!uiDebugUnlockAll && maxActive <= 0) {
      toast.error("Your plan does not allow strategies.");
      return;
    }

    const current = enabledIds;
    const isOn = current.includes(id);

    if (isOn) {
      setSelections({ ...selections, [plan.planId]: current.filter((x) => x !== id) });
      return;
    }

    if (!uiDebugUnlockAll && maxActive === 1) {
      // choose any one
      setSelections({ ...selections, [plan.planId]: [id] });
      return;
    }

    if (!uiDebugUnlockAll && maxActive > 0 && current.length >= maxActive) {
      toast.warning(`Max ${maxActive} strategies allowed for this plan.`);
      return;
    }

    setSelections({ ...selections, [plan.planId]: [...current, id] });
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Built-in Strategies"
      subtitle="Enable/disable strategies included in your plan. You can keep strategies OFF and use only webhook if you want."
    >
      {!plan ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">Select a plan first.</div>
      ) : (
        <div className="space-y-4">
          <div className={clsx(soft, "p-4")}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-slate-100">{plan.planName}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Enabled: <span className="text-slate-200 font-semibold">{enabledIds.length}</span> /{" "}
                  <span className="text-slate-200 font-semibold">{maxActive || 0}</span>
                  {maxActive === 1 ? " • only one can be active" : ""}
                </div>
              </div>
              <span
                className={clsx(
                  chip,
                  strategiesEnabled
                    ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                {strategiesEnabled ? "Strategies ON" : "Strategies OFF"}
              </span>
            </div>
          </div>

          <ToggleRow
            label="Enable Built-in Strategies"
            hint="If OFF, built-in strategies won’t run for this plan. Webhook can still run."
            value={strategiesEnabled}
            onChange={setStrategiesEnabled}
          />

          <div className={clsx(strategiesEnabled ? "" : "opacity-60 pointer-events-none")}>
            <div className="text-xs text-slate-400 mb-2">
              {strategiesEnabled ? "Select strategies to activate:" : "Enable strategies to change selection."}
            </div>

            <div className="grid gap-3">
              {strategies.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                  No strategies configured (dummy).
                </div>
              ) : (
                strategies.map((s) => {
                  const on = enabledIds.includes(s.id);

                  const capReached =
                    !uiDebugUnlockAll &&
                    maxActive > 0 &&
                    maxActive !== 1 &&
                    !on &&
                    enabledIds.length >= maxActive;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (capReached) {
                          toast.warning(`Max ${maxActive} strategies allowed for this plan.`);
                          return;
                        }
                        toggleStrategy(s.id);
                      }}
                      className={clsx(
                        "text-left rounded-xl border p-4 transition",
                        on ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                        capReached && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100">{s.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{s.description}</div>
                          {s.tags?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {s.tags.map((t) => (
                                <span key={t} className="text-[11px] rounded-full border border-white/10 bg-white/5 text-slate-300 px-2 py-1">
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <span
                          className={clsx(
                            "text-[11px] rounded-full border px-2 py-1",
                            on ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300"
                          )}
                        >
                          {on ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button type="button" className={clsx(btn, btnPrimary, "w-full")} onClick={() => toast.success("Saved (dummy)")}>
            Save
          </button>
        </div>
      )}
    </SlideOver>
  );
}
