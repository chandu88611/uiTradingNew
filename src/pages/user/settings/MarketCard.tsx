import React from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { MarketLimits } from "./types";
import { clsx } from "./utils";
import { soft, btn, btnGhost, btnPrimary } from "./style";
import { StatusPill } from "./StatusPill";

export function MarketCard({
  title,
  subtitle,
  icon,
  accent,
  info,
  locked,
  onOpen,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: "emerald" | "indigo" | "yellow" | "violet";
  info: MarketLimits;
  locked: boolean;
  onOpen: () => void;
}) {
  const badge = locked
    ? { tone: "amber" as const, text: "Locked" }
    : info.executionAllowed
    ? { tone: "emerald" as const, text: "Active • Execution Enabled" }
    : { tone: "slate" as const, text: "Active • Execution Disabled" };

  const accentBox =
    accent === "indigo"
      ? "bg-indigo-500/15 border-indigo-400/20 text-indigo-200"
      : accent === "yellow"
      ? "bg-yellow-500/15 border-yellow-400/20 text-yellow-200"
      : accent === "violet"
      ? "bg-violet-500/15 border-violet-400/20 text-violet-200"
      : "bg-emerald-500/15 border-emerald-400/20 text-emerald-200";

  return (
    <div className={clsx(soft, "p-5")}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className={clsx("h-10 w-10 rounded-xl border flex items-center justify-center", accentBox)}>{icon}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-semibold text-slate-100">{title}</p>
              <StatusPill tone={badge.tone} text={badge.text} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            <p className="text-[11px] text-slate-500 mt-2">
              Active plans: <span className="text-slate-200 font-semibold">{info.plansCount}</span>
              {info.earliestEndDate ? (
                <>
                  {" "}
                  • valid until:{" "}
                  <span className="text-slate-200 font-semibold">{new Date(info.earliestEndDate).toLocaleString()}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <button type="button" onClick={onOpen} className={clsx(btn, locked ? btnGhost : btnPrimary)}>
          {locked ? (
            <>
              Upgrade <ExternalLink size={16} />
            </>
          ) : (
            <>
              Open <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
