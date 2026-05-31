import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  RefreshCw,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Target,
  Clock3,
} from "lucide-react";

import { Market, RiskSettings } from "./types";
import { clsx } from "./utils";
import {
  pageWrap,
  card,
  soft,
  btn,
  btnGhost,
  btnPrimary,
  input,
} from "./style";

import { Toggle } from "./Toggle";
import { Field } from "./Field";
import {
  useGetUserSettingsQuery,
  useUpdateTradeStatusMutation,
  useUpdateRiskLimitsMutation,
} from "../../../services/userApi";

function defaultRiskSettings(): RiskSettings {
  const guard = {
    enabled: true,
    pauseTrading: true,
    closePositions: false,
    notify: true,
    dailyMaxLoss: null,
    dailyProfitTarget: null,
    minGainPerDay: null,
  };

  return {
    masterPause: false,
    pauseUntil: null,
    pauseReason: "",
    executionMode: "EXECUTION",
    allowedMarkets: { FOREX: true, INDIA: true, CRYPTO: true, COPY: true },
    globalGuards: guard,

    maxTradesPerDay: null,
    maxOpenPositions: null,
    maxLotPerTrade: null,
    maxDrawdownPct: null,

    cooldownAfterLossMins: null,
    maxConsecutiveLosses: null,
    pauseAfterConsecutiveLossesMins: null,

    sessionEnabled: false,
    sessionDays: [1, 2, 3, 4, 5],
    sessionStart: "09:15",
    sessionEnd: "15:30",

    perMarketOverride: {
      FOREX: {
        enabled: false,
        guards: { ...guard },
        maxLotPerTrade: null,
        maxTradesPerDay: null,
      },
      INDIA: {
        enabled: false,
        guards: { ...guard },
        maxLotPerTrade: null,
        maxTradesPerDay: null,
      },
      CRYPTO: {
        enabled: false,
        guards: { ...guard },
        maxLotPerTrade: null,
        maxTradesPerDay: null,
      },
      COPY: {
        enabled: false,
        guards: { ...guard },
        maxLotPerTrade: null,
        maxTradesPerDay: null,
      },
    },

    alerts: {
      email: false,
      telegram: false,
      telegramBotToken: "",
      telegramChatId: "",
    },
  };
}

function mapApiToRisk(settings?: any): RiskSettings {
  const base = defaultRiskSettings();

  if (!settings) return base;

  const enabledMarkets = new Set<Market>();

  if (Array.isArray(settings?.accounts)) {
    settings.accounts.forEach((account: any) => {
      const market = account?.broker?.marketCategory as Market | undefined;
      if (market && ["FOREX", "INDIA", "CRYPTO", "COPY"].includes(market)) {
        enabledMarkets.add(market);
      }
    });
  }

  return {
    ...base,
    masterPause: !Boolean(settings?.trade?.allowTrade),
    allowedMarkets: {
      FOREX: enabledMarkets.size ? enabledMarkets.has("FOREX") : true,
      INDIA: enabledMarkets.size ? enabledMarkets.has("INDIA") : true,
      CRYPTO: enabledMarkets.size ? enabledMarkets.has("CRYPTO") : true,
      COPY: enabledMarkets.size ? enabledMarkets.has("COPY") : true,
    },
    globalGuards: {
      ...base.globalGuards,
      enabled: Boolean(settings?.riskLimits?.isEnabled),
      dailyMaxLoss:
        settings?.riskLimits?.dailyLossLimit != null
          ? Number(settings.riskLimits.dailyLossLimit)
          : null,
      dailyProfitTarget:
        settings?.riskLimits?.dailyProfitTarget != null
          ? Number(settings.riskLimits.dailyProfitTarget)
          : null,
      minGainPerDay:
        settings?.riskLimits?.dailyProfitTarget != null
          ? Number(settings.riskLimits.dailyProfitTarget)
          : null,
    },
    maxTradesPerDay:
      settings?.riskLimits?.maxTradesPerDay != null
        ? Number(settings.riskLimits.maxTradesPerDay)
        : null,
    cooldownAfterLossMins:
      settings?.riskLimits?.cooldownAfterLossMins != null
        ? Number(settings.riskLimits.cooldownAfterLossMins)
        : null,
  };
}

