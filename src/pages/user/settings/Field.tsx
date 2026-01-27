import React from "react";
import { label as labelCls } from "./style";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={labelCls}>{label}</div>
      {hint ? <div className="text-[11px] text-slate-500 mt-1">{hint}</div> : null}
      {children}
    </div>
  );
}
