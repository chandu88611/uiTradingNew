import React from "react";
import { ShieldCheck } from "lucide-react";
import { clsx } from "./utils";

export function StatusPill({
  tone,
  text,
}: {
  tone: "emerald" | "amber" | "rose" | "slate";
  text: string;
}) {
  const cls =
    tone === "emerald"
      ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
      : tone === "amber"
      ? "text-amber-200 bg-amber-500/10 border-amber-500/20"
      : tone === "rose"
      ? "text-rose-200 bg-rose-500/10 border-rose-500/20"
      : "text-slate-200 bg-white/5 border-white/10";

  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs", cls)}>
      <ShieldCheck size={14} />
      {text}
    </span>
  );
}
