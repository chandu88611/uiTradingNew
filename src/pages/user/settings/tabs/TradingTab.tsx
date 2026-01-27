import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Bitcoin, Building2, CandlestickChart, Copy, Check, ArrowRight } from "lucide-react";

import { Market, MarketSummary, PlanInstance, PlanPref, DummyAccount } from "../types";
import { clsx } from "../utils";
import { soft, btn, btnGhost, btnPrimary, btnDanger, input } from "../style";
import { MarketCard } from "../MarketCard";
import { Modal } from "../Modal";
import { StatusPill } from "../StatusPill";
import { UsageRow } from "../UsageRow";

export function TradingTab({
  summary,
  plansByMarket,
  planPrefs,
  setPlanPrefs,
  locked,
  accounts,
}: {
  summary: MarketSummary;
  plansByMarket: Record<Market, PlanInstance[]>;
  planPrefs: Record<Market, PlanPref>;
  setPlanPrefs: (v: Record<Market, PlanPref>) => void;
  locked: (m: Market) => boolean;
  accounts: DummyAccount[];
}) {
  const [activeMarket, setActiveMarket] = useState<Market | null>(null);

  const openMarket = (m: Market) => {
    if (locked(m)) return;
    setActiveMarket(m);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Trading Accounts</h2>
        <p className="text-xs text-slate-400 mt-1">
          Inline management only: choose plan-per-market + manage accounts in the same page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MarketCard
          title="Forex"
          subtitle="MT5 / cTrader accounts • execution + signals"
          icon={<CandlestickChart size={18} />}
          accent="emerald"
          info={summary.FOREX}
          locked={locked("FOREX")}
          onOpen={() => openMarket("FOREX")}
        />
        <MarketCard
          title="Indian Market"
          subtitle="Broker accounts • NSE/BSE execution"
          icon={<Building2 size={18} />}
          accent="indigo"
          info={summary.INDIA}
          locked={locked("INDIA")}
          onOpen={() => openMarket("INDIA")}
        />
        <MarketCard
          title="Crypto"
          subtitle="Exchange API keys • spot/futures execution"
          icon={<Bitcoin size={18} />}
          accent="yellow"
          info={summary.CRYPTO}
          locked={locked("CRYPTO")}
          onOpen={() => openMarket("CRYPTO")}
        />
        <MarketCard
          title="Copy Trading"
          subtitle="Master/Child mapping • copy rows"
          icon={<Copy size={18} />}
          accent="violet"
          info={summary.COPY}
          locked={locked("COPY")}
          onOpen={() => openMarket("COPY")}
        />
      </div>

      <Modal
        open={Boolean(activeMarket)}
        title={activeMarket ? `${activeMarket} • Manage` : "Manage"}
        onClose={() => setActiveMarket(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className={clsx(btn, btnGhost)} onClick={() => setActiveMarket(null)}>
              Close
            </button>
            <button
              className={clsx(btn, btnPrimary)}
              onClick={() => {
                toast.success("Saved (dummy)");
                setActiveMarket(null);
              }}
            >
              <Check size={16} /> Save
            </button>
          </div>
        }
      >
        {activeMarket ? (
          <MarketInlineManager
            market={activeMarket}
            summary={summary[activeMarket]}
            plans={plansByMarket[activeMarket] ?? []}
            pref={planPrefs[activeMarket]}
            onChangePref={(next) => setPlanPrefs({ ...planPrefs, [activeMarket]: next })}
            accounts={accounts.filter((a) => a.market === activeMarket)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function MarketInlineManager({
  market,
  summary,
  plans,
  pref,
  onChangePref,
  accounts,
}: {
  market: Market;
  summary: any;
  plans: PlanInstance[];
  pref: PlanPref;
  onChangePref: (p: PlanPref) => void;
  accounts: DummyAccount[];
}) {
  const planMode = pref?.mode ?? "AUTO_MAX";
  const selectedPlanId = pref?.planId ?? null;

  const chosen = useMemo(() => {
    if (planMode !== "SPECIFIC" || !selectedPlanId) return null;
    return plans.find((p) => p.planId === selectedPlanId) ?? null;
  }, [planMode, selectedPlanId, plans]);

  const effective = useMemo(() => {
    if (planMode === "SPECIFIC" && chosen) {
      return {
        executionAllowed: chosen.executionAllowed,
        ...chosen.limits,
      };
    }
    return {
      executionAllowed: summary.executionAllowed,
      maxConnectedAccounts: summary.maxConnectedAccounts,
      maxActiveStrategies: summary.maxActiveStrategies,
      maxDailyTrades: summary.maxDailyTrades,
      maxLotPerTrade: summary.maxLotPerTrade,
    };
  }, [planMode, chosen, summary]);

  return (
    <div className="space-y-5">
      <div className={clsx(soft, "p-5")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-100">Plan selection</div>
            <div className="text-xs text-slate-400 mt-1">
              If user has multiple plans, choose one for the engine to use.
            </div>
          </div>
          <StatusPill tone={effective.executionAllowed ? "emerald" : "slate"} text={effective.executionAllowed ? "Exec ON" : "Exec OFF"} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button
            className={clsx(btn, planMode === "AUTO_MAX" ? btnPrimary : btnGhost)}
            onClick={() => onChangePref({ mode: "AUTO_MAX", planId: null })}
            type="button"
          >
            Auto (MAX across plans)
          </button>
          <button
            className={clsx(btn, planMode === "SPECIFIC" ? btnPrimary : btnGhost)}
            onClick={() => onChangePref({ mode: "SPECIFIC", planId: selectedPlanId ?? plans[0]?.planId ?? null })}
            type="button"
          >
            Use specific plan
          </button>
        </div>

        {planMode === "SPECIFIC" ? (
          <div className="mt-4">
            <div className="text-xs text-slate-400">Select plan</div>
            <select
              className={input}
              value={selectedPlanId ?? ""}
              onChange={(e) => onChangePref({ mode: "SPECIFIC", planId: e.target.value })}
            >
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="text-base font-semibold text-slate-100">Limits + usage</div>
        <div className="text-xs text-slate-400 mt-1">Usage is dummy for now (accounts count is real).</div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <UsageRow label="Connected Accounts" used={accounts.length} max={effective.maxConnectedAccounts ?? null} />
          <UsageRow label="Max Active Strategies" used={null} max={effective.maxActiveStrategies ?? null} />
          <UsageRow label="Max Daily Trades" used={null} max={effective.maxDailyTrades ?? null} />
          <UsageRow label="Max Lot Per Trade" used={null} max={effective.maxLotPerTrade ?? null} />
        </div>
      </div>

      <div className={clsx(soft, "p-5")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-semibold text-slate-100">Accounts</div>
            <div className="text-xs text-slate-400 mt-1">Inline list (dummy actions).</div>
          </div>
          <button className={clsx(btn, btnGhost)} onClick={() => toast.info("Open your add-account modal later")} type="button">
            Add account <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {accounts.length === 0 ? (
            <div className="text-xs text-slate-500 rounded-xl border border-white/10 bg-white/5 p-4">
              No accounts connected in this market.
            </div>
          ) : (
            accounts.map((a) => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{a.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Provider: {a.provider} • Login: {a.login ?? "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={clsx(btn, btnGhost, "px-3 py-2")} type="button" onClick={() => toast.info("Edit (dummy)")}>
                    Edit
                  </button>
                  <button className={clsx(btn, btnDanger, "px-3 py-2")} type="button" onClick={() => toast.info("Delete (dummy)")}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
