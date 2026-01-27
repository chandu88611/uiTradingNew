import React from "react";
import { Activity, Layers, Settings2, SlidersHorizontal, User } from "lucide-react";
import { clsx } from "./utils";
import { TabKey } from "./types";

export function SectionTabs({ value, onChange }: { value: TabKey; onChange: (v: TabKey) => void }) {
  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: "TRADING", label: "Trading", icon: <Layers size={16} /> },
    { key: "RISK", label: "Risk", icon: <SlidersHorizontal size={16} /> },
    { key: "STRATEGIES", label: "Strategies", icon: <Activity size={16} /> },
    { key: "USAGE", label: "Plan Usage", icon: <Settings2 size={16} /> },
    { key: "ACCOUNT", label: "Account", icon: <User size={16} /> },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
            value === t.key
              ? "bg-emerald-500 text-slate-950 border-emerald-500"
              : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
