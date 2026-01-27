// src/pages/copytrading/forex/ui.ts
export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const pageWrap = "min-h-screen bg-slate-950 text-white p-6";

export const card =
  "rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

export const soft =
  "rounded-2xl border border-white/5 bg-slate-950/30 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

export const btn =
  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";

export const btnOutline =
  "border border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-900/80";

export const btnPrimary = "bg-indigo-500 text-white hover:bg-indigo-400";
export const btnDanger = "bg-rose-500 text-slate-950 hover:bg-rose-400";
export const btnAmber = "bg-yellow-400 text-slate-950 hover:bg-yellow-300";

export const chip =
  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px]";

export const input =
  "mt-2 w-full rounded-lg border border-slate-200/15 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

export function formatDate(ts?: string) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}
