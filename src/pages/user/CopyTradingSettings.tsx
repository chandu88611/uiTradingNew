import React, { useMemo } from "react";
import { Plus, Trash2, ShieldCheck, Settings2 } from "lucide-react";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

function clsx(...parts: Array<string | false  | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid() {
  // browser-safe id
  // @ts-ignore
  if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

type CopyMarket = "FOREX" | "INDIA";
type ForexPlatform = "MT5" | "CTRADER";

export type CopyTradingSettingsValue = {
  enabled?: boolean; // global enable/disable
  market?: CopyMarket;

  forex?: {
    platform?: ForexPlatform;
    accounts?: Array<{
      id: string;
      label?: string;
      enabled?: boolean;

      // MT5
      mt5Login?: string;
      mt5Password?: string;
      mt5Server?: string;

      // cTrader (adjust fields as per your backend)
      ctraderAccountId?: string;
      ctraderAccessToken?: string;
      ctraderClientId?: string;
    }>;
  };

  india?: {
    broker?: string; // optional (Zerodha/Angel/Upstox...)
    accounts?: Array<{
      id: string;
      label?: string;
      enabled?: boolean;

      clientId?: string;
      token?: string;
    }>;
  };
};

export default function CopyTradingSettings({
  value,
  onChange,
}: {
  value?: CopyTradingSettingsValue;
  onChange: (next: CopyTradingSettingsValue) => void;
}) {
  const v = useMemo<CopyTradingSettingsValue>(() => {
    const base = value ?? {};
    return {
      enabled: Boolean(base.enabled),
      market: (base.market ?? "FOREX") as CopyMarket,
      forex: {
        platform: (base.forex?.platform ?? "MT5") as ForexPlatform,
        accounts: base.forex?.accounts ?? [],
      },
      india: {
        broker: base.india?.broker ?? "ZERODHA",
        accounts: base.india?.accounts ?? [],
      },
    };
  }, [value]);

  const set = (patch: Partial<CopyTradingSettingsValue>) => onChange({ ...v, ...patch });

  const setForex = (patch: Partial<NonNullable<CopyTradingSettingsValue["forex"]>>) =>
    set({ forex: { ...(v.forex ?? {}), ...patch } });

  const setIndia = (patch: Partial<NonNullable<CopyTradingSettingsValue["india"]>>) =>
    set({ india: { ...(v.india ?? {}), ...patch } });

  const setForexAccount = (id: string, patch: any) => {
    const next = (v.forex?.accounts ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a));
    setForex({ accounts: next });
  };

  const setIndiaAccount = (id: string, patch: any) => {
    const next = (v.india?.accounts ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a));
    setIndia({ accounts: next });
  };

  const removeForexAccount = (id: string) =>
    setForex({ accounts: (v.forex?.accounts ?? []).filter((a) => a.id !== id) });

  const removeIndiaAccount = (id: string) =>
    setIndia({ accounts: (v.india?.accounts ?? []).filter((a) => a.id !== id) });

  const addForexAccount = () => {
    const next = [...(v.forex?.accounts ?? []), { id: uid(), enabled: true, label: "" }];
    setForex({ accounts: next });
  };

  const addIndiaAccount = () => {
    const next = [...(v.india?.accounts ?? []), { id: uid(), enabled: true, label: "" }];
    setIndia({ accounts: next });
  };

  const disabledAll = !v.enabled;

  return (
    <div className="space-y-6">
      {/* Global Toggle */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              Copy Trading
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Enable/disable copy trading and manage accounts by market.
            </p>
          </div>

          <button
            type="button"
            onClick={() => set({ enabled: !v.enabled })}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition",
              v.enabled
                ? "bg-emerald-500 text-slate-950 border-emerald-500 hover:bg-emerald-400"
                : "bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500"
            )}
          >
            <Settings2 size={16} />
            {v.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Market Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => set({ market: "FOREX" })}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
            v.market === "FOREX"
              ? "bg-slate-100 text-slate-950 border-slate-100"
              : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
          )}
        >
          FOREX
        </button>

        <button
          type="button"
          onClick={() => set({ market: "INDIA" })}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
            v.market === "INDIA"
              ? "bg-slate-100 text-slate-950 border-slate-100"
              : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
          )}
        >
          INDIAN MARKET
        </button>
      </div>

      {/* FOREX */}
      {v.market === "FOREX" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Forex Copy Trading Accounts</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose platform and add accounts (MT5 or cTrader).
              </p>
            </div>

            <button
              type="button"
              onClick={addForexAccount}
              disabled={disabledAll}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Account
            </button>
          </div>

          {/* Platform */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabledAll}
              onClick={() => setForex({ platform: "MT5" })}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
                v.forex?.platform === "MT5"
                  ? "bg-slate-100 text-slate-950 border-slate-100"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500",
                disabledAll && "opacity-60 cursor-not-allowed"
              )}
            >
              MT5
            </button>

            <button
              type="button"
              disabled={disabledAll}
              onClick={() => setForex({ platform: "CTRADER" })}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
                v.forex?.platform === "CTRADER"
                  ? "bg-slate-100 text-slate-950 border-slate-100"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500",
                disabledAll && "opacity-60 cursor-not-allowed"
              )}
            >
              cTrader
            </button>
          </div>

          {/* Accounts List */}
          {(v.forex?.accounts ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No accounts added yet.</p>
          ) : (
            <div className="space-y-3">
              {(v.forex?.accounts ?? []).map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={disabledAll}
                        onClick={() => setForexAccount(a.id, { enabled: !a.enabled })}
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold border",
                          a.enabled
                            ? "bg-emerald-500 text-slate-950 border-emerald-500"
                            : "bg-slate-900 text-slate-300 border-slate-700",
                          disabledAll && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {a.enabled ? "Enabled" : "Disabled"}
                      </button>

                      <span className="text-xs text-slate-400">
                        {v.forex?.platform === "MT5" ? "MT5 Account" : "cTrader Account"}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={disabledAll}
                      onClick={() => removeForexAccount(a.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-300">
                        Label (Optional)
                      </label>
                      <input
                        disabled={disabledAll}
                        value={a.label ?? ""}
                        onChange={(e) => setForexAccount(a.id, { label: e.target.value })}
                        className={clsx(inputBase, disabledAll && "opacity-60")}
                        placeholder="My ICMarkets #1"
                      />
                    </div>

                    {v.forex?.platform === "MT5" ? (
                      <>
                        <div>
                          <label className="text-xs font-medium text-slate-300">
                            MT5 Login
                          </label>
                          <input
                            disabled={disabledAll}
                            value={a.mt5Login ?? ""}
                            onChange={(e) => setForexAccount(a.id, { mt5Login: e.target.value })}
                            className={clsx(inputBase, disabledAll && "opacity-60")}
                            placeholder="12345678"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300">
                            MT5 Password
                          </label>
                          <input
                            disabled={disabledAll}
                            type="password"
                            value={a.mt5Password ?? ""}
                            onChange={(e) =>
                              setForexAccount(a.id, { mt5Password: e.target.value })
                            }
                            className={clsx(inputBase, disabledAll && "opacity-60")}
                            placeholder="••••••••"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300">
                            MT5 Server
                          </label>
                          <input
                            disabled={disabledAll}
                            value={a.mt5Server ?? ""}
                            onChange={(e) => setForexAccount(a.id, { mt5Server: e.target.value })}
                            className={clsx(inputBase, disabledAll && "opacity-60")}
                            placeholder="ICMarketsSC-Live"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-medium text-slate-300">
                            cTrader Account ID
                          </label>
                          <input
                            disabled={disabledAll}
                            value={a.ctraderAccountId ?? ""}
                            onChange={(e) =>
                              setForexAccount(a.id, { ctraderAccountId: e.target.value })
                            }
                            className={clsx(inputBase, disabledAll && "opacity-60")}
                            placeholder="10987654"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300">
                            cTrader Access Token
                          </label>
                          <input
                            disabled={disabledAll}
                            type="password"
                            value={a.ctraderAccessToken ?? ""}
                            onChange={(e) =>
                              setForexAccount(a.id, { ctraderAccessToken: e.target.value })
                            }
                            className={clsx(inputBase, disabledAll && "opacity-60")}
                            placeholder="••••••••"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300">
                            cTrader Client ID (Optional)
                          </label>
                          <input
                            disabled={disabledAll}
                            value={a.ctraderClientId ?? ""}
                            onChange={(e) =>
                              setForexAccount(a.id, { ctraderClientId: e.target.value })
                            }
                            className={clsx(inputBase, disabledAll && "opacity-60")}
                            placeholder="your-client-id"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            Note: Store secrets securely on backend (encrypt at rest). UI only collects inputs.
          </p>
        </div>
      )}

      {/* INDIA */}
      {v.market === "INDIA" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Indian Market Accounts</p>
              <p className="text-xs text-slate-400 mt-1">
                Add token per account. You can add / update / delete accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={addIndiaAccount}
              disabled={disabledAll}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Account
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Broker</label>
              <select
                disabled={disabledAll}
                value={v.india?.broker ?? "ZERODHA"}
                onChange={(e) => setIndia({ broker: e.target.value })}
                className={clsx(inputBase, "!mt-1", disabledAll && "opacity-60")}
              >
                <option value="ZERODHA">Zerodha</option>
                <option value="ANGEL">Angel One</option>
                <option value="UPSTOX">Upstox</option>
                <option value="FYERS">Fyers</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {(v.india?.accounts ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No accounts added yet.</p>
          ) : (
            <div className="space-y-3">
              {(v.india?.accounts ?? []).map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={disabledAll}
                        onClick={() => setIndiaAccount(a.id, { enabled: !a.enabled })}
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold border",
                          a.enabled
                            ? "bg-emerald-500 text-slate-950 border-emerald-500"
                            : "bg-slate-900 text-slate-300 border-slate-700",
                          disabledAll && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {a.enabled ? "Enabled" : "Disabled"}
                      </button>

                      <span className="text-xs text-slate-400">Account</span>
                    </div>

                    <button
                      type="button"
                      disabled={disabledAll}
                      onClick={() => removeIndiaAccount(a.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-300">
                        Label (Optional)
                      </label>
                      <input
                        disabled={disabledAll}
                        value={a.label ?? ""}
                        onChange={(e) => setIndiaAccount(a.id, { label: e.target.value })}
                        className={clsx(inputBase, disabledAll && "opacity-60")}
                        placeholder="My Zerodha #1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Client ID</label>
                      <input
                        disabled={disabledAll}
                        value={a.clientId ?? ""}
                        onChange={(e) => setIndiaAccount(a.id, { clientId: e.target.value })}
                        className={clsx(inputBase, disabledAll && "opacity-60")}
                        placeholder="AB1234"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-300">
                        Access Token
                      </label>
                      <input
                        disabled={disabledAll}
                        type="password"
                        value={a.token ?? ""}
                        onChange={(e) => setIndiaAccount(a.id, { token: e.target.value })}
                        className={clsx(inputBase, disabledAll && "opacity-60")}
                        placeholder="••••••••"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Token should be stored securely and refreshed as per broker rules.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
