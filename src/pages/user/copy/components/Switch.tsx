import React from "react";
import { clsx } from "../ui";

export default function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 rounded-full border transition",
        checked ? "bg-emerald-500/90 border-emerald-400" : "bg-slate-800 border-slate-700",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-pressed={checked}
      aria-label="toggle"
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
