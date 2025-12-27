import React, { useMemo, useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

import {
  useListMyTradingAccountsQuery,
  useVerifyTradingAccountMutation,
  useDeleteTradingAccountMutation,
  useCreateTradingAccountMutation,
  MarketCategory,
  TradingAccount,
} from "../../services/tradingAccounts.api";

import { useGetMyForexTraderDetailsQuery } from "../../services/forexTraderUserDetails.api";
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

import CopyTradingSettings from "../user/CopyTradingSettings";
import CopyTradingExecutionPanel from "../user/CopyTradingExecutionPanel";

/* ------------------------ utils ------------------------ */

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Mode = "FOREX" | "INDIA";

const cardBase =
  "rounded-2xl border border-white/8 bg-[#070b16] p-4 shadow-lg shadow-emerald-500/5";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

/**
 * ✅ Determines which markets to show based on subscription.
 * Priority:
 * 1) backend enabledMarkets (future-proof)
 * 2) planCode/description inference (your plan description often says "India + Forex")
 * 3) plan.category as last fallback
 */
function deriveEnabledMarkets(subRes: any): Mode[] {
  const data = subRes?.data ?? subRes ?? null;
  const plan = data?.plan ?? null;

  // If execution isn't enabled, treat as no access
  if (data && data.executionEnabled === false) return [];

  // 1) Best: backend provides enabledMarkets directly (future-proof)
  const direct = data?.enabledMarkets || plan?.enabledMarkets;
  if (Array.isArray(direct)) {
    const m = direct
      .map((x: any) => String(x).toUpperCase())
      .filter((x: string) => x === "FOREX" || x === "INDIA") as Mode[];
    if (m.length) return Array.from(new Set(m));
  }

  const planCode = String(plan?.planCode ?? "").toUpperCase();
  const desc = String(plan?.description ?? "").toLowerCase();

  // 2) Inference from planCode + description (your planCode: COPY_TRADING_STARTER)
  const looksLikeCopyPlan =
    planCode.includes("COPY_TRADING") || planCode.includes("TRADE_COPIER");

  if (looksLikeCopyPlan) {
    const hasIndiaWord = desc.includes("india") || desc.includes("nse") || desc.includes("bse");
    const hasForexWord = desc.includes("forex") || desc.includes("mt5") || desc.includes("ctrader");

    if (hasIndiaWord && hasForexWord) return ["FOREX", "INDIA"];
    if (hasForexWord) return ["FOREX"];
    if (hasIndiaWord) return ["INDIA"];
  }

  // 3) Last fallback: category
  const cat = String(plan?.category ?? "").toUpperCase();
  if (cat === "FOREX") return ["FOREX"];
  if (cat === "INDIA") return ["INDIA"];

  return [];
}

/* ------------------------ main component ------------------------ */

export default function CopyControlCenter() {
  // -----------------------------
  // PLAN -> enabledMarkets
  // -----------------------------
  const {
    data: subRes,
    isLoading: planLoading,
    isFetching: planFetching,
    refetch: refetchPlan,
  } = useGetMyCurrentSubscriptionQuery(undefined as any);

  const enabledMarkets = useMemo(() => deriveEnabledMarkets(subRes), [subRes]);

  const canForex = enabledMarkets.includes("FOREX");
  const canIndia = enabledMarkets.includes("INDIA");

  // Market tab (only meaningful if both enabled)
  const [market, setMarket] = useState<Mode>("FOREX");

  // Keep selected market valid
  const marketsKey = useMemo(() => enabledMarkets.join("|"), [enabledMarkets]);

  useEffect(() => {
    if (!enabledMarkets.length) return;

    // If current market isn't allowed, switch to first allowed
    if (!enabledMarkets.includes(market)) {
      setMarket(enabledMarkets[0]);
      return;
    }

    // If only one market is enabled, force it
    if (enabledMarkets.length === 1 && market !== enabledMarkets[0]) {
      setMarket(enabledMarkets[0]);
    }
  }, [marketsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------
  // INDIA accounts (from /trading-accounts/me)
  // -----------------------------
  const {
    data: indiaAccountsRaw = [],
    isLoading: indiaLoading,
    isFetching: indiaFetching,
    refetch: refetchIndia,
  } = useListMyTradingAccountsQuery(undefined, { skip: !canIndia } as any);

  const indiaAccounts = useMemo(() => {
    const list = (indiaAccountsRaw || []) as any[];
    return list.filter(
      (a: any) => String(a.market || "INDIA").toUpperCase() === "INDIA"
    );
  }, [indiaAccountsRaw]);

  // -----------------------------
  // FOREX trader rows (from /forex-trader-user-details/me)
  // -----------------------------
  const {
    data: forexDetailsRes,
    isLoading: fxLoading,
    isFetching: fxFetching,
    refetch: refetchFx,
  } = useGetMyForexTraderDetailsQuery(undefined, { skip: !canForex } as any);

  const forexRows = useMemo(() => {
    const raw = (forexDetailsRes as any)?.data ?? forexDetailsRes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [forexDetailsRes]);

  // -----------------------------
  // Map BOTH markets into the shape ExecutionPanel expects (ALL accounts)
  // -----------------------------
  const accountsForExecution = useMemo(() => {
    const out: Array<{
      id: string;
      market: Mode;
      brokerType: string;
      label: string;
      isMaster?: boolean;
    }> = [];

    if (canForex) {
      out.push(
        ...forexRows.map((r: any) => ({
          id: String(r.id),
          market: "FOREX" as const,
          brokerType: String(r.forexType || "MT5").toUpperCase(), // MT5 / CTRADER
          label: `${String(r.forexType || "MT5").toUpperCase()} • ${String(
            r.forexTraderUserId || r.loginId || ""
          )}`,
          isMaster: !!r.isMaster,
        }))
      );
    }

    if (canIndia) {
      out.push(
        ...(indiaAccounts as any[]).map((a: any) => ({
          id: String(a.id),
          market: "INDIA" as const,
          brokerType: String(a.broker || "BROKER").toUpperCase(),
          label:
            a.label ||
            a.accountLabel ||
            `${String(a.broker || "Broker")} • ${String(a.externalAccountId || a.id)}`,
          isMaster: false,
        }))
      );
    }

    return out;
  }, [canForex, canIndia, forexRows, indiaAccounts]);

  // -----------------------------
  // Page refresh action
  // -----------------------------
  const onRefresh = () => {
    refetchPlan();
    if (canForex) refetchFx();
    if (canIndia) refetchIndia();
  };

  const showMarketSwitch = enabledMarkets.length > 1;

  const showNoAccess =
    !planLoading && !planFetching && enabledMarkets.length === 0;

  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-[#050810] text-slate-50">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col gap-3 border-b border-white/5 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-400/80">
              Copy Engine
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Broadcast trades to all linked accounts
            </h1>
            <p className="mt-2 max-w-xl text-xs text-slate-400">
              Connect accounts once. Then place manual trades to all accounts or
              link strategies for automation.
              <br />
              <span className="text-slate-300">
                Note: UI does not send MT5 server/password. MT5 uses Login ID
                only.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Market switch (ONLY if plan has both markets) */}
            {showMarketSwitch && (
              <div className="inline-flex rounded-full bg-slate-900/70 p-1 text-xs">
                {canForex && (
                  <ModePill
                    active={market === "FOREX"}
                    onClick={() => setMarket("FOREX")}
                  >
                    FOREX
                  </ModePill>
                )}
                {canIndia && (
                  <ModePill
                    active={market === "INDIA"}
                    onClick={() => setMarket("INDIA")}
                  >
                    INDIA
                  </ModePill>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {showNoAccess && (
          <div className="mt-5 rounded-2xl border border-white/8 bg-[#070b16] p-4 text-sm text-slate-300">
            Your current plan does not include copy execution access (FOREX/INDIA).
          </div>
        )}

        {/* MAIN GRID */}
        {!showNoAccess && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
            {/* LEFT: Accounts setup */}
            <div className="space-y-4">
              <div className={cardBase}>
                {market === "FOREX" ? (
                  canForex ? (
                    <CopyTradingSettings mode="FOREX" />
                  ) : (
                    <div className="text-sm text-slate-300">
                      Your plan does not include FOREX.
                    </div>
                  )
                ) : canIndia ? (
                  <IndiaAccountsCard
                    loading={indiaLoading}
                    fetching={indiaFetching}
                    accounts={indiaAccounts as any}
                    refetch={refetchIndia}
                  />
                ) : (
                  <div className="text-sm text-slate-300">
                    Your plan does not include INDIA.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Execution */}
            <div className="space-y-4">
              <div className={cardBase}>
                <CopyTradingExecutionPanel
                  enabledMarkets={enabledMarkets}
                  accounts={accountsForExecution}
                  initialMarket={market}
                  showTradingViewWidget
                  toTradingViewSymbol={({ market, symbol }) => {
                    // if already a TV symbol like "NSE:RELIANCE"
                    if (symbol.includes(":")) return symbol;

                    // You can tweak mapping to your preference.
                    // INDIA => NSE:SYMBOL
                    if (market === "INDIA") return `NSE:${symbol.toUpperCase()}`;

                    // FOREX => FX:EURUSD (or you can use OANDA:EURUSD, FX_IDC:EURUSD etc)
                    return `FX:${symbol.replace("/", "").toUpperCase()}`;
                  }}
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Execution sends{" "}
                <span className="text-slate-300 font-semibold">one request</span>{" "}
                and backend fans out to all targets. No MT5 server/password is
                sent from UI.
              </div>
            </div>
          </div>
        )}

        {/* Small loading hint */}
        {(planLoading ||
          planFetching ||
          fxLoading ||
          fxFetching ||
          indiaLoading ||
          indiaFetching) && (
          <div className="mt-4 text-[11px] text-slate-500">Syncing…</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------ small UI helpers ------------------------ */

const ModePill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "rounded-full px-4 py-1.5 transition",
      active
        ? "bg-emerald-500 text-black shadow shadow-emerald-500/40"
        : "bg-transparent text-slate-300 hover:bg-slate-800"
    )}
  >
    {children}
  </button>
);

/* ------------------------ INDIA accounts card ------------------------ */
/**
 * Minimal account list using your tradingAccounts.api.ts
 * (Create / Verify / Delete). Credentials can be JSON.
 */
function IndiaAccountsCard({
  loading,
  fetching,
  accounts,
  refetch,
}: {
  loading: boolean;
  fetching: boolean;
  accounts: TradingAccount[];
  refetch: () => any;
}) {
  const [verifyAcc, { isLoading: verifying }] =
    useVerifyTradingAccountMutation();
  const [deleteAcc, { isLoading: deleting }] =
    useDeleteTradingAccountMutation();
  const [createAcc, { isLoading: creating }] =
    useCreateTradingAccountMutation();

  const [showAdd, setShowAdd] = useState(false);

  // Create form
  const [broker, setBroker] = useState<string>("ZERODHA");
  const [label, setLabel] = useState<string>("");
  const [externalAccountId, setExternalAccountId] = useState<string>("");
  const [credentialsJson, setCredentialsJson] = useState<string>(
    JSON.stringify({ accessToken: "", apiKey: "" }, null, 2)
  );

  async function onCreate() {
    try {
      let creds: any = {};
      try {
        creds = JSON.parse(credentialsJson || "{}");
      } catch {
        alert("Credentials must be valid JSON");
        return;
      }

      await createAcc({
        market: "INDIA" as MarketCategory,
        broker: broker.trim(),
        label: label.trim() || undefined,
        externalAccountId: externalAccountId.trim() || undefined,
        credentials: creds,
      } as any).unwrap();

      setShowAdd(false);
      setLabel("");
      setExternalAccountId("");
      refetch();
    } catch (e: any) {
      alert(e?.data?.message || "Failed to create account");
    }
  }

  async function onVerify(id: number | string) {
    try {
      const n = Number(id);
      if (!Number.isFinite(n)) return alert("Invalid account id");
      await verifyAcc({ id: n } as any).unwrap();
      refetch();
    } catch (e: any) {
      alert(e?.data?.message || "Verify failed");
    }
  }

  async function onDelete(id: number | string) {
    if (!confirm("Delete this account?")) return;
    try {
      const n = Number(id);
      if (!Number.isFinite(n)) return alert("Invalid account id");
      await deleteAcc({ id: n } as any).unwrap();
      refetch();
    } catch (e: any) {
      alert(e?.data?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold">India Trading Accounts</p>
          <p className="text-xs text-slate-400 mt-1">
            Connected broker accounts used for copy trading execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
          >
            <RefreshCw size={14} />
            {fetching ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => setShowAdd((s) => !s)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
          >
            + Add
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">
                Broker
              </label>
              <input
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className={inputBase}
                placeholder="ZERODHA / ANGEL / DHAN ..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">
                Label
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputBase}
                placeholder="e.g. Zerodha Main"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">
                External Account ID
              </label>
              <input
                value={externalAccountId}
                onChange={(e) => setExternalAccountId(e.target.value)}
                className={inputBase}
                placeholder="e.g. AB1234 (optional)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">
                Credentials (JSON)
              </label>
              <textarea
                value={credentialsJson}
                onChange={(e) => setCredentialsJson(e.target.value)}
                className={clsx(inputBase, "min-h-[140px] font-mono text-[12px]")}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Store what your backend expects (accessToken/apiKey/etc). This
                is only for INDIA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {creating ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : (accounts as any[]).length === 0 ? (
        <div className="text-sm text-slate-400">No accounts yet.</div>
      ) : (
        <div className="space-y-2">
          {(accounts as any[]).map((a: any) => (
            <div
              key={String(a.id)}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex items-start justify-between gap-3 flex-wrap"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {a.label ||
                    a.accountLabel ||
                    `${a.broker} • ${a.externalAccountId || a.id}`}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  status: <span className="text-slate-200">{a.status}</span>
                  {a.lastVerifiedAt || a.last_verified_at ? (
                    <>
                      {" "}
                      • last verified:{" "}
                      <span className="text-slate-200">
                        {a.lastVerifiedAt || a.last_verified_at}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onVerify(a.id)}
                  disabled={verifying}
                  className="rounded-full bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 disabled:opacity-60"
                >
                  {verifying ? "Verifying..." : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  disabled={deleting}
                  className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
