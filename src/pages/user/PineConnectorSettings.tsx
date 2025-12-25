import React, { useMemo } from "react";
import {
  Link2,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUpdateTradeStatusMutation } from "../../services/userApi";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const cardBase = "rounded-2xl border border-slate-800 bg-slate-900/50 p-5";

type PineMode = "MANAGED" | "SELF";

export type PineConnectorSettingsValue = {
  enabled?: boolean;
  mode?: PineMode;

  // ✅ Light info only (NO MT5 creds)
  label?: string;
  notes?: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4",
        disabled && "opacity-60"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-8 w-14 rounded-full border transition",
          checked
            ? "bg-emerald-500/90 border-emerald-400"
            : "bg-slate-800 border-slate-700",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={clsx(
            "absolute top-1 h-6 w-6 rounded-full bg-slate-950 transition",
            checked ? "left-7" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function Badge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border",
        ok
          ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
          : "bg-rose-500/10 text-rose-300 border-rose-400/30"
      )}
    >
      <ShieldCheck size={14} />
      {text}
    </span>
  );
}

export default function PineConnectorSettings({
  value,
  onChange,

 
  allowTrade,
  setAllowTrade,

  onRefreshSubscription,
}: {
  value?: PineConnectorSettingsValue;
  onChange: (next: PineConnectorSettingsValue) => void;

  allowTrade: boolean;
  setAllowTrade: (next: boolean) => void;

  onRefreshSubscription?: () => Promise<any> | any;
}) {
  const v = value || {};
  const enabled = !!v.enabled;
  const mode = (v.mode || "MANAGED") as PineMode;

  const [updateTradeStatus, { isLoading: tradeStatusLoading }] =
    useUpdateTradeStatusMutation();

  const completeness = useMemo(() => {
    if (!enabled) return { ok: false, text: "Disabled" };
    return { ok: true, text: "Ready" };
  }, [enabled]);

  const set = (k: keyof PineConnectorSettingsValue, val: any) => {
    onChange({ ...v, [k]: val });
  };

  // ✅ Proper: update server -> refetch -> set UI from server -> toast
  const onToggleAllowTrade = async () => {
    const next = !allowTrade;

    try {
      // 1) update server
      await updateTradeStatus({ allowTrade: next }).unwrap();

      // 2) refetch fresh subscription (source of truth)
      const refreshed = await onRefreshSubscription?.();

  
      const sub =
        (refreshed as any)?.data?.data ??
        (refreshed as any)?.data ??
        (refreshed as any)?.currentData?.data ??
        (refreshed as any)?.currentData ??
        null;

      const serverValue = Boolean(
         sub?.executionEnabled ?? next
      );

 
      setAllowTrade(serverValue);
 
      toast.success(serverValue ? "Trading enabled" : "Trading disabled");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update trade status");
 
      try {
        const refreshed = await onRefreshSubscription?.();
        const sub =
          (refreshed as any)?.data?.data ??
          (refreshed as any)?.data ??
          (refreshed as any)?.currentData?.data ??
          (refreshed as any)?.currentData ??
          null;

        const serverValue = Boolean(
           sub?.executionEnabled ?? allowTrade
        );
        setAllowTrade(serverValue);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className={cardBase}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
              <Link2 className="text-emerald-300" size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Pine Connector
              </h3>
              <p className="text-xs text-slate-400">
                TradingView → Webhook → Our Bridge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge ok={completeness.ok} text={completeness.text} />
            {onRefreshSubscription && (
              <button
                type="button"
                onClick={() => onRefreshSubscription?.()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* <Toggle
            checked={enabled}
            onChange={(b) => set("enabled", b)}
            label="Enable Pine Connector"
            hint="Turn ON if your plan supports Pine Connector."
          /> */}

          {/* ✅ Allow Trading toggle (server call) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Zap
                    size={16}
                    className={allowTrade ? "text-emerald-400" : "text-rose-400"}
                  />
                  Allow Trading (Execution)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  If OFF, webhooks will NOT place/close trades.
                </p>
              </div>

              <button
                type="button"
                disabled={tradeStatusLoading}
                onClick={onToggleAllowTrade}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                  allowTrade
                    ? "bg-rose-500 text-slate-950 hover:bg-rose-400"
                    : "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
                  tradeStatusLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {tradeStatusLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating...
                  </>
                ) : allowTrade ? (
                  "Disable Trading"
                ) : (
                  "Enable Trading"
                )}
              </button>
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              Current status:{" "}
              <span
                className={
                  allowTrade
                    ? "text-emerald-300 font-semibold"
                    : "text-rose-300 font-semibold"
                }
              >
                {allowTrade ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          {/* Mode + explanation (no MT5 creds) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">
                Execution Mode
              </label>
              <select
                disabled={!enabled}
                className={`${inputBase} ${
                  !enabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
                value={mode}
                onChange={(e) => set("mode", e.target.value as PineMode)}
              >
                <option value="MANAGED">Managed by Us</option>
                <option value="SELF">Self Managed</option>
              </select>

              {enabled && mode === "SELF" && (
                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Label (optional)
                    </label>
                    <input
                      className={inputBase}
                      placeholder="e.g. My TV Strategy"
                      value={v.label || ""}
                      onChange={(e) => set("label", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Notes (optional)
                    </label>
                    <input
                      className={inputBase}
                      placeholder="Any note..."
                      value={v.notes || ""}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <SlidersHorizontal size={16} />
                <p className="text-sm font-medium">How it works</p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                *Managed*: Signals execute via our system based on your plan.
                <br />
                *Self*: You manage execution; we store only basic config for reference.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
