import React from "react";
import { ShieldAlert, PauseCircle, PlayCircle, Clock } from "lucide-react";
import Switch from "./Switch";
import { btn, btnDanger, btnGhost, btnPrimary, card, chip, clsx, input, formatDate } from "../ui";
import { GlobalRiskSettings } from "../settingsHub.types";

export default function GlobalControlsCard({
  value,
  onChange,
}: {
  value: GlobalRiskSettings;
  onChange: (next: GlobalRiskSettings) => void;
}) {
  const pausedNow =
    value.paused &&
    (!value.pauseUntil ||
      (Number.isFinite(new Date(value.pauseUntil).getTime()) &&
        new Date(value.pauseUntil).getTime() > Date.now()));

  const statusChip = pausedNow
    ? clsx(chip, "text-rose-200 bg-rose-500/10 border-rose-500/20")
    : clsx(chip, "text-emerald-200 bg-emerald-500/10 border-emerald-500/20");

  const toDatetimeLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fromDatetimeLocal = (v: string) => {
    if (!v) return null;
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toISOString();
  };

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-300" />
            <div className="text-base font-semibold text-slate-100">Emergency Controls</div>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            One place to pause everything + enforce daily safety rules.
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className={statusChip}>
              {pausedNow ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
              {pausedNow ? "Trading Paused" : "Trading Active"}
            </span>

            <span className={clsx(chip, "text-slate-200 bg-white/5 border-white/10")}>
              <Clock size={14} />
              Until: <b className="text-slate-100">{value.pauseUntil ? formatDate(value.pauseUntil) : "—"}</b>
            </span>

            {value.manualResumeRequired ? (
              <span className={clsx(chip, "text-slate-200 bg-white/5 border-white/10")}>
                Manual resume required
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-300">Pause ALL</div>
          <Switch
            checked={value.paused}
            onChange={(v) => onChange({ ...value, paused: v })}
          />
        </div>
      </div>

      {/* Pause details */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-slate-300">Pause Until (optional)</div>
          <input
            className={input}
            type="datetime-local"
            value={toDatetimeLocal(value.pauseUntil)}
            onChange={(e) => onChange({ ...value, pauseUntil: fromDatetimeLocal(e.target.value) })}
          />
          <div className="text-[11px] text-slate-500 mt-2">
            If empty: pause stays ON until you resume.
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/25 p-4">
          <div className="text-xs font-semibold text-slate-300">Resume</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Use resume when you want to restart execution.
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              type="button"
              className={clsx(btn, btnPrimary)}
              onClick={() => onChange({ ...value, paused: false, pauseUntil: null })}
            >
              <PlayCircle size={16} />
              Resume now
            </button>
            <button
              type="button"
              className={clsx(btn, btnDanger)}
              onClick={() =>
                onChange({
                  ...value,
                  paused: true,
                  pauseUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                })
              }
            >
              <PauseCircle size={16} />
              Pause 6h
            </button>
            <button
              type="button"
              className={clsx(btn, btnGhost)}
              onClick={() =>
                onChange({
                  ...value,
                  paused: true,
                  pauseUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                })
              }
            >
              Pause 24h
            </button>
          </div>
        </div>
      </div>

      {/* Daily safety rules */}
      <div className="mt-6">
        <div className="text-sm font-semibold text-slate-100">Daily Safety Rules</div>
        <div className="text-xs text-slate-400 mt-1">
          Enforce “stop trading” behavior when targets are hit (global).
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <FieldNumber
            label="Max Loss / Day (Amount)"
            value={value.maxLossAmount}
            onChange={(n) => onChange({ ...value, maxLossAmount: n })}
            placeholder="e.g. 2500"
          />
          <FieldNumber
            label="Max Loss / Day (%)"
            value={value.maxLossPercent}
            onChange={(n) => onChange({ ...value, maxLossPercent: n })}
            placeholder="e.g. 2"
          />
          <FieldNumber
            label="Min Gain / Day (Amount)"
            value={value.minGainAmount}
            onChange={(n) => onChange({ ...value, minGainAmount: n })}
            placeholder="e.g. 800"
          />

          <FieldNumber
            label="Min Gain / Day (%)"
            value={value.minGainPercent}
            onChange={(n) => onChange({ ...value, minGainPercent: n })}
            placeholder="e.g. 1"
          />
          <FieldNumber
            label="Max Trades / Day"
            value={value.maxTradesPerDay}
            onChange={(n) => onChange({ ...value, maxTradesPerDay: n })}
            placeholder="e.g. 25"
          />
          <FieldNumber
            label="Stop after consecutive losses"
            value={value.stopAfterConsecutiveLosses}
            onChange={(n) => onChange({ ...value, stopAfterConsecutiveLosses: n })}
            placeholder="e.g. 3"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-slate-950/25 p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-300">Block outside hours</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Simple time window to prevent unwanted sessions.
                </div>
              </div>
              <Switch
                checked={value.blockOutsideHours}
                onChange={(v) => onChange({ ...value, blockOutsideHours: v })}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">From</div>
                <input
                  className={input}
                  type="time"
                  value={value.tradeFromHHMM}
                  onChange={(e) => onChange({ ...value, tradeFromHHMM: e.target.value })}
                  disabled={!value.blockOutsideHours}
                />
              </div>
              <div>
                <div className="text-xs text-slate-400">To</div>
                <input
                  className={input}
                  type="time"
                  value={value.tradeToHHMM}
                  onChange={(e) => onChange({ ...value, tradeToHHMM: e.target.value })}
                  disabled={!value.blockOutsideHours}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-950/25 p-4">
            <div className="text-xs font-semibold text-slate-300">Manual Resume Required</div>
            <div className="text-[11px] text-slate-500 mt-1">
              If enabled, engine won’t auto-resume after pause-until.
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-300">Enable</span>
              <Switch
                checked={value.manualResumeRequired}
                onChange={(v) => onChange({ ...value, manualResumeRequired: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/25 p-4">
      <div className="text-xs font-semibold text-slate-300">{label}</div>
      <input
        className={input}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (!raw) return onChange(null);
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
      />
    </div>
  );
}
