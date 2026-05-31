 
import React, { useEffect, useMemo, useState } from "react";
import ApiAccountsManager, { ApiAccountItem, ApiTypeOption } from "../ApiAccountsManager";
import { PlanInstance, PlanSignalSettings, StrategySelections } from "./india.types";
import { clsx, btn, btnGhost } from "./ui";
import { toast } from "react-toastify";
import { Copy } from "lucide-react";

import {
  useGetMyForexTraderDetailsQuery,
  useUpsertMyForexTraderDetailsMutation,
  useDeleteForexTraderDetailByIdMutation,
  usePatchTradingAccountEnabledMutation,
} from "../../../services/forexTraderUserDetails.api";

import {
  extractTokenAny,
  useGenerateIndianAuthTokenMutation,
  useGenerateZebuAuthTokenMutation,
  useSaveDhanAccessTokenMutation,
  useSaveTradingAccountTokenMutation,
} from "../../../services/brokerConnect.api";

import { useHandleCopyTradingRequestMutation } from "../../../services/copyTrading.api";

import MarketStrategiesDrawer from "../common/MarketStrategiesDrawer";
import MarketWebhookDrawer from "../common/MarketWebhookDrawer";
import { useGetMyCurrentSubscriptionQuery } from "../../../services/profileSubscription.api";

const UI_DEBUG_UNLOCK_ALL = true;

const INDIAN_TYPES: ApiTypeOption[] = [
  {
    value: "ZEBU",
    label: "Zebu",
    fields: [
      { key: "apiName", label: "Label / Name", required: true },
      { key: "accountId", label: "Account Id", required: true },
      { key: "apiKey", label: "API Key", required: true },
      { key: "apiSecret", label: "API Secret", required: true, type: "password" },
      { key: "isMaster", label: "Is Master", type: "boolean" },
    ],
  },
  {
    value: "DHAN",
    label: "Dhan",
    fields: [
      { key: "apiName", label: "Label / Name", required: true },
      { key: "accountId", label: "Account Id", required: true },
      { key: "apiKey", label: "API Key", required: true },
      { key: "apiSecret", label: "API Secret", required: true, type: "password" },
      { key: "isMaster", label: "Is Master", type: "boolean" },
    ],
  },
];

