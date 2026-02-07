import React from "react";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 rounded-full border transition",
        checked ? "bg-emerald-500/90 border-emerald-400" : "bg-slate-800 border-slate-700"
      )}
      aria-pressed={checked}
    >
      <span
        className={clsx(
          "absolute top-[3px] h-4 w-4 rounded-full bg-slate-950 transition",
          checked ? "left-6" : "left-[3px]"
        )}
      />
    </button>
  );
}

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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100">{label}</div>
          {hint ? <div className="text-xs text-slate-400 mt-1">{hint}</div> : null}
        </div>
        <Switch checked={value} onChange={onChange} />
      </div>
    </div>
  );
}
