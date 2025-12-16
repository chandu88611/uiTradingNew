import React, { useMemo, useState } from "react";
import { Building2, Eye, EyeOff, ShieldCheck } from "lucide-react";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/50 p-5";

export type IndianMarketSettingsValue = {
  enabled?: boolean;
  broker?: "MOTILAL_OSWAL" | "ZERODHA" | "ANGEL" | "UPSTOX" | "OTHER";
  clientId?: string;
  token?: string;
  apiKey?: string;
  apiSecret?: string;
  notes?: string;
};

function Toggle({ checked, onChange, label, hint }: any) {
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

function Badge({ ok, text }: any) {
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

export default function IndianMarketSettings({
  value,
  onChange,
}: {
  value?: IndianMarketSettingsValue;
  onChange: (next: IndianMarketSettingsValue) => void;
}) {
  const v = value || {};
  const [showSecret, setShowSecret] = useState(false);

  const enabled = !!v.enabled;

  const completeness = useMemo(() => {
    if (!enabled) return { ok: false, text: "Disabled" };
    const ok = !!(v.broker && (v.token || v.apiKey) && v.clientId);
    return { ok, text: ok ? "Ready" : "Needs broker token" };
  }, [enabled, v]);

  const set = (k: keyof IndianMarketSettingsValue, val: any) =>
    onChange({ ...v, [k]: val });

  return (
    <div className="space-y-5">
      <div className={cardBase}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center">
              <Building2 className="text-indigo-300" size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Indian Market</h3>
              <p className="text-xs text-slate-400">
                Token settings required for executing Indian market strategies.
              </p>
            </div>
          </div>

          <Badge ok={completeness.ok} text={completeness.text} />
        </div>

        <div className="mt-5">
          <Toggle
            checked={enabled}
            onChange={(b: boolean) => set("enabled", b)}
            label="Enable Indian Market Trading"
            hint="Even if you don’t trade today, keep it ON if you have an active strategy."
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Broker</label>
            <select
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              value={v.broker || ""}
              onChange={(e) => set("broker", e.target.value as any)}
            >
              <option value="">Select broker</option>
              <option value="MOTILAL_OSWAL">Motilal Oswal</option>
              <option value="ZERODHA">Zerodha</option>
              <option value="ANGEL">Angel One</option>
              <option value="UPSTOX">Upstox</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Client ID</label>
            <input
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="Your broker client id"
              value={v.clientId || ""}
              onChange={(e) => set("clientId", e.target.value)}
            />
          </div>

          <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">
              Depending on broker, you may need either a single token OR API key + secret.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Access Token</label>
            <input
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="Token"
              value={v.token || ""}
              onChange={(e) => set("token", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">API Key (Optional)</label>
            <input
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="API Key"
              value={v.apiKey || ""}
              onChange={(e) => set("apiKey", e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="text-xs font-medium text-slate-300">
              API Secret (Optional)
            </label>
            <input
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="••••••••"
              type={showSecret ? "text" : "password"}
              value={v.apiSecret || ""}
              onChange={(e) => set("apiSecret", e.target.value)}
            />
            <button
              type="button"
              disabled={!enabled}
              onClick={() => setShowSecret((p) => !p)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-200 disabled:opacity-60"
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Notes (Optional)</label>
            <input
              disabled={!enabled}
              className={`${inputBase} ${!enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="Any note..."
              value={v.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
