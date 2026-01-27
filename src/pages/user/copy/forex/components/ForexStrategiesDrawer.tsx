// src/pages/copytrading/forex/components/ForexStrategiesDrawer.tsx
import React, { useMemo } from "react";
import { toast } from "react-toastify";
import Drawer from "./Drawer";
import Switch from "./Switch";
import { clsx } from "../ui";
import { ForexCopyPlanInstance, ForexPlanSignalSettings, ForexPlanStrategies, ForexStrategySelections } from "../forex.types";

function riskBadge(risk: "LOW" | "MEDIUM" | "HIGH") {
  return risk === "LOW"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : risk === "MEDIUM"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-rose-100 text-rose-700 border-rose-200";
}

export default function ForexStrategiesDrawer({
  open,
  onClose,
  plan,
  strategyDefs,
  planSignals,
  setPlanSignals,
  selections,
  setSelections,
}: {
  open: boolean;
  onClose: () => void;
  plan: ForexCopyPlanInstance | null;
  strategyDefs: ForexPlanStrategies;

  planSignals: ForexPlanSignalSettings;
  setPlanSignals: (v: ForexPlanSignalSettings) => void;

  selections: ForexStrategySelections;
  setSelections: (v: ForexStrategySelections) => void;
}) {
  const defs = useMemo(() => (plan ? strategyDefs[plan.planId] ?? [] : []), [plan, strategyDefs]);
  if (!plan) return null;

  const sig = planSignals[plan.planId];
  const strategiesEnabled = !!sig?.strategiesEnabled;

  const selected = selections[plan.planId] ?? [];
  const max = plan.limits.maxActiveStrategies;

  const toggle = (id: string) => {
    const cur = new Set(selected);
    const has = cur.has(id);

    if (!has && max > 0 && cur.size >= max) {
      toast.error(`Max active strategies reached (${max}) for this plan`);
      return;
    }

    if (has) cur.delete(id);
    else cur.add(id);

    setSelections({ ...selections, [plan.planId]: Array.from(cur) });
  };

  return (
    <Drawer open={open} title="Strategies" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Enable Strategies</div>
              <div className="text-xs text-slate-600 mt-1">
                Strategies are per-plan. You can enable multiple strategies (limited by plan).
              </div>
            </div>
            <Switch
              checked={strategiesEnabled}
              onChange={(v) => {
                setPlanSignals({
                  ...planSignals,
                  [plan.planId]: {
                    strategiesEnabled: v,
                    webhookEnabled: !!planSignals[plan.planId]?.webhookEnabled,
                  },
                });
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600">AVAILABLE STRATEGIES</div>
            <div className="text-xs text-slate-500">
              Enabled: <b>{selected.length}</b> / <b>{max || "—"}</b>
            </div>
          </div>

          {defs.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No strategies for this plan.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {defs.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={clsx(
                      "w-full rounded-xl border p-3 text-left transition",
                      on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{s.description}</div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]", riskBadge(s.risk))}>
                            {s.risk}
                          </span>
                          {s.tags.map((t) => (
                            <span key={t} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={clsx("mt-1 h-5 w-10 rounded-full border p-[2px] flex items-center", on ? "bg-emerald-100 border-emerald-200 justify-end" : "bg-slate-100 border-slate-200 justify-start")}>
                        <div className={clsx("h-4 w-4 rounded-full", on ? "bg-emerald-500" : "bg-slate-400")} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500">
          Rule: Strategies are tied to this plan. You can’t enable strategies from another plan here.
        </div>
      </div>
    </Drawer>
  );
}
