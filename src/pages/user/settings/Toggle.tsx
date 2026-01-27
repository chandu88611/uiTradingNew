import React from "react";
import { clsx } from "./utils";

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  danger,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-4 rounded-xl border p-4",
        danger ? "border-rose-500/20 bg-rose-500/5" : "border-white/5 bg-slate-950/25"
      )}
    >
      <div className="min-w-0">
        <div className={clsx("text-sm font-semibold", danger ? "text-rose-100" : "text-slate-100")}>{label}</div>
        {hint ? <div className={clsx("text-xs mt-1", danger ? "text-rose-200/70" : "text-slate-400")}>{hint}</div> : null}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-7 w-12 items-center rounded-full border transition",
          checked
            ? danger
              ? "bg-rose-500/30 border-rose-500/30"
              : "bg-emerald-500/30 border-emerald-500/30"
            : "bg-white/5 border-white/10"
        )}
      >
        <span className={clsx("inline-block h-5 w-5 transform rounded-full bg-white transition", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}
