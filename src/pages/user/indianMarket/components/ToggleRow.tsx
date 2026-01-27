import React from "react";
import { clsx } from "../ui";

export default function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-100">{label}</div>
        {hint ? <div className="text-xs text-slate-400 mt-1">{hint}</div> : null}
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={clsx(
          "relative h-7 w-12 rounded-full border transition",
          value ? "bg-emerald-500/20 border-emerald-500/30" : "bg-slate-900 border-white/10"
        )}
        aria-pressed={value}
      >
        <span
          className={clsx(
            "absolute top-1 h-5 w-5 rounded-full transition",
            value ? "left-6 bg-emerald-300" : "left-1 bg-slate-300"
          )}
        />
      </button>
    </div>
  );
}
