import React from "react";
import { RefreshCw, Shield } from "lucide-react";

function clsx(...p: any[]) {
  return p.filter(Boolean).join(" ");
}

const panel =
  "rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur " +
  "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

export default function CopyToolbar({
  title,
  subtitle,
  useDummy,
  onToggleDummy,
  onRefresh,
  rightSlot,
}: {
  title: string;
  subtitle: string;
  useDummy: boolean;
  onToggleDummy: () => void;
  onRefresh: () => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className={clsx(panel, "p-4 md:p-5")}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-100">
            {title.split(" ")[0]}{" "}
            <span className="text-emerald-400">{title.split(" ").slice(1).join(" ")}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleDummy}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
              useDummy
                ? "bg-emerald-500 text-slate-950 border-emerald-500"
                : "border-slate-800 bg-slate-900/50 text-slate-200 hover:bg-slate-900/70"
            )}
          >
            <Shield size={16} />
            Dummy Data: {useDummy ? "ON" : "OFF"}
          </button>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900/70"
            title={useDummy ? "Reset dummy dataset" : "Refetch from API"}
          >
            <RefreshCw size={16} />
            {useDummy ? "Reset Dummy" : "Refresh"}
          </button>

          {rightSlot}
        </div>
      </div>
    </div>
  );
}
