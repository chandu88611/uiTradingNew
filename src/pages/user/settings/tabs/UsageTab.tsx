import React from "react";

import { Market, MarketSummary, PlanInstance, PlanPrefs } from "../types";
import { clsx } from "../utils";
import { soft, btn, btnGhost, btnPrimary, input } from "../style";
import { UsageRow } from "../UsageRow";

export function UsageTab({
  summary,
  accountsCountByMarket,
  planPrefs,
  setPlanPrefs,
  plansByMarket,
}: {
  summary: MarketSummary;
  accountsCountByMarket: Record<Market, number>;
  planPrefs: PlanPrefs;
  setPlanPrefs: (p: PlanPrefs) => void;
  plansByMarket: Record<Market, PlanInstance[]>;
}) {
  const renderMarket = (m: Market, title: string) => {
    const s = summary[m];
    const pref = planPrefs[m];
    const plans = plansByMarket[m] || [];

    const chosen =
      pref.mode === "SPECIFIC" && pref.planId ? plans.find((p) => p.planId === pref.planId) : null;

    const effective =
      pref.mode === "SPECIFIC" && chosen
        ? chosen.limits
        : {
            maxConnectedAccounts: s.maxConnectedAccounts,
            maxActiveStrategies: s.maxActiveStrategies,
            maxDailyTrades: s.maxDailyTrades,
            maxLotPerTrade: s.maxLotPerTrade,
          };

    return (
      <div className={clsx(soft, "p-5")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-100">{title}</div>
            <div className="text-xs text-slate-400 mt-1">Pick which plan to use if multiple exist.</div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              className={clsx(btn, pref.mode === "AUTO_MAX" ? btnPrimary : btnGhost)}
              onClick={() => setPlanPrefs({ ...planPrefs, [m]: { mode: "AUTO_MAX", planId: null } })}
              type="button"
            >
              Auto (MAX)
            </button>
            <button
              className={clsx(btn, pref.mode === "SPECIFIC" ? btnPrimary : btnGhost)}
              onClick={() =>
                setPlanPrefs({
                  ...planPrefs,
                  [m]: { mode: "SPECIFIC", planId: pref.planId ?? plans[0]?.planId ?? null },
                })
              }
              type="button"
            >
              Specific
            </button>
          </div>
        </div>

        {pref.mode === "SPECIFIC" ? (
          <div className="mt-3">
            <select
              className={input}
              value={pref.planId ?? ""}
              onChange={(e) => setPlanPrefs({ ...planPrefs, [m]: { mode: "SPECIFIC", planId: e.target.value } })}
              disabled={plans.length <= 1}
            >
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName}
                </option>
              ))}
            </select>
            {plans.length <= 1 ? <div className="text-[11px] text-slate-500 mt-1">Only one plan available.</div> : null}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <UsageRow label="Connected Accounts" used={accountsCountByMarket[m] ?? 0} max={effective.maxConnectedAccounts ?? null} />
          <UsageRow label="Max Active Strategies" used={null} max={effective.maxActiveStrategies ?? null} />
          <UsageRow label="Max Daily Trades" used={null} max={effective.maxDailyTrades ?? null} />
          <UsageRow label="Max Lot Per Trade" used={null} max={effective.maxLotPerTrade ?? null} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Plan Usage</h2>
        <p className="text-xs text-slate-400 mt-1">All inline. No redirects. Dummy usage except accounts count.</p>
      </div>

      {renderMarket("FOREX", "Forex")}
      {renderMarket("INDIA", "Indian Market")}
      {renderMarket("CRYPTO", "Crypto")}
      {renderMarket("COPY", "Copy Trading")}

      <div className="text-[11px] text-slate-500">
        Later: wire used counters from APIs (active strategies, daily trades, lot usage, etc).
      </div>
    </div>
  );
}
