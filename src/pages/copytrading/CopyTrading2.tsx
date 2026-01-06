import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Users, Zap, Layers } from "lucide-react";

import { useListMyTradingAccountsQuery, TradingAccount } from "../../services/tradingAccounts.api";
import { useGetMyForexTraderDetailsQuery } from "../../services/forexTraderUserDetails.api";
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";


import ForexCopyMarket from "./ForexCopyMarket";
import IndiaCopyMarket from "./IndiaCopyMarket";
import CopyTradingExecutionPanel from "../user/CopyTradingExecutionPanel";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Market = "FOREX" | "INDIA";
type TabKey = "ACCOUNTS" | "EXECUTION";
type AccountsView = "ALL" | "FOREX" | "INDIA";

const shell = "min-h-screen bg-[#050810] text-slate-50";
const wrap = "mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8";

const cardBase =
  "rounded-3xl border border-white/8 bg-[#070b16] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.45)]";

const softCard = "rounded-3xl border border-white/10 bg-white/5 p-4";

function deriveEnabledMarkets(subRes: any): Market[] {
  const data = subRes?.data ?? subRes ?? null;
  const plan = data?.plan ?? null;

  if (!data || !plan) return [];
  if (data.executionEnabled === false) return [];

  const direct = data.enabledMarkets || plan.enabledMarkets || plan?.metadata?.enabledMarkets;
  if (Array.isArray(direct)) {
    const m = direct
      .map((x: any) => String(x).toUpperCase())
      .filter((x: string) => x === "FOREX" || x === "INDIA") as Market[];
    if (m.length) return Array.from(new Set(m));
  }

  const cat = String(plan.category ?? "").toUpperCase();
  if (cat === "FOREX") return ["FOREX"];
  if (cat === "INDIA") return ["INDIA"];
  if (cat === "BOTH") return ["FOREX", "INDIA"];

  const desc = String(plan.description ?? "").toLowerCase();
  const hasIndia = desc.includes("india") || desc.includes("nse") || desc.includes("bse");
  const hasForex = desc.includes("forex") || desc.includes("mt5") || desc.includes("ctrader");

  if (hasIndia && hasForex) return ["FOREX", "INDIA"];
  if (hasForex) return ["FOREX"];
  if (hasIndia) return ["INDIA"];
  return [];
}

