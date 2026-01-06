import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CandlestickChart,
  ShieldCheck,
  RefreshCw,
  PlugZap,
  KeyRound,
  Save,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  useGetMeQuery,
  useUpdateMeMutation,
  useUpdateTradeStatusMutation,
  useUpdateExecutionProviderMutation,
} from "../../services/userApi";
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

import PineConnectorSettings, {
  PineConnectorSettingsValue,
} from "../user/PineConnectorSettings";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const sectionBase = "rounded-2xl border border-slate-800 bg-slate-900/40 p-6";

type ExecProvider = "MT5" | "CTRADER";

function pickUser(res: any) {
  return res?.user || res?.data || null;
}

function ProviderPill({
  active,
  label,
  onClick,
  disabled,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
        active
          ? "bg-slate-100 text-slate-950 border-slate-100"
          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function ForexTradingPage() {
  const { data: meRes, isLoading: meLoading, isFetching: meFetching, refetch: refetchMe } =
    useGetMeQuery();

  const { data: subRes, isLoading: subLoading, isFetching: subFetching, refetch: refetchSub } =
    useGetMyCurrentSubscriptionQuery();

  const [updateMe, { isLoading: savingTrading }] = useUpdateMeMutation();
  const [updateTradeStatus] = useUpdateTradeStatusMutation();
  const [updateExecutionProvider, { isLoading: switchingProvider }] =
    useUpdateExecutionProviderMutation();

  const user = useMemo(() => pickUser(meRes), [meRes]);
  const mySub = (subRes as any)?.data ?? null;
  const plan = mySub?.plan ?? null;

  const canUseForex =
    plan?.category === "FOREX" ||
    plan?.executionFlow === "PINE_CONNECTOR" ||
    Boolean(plan?.featureFlags?.pineConnector);

  const webhookToken: string | null = mySub?.webhookToken ?? null;
  const webhookUrl: string | null = webhookToken
    ? `https://backend.globalalgotrading.com/tradingview/alerts?token=${webhookToken}`
    : null;

  const serverAllowTrade: boolean = Boolean(
    (mySub as any)?.allowTrade ?? (mySub as any)?.executionEnabled
  );
  const [allowTradeLocal, setAllowTradeLocal] = useState(serverAllowTrade);

  // local trading settings
  const tradeSettings = (user?.tradeSettings ?? {}) as {
    pineConnector?: PineConnectorSettingsValue & {
      executionProvider?: ExecProvider;
      mt5LoginId?: string | number | null;
      ctraderAccountId?: string | number | null;
      ctraderAccessToken?: string | null;
    };
  };

  const [localTradeSettings, setLocalTradeSettings] = useState(tradeSettings);

  useEffect(() => {
    setLocalTradeSettings(tradeSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tradeSettings]);

  useEffect(() => setAllowTradeLocal(serverAllowTrade), [serverAllowTrade]);

  const pine = (localTradeSettings.pineConnector || {}) as any;
  const execProvider: ExecProvider = pine.executionProvider || "MT5";

  const setPine = (patch: Record<string, any>) => {
    setLocalTradeSettings((p) => ({
      ...p,
      pineConnector: { ...(p.pineConnector as any), ...patch },
    }));
  };

  const onSelectProvider = async (next: ExecProvider) => {
    const prev = execProvider;
    setPine({ executionProvider: next });

    try {
      await updateExecutionProvider({ executionProvider: next } as any).unwrap();
      toast.success(next === "MT5" ? "MT5 enabled" : "cTrader enabled");
      refetchSub();
      refetchMe();
    } catch (err: any) {
      setPine({ executionProvider: prev });
      toast.error(err?.data?.message || "Failed to switch execution provider");
    }
  };

  const loading = meLoading || meFetching;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={sectionBase}>Loading…</div>
      </div>
    );
  }

  if (!canUseForex) {
    return (
      <div className={sectionBase}>
        <div className="flex items-center gap-2 text-slate-200">
          <Zap size={16} />
          <div className="font-semibold">Forex Trading not enabled</div>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Your current plan does not include Forex / Pine Connector features.
        </p>
        <Link
          to="/pricing"
          className="mt-4 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Forex Trading</h1>
        <p className="text-sm text-slate-400 mt-1">
          Choose: use our strategy OR use your own TradingView webhook.
        </p>
      </div>

      {/* OPTION A: USE OUR STRATEGY */}
      <section className={sectionBase}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap size={18} />
              Option A: Use Our Strategy
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              If you purchased a strategy plan, connect your account and start.
            </p>
          </div>

          <Link
            to="/user/use-strategy"
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Browse / Connect Strategy
          </Link>
        </div>
      </section>

      {/* OPTION B: USE YOUR OWN TRADINGVIEW */}
      <section className={sectionBase}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Option B: Use Your Own TradingView
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Copy webhook URL → paste into TradingView Alert Webhook URL.
            </p>
          </div>

          <button
            onClick={() => refetchSub()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
          >
            <RefreshCw size={14} />
            {subLoading || subFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4">
          {!webhookUrl ? (
            <div className="text-sm text-yellow-200">
              Webhook token not ready yet. Refresh after a few seconds.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input readOnly value={webhookUrl} className={`${inputBase} !mt-0`} />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(webhookUrl);
                    toast.success("Webhook URL copied");
                  } catch {
                    toast.error("Failed to copy");
                  }
                }}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </section>

      {/* EXECUTION PROVIDER */}
      <section className={sectionBase}>
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PlugZap size={18} className="text-emerald-400" />
            Execution Setup (MT5 / cTrader)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            MT5: user runs EA. cTrader: user provides Account ID + Token and backend places orders.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ProviderPill
            active={execProvider === "MT5"}
            onClick={() => onSelectProvider("MT5")}
            label="MT5 (EA)"
            disabled={switchingProvider}
          />
          <ProviderPill
            active={execProvider === "CTRADER"}
            onClick={() => onSelectProvider("CTRADER")}
            label="cTrader (API)"
            disabled={switchingProvider}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {execProvider === "MT5" ? (
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">MT5 Login ID</label>
              <input
                className={inputBase}
                value={String(pine.mt5LoginId ?? "")}
                onChange={(e) => setPine({ mt5LoginId: e.target.value })}
                placeholder="e.g., 12345678"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                We identify your MT5 terminal by Login ID.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300">cTrader Account ID</label>
                <input
                  className={inputBase}
                  value={String(pine.ctraderAccountId ?? "")}
                  onChange={(e) => setPine({ ctraderAccountId: e.target.value })}
                  placeholder="e.g., 123456"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">cTrader Access Token</label>
                <input
                  className={inputBase}
                  type="password"
                  value={String(pine.ctraderAccessToken ?? "")}
                  onChange={(e) => setPine({ ctraderAccessToken: e.target.value })}
                  placeholder="Paste token"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <KeyRound size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">How it works</p>
              <p className="text-sm text-slate-200 mt-1">
                {execProvider === "MT5"
                  ? "MT5 mode: user runs EA on terminal and trades execute from MT5 side."
                  : "cTrader mode: backend places orders via cTrader API using your token."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await updateMe({ tradeSettings: localTradeSettings } as any).unwrap();
                toast.success("Forex trading settings saved");
                refetchMe();
              } catch (err: any) {
                toast.error(err?.data?.message || "Failed to save");
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            <Save size={16} />
            {savingTrading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </section>

      {/* OPTIONAL: KEEP YOUR EXISTING COMPONENT */}
      <section className={sectionBase}>
        <PineConnectorSettings
          value={localTradeSettings.pineConnector as any}
          onChange={(next) =>
            setLocalTradeSettings((p) => ({
              ...p,
              pineConnector: next as any,
            }))
          }
          allowTrade={allowTradeLocal}
          setAllowTrade={async (next) => {
            setAllowTradeLocal(next);
            try {
              await updateTradeStatus({ allowTrade: next } as any).unwrap();
              toast.success(next ? "Execution Enabled" : "Execution Disabled");
              refetchSub();
            } catch (err: any) {
              toast.error(err?.data?.message || "Failed to update execution");
              setAllowTradeLocal(serverAllowTrade);
            }
          }}
          onRefreshSubscription={refetchSub}
        />
      </section>
    </div>
  );
}
