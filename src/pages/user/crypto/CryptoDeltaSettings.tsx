import React, { useEffect, useMemo, useState } from "react";
import ApiAccountsManager, { ApiAccountItem, ApiTypeOption } from "../ApiAccountsManager";
import { toast } from "react-toastify";
import { Copy } from "lucide-react";

import CryptoStrategiesDrawer from "./components/CryptoStrategiesDrawer";
import CryptoWebhookDrawer from "./components/CryptoWebhookDrawer";

import { CryptoPlanInstance, CryptoPlanSignalSettings, CryptoStrategySelections } from "./crypto.types";

import {
  useGetMyForexTraderDetailsQuery,
  useUpsertMyForexTraderDetailsMutation,
  useDeleteForexTraderDetailByIdMutation,
  usePatchTradingAccountEnabledMutation,
} from "../../../services/forexTraderUserDetails.api";

import { useHandleCopyTradingRequestMutation } from "../../../services/copyTrading.api";
import { useGetMyCurrentSubscriptionQuery } from "../../../services/profileSubscription.api";
import MarketWebhookDrawer from "../common/MarketWebhookDrawer";
import MarketStrategiesDrawer from "../common/MarketStrategiesDrawer";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const UI_DEBUG_UNLOCK_ALL = true;

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition";
const btnGhost = "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

function getLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLS(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function ensurePlanDefaults(planId: string, map: CryptoPlanSignalSettings): CryptoPlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
}

function formatDate(ts?: string) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

function maskMiddle(v?: string, keepStart = 3, keepEnd = 3) {
  const s = String(v || "");
  if (!s) return "—";
  if (s.length <= keepStart + keepEnd + 2) return s;
  return `${s.slice(0, keepStart)}••••••${s.slice(-keepEnd)}`;
}

function maskEnd(v?: string, keepEnd = 4) {
  const s = String(v || "");
  if (!s) return "—";
  if (s.length <= keepEnd + 2) return `••••${s}`;
  return `••••${s.slice(-keepEnd)}`;
}

/* ================= small themed modal ================= */

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="text-base font-semibold">{title}</div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-900">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const CRYPTO_TYPES: ApiTypeOption[] = [
  {
    value: "COINDCX",
    label: "CoinDCX",
    fields: [
      { key: "apiName", label: "Label / Name", required: true },
      { key: "accountId", label: "Account Id", required: true },
      { key: "apiKey", label: "API Key", required: true },
      { key: "apiSecret", label: "API Secret", required: true, type: "password" },
      { key: "isMaster", label: "Is Master", type: "boolean" },
    ],
  },
];

