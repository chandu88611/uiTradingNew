// ui.ts
export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const pageWrap = "w-full";
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

export const chip =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]";

export function formatDate(ts?: string | null) {
  if (!ts) return "—";
  const t = new Date(ts).getTime();
  if (!Number.isFinite(t)) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function getLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setLS(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