export default function SettingsHubPage() {
  const [risk, setRisk] = useState<RiskSettings>(defaultRiskSettings());

  const { data, isLoading, refetch } = useGetUserSettingsQuery();
  const [updateTradeStatus, { isLoading: tradeSaving }] =
    useUpdateTradeStatusMutation();
  const [updateRiskLimits, { isLoading: riskSaving }] =
    useUpdateRiskLimitsMutation();

  useEffect(() => {
    if (data?.data) {
      setRisk(mapApiToRisk(data.data));
    }
  }, [data]);

  const markets: Market[] = ["FOREX", "INDIA", "CRYPTO", "COPY"];

  const activeMarkets = useMemo(
    () => markets.filter((m) => risk.allowedMarkets?.[m]),
    [risk.allowedMarkets]
  );

  const modeLabel =
    risk.executionMode === "EXECUTION"
      ? "Live Trading"
      : risk.executionMode === "SIGNALS_ONLY"
      ? "Signals Only"
      : "Paper Mode";

  const overall = useMemo(() => {
    if (risk.masterPause) {
      return {
        tone: "amber" as const,
        text: "Trading Paused",
      };
    }

    if (activeMarkets.length === 0) {
      return {
        tone: "amber" as const,
        text: "No Active Markets",
      };
    }

    if (risk.executionMode === "EXECUTION") {
      return {
        tone: "emerald" as const,
        text: `${modeLabel} • ${activeMarkets.length} Market(s) Available`,
      };
    }

    return {
      tone: "slate" as const,
      text: `${modeLabel} • ${activeMarkets.length} Market(s) Available`,
    };
  }, [risk.masterPause, risk.executionMode, activeMarkets.length, modeLabel]);

  const setGuard = (patch: Partial<RiskSettings["globalGuards"]>) => {
    const next: RiskSettings = {
      ...risk,
      globalGuards: {
        ...risk.globalGuards,
        ...patch,
      },
    };

    if (patch.dailyProfitTarget !== undefined) {
      next.globalGuards.minGainPerDay = patch.dailyProfitTarget ?? null;
    }

    setRisk(next);
  };

  const resetAll = () => {
    if (data?.data) {
      setRisk(mapApiToRisk(data.data));
      toast.info("Settings reset to server values");
      return;
    }

    setRisk(defaultRiskSettings());
    toast.info("Settings reset");
  };

  const saveAll = async () => {
    try {
      await Promise.all([
        updateTradeStatus({
          allowTrade: !risk.masterPause,
        }).unwrap(),

        updateRiskLimits({
          isEnabled: risk.globalGuards.enabled,
          dailyLossLimit: risk.globalGuards.dailyMaxLoss ?? null,
          dailyProfitTarget: risk.globalGuards.dailyProfitTarget ?? null,
          maxTradesPerDay: risk.maxTradesPerDay ?? null,
          cooldownAfterLossMins: risk.cooldownAfterLossMins ?? null,
        }).unwrap(),
      ]);

      toast.success("Settings saved");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save settings");
    }
  };

  const saving = tradeSaving || riskSaving;

  return (
    <div className={pageWrap}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white md:text-2xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Minimal controls for trading and risk. Strategy settings stay in the
            plan page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className={clsx(btn, btnGhost, "rounded-full")}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span
          className={clsx(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
            overall.tone === "emerald"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : overall.tone === "amber"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : "border-white/10 bg-white/5 text-slate-200"
          )}
        >
          <ShieldCheck size={14} />
          {overall.text}
        </span>

        {activeMarkets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeMarkets.map((market) => (
              <span
                key={market}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300"
              >
                {market}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className={clsx(soft, "p-5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-semibold text-slate-100">
                  <PlayCircle size={18} />
                  Trading
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Simple execution control for the whole account.
                </div>
              </div>

              <span
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  risk.masterPause
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                )}
              >
                {risk.masterPause ? (
                  <PauseCircle size={14} />
                ) : (
                  <ShieldCheck size={14} />
                )}
                {risk.masterPause ? "Paused" : "Active"}
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              <Toggle
                checked={!risk.masterPause}
                onChange={(v) => setRisk({ ...risk, masterPause: !v })}
                label={!risk.masterPause ? "Trading Active" : "Trading Paused"}
                hint="Turn execution on or off instantly."
                danger={risk.masterPause}
              />

              <Field label="Pause until (optional)">
                <input
                  className={input}
                  type="datetime-local"
                  value={risk.pauseUntil ?? ""}
                  onChange={(e) =>
                    setRisk({
                      ...risk,
                      pauseUntil: e.target.value || null,
                    })
                  }
                />
              </Field>

              <Field label="Mode">
                <select
                  className={input}
                  value={risk.executionMode}
                  onChange={(e) =>
                    setRisk({
                      ...risk,
                      executionMode:
                        e.target.value as RiskSettings["executionMode"],
                    })
                  }
                >
                  <option value="EXECUTION">Live Trading</option>
                  <option value="SIGNALS_ONLY">Signals Only</option>
                  <option value="PAPER">Paper Mode</option>
                </select>
              </Field>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-slate-100">Note</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  Trading active or paused is connected to backend. Pause until
                  and Mode are currently UI-only unless backend gives separate
                  APIs for them.
                </div>
              </div>
            </div>
          </div>

          <div className={clsx(soft, "p-5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-semibold text-slate-100">
                  <Target size={18} />
                  Risk
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Only the useful guardrails traders actually need daily.
                </div>
              </div>

              <span
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  risk.globalGuards.enabled
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-200"
                )}
              >
                <ShieldCheck size={14} />
                {risk.globalGuards.enabled ? "Risk ON" : "Risk OFF"}
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              <Toggle
                checked={risk.globalGuards.enabled}
                onChange={(v) => setGuard({ enabled: v })}
                label="Enable risk limits"
                hint="Use daily stop rules and session timing."
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Daily loss limit">
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={risk.globalGuards.dailyMaxLoss ?? ""}
                    onChange={(e) =>
                      setGuard({
                        dailyMaxLoss: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 2000"
                  />
                </Field>

                <Field label="Daily profit target">
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={risk.globalGuards.dailyProfitTarget ?? ""}
                    onChange={(e) =>
                      setGuard({
                        dailyProfitTarget: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 1500"
                  />
                </Field>

                <Field label="Max trades per day">
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={risk.maxTradesPerDay ?? ""}
                    onChange={(e) =>
                      setRisk({
                        ...risk,
                        maxTradesPerDay: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 10"
                  />
                </Field>

                <Field label="Cooldown after loss (mins)">
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={risk.cooldownAfterLossMins ?? ""}
                    onChange={(e) =>
                      setRisk({
                        ...risk,
                        cooldownAfterLossMins: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 15"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <Clock3 size={16} />
                      Trading Session
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Restrict execution to a fixed time window.
                    </div>
                  </div>

                  <Toggle
                    checked={risk.sessionEnabled}
                    onChange={(v) => setRisk({ ...risk, sessionEnabled: v })}
                    label={risk.sessionEnabled ? "Enabled" : "Disabled"}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Start time">
                    <input
                      className={input}
                      type="time"
                      value={risk.sessionStart ?? ""}
                      disabled={!risk.sessionEnabled}
                      onChange={(e) =>
                        setRisk({
                          ...risk,
                          sessionStart: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="End time">
                    <input
                      className={input}
                      type="time"
                      value={risk.sessionEnd ?? ""}
                      disabled={!risk.sessionEnabled}
                      onChange={(e) =>
                        setRisk({
                          ...risk,
                          sessionEnd: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button className={clsx(btn, btnGhost)} type="button" onClick={resetAll}>
            Reset
          </button>
          <button
            className={clsx(btn, btnPrimary)}
            type="button"
            onClick={saveAll}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}