/* ================= helpers ================= */

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
function ensurePlanSignalDefaults(planId: string, map: PlanSignalSettings): PlanSignalSettings {
  if (map[planId]) return map;
  return { ...map, [planId]: { strategiesEnabled: true, webhookEnabled: false } };
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

/* ================= component ================= */

export default function IndianTradingPage() {
  const { data: subRes } = useGetMyCurrentSubscriptionQuery({ market: "INDIAN" } as any);
  const [patchTradingEnabled] = usePatchTradingAccountEnabledMutation();

  const allSubs = useMemo(() => {
    const root = (subRes as any)?.subscription ?? (subRes as any)?.data?.subscription ?? (subRes as any)?.data ?? subRes;
    const arr = Array.isArray(root?.data) ? root.data : Array.isArray(root) ? root : [];
    return arr;
  }, [subRes]);

  const indianSubs = useMemo(() => {
    return allSubs.filter((s: any) => {
      const code = String(s?.plan?.market?.code || "").toUpperCase();
      const marketId = Number(s?.plan?.marketId ?? s?.plan?.market?.id ?? s?.marketId ?? 0);
      return code === "INDIAN" || marketId === 3;
    });
  }, [allSubs]);

  const indianActiveSubs = useMemo(() => {
    const active = indianSubs.filter((s: any) => String(s?.statusV2 ?? s?.status ?? "").toLowerCase() === "active");
    return active.length ? active : indianSubs;
  }, [indianSubs]);

  const hasPlan = indianActiveSubs.length > 0;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("india.selectedPlanId.v3", ""));

  useEffect(() => {
    if (!indianActiveSubs.length) return;
    const valid = new Set(indianActiveSubs.map((s: any) => String(s.planId)));
    const current = String(selectedPlanId || "");
    if (!current || !valid.has(current)) {
      const next = String(indianActiveSubs[0].planId);
      setSelectedPlanId(next);
      setLS("india.selectedPlanId.v3", next);
    } else {
      setLS("india.selectedPlanId.v3", current);
    }
  }, [indianActiveSubs, selectedPlanId]);

  const selectedSub = useMemo(() => {
    if (!selectedPlanId) return null;
    return indianActiveSubs.find((s: any) => String(s.planId) === String(selectedPlanId)) ?? null;
  }, [indianActiveSubs, selectedPlanId]);

  const effectivePlanId = String(selectedSub?.planId ?? "").trim();

  const selectedPlan: PlanInstance | null = useMemo(() => {
    if (!selectedSub) return null;
    return { planId: String(selectedSub.planId), name: selectedSub.plan?.name ?? "Indian Plan" } as any;
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

  const [planSignals, setPlanSignals] = useState<PlanSignalSettings>(() => getLS("india.planSignals.v1", {}));
  useEffect(() => setLS("india.planSignals.v1", planSignals), [planSignals]);
  useEffect(() => {
    if (selectedPlan?.planId) setPlanSignals((p) => ensurePlanSignalDefaults(selectedPlan.planId, p));
  }, [selectedPlan?.planId]);

  const signals = selectedPlan?.planId ? planSignals[selectedPlan.planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;
  const webhookEnabled = !!signals?.webhookEnabled;

  const [strategySelections, setStrategySelections] = useState<StrategySelections>(() => getLS("india.strategySelections.v1", {}));
  useEffect(() => setLS("india.strategySelections.v1", strategySelections), [strategySelections]);

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (strategySelections[selectedPlan.planId] ?? []).length;
  }, [strategySelections, selectedPlan]);

  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook, setOpenWebhook] = useState(false);

  /* ===== accounts ===== */

  const { data: tradingAccounts, refetch } = useGetMyForexTraderDetailsQuery(
    effectivePlanId ? ({ planId: effectivePlanId } as any) : (undefined as any),
  );

  const [upsertAccount] = useUpsertMyForexTraderDetailsMutation();
  const [deleteAccount] = useDeleteForexTraderDetailByIdMutation();

  // ✅ NEW: use connect-broker APIs
  const [generateZebuAuthToken] = useGenerateZebuAuthTokenMutation();
  const [generateIndianAuthToken] = useGenerateIndianAuthTokenMutation();
  const [saveTradingAccountToken] = useSaveTradingAccountTokenMutation();
  const [saveDhanAccessToken] = useSaveDhanAccessTokenMutation();

  // copy trading request
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
      await handleCopyReq({ userTradingAccountId: Number(requestItem.id), userEmail: email } as any).unwrap();
      toast.success("Request sent successfully");
      closeRequest();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to send request");
    }
  };

  const indianBrokerAccounts = useMemo(() => {
    const raw = (tradingAccounts as any)?.data ?? tradingAccounts ?? null;
    const list = Array.isArray(raw?.accounts) ? raw.accounts : Array.isArray(raw) ? raw : [];
    return list.filter((a: any) => {
      const code = String(a?.broker?.code ?? a?.forexType ?? "").toUpperCase();
      return code === "ZEBU" || code === "DHAN";
    });
  }, [tradingAccounts]);

  const items = useMemo<ApiAccountItem[]>(() => {
    return indianBrokerAccounts.map((a: any) => {
      const type = String(a?.broker?.code ?? a?.forexType ?? "").toUpperCase();
      const accountId = String(a?.accountId ?? a?.forexTraderUserId ?? "").trim();
      const apiKey = String(a?.accountMeta?.apiKey ?? a?.accountMeta?.zebu?.apiKey ?? "").trim();
      const status = String(a?.status ?? "");
      const enabled = typeof a?.isEnabled === "boolean" ? !!a.isEnabled : String(status).toUpperCase() === "ACTIVE";
      const tokenSet = !!(a?.accessToken || a?.refreshToken || a?.hasToken || a?.credentialsEncrypted);
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
        tokenSet,
        meta: { lastVerifiedAt: a?.lastVerifiedAt ?? null },
      };
    });
  }, [indianBrokerAccounts]);

  const accountsLite = useMemo(() => {
    return indianBrokerAccounts.map((a: any) => ({
      id: a?.id,
      forexType: String(a?.forexType ?? "").toUpperCase(),
      forexTraderUserId: String(a?.forexTraderUserId ?? "").trim(),
      isMaster: !!a?.isMaster,
    }));
  }, [indianBrokerAccounts]);

  const webhookToken = String(selectedSub?.webhookToken ?? "");
  const TV_WEBHOOK_URL = `https://backend.tradebro.io/tradingview/alerts?token=${encodeURIComponent(webhookToken)}`;

  const locked = (!hasPlan && !UI_DEBUG_UNLOCK_ALL) || !selectedPlan;

  /* ===== modals ===== */

  type ModalMode = "NONE" | "TOKEN" | "TOTP";
  const [modalMode, setModalMode] = useState<ModalMode>("NONE");
  const [activeItem, setActiveItem] = useState<ApiAccountItem | null>(null);

  const [tokenValue, setTokenValue] = useState("");
  const [totpValue, setTotpValue] = useState("");
  const [passwordValue, setPasswordValue] = useState(""); // ✅ ZEBU only

  const [savingToken, setSavingToken] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  const openTokenModal = (it: ApiAccountItem) => {
    setActiveItem(it);
    setTokenValue("");
    setModalMode("TOKEN");
  };

  const openTotpModal = (it: ApiAccountItem) => {
    setActiveItem(it);
    setTotpValue("");
    setPasswordValue("");
    setModalMode("TOTP");
  };

  const closeModal = () => {
    setModalMode("NONE");
    setActiveItem(null);
    setTokenValue("");
    setTotpValue("");
    setPasswordValue("");
  };

  // ✅ Paste token flow:
  // - DHAN => POST dhan/auth/token {tradingAccountId, accessToken}
  // - ZEBU => PATCH trading-accounts/:id credentialsEncrypted
  const saveToken = async () => {
    if (!activeItem) return;
    if (locked) return;

    const broker = String(activeItem.type || "").toUpperCase() as "ZEBU" | "DHAN";
    const t = String(tokenValue || "").trim();
    if (!t) return toast.error("Access token is required");

    try {
      setSavingToken(true);

      if (broker === "DHAN") {
        await saveDhanAccessToken({
          tradingAccountId: Number(activeItem.id),
          accessToken: t,
        } as any).unwrap();
      } else {
        await saveTradingAccountToken({
          tradingAccountId: Number(activeItem.id),
          token: t,
          planId: effectivePlanId || undefined,
        } as any).unwrap();
      }

      toast.success("Token saved");
      closeModal();
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to save token");
    } finally {
      setSavingToken(false);
    }
  };

  // ✅ Generate token flow:
  // - ZEBU => POST zebu/auth/token/generate { tradingAccountId, totp, password }
  // - DHAN => POST dhan/auth/token/generate { tradingAccountId, totp }
  // then save:
  // - DHAN => POST dhan/auth/token { tradingAccountId, accessToken }
  // - ZEBU => PATCH trading-accounts/:id credentialsEncrypted
  const generateByTotp = async () => {
    if (!activeItem) return;
    if (locked) return;

    const broker = String(activeItem.type || "").toUpperCase() as "ZEBU" | "DHAN";
    const totp = String(totpValue || "").trim();
    if (!totp) return toast.error("TOTP is required");

    const password = String(passwordValue || "").trim();
    if (broker === "ZEBU" && !password) return toast.error("Password is required for ZEBU");

    try {
      setGeneratingToken(true);

      let res: any;

      if (broker === "ZEBU") {
        res = await generateZebuAuthToken({
          tradingAccountId: Number(activeItem.id),
          totp,
          password,
        } as any).unwrap();
      } else {
        res = await generateIndianAuthToken({
          broker: "DHAN",
          tradingAccountId: Number(activeItem.id),
          totp,
        } as any).unwrap();
      }

      const newToken = extractTokenAny(res);

      if (newToken) {
        if (broker === "DHAN") {
          await saveDhanAccessToken({
            tradingAccountId: Number(activeItem.id),
            accessToken: newToken,
          } as any).unwrap();
        } else {
          await saveTradingAccountToken({
            tradingAccountId: Number(activeItem.id),
            token: newToken,
            planId: effectivePlanId || undefined,
          } as any).unwrap();
        }
      }

      toast.success(res?.message || "Token generated");
      closeModal();
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to generate token");
    } finally {
      setGeneratingToken(false);
    }
  };

  /* ================= UI ================= */

  const actionBtn =
    "inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10";
  const actionBtnPrimary =
    "inline-flex items-center justify-center rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400";

  const reqBtnGreen =
    "inline-flex items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/15";
  const reqBtnRed =
    "inline-flex items-center justify-center rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/15";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Indian APIs</h1>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                strategiesEnabled
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-200",
              )}
            >
              Strategies: {strategiesEnabled ? "ON" : "OFF"} ({enabledStrategyCount})
            </span>

            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                webhookEnabled
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-200",
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
      </div>

      <ApiAccountsManager
        title="Indian Broker APIs"
        typeLabel="BROKER"
        typeOptions={INDIAN_TYPES}
        maxAccounts={10}
        locked={!!locked}
        lockedReason="Upgrade to add Indian broker APIs."
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
                <span className="text-slate-400">Token</span>
                <span className={it.tokenSet ? "text-emerald-300" : "text-amber-300"}>
                  {it.tokenSet ? "Set" : "Not set"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Last Verified</span>
                <span className="text-slate-200 font-medium">{lastVerified}</span>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button type="button" className={actionBtnPrimary} onClick={() => openTokenModal(it)} disabled={!!locked}>
                  {it.tokenSet ? "Update Token" : "Add Token"}
                </button>

                <button type="button" className={actionBtn} onClick={() => openTotpModal(it)} disabled={!!locked}>
                  Generate via TOTP
                </button>

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

                <button type="button" className={actionBtn} onClick={() => copyConnectLink(it)} title="Copy link to send to client">
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
            tokenSet: !!res?.hasToken,
          };
        }}
        onToggle={async (id, enabled) => {
          await patchTradingEnabled({ id: Number(id), isEnabled: enabled, planId: effectivePlanId } as any).unwrap();
          toast.success(enabled ? "Account turned ON" : "Account turned OFF");
          await refetch();
        }}
        onDelete={async (id) => {
          if (!effectivePlanId) throw new Error("planId missing");
          await deleteAccount({ planId: effectivePlanId, id: Number(id) } as any).unwrap();
          await refetch();
        }}
      />

      {/* drawers */}
      <MarketWebhookDrawer
        open={openWebhook}
        market="INDIAN"
        onClose={() => setOpenWebhook(false)}
        plan={(selectedSub as any)?.plan ?? null}
        accounts={accountsLite as any}
        planSignals={planSignals}
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

      {/* TOKEN modal */}
      <Modal
        open={modalMode === "TOKEN"}
        title={`${String(activeItem?.type || "").toUpperCase()} • ${activeItem?.apiName || "Account"} • Save Token`}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Paste your access token here. For DHAN this will call <b>dhan/auth/token</b>.
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300">
              ACCESS TOKEN
            </label>
            <input
              type="password"
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="Paste token…"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveToken}
              disabled={savingToken || !!locked || !tokenValue.trim()}
              className={clsx(
                "rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400",
                (savingToken || !!locked || !tokenValue.trim()) && "opacity-60 cursor-not-allowed",
              )}
            >
              {savingToken ? "Saving…" : "Save"}
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-700 bg-slate-900/40 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* TOTP modal */}
      <Modal
        open={modalMode === "TOTP"}
        title={`${String(activeItem?.type || "").toUpperCase()} • ${activeItem?.apiName || "Account"} • Generate Token`}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            {String(activeItem?.type || "").toUpperCase() === "ZEBU"
              ? "ZEBU requires Password + TOTP to generate token."
              : "DHAN requires only TOTP to generate token."}
          </div>

          {/* ZEBU password only */}
          {String(activeItem?.type || "").toUpperCase() === "ZEBU" ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-300">PASSWORD</label>
              <input
                type="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder="Enter Zebu password…"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          ) : null}

          <div>
            <label className="text-[11px] font-semibold text-slate-300">TOTP</label>
            <input
              type="text"
              inputMode="numeric"
              value={totpValue}
              onChange={(e) => setTotpValue(e.target.value)}
              placeholder="Enter 6-digit TOTP…"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={generateByTotp}
              disabled={
                generatingToken ||
                !!locked ||
                !totpValue.trim() ||
                (String(activeItem?.type || "").toUpperCase() === "ZEBU" && !passwordValue.trim())
              }
              className={clsx(
                "rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400",
                (generatingToken ||
                  !!locked ||
                  !totpValue.trim() ||
                  (String(activeItem?.type || "").toUpperCase() === "ZEBU" && !passwordValue.trim())) &&
                  "opacity-60 cursor-not-allowed",
              )}
            >
              {generatingToken ? "Generating…" : "Generate"}
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-700 bg-slate-900/40 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Copy trading request modal */}
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
              placeholder="abhishek1dulat@gmail.com"
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
                (sendingReq || !!locked || !requestEmail.trim()) && "opacity-60 cursor-not-allowed",
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