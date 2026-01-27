import React, { useMemo } from "react";
import { Market, MarketSummary, DummySubscription } from "../types";
import { soft } from "../style";
import { isExpired } from "../utils";
import { StatusPill } from "../StatusPill";

export function AccountTab({ subs, summary }: { subs: DummySubscription[]; summary: MarketSummary }) {
  const activeSubs = useMemo(() => subs.filter((s) => !isExpired(s.endDate)), [subs]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <p className="text-xs text-slate-400 mt-1">Inline subscription summary (dummy), market status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${soft} p-5`}>
          <div className="text-sm font-semibold text-slate-100">Active subscriptions</div>
          <div className="text-xs text-slate-400 mt-1">Non-expired subscriptions from dummy data.</div>

          <div className="mt-4 grid gap-2">
            {activeSubs.length === 0 ? (
              <div className="text-xs text-slate-500 rounded-xl border border-white/10 bg-white/5 p-4">No active plans.</div>
            ) : (
              activeSubs.map((s) => {
                const plan = s.plan;
                const end = s.endDate ? new Date(s.endDate).toLocaleString() : "—";
                const exec = Boolean(s.executionEnabled ?? plan.executionEnabled);
                return (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100">{plan.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Category: {plan.category ?? "—"} • Valid until: {end}
                        </div>
                      </div>
                      <StatusPill tone={exec ? "emerald" : "slate"} text={exec ? "Exec ON" : "Exec OFF"} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`${soft} p-5`}>
          <div className="text-sm font-semibold text-slate-100">Market status</div>
          <div className="text-xs text-slate-400 mt-1">Computed from active plans.</div>

          <div className="mt-4 grid gap-2">
            {(["FOREX", "INDIA", "CRYPTO", "COPY"] as Market[]).map((m) => {
              const s = summary[m];
              return (
                <div key={m} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{m}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Plans: {s.plansCount} • Exec: {s.executionAllowed ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <StatusPill
                    tone={!s.hasPlan ? "amber" : s.executionAllowed ? "emerald" : "slate"}
                    text={!s.hasPlan ? "No Plan" : s.executionAllowed ? "Active" : "Active • No Exec"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
