import React from "react";

export default function UsageRow({
  label,
  used,
  max,
}: {
  label: string;
  used: number | null;
  max: number | null;
}) {
  const pct =
    used != null && max != null && max > 0
      ? Math.min(100, Math.round((used / max) * 100))
      : null;

  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{label}</div>
        <div className="text-xs text-slate-300">
          {used == null ? "—" : used} / {max == null || max === 0 ? "—" : max}
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div className="h-2 rounded-full bg-emerald-500/60" style={{ width: `${pct ?? 0}%` }} />
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        {pct == null ? "Usage counters not connected yet (showing plan limits)." : `${pct}% used`}
      </div>
    </div>
  );
}
