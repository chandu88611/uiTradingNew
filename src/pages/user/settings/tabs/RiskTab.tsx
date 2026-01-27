import React from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Check, PauseCircle } from "lucide-react";

import { Market, MarketSummary, RiskGuard, RiskSettings } from "../types";
import { clsx } from "../utils";
import { soft, btn, btnGhost, btnPrimary, input } from "../style";
import { StatusPill } from "../StatusPill";
import { Toggle } from "../Toggle";
import { Field } from "../Field";

export function RiskTab({
  risk,
  setRisk,
  summary,
}: {
  risk: RiskSettings;
  setRisk: (r: RiskSettings) => void;
  summary: MarketSummary;
}) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const setGuard = (patch: Partial<RiskGuard>) => {
    const next: RiskSettings = { ...risk, globalGuards: { ...risk.globalGuards, ...patch } };

    // Mirror alias fields
    if (patch.dailyProfitTarget != null) next.globalGuards.minGainPerDay = patch.dailyProfitTarget;
    if (patch.minGainPerDay != null) next.globalGuards.dailyProfitTarget = patch.minGainPerDay;

    setRisk(next);
  };

  const activeMarkets = (Object.keys(summary) as Market[]).filter((m) => summary[m].hasPlan);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Risk Management</h2>
        <p className="text-xs text-slate-400 mt-1">
          Built for retail behavior: pause trading, max loss/day, stop after profit target, sessions, cooldowns.
        </p>
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-100">Master pause</div>
            <div className="text-xs text-slate-400 mt-1">
              For users who want to stop trading completely for some time.
            </div>
          </div>

          <StatusPill tone={risk.masterPause ? "amber" : "emerald"} text={risk.masterPause ? "Trading Paused" : "Trading Active"} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            checked={risk.masterPause}
            onChange={(v) => setRisk({ ...risk, masterPause: v })}
            label={risk.masterPause ? "Paused (no new trades)" : "Active (execution allowed)"}
            hint="This overrides everything."
            danger={risk.masterPause}
          />

          <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
            <div className="text-sm font-semibold text-slate-100">Pause until (optional)</div>
            <div className="text-xs text-slate-400 mt-1">Auto-resume after this time.</div>
            <input
              className={input}
              type="datetime-local"
              value={risk.pauseUntil ?? ""}
              onChange={(e) => setRisk({ ...risk, pauseUntil: e.target.value || null })}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Reason / Notes">
            <input
              className={input}
              value={risk.pauseReason ?? ""}
              onChange={(e) => setRisk({ ...risk, pauseReason: e.target.value })}
              placeholder="e.g. traveling, drawdown, market uncertainty…"
            />
          </Field>

          <Field label="Execution mode" hint="Very common retail need: switch to signals-only without changing setups.">
            <select
              className={input}
              value={risk.executionMode}
              onChange={(e) => setRisk({ ...risk, executionMode: e.target.value as any })}
            >
              <option value="EXECUTION">Execution (place orders)</option>
              <option value="SIGNALS_ONLY">Signals only (no orders)</option>
              <option value="PAPER">Paper (simulate)</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-100">Allowed markets</div>
          <div className="text-xs text-slate-400 mt-1">Disable a market temporarily without touching others.</div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(Object.keys(risk.allowedMarkets) as Market[]).map((m) => (
              <Toggle
                key={m}
                checked={risk.allowedMarkets[m]}
                onChange={(v) => setRisk({ ...risk, allowedMarkets: { ...risk.allowedMarkets, [m]: v } })}
                label={m}
                hint={summary[m].hasPlan ? "Market available" : "No active plan in this market"}
                danger={!risk.allowedMarkets[m]}
              />
            ))}
          </div>

          {activeMarkets.length === 0 ? (
            <div className="mt-3 text-[11px] text-amber-200/80 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5" />
              No active plans found. Settings will save but trading won’t run until plans exist.
            </div>
          ) : null}
        </div>
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="text-base font-semibold text-slate-100">Daily guardrails</div>
        <div className="text-xs text-slate-400 mt-1">
          Max loss per day + minimum gain per day (profit target). Perfect for “stop trading for the day”.
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            checked={risk.globalGuards.enabled}
            onChange={(v) => setGuard({ enabled: v })}
            label="Enable daily guardrails"
            hint="Engine should monitor daily realized PnL."
          />
          <Toggle
            checked={risk.globalGuards.pauseTrading}
            onChange={(v) => setGuard({ pauseTrading: v })}
            label="When triggered: pause new trades"
            hint="Recommended. Doesn’t touch existing positions."
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Toggle
            checked={risk.globalGuards.closePositions}
            onChange={(v) => setGuard({ closePositions: v })}
            label="When triggered: auto-close positions"
            hint="High risk. Optional."
            danger={risk.globalGuards.closePositions}
          />
          <Toggle
            checked={risk.globalGuards.notify}
            onChange={(v) => setGuard({ notify: v })}
            label="Send alert when triggered"
            hint="Email/Telegram (configure below)."
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Max loss per day">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.globalGuards.dailyMaxLoss ?? ""}
              onChange={(e) => setGuard({ dailyMaxLoss: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 2000"
            />
          </Field>

          <Field label="Daily profit target">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.globalGuards.dailyProfitTarget ?? ""}
              onChange={(e) => setGuard({ dailyProfitTarget: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 1500"
            />
          </Field>

          <Field label="Minimum gain per day (alias)">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.globalGuards.minGainPerDay ?? ""}
              onChange={(e) => setGuard({ minGainPerDay: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 1500"
            />
          </Field>
        </div>
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="text-base font-semibold text-slate-100">Behavior controls</div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Max trades per day">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.maxTradesPerDay ?? ""}
              onChange={(e) => setRisk({ ...risk, maxTradesPerDay: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 20"
            />
          </Field>

          <Field label="Max open positions">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.maxOpenPositions ?? ""}
              onChange={(e) => setRisk({ ...risk, maxOpenPositions: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 6"
            />
          </Field>

          <Field label="Cooldown after loss (mins)">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.cooldownAfterLossMins ?? ""}
              onChange={(e) => setRisk({ ...risk, cooldownAfterLossMins: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 10"
            />
          </Field>

          <Field label="Max consecutive losses">
            <input
              className={input}
              type="number"
              min={0}
              value={risk.maxConsecutiveLosses ?? ""}
              onChange={(e) => setRisk({ ...risk, maxConsecutiveLosses: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 3"
            />
          </Field>
        </div>
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="text-base font-semibold text-slate-100">Session restriction</div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Toggle
            checked={risk.sessionEnabled}
            onChange={(v) => setRisk({ ...risk, sessionEnabled: v })}
            label="Enable session window"
            hint="Only trade within selected days + times."
          />

          <div className="rounded-xl border border-white/5 bg-slate-950/25 p-4">
            <div className="text-sm font-semibold text-slate-100">Days</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {days.map((d, i) => {
                const on = risk.sessionDays.includes(i);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const next = on ? risk.sessionDays.filter((x) => x !== i) : [...risk.sessionDays, i].sort((a, b) => a - b);
                      setRisk({ ...risk, sessionDays: next });
                    }}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      on
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    )}
                    disabled={!risk.sessionEnabled}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Session start">
            <input className={input} type="time" value={risk.sessionStart ?? ""} disabled={!risk.sessionEnabled}
              onChange={(e) => setRisk({ ...risk, sessionStart: e.target.value })} />
          </Field>
          <Field label="Session end">
            <input className={input} type="time" value={risk.sessionEnd ?? ""} disabled={!risk.sessionEnabled}
              onChange={(e) => setRisk({ ...risk, sessionEnd: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className={clsx(btn, btnGhost)} type="button" onClick={() => toast.info("Reset (dummy)")}>
          Reset
        </button>
        <button className={clsx(btn, btnPrimary)} type="button" onClick={() => toast.success("Risk saved (dummy)")}>
          <Check size={16} /> Save
        </button>
      </div>
    </div>
  );
}
