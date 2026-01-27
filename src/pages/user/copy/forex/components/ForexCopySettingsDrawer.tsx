
// src/pages/copytrading/forex/components/ForexCopySettingsDrawer.tsx
import React from "react";
import Drawer from "./Drawer";
import Switch from "./Switch";
import { ForexCopySettings } from "../forex.types";

export default function ForexCopySettingsDrawer({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: ForexCopySettings;
  onChange: (v: ForexCopySettings) => void;
}) {
  const patch = (p: Partial<ForexCopySettings>) => onChange({ ...value, ...p });

  return (
    <Drawer open={open} title="Copy Settings" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-900">Position multiplier</div>
          <div className="text-xs text-slate-600 mt-1">Example: 0.5 = half size, 2 = double size.</div>
          <input
            type="number"
            step="0.1"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={value.multiplier}
            onChange={(e) => patch({ multiplier: Number(e.target.value || 0) })}
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-900">Risk caps</div>

          <div className="mt-3 grid gap-3 grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-600">MAX SLIPPAGE (pips)</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={value.maxSlippagePips}
                onChange={(e) => patch({ maxSlippagePips: Number(e.target.value || 0) })}
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-600">PER-TRADE CAP</div>
              <input
                type="number"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={value.perTradeRiskCap}
                onChange={(e) => patch({ perTradeRiskCap: Number(e.target.value || 0) })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Pause copying</div>
              <div className="text-xs text-slate-600 mt-1">Temporarily stop copying new trades.</div>
            </div>
            <Switch checked={value.pauseCopy} onChange={(v) => patch({ pauseCopy: v })} />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

