import React from "react";
import { CheckCircle2, PauseCircle, PlayCircle, Settings2, Link2 } from "lucide-react";

function clsx(...p: any[]) {
  return p.filter(Boolean).join(" ");
}

function initials(name?: string) {
  const n = String(name || "").trim();
  if (!n) return "M";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((x) => x[0]?.toUpperCase()).join("");
}

function statusMeta(status?: string) {
  const s = String(status || "").toUpperCase();
  if (!s) return { label: "ACTIVE", cls: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" };
  if (s === "ACTIVE" || s === "RUNNING" || s === "VERIFIED")
    return { label: "ACTIVE", cls: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" };
  if (s === "PAUSED" || s === "INACTIVE" || s === "DISABLED")
    return { label: "PAUSED", cls: "border-slate-700 bg-white/5 text-slate-200" };
  if (s === "PENDING" || s === "PENDING_VERIFY" || s === "WAITING")
    return { label: "PENDING", cls: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200" };
  return { label: s, cls: "border-rose-500/20 bg-rose-500/10 text-rose-200" };
}

const panel =
  "rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur " +
  "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

const btn =
  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition";
const btnGhost = "border-slate-800 bg-slate-950/20 text-slate-200 hover:bg-slate-950/35 hover:border-slate-700";
const btnPrimary = "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15";
const btnWarn = "border-slate-700 bg-white/5 text-slate-200 hover:bg-white/10";

export default function FollowCardShell({
  f,
  children,
  onEdit,
  onConnect,
  onQuickStatus,
}: {
  f: any; // NormalizedFollow (keep any so it won't break)
  children?: React.ReactNode;
  onEdit: (f: any) => void;
  onConnect: (f: any) => void;
  onQuickStatus: (f: any, status: any) => void;
}) {
  const masterName =
    (f?.masterName ?? f?.master?.name ?? f?.master?.displayName ?? f?.accountLabel ?? "Master") as string;

  const masterEmail =
    (f?.masterEmail ?? f?.master?.email ?? f?.meta?.masterEmail ?? f?.meta?.email ?? "") as string;

  const st = statusMeta(f?.status);
  const paused = st.label === "PAUSED";

  return (
    <div className={clsx(panel, "p-4 md:p-5")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-950/25 flex items-center justify-center text-sm font-bold text-slate-200">
            {initials(masterName)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm font-semibold text-slate-100 truncate">{masterName}</div>
              <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]", st.cls)}>
                <CheckCircle2 size={12} className="opacity-80" />
                {st.label}
              </span>
            </div>

            {masterEmail ? (
              <div className="mt-0.5 text-[12px] text-slate-400 truncate">{masterEmail}</div>
            ) : (
              <div className="mt-0.5 text-[12px] text-slate-500 truncate">—</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onConnect(f)} className={clsx(btn, btnPrimary)}>
            <Link2 size={14} />
            Connect / Update
          </button>

          <button type="button" onClick={() => onEdit(f)} className={clsx(btn, btnGhost)}>
            <Settings2 size={14} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onQuickStatus(f, paused ? "ACTIVE" : "PAUSED")}
            className={clsx(btn, btnWarn)}
            title={paused ? "Resume copying" : "Pause copying"}
          >
            {paused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4">{children}</div>
    </div>
  );
}
