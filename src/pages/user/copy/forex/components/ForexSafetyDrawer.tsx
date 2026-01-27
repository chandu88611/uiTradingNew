// src/pages/copytrading/forex/components/ForexSafetyDrawer.tsx
import React from "react";
import Drawer from "./Drawer";
import Switch from "./Switch";
import { ForexCopyPlanInstance, ForexSafetySettings } from "../forex.types";

export default function ForexSafetyDrawer({
  open,
  onClose,
  plan,
  safety,
  setSafety,
}: {
  open: boolean;
  onClose: () => void;
  plan: ForexCopyPlanInstance | null;
  safety: ForexSafetySettings;
  setSafety: (v: ForexSafetySettings) => void;
}) {
  if (!plan) return null;
  const cur = safety[plan.planId];

  const patch = (p: Partial<typeof cur>) => {
    setSafety({
      ...safety,
      [plan.planId]: { ...cur, ...p },
    });
  };

  return (
    <Drawer open={open} title="Safety Controls" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Pause trading</div>
              <div className="text-xs text-slate-600 mt-1">
                Stops execution temporarily (per plan).
              </div>
            </div>
            <Switch checked={!!cur.pauseEnabled} onChange={(v) => patch({ pauseEnabled: v })} />
          </div>

          <div className="mt-3">
            <div className="text-[11px] font-semibold text-slate-600">PAUSE UNTIL (optional)</div>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={(cur.pauseUntil ?? "").slice(0, 16)}
              onChange={(e) => patch({ pauseUntil: e.target.value ? new Date(e.target.value).toISOString() : "" })}
              disabled={!cur.pauseEnabled}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-900">Daily guardrails</div>
          <div className="text-xs text-slate-600 mt-1">
            If max loss hit → disable execution. If min profit hit → optionally stop for the day.
          </div>

          <div className="mt-3 grid gap-3 grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-600">MAX LOSS / DAY</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={cur.maxLossPerDay}
                onChange={(e) => patch({ maxLossPerDay: Number(e.target.value || 0) })}
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-600">MIN PROFIT / DAY</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={cur.minProfitPerDay}
                onChange={(e) => patch({ minProfitPerDay: Number(e.target.value || 0) })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-900">Limits</div>

          <div className="mt-3 grid gap-3 grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-600">MAX DAILY TRADES</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={cur.maxDailyTrades}
                onChange={(e) => patch({ maxDailyTrades: Number(e.target.value || 0) })}
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-600">MAX OPEN POSITIONS</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={cur.maxOpenPositions}
                onChange={(e) => patch({ maxOpenPositions: Number(e.target.value || 0) })}
              />
            </div>

            <div className="col-span-2">
              <div className="text-[11px] font-semibold text-slate-600">MAX LOT / TRADE</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={cur.maxLotPerTrade}
                onChange={(e) => patch({ maxLotPerTrade: Number(e.target.value || 0) })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-sm font-semibold text-rose-800">Kill switch</div>
          <div className="text-xs text-rose-700 mt-1">
            Emergency stop. Disables all execution for this plan immediately.
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-rose-800 font-semibold">{cur.killSwitch ? "ENABLED" : "OFF"}</div>
            <Switch checked={!!cur.killSwitch} onChange={(v) => patch({ killSwitch: v })} />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