export default function CopyControlCenter() {
  /**
   * ✅ PREVIEW FLAG
   * You want to see both INDIA + FOREX UI even if plan does not include.
   */
  const FORCE_SHOW_BOTH_MARKETS_FOR_UI = true;

  const {
    data: subRes,
    isLoading: planLoading,
    isFetching: planFetching,
    refetch: refetchPlan,
  } = useGetMyCurrentSubscriptionQuery();

  const enabledMarkets = useMemo(() => deriveEnabledMarkets(subRes), [subRes]);
  const entitledForex = enabledMarkets.includes("FOREX");
  const entitledIndia = enabledMarkets.includes("INDIA");

  const canForex = FORCE_SHOW_BOTH_MARKETS_FOR_UI || entitledForex;
  const canIndia = FORCE_SHOW_BOTH_MARKETS_FOR_UI || entitledIndia;

  const [tab, setTab] = useState<TabKey>("ACCOUNTS");

  // Accounts view: All / Forex / India
  const [accountsView, setAccountsView] = useState<AccountsView>("ALL");
  useEffect(() => {
    if (!canForex && canIndia) setAccountsView("INDIA");
    if (!canIndia && canForex) setAccountsView("FOREX");
  }, [canForex, canIndia]);

  // Execution market selection
  const [execMarket, setExecMarket] = useState<Market>("FOREX");
  useEffect(() => {
    if (execMarket === "FOREX" && !canForex && canIndia) setExecMarket("INDIA");
    if (execMarket === "INDIA" && !canIndia && canForex) setExecMarket("FOREX");
  }, [canForex, canIndia, execMarket]);

  // INDIA accounts
  const {
    data: indiaAccountsRaw = [],
    isLoading: indiaLoading,
    isFetching: indiaFetching,
    refetch: refetchIndia,
  } = useListMyTradingAccountsQuery(undefined, { skip: !canIndia });

  const indiaAccounts = useMemo(() => {
    const list = (indiaAccountsRaw || []) as any[];
    return list.filter((a: any) => String(a.market || "INDIA").toUpperCase() === "INDIA");
  }, [indiaAccountsRaw]);

  // FOREX rows
  const {
    data: forexDetailsRes,
    isLoading: fxLoading,
    isFetching: fxFetching,
    refetch: refetchFx,
  } = useGetMyForexTraderDetailsQuery(undefined, { skip: !canForex });

  const forexRows = useMemo(() => {
    const raw = (forexDetailsRes as any)?.data ?? forexDetailsRes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [forexDetailsRes]);

  // Accounts for execution panel
  const accountsForExecution = useMemo(() => {
    const out: Array<{
      id: string;
      market: Market;
      brokerType: string;
      label: string;
      isMaster?: boolean;
      meta?: any;
    }> = [];

    if (canForex) {
      out.push(
        ...forexRows.map((r: any) => ({
          id: String(r.id),
          market: "FOREX" as const,
          brokerType: String(r.forexType || "MT5").toUpperCase(),
          label: `${String(r.forexType || "MT5").toUpperCase()} • ${String(
            r.forexTraderUserId || r.loginId || ""
          )}`,
          isMaster: !!r.isMaster,
          meta: r,
        }))
      );
    }

    if (canIndia) {
      out.push(
        ...(indiaAccounts as TradingAccount[]).map((a: any) => ({
          id: String(a.id),
          market: "INDIA" as const,
          brokerType: String(a.broker || "BROKER").toUpperCase(),
          label:
            a.label ||
            a.accountLabel ||
            `${String(a.broker || "Broker")} • ${String(a.externalAccountId || a.id)}`,
          isMaster: false,
          meta: a,
        }))
      );
    }

    return out;
  }, [canForex, canIndia, forexRows, indiaAccounts]);

  const onRefreshAll = () => {
    refetchPlan();
    if (canForex) refetchFx();
    if (canIndia) refetchIndia();
  };

  const syncing = planLoading || planFetching || fxLoading || fxFetching || indiaLoading || indiaFetching;

  const showNoAccessReal =
    !FORCE_SHOW_BOTH_MARKETS_FOR_UI && !planLoading && !planFetching && enabledMarkets.length === 0;

  return (
    <div className={shell}>
      <div className={wrap}>
        {/* HEADER */}
        <div className="flex flex-col gap-3 border-b border-white/5 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-400/80">Copy Engine</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Copy Trading Control Center
            </h1>
            <p className="mt-2 max-w-2xl text-xs text-slate-400">
              <span className="text-slate-200 font-medium">Accounts</span> = manage all copy accounts (Forex + India).
              <br />
              <span className="text-slate-200 font-medium">Execution</span> = place trades / strategy linking.
              <br />
              <span className="text-slate-300">Note: UI does not send MT5 server/password. MT5 uses Login ID only.</span>
            </p>

            {FORCE_SHOW_BOTH_MARKETS_FOR_UI && (!entitledForex || !entitledIndia) && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                <span className="font-semibold text-emerald-300">Preview Mode</span>
                <span className="text-slate-400">Showing FOREX + INDIA UI even if plan doesn&apos;t include them.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onRefreshAll}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 text-xs hover:bg-slate-700"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 p-1">
            <TabPill
              active={tab === "ACCOUNTS"}
              onClick={() => setTab("ACCOUNTS")}
              icon={<Users size={16} />}
            >
              Accounts
            </TabPill>
            <TabPill
              active={tab === "EXECUTION"}
              onClick={() => setTab("EXECUTION")}
              icon={<Zap size={16} />}
            >
              Execution
            </TabPill>
          </div>

          {/* Accounts view switch (NOT side-by-side) */}
          {tab === "ACCOUNTS" && (
            <div className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 p-1">
              <SmallPill
                active={accountsView === "ALL"}
                onClick={() => setAccountsView("ALL")}
                icon={<Layers size={14} />}
              >
                All
              </SmallPill>
              <SmallPill
                active={accountsView === "FOREX"}
                onClick={() => setAccountsView("FOREX")}
                disabled={!canForex}
              >
                Forex
              </SmallPill>
              <SmallPill
                active={accountsView === "INDIA"}
                onClick={() => setAccountsView("INDIA")}
                disabled={!canIndia}
              >
                India
              </SmallPill>
            </div>
          )}

          {/* Execution market switch */}
          {tab === "EXECUTION" && (
            <div className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 p-1">
              <SmallPill active={execMarket === "FOREX"} onClick={() => setExecMarket("FOREX")} disabled={!canForex}>
                Forex
              </SmallPill>
              <SmallPill active={execMarket === "INDIA"} onClick={() => setExecMarket("INDIA")} disabled={!canIndia}>
                India
              </SmallPill>
            </div>
          )}
        </div>

        {showNoAccessReal ? (
          <div className="mt-5 rounded-3xl border border-white/8 bg-[#070b16] p-5 text-sm text-slate-300">
            Your current plan does not include execution access (FOREX/INDIA).
          </div>
        ) : (
          <>
            {/* ACCOUNTS TAB (STACKED, NOT SIDE-BY-SIDE) */}
            {tab === "ACCOUNTS" && (
              <div className="mt-5 space-y-6">
                {accountsView === "ALL" && (
                  <>
                    <div className={cardBase}>
                      <SectionHeader
                        title="Forex Accounts"
                        subtitle="Add Master/Child rows. Master is decided by isMaster."
                        right={<Badge tone={entitledForex ? "good" : "warn"}>{entitledForex ? "Plan enabled" : "Not in plan"}</Badge>}
                      />
                      <div className="mt-4">
                        <ForexCopyMarket
                          canForex={canForex}
                          rows={forexRows}
                          loading={fxLoading}
                          fetching={fxFetching}
                          refetch={() => refetchFx()}
                        />
                      </div>
                    </div>

                    <div className={cardBase}>
                      <SectionHeader
                        title="India Accounts"
                        subtitle="Add broker accounts and request access tokens from users."
                        right={<Badge tone={entitledIndia ? "good" : "warn"}>{entitledIndia ? "Plan enabled" : "Not in plan"}</Badge>}
                      />
                      <div className="mt-4">
                        <IndiaCopyMarket
                          canIndia={canIndia}
                          accounts={indiaAccounts as any}
                          loading={indiaLoading}
                          fetching={indiaFetching}
                          refetch={() => refetchIndia()}
                        />
                      </div>
                    </div>
                  </>
                )}

                {accountsView === "FOREX" && (
                  <div className={cardBase}>
                    <SectionHeader
                      title="Forex Accounts"
                      subtitle="Add Master/Child rows. Master is decided by isMaster."
                      right={<Badge tone={entitledForex ? "good" : "warn"}>{entitledForex ? "Plan enabled" : "Not in plan"}</Badge>}
                    />
                    <div className="mt-4">
                      <ForexCopyMarket
                        canForex={canForex}
                        rows={forexRows}
                        loading={fxLoading}
                        fetching={fxFetching}
                        refetch={() => refetchFx()}
                      />
                    </div>
                  </div>
                )}

                {accountsView === "INDIA" && (
                  <div className={cardBase}>
                    <SectionHeader
                      title="India Accounts"
                      subtitle="Add broker accounts and request access tokens from users."
                      right={<Badge tone={entitledIndia ? "good" : "warn"}>{entitledIndia ? "Plan enabled" : "Not in plan"}</Badge>}
                    />
                    <div className="mt-4">
                      <IndiaCopyMarket
                        canIndia={canIndia}
                        accounts={indiaAccounts as any}
                        loading={indiaLoading}
                        fetching={indiaFetching}
                        refetch={() => refetchIndia()}
                      />
                    </div>
                  </div>
                )}

                <div className={softCard}>
                  <div className="text-sm font-semibold text-slate-100">Why this layout?</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Accounts management stays clean and full-width. Execution is separated into its own tab, so trade forms
                    never mix with onboarding.
                  </div>
                </div>
              </div>
            )}

            {/* EXECUTION TAB */}
            {tab === "EXECUTION" && (
              <div className="mt-5">
                <div className={cardBase}>
                  <SectionHeader
                    title="Execution"
                    subtitle="Manual trades & strategy linking. Backend fans out to selected accounts."
                    right={<Badge tone={accountsForExecution.length ? "good" : "warn"}>{accountsForExecution.length} accounts</Badge>}
                  />
                  <div className="mt-4">
                    <CopyTradingExecutionPanel
                      enabledMarkets={FORCE_SHOW_BOTH_MARKETS_FOR_UI ? (["FOREX", "INDIA"] as Market[]) : enabledMarkets}
                      accounts={accountsForExecution}
                      initialMarket={execMarket}
                      showTradingViewWidget
                      toTradingViewSymbol={({ market, symbol, meta }: any) => {
                        const full = meta?.full_name;
                        if (full && typeof full === "string" && full.includes(":")) return full;
                        if (symbol.includes(":")) return symbol;
                        if (market === "INDIA") return `NSE:${symbol.toUpperCase()}`;
                        return `FX:${symbol.replace("/", "").toUpperCase()}`;
                      }}
                    />
                  </div>
                  <div className="mt-4 text-[11px] text-slate-500">
                    Execution sends <span className="text-slate-200 font-semibold">one request</span> and backend fans out.
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {syncing && <div className="mt-4 text-[11px] text-slate-500">Syncing…</div>}
      </div>
    </div>
  );
}

/* ---------------- UI Bits ---------------- */

const TabPill: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
      active ? "bg-emerald-500 text-black" : "bg-transparent text-slate-300 hover:bg-slate-800/60"
    )}
  >
    {icon}
    {children}
  </button>
);

const SmallPill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ active, onClick, children, icon, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition",
      disabled && "opacity-50 cursor-not-allowed",
      active ? "bg-white/15 text-white" : "bg-transparent text-slate-300 hover:bg-white/10"
    )}
  >
    {icon ? icon : null}
    {children}
  </button>
);

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
      </div>
      {right ? <div className="mt-0.5">{right}</div> : null}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "good" | "warn" }) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        tone === "good"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
      )}
    >
      {children}
    </div>
  );
}
