import React from "react";

export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const page = "min-h-screen bg-slate-950 text-white p-6";
export const card =
  "rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
export const soft =
  "rounded-2xl border border-white/5 bg-slate-950/30 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
export const btnGhost = "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";
export const btnPrimary =
  "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20";
export const btnDanger =
  "border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15";

export const input =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40";

export const selectInline =
  "h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40";

export const pillBase = "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap";
export const pillOff = "border-white/10 bg-white/5 text-slate-200";
export const pillOn = "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
export const pillWarn = "border-amber-500/20 bg-amber-500/10 text-amber-200";
