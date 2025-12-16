import React, { useEffect, useMemo, useState } from "react";
import { Link2, Eye, EyeOff, ShieldCheck, SlidersHorizontal } from "lucide-react";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/50 p-5";

type PineMode = "MANAGED" | "SELF";

export type PineConnectorSettingsValue = {
  enabled?: boolean;
  mode?: PineMode;

  // if managed:
  mt5Login?: string;
  mt5Password?: string;
  mt5Server?: string;
  mt5InvestorPassword?: string;

  // if self:
  label?: string;
  notes?: string;
};

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full border transition ${
          checked
            ? "bg-emerald-500/90 border-emerald-400"
            : "bg-slate-800 border-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-slate-950 transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function Badge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border ${
        ok
          ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
          : "bg-rose-500/10 text-rose-300 border-rose-400/30"
      }`}
    >
      <ShieldCheck size={14} />
      {text}
    </span>
  );
}

export default function PineConnectorSettings({
  value,
  onChange,
}: {
  value?: PineConnectorSettingsValue;
  onChange: (next: PineConnectorSettingsValue) => void;
}) {
  const v = value || {};

  const [showPass, setShowPass] = useState(false);
  const [showInvestor, setShowInvestor] = useState(false);

  const enabled = !!v.enabled;
  const mode = (v.mode || "MANAGED") as PineMode;

  const completeness = useMemo(() => {
    if (!enabled) return { ok: false, text: "Disabled" };

    if (mode === "MANAGED") {
      const ok = !!(v.mt5Login && v.mt5Password && v.mt5Server);
      return { ok, text: ok ? "Ready" : "Needs MT5 credentials" };
    }
    const ok = !!(v.label && v.label.trim().length > 2);
    return { ok, text: ok ? "Ready" : "Needs basic info" };
  }, [enabled, mode, v]);

  const set = (k: keyof PineConnectorSettingsValue, val: any) => {
    onChange({ ...v, [k]: val });
  };

  return (
    <div className="space-y-5">
      <div className={cardBase}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
                <Link2 className="text-emerald-300" size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">Pine Connector</h3>
                <p className="text-xs text-slate-400">
                  TradingView → (Our Bridge) → MT5. Managed or Self-managed.
                </p>
              </div>
            </div>
          </div>

          <Badge ok={completeness.ok} text={completeness.text} />
        </div>

        <div className="mt-5">
          <Toggle
            checked={enabled}
            onChange={(b) => set("enabled", b)}
            label="Enable Pine Connector"
            hint="Turn ON if you have a Pine/Strategy subscription."
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">
              Execution Mode
            </label>
            <select
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              value={mode}
              onChange={(e) => set("mode", e.target.value as PineMode)}
            >
              <option value="MANAGED">Managed by Us (TV → MT5)</option>
              <option value="SELF">Self Managed</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <SlidersHorizontal size={16} />
              <p className="text-sm font-medium">How it works</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              *Managed*: you provide MT5 creds, we execute signals on your terminal.
              <br />
              *Self*: you manage execution, we store only basic account info.
            </p>
          </div>
        </div>
      </div>

      {/* Managed fields */}
      {enabled && mode === "MANAGED" && (
        <div className={cardBase}>
          <h4 className="text-sm font-semibold text-slate-200">MT5 Credentials</h4>
          <p className="text-xs text-slate-400 mt-1">
            We recommend encrypting these at backend. UI masks passwords.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">MT5 Login</label>
              <input
                className={inputBase}
                placeholder="e.g. 12345678"
                value={v.mt5Login || ""}
                onChange={(e) => set("mt5Login", e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">MT5 Server</label>
              <input
                className={inputBase}
                placeholder="e.g. ICMarketsSC-Demo"
                value={v.mt5Server || ""}
                onChange={(e) => set("mt5Server", e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="text-xs font-medium text-slate-300">MT5 Password</label>
              <input
                className={inputBase}
                placeholder="••••••••"
                type={showPass ? "text" : "password"}
                value={v.mt5Password || ""}
                onChange={(e) => set("mt5Password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <label className="text-xs font-medium text-slate-300">
                Investor Password (Optional)
              </label>
              <input
                className={inputBase}
                placeholder="••••••••"
                type={showInvestor ? "text" : "password"}
                value={v.mt5InvestorPassword || ""}
                onChange={(e) => set("mt5InvestorPassword", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowInvestor((p) => !p)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200"
              >
                {showInvestor ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-managed fields */}
      {enabled && mode === "SELF" && (
        <div className={cardBase}>
          <h4 className="text-sm font-semibold text-slate-200">Basic Info</h4>
          <p className="text-xs text-slate-400 mt-1">
            Only for display/reference. No MT5 passwords required.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Account Label</label>
              <input
                className={inputBase}
                placeholder="e.g. My FX Account"
                value={v.label || ""}
                onChange={(e) => set("label", e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Notes (Optional)</label>
              <input
                className={inputBase}
                placeholder="Any note..."
                value={v.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