export default function CryptoTradingPage() {
  const { data: subRes } = useGetMyCurrentSubscriptionQuery({ market: "CRYPTO" } as any);
  const [patchTradingEnabled] = usePatchTradingAccountEnabledMutation();

  const allSubs = useMemo(() => {
    const root =
      (subRes as any)?.subscription ??
      (subRes as any)?.data?.subscription ??
      (subRes as any)?.data ??
      subRes;
    const arr = Array.isArray(root?.data) ? root.data : Array.isArray(root) ? root : [];
    return arr;
  }, [subRes]);

  const cryptoSubs = useMemo(() => {
    return allSubs.filter((s: any) => {
      const code = String(s?.plan?.market?.code || "").toUpperCase();
      const marketId = Number(s?.plan?.marketId ?? s?.plan?.market?.id ?? s?.marketId ?? 0);
      return code === "CRYPTO" || marketId === 2;
    });
  }, [allSubs]);

  const cryptoActiveSubs = useMemo(() => {
    const active = cryptoSubs.filter(
      (s: any) => String(s?.statusV2 ?? s?.status ?? "").toLowerCase() === "active"
    );
    return active.length ? active : cryptoSubs;
  }, [cryptoSubs]);

  const hasPlan = cryptoActiveSubs.length > 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("crypto.selectedPlanId.v2", ""));

  useEffect(() => {
    if (!cryptoActiveSubs.length) return;
    const valid = new Set(cryptoActiveSubs.map((s: any) => String(s.planId)));
    const current = String(selectedPlanId || "");
    if (!current || !valid.has(current)) {
      const next = String(cryptoActiveSubs[0].planId);
      setSelectedPlanId(next);
      setLS("crypto.selectedPlanId.v2", next);
    } else {
      setLS("crypto.selectedPlanId.v2", current);
    }
  }, [cryptoActiveSubs, selectedPlanId]);

  const selectedSub = useMemo(() => {
    if (!selectedPlanId) return null;
    return cryptoActiveSubs.find((s: any) => String(s.planId) === String(selectedPlanId)) ?? null;
  }, [cryptoActiveSubs, selectedPlanId]);

  const effectivePlanId = String(selectedSub?.planId ?? "").trim();

  const selectedPlan: CryptoPlanInstance | null = useMemo(() => {
    if (!selectedSub) return null;
    return {
      planId: String(selectedSub.planId),
      planName: selectedSub.plan?.name ?? "Crypto Plan",
      limits: {
        maxConnectedAccounts:
          Number(
            selectedSub?.plan?.limits?.maxConnectedAccounts ??
              selectedSub?.plan?.features?.find?.((f: any) => f?.featureKey === "maxConnectedAccounts")?.featureValue ??
              0
          ) || 0,
        maxActiveStrategies:
          Number(
            selectedSub?.plan?.limits?.maxActiveStrategies ??
              selectedSub?.plan?.features?.find?.((f: any) => f?.featureKey === "maxActiveStrategies")?.featureValue ??
              0
          ) || 0,
      },
    } as any;
  }, [selectedSub]);

  /* ===== connect link ===== */

  const CONNECT_BROKER_ROUTE = "/connect-broker";

  const buildConnectBrokerLink = (it: ApiAccountItem) => {
    const broker = String(it.type || "").toUpperCase();
    const url = new URL(`${window.location.origin}${CONNECT_BROKER_ROUTE}`);
    url.searchParams.set("accountId", String(it.id));
    url.searchParams.set("broker", broker);
    if (effectivePlanId) url.searchParams.set("planId", effectivePlanId);
    url.searchParams.set("redirect", `${window.location.pathname}${window.location.search}`);
    return url.toString();
  };

  const copyText = async (text: string, successMsg = "Copied") => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(successMsg);
        return;
      }
      throw new Error("clipboard not available");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast.success(successMsg);
      } catch {
        toast.error("Copy failed. Please copy manually.");
      }
    }
  };

  const copyConnectLink = async (it: ApiAccountItem) => {
    const link = buildConnectBrokerLink(it);
    await copyText(link, "Connect link copied");
  };

  /* ===== signals ===== */

  const [planSignals, setPlanSignals] = useState<CryptoPlanSignalSettings>(() =>
    getLS("crypto.planSignals.v2", {})
  );
  useEffect(() => setLS("crypto.planSignals.v2", planSignals), [planSignals]);

  useEffect(() => {
    if (selectedPlan?.planId) {
      setPlanSignals((prev) => ensurePlanDefaults(selectedPlan.planId, prev));
    }
  }, [selectedPlan?.planId]);

  const signals = selectedPlan?.planId ? planSignals[selectedPlan.planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;
  const webhookEnabled = !!signals?.webhookEnabled;

  const [strategySelections, setStrategySelections] = useState<CryptoStrategySelections>(() =>
    getLS("crypto.strategySelections.v2", {})
  );
  useEffect(() => setLS("crypto.strategySelections.v2", strategySelections), [strategySelections]);

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (strategySelections[selectedPlan.planId] ?? []).length;
  }, [strategySelections, selectedPlan]);

  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook, setOpenWebhook] = useState(false);

  /* ===== accounts ===== */

  const { data: tradingAccounts, refetch } = useGetMyForexTraderDetailsQuery(
    effectivePlanId ? ({ planId: effectivePlanId } as any) : (undefined as any)
  );

  const [upsertAccount] = useUpsertMyForexTraderDetailsMutation();
  const [deleteAccount] = useDeleteForexTraderDetailByIdMutation();

  const [handleCopyReq, { isLoading: sendingReq }] = useHandleCopyTradingRequestMutation();
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestItem, setRequestItem] = useState<ApiAccountItem | null>(null);
  const [requestEmail, setRequestEmail] = useState("");

  const openRequest = (it: ApiAccountItem) => {
    if (!it.enabled) return toast.error("Account OFF. Turn ON account to send request.");
    setRequestItem(it);
    setRequestEmail("");
    setRequestOpen(true);
  };

  const closeRequest = () => {
    setRequestOpen(false);
    setRequestItem(null);
    setRequestEmail("");
  };

  const sendRequest = async () => {
    if (!requestItem) return;
    const email = requestEmail.trim();
    if (!email) return toast.error("User email is required");

    try {
      await handleCopyReq({
        userTradingAccountId: Number(requestItem.id),
        userEmail: email,
      } as any).unwrap();

      toast.success("Request sent successfully");
      closeRequest();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to send request");
    }
  };

  const cryptoBrokerAccounts = useMemo(() => {
    const raw = (tradingAccounts as any)?.data ?? tradingAccounts ?? null;
    const list = Array.isArray(raw?.accounts) ? raw.accounts : Array.isArray(raw) ? raw : [];
    return list.filter((a: any) => {
      const code = String(a?.broker?.code ?? a?.forexType ?? "").toUpperCase();
      return code === "COINDCX";
    });
  }, [tradingAccounts]);

  const items = useMemo<ApiAccountItem[]>(() => {
    return cryptoBrokerAccounts.map((a: any) => {
      const type = String(a?.broker?.code ?? a?.forexType ?? "").toUpperCase();
      const accountId = String(a?.accountId ?? a?.forexTraderUserId ?? "").trim();
      const apiKey = String(a?.accountMeta?.apiKey ?? "").trim();
      const status = String(a?.status ?? "");
      const enabled =
        typeof a?.isEnabled === "boolean" ? !!a.isEnabled : String(status).toUpperCase() === "ACTIVE";

      return {
        id: a?.id,
        type,
        apiName: String(a?.accountLabel ?? "API"),
        status,
        enabled,
        isMaster: !!a?.isMaster,
        createdAt: a?.createdAt,
        updatedAt: a?.updatedAt,
        accountId,
        apiKey,
        secretSet: true,
        tokenSet: false,
        meta: { lastVerifiedAt: a?.lastVerifiedAt ?? null },
      };
    });
  }, [cryptoBrokerAccounts]);

  const accountsLite = useMemo(() => {
    return cryptoBrokerAccounts.map((a: any) => ({
      id: a?.id,
      forexType: String(a?.forexType ?? a?.broker?.code ?? "").toUpperCase(),
      forexTraderUserId: String(a?.forexTraderUserId ?? a?.accountId ?? "").trim(),
      isMaster: !!a?.isMaster,
    }));
  }, [cryptoBrokerAccounts]);

  const webhookToken = String(selectedSub?.webhookToken ?? "");
  const TV_WEBHOOK_URL = `https://backend.tradebro.io/tradingview/alerts?token=${encodeURIComponent(webhookToken)}`;

  const maxAccounts = selectedPlan?.limits?.maxConnectedAccounts ?? 0;
  const maxStrategies = selectedPlan?.limits?.maxActiveStrategies ?? 0;
  const limitReached = maxAccounts > 0 && items.length >= maxAccounts;

  const locked = (!hasPlan && !UI_DEBUG_UNLOCK_ALL) || !selectedPlan;

  const actionBtn =
    "inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10";

  const reqBtnGreen =
    "inline-flex items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/15";

  const reqBtnRed =
    "inline-flex items-center justify-center rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/15";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Crypto APIs</h1>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                strategiesEnabled
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-200"
              )}
            >
              Strategies: {strategiesEnabled ? "ON" : "OFF"} ({enabledStrategyCount}
              {maxStrategies ? `/${maxStrategies}` : ""})
            </span>

            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                webhookEnabled
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-200"
              )}
            >
              Webhook: {webhookEnabled ? "ON" : "OFF"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className={clsx(btn, btnGhost)} onClick={() => setOpenWebhook(true)}>
              Webhook
            </button>
            <button className={clsx(btn, btnGhost)} onClick={() => setOpenStrategies(true)}>
              Strategies
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-400">
          Accounts used: <span className="text-slate-200 font-semibold">{items.length}</span>
          {maxAccounts > 0 ? (
            <>
              {" "}
              / <span className="text-slate-200 font-semibold">{maxAccounts}</span>
            </>
          ) : null}
          {limitReached ? <span className="ml-2 text-amber-300">Plan limit reached</span> : null}
        </div>
      </div>

      <ApiAccountsManager
        title="Crypto Broker APIs"
        typeLabel="BROKER"
        typeOptions={CRYPTO_TYPES}
        maxAccounts={maxAccounts || 10}
        locked={!!locked}
        lockedReason="Upgrade to add crypto broker APIs."
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
        items={items}
        showIdPill={false}
        renderItemDetails={(it) => {
          const lastVerified = it.meta?.lastVerifiedAt ? formatDate(String(it.meta.lastVerifiedAt)) : "—";

          return (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Account Id</span>
                <span className="text-slate-200 font-medium">{maskMiddle(it.accountId)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">API Key</span>
                <span className="text-slate-200 font-medium">{it.apiKey ? maskEnd(it.apiKey) : "—"}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Is Master</span>
                <span className="text-slate-200 font-medium">{it.isMaster ? "YES" : "NO"}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Last Verified</span>
                <span className="text-slate-200 font-medium">{lastVerified}</span>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {!it.isMaster ? (
                  <button
                    type="button"
                    className={clsx(it.enabled ? reqBtnGreen : reqBtnRed, sendingReq && "opacity-60 cursor-not-allowed")}
                    onClick={() => openRequest(it)}
                    disabled={!!locked || sendingReq}
                    title={it.enabled ? "Send request" : "Account OFF"}
                  >
                    Request Copy Trading
                  </button>
                ) : null}

                <button
                  type="button"
                  className={actionBtn}
                  onClick={() => copyConnectLink(it)}
                  title="Copy link to send to client"
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy size={14} />
                    Copy Connect Link
                  </span>
                </button>
              </div>
            </div>
          );
        }}
        onCreate={async ({ type, apiName, meta }) => {
          if (!effectivePlanId) throw new Error("planId missing");

          const accountId = String((meta as any)?.accountId ?? "").trim();
          const apiKey = String((meta as any)?.apiKey ?? "").trim();
          const apiSecret = String((meta as any)?.apiSecret ?? "").trim();
          const isMaster = !!(meta as any)?.isMaster;

          const res = await upsertAccount({
            planId: effectivePlanId,
            forexType: type,
            forexTraderUserId: accountId,
            isMaster,
            executionFlow: "API",
            accountLabel: apiName,
            accountMeta: { apiKey, apiSecret },
          } as any).unwrap();

          await refetch();

          return {
            id: res?.id ?? Date.now(),
            type,
            apiName,
            status: res?.status ?? "pending",
            enabled: String(res?.status ?? "").toUpperCase() === "ACTIVE",
            isMaster,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            accountId,
            apiKey,
            secretSet: true,
            tokenSet: false,
          };
        }}
        onToggle={async (id, enabled) => {
          await patchTradingEnabled({
            id: Number(id),
            isEnabled: enabled,
            planId: effectivePlanId,
          } as any).unwrap();

          toast.success(enabled ? "Account turned ON" : "Account turned OFF");
          await refetch();
        }}
        onDelete={async (id) => {
          if (!effectivePlanId) throw new Error("planId missing");
          await deleteAccount({ planId: effectivePlanId, id: Number(id) } as any).unwrap();
          await refetch();
        }}
      />

      <MarketWebhookDrawer
        open={openWebhook}
        onClose={() => setOpenWebhook(false)}
        plan={(selectedSub as any)?.plan ?? null}
        accounts={accountsLite as any}
        planSignals={planSignals}
        market="CRYPTO"
        setPlanSignals={setPlanSignals}
        webhookUrl={TV_WEBHOOK_URL}
      />

      <MarketStrategiesDrawer
        open={openStrategies}
        onClose={() => setOpenStrategies(false)}
        plan={(selectedSub as any)?.plan ?? null}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={strategySelections}
        setSelections={setStrategySelections}
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
      />

      <Modal
        open={requestOpen}
        title={`Request Copy Trading • ${requestItem?.apiName || "Account"} • #${requestItem?.id ?? "—"}`}
        onClose={closeRequest}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Send request for this account to the user email. After approval in notification bell, copy trading will be enabled.
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300">USER EMAIL</label>
            <input
              type="email"
              value={requestEmail}
              onChange={(e) => setRequestEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={sendRequest}
              disabled={sendingReq || !!locked || !requestEmail.trim()}
              className={clsx(
                "rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400",
                (sendingReq || !!locked || !requestEmail.trim()) && "opacity-60 cursor-not-allowed"
              )}
            >
              {sendingReq ? "Sending…" : "Send Request"}
            </button>

            <button
              type="button"
              onClick={() => requestItem && copyConnectLink(requestItem)}
              disabled={!requestItem}
              className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/15"
            >
              <span className="inline-flex items-center gap-2">
                <Copy size={16} />
                Copy Connect Link
              </span>
            </button>

            <button
              type="button"
              onClick={closeRequest}
              className="rounded-xl border border-slate-700 bg-slate-900/40 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}