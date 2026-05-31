

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Download,
  Power,
  MoreVertical,
  Save,
  Trash2,
  Crown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  X,
  Mail,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  useGetMyForexTraderDetailsQuery,
  useUpsertMyForexTraderDetailsMutation,
  usePatchForexTraderDetailByIdMutation,
  useDeleteForexTraderDetailByIdMutation,
  ForexTradeCategory,
  type ForexAccountRow,
} from "../../../services/forexTraderUserDetails.api";

import ForexMT5SetupDrawer from "./components/ForexMT5SetupDrawer";
import SlideOver from "./components/SlideOver";

// NOTE: forex plans/strategies now come from the user's real subscription.
// (Old dummy import removed; the only remaining reference was dead/commented code.)
import {
  ForexPlanInstance,
  ForexPlanSignalSettings,
  ForexStrategySelections,
  ForexAccountRowLite,
} from "./forex.types";
import { useGetMyCurrentSubscriptionQuery } from "../../../services/profileSubscription.api";
import { useHandleCopyTradingRequestMutation } from "../../../services/copyTrading.api";
import MarketStrategiesDrawer from "../common/MarketStrategiesDrawer";
import MarketWebhookDrawer from "../common/MarketWebhookDrawer";
export enum MarketType {
  FOREX = "FOREX",
  CRYPTO = "CRYPTO",
  INDIAN = "INDIAN",
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const UI_DEBUG_UNLOCK_ALL = false;

const pageWrap = "w-full";
const card =
  "rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const btn =
  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
const btnOutline =
  "border border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-900/80";
const btnPrimary = "bg-indigo-500 text-white hover:bg-indigo-400";
const btnAmber = "bg-yellow-400 text-slate-950 hover:bg-yellow-300";
const btnGreen = "bg-emerald-400 text-slate-950 hover:bg-emerald-300";
const input =
  "mt-2 w-full rounded-lg border border-slate-200/15 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

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
  } catch { }
}

function genSecret() {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}

function ensurePlanDefaults(planId: string, map: ForexPlanSignalSettings): ForexPlanSignalSettings {
  if (map[planId]) return map;
  return {
    ...map,
    [planId]: { strategiesEnabled: true, webhookEnabled: false },
  };
}

function formatDate(ts?: string | null) {
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

/** status helpers */
function normalizeStatus(s?: string) {
  return String(s || "").toUpperCase();
}
function isPendingVerify(status?: string) {
  const s = normalizeStatus(status);
  return s === "PENDING_VERIFY" || s === "PENDING";
}
function isVerifiedStatus(status?: string) {
  const s = normalizeStatus(status);
  return s === "ACTIVE" || s === "VERIFIED";
}
function needsCtraderAuth(row: ForexAccountRow) {
  if (String(row.forexType).toUpperCase() !== "CTRADER") return false;
  const s = normalizeStatus(row.status);
  if (s === "PENDING_VERIFY" || s === "TOKEN_EXPIRED" || s === "REAUTH_REQUIRED") return true;
  if (!isVerifiedStatus(s)) return true;
  return false;
}
function isEnabledFromStatus(status?: string) {
  const s = normalizeStatus(status);
  if (!s) return true;
  if (s === "INACTIVE" || s === "DISABLED" || s === "PAUSED") return false;
  if (s === "PENDING_VERIFY") return false;
  return true;
}
function toPatchStatus(enabled: boolean) {
  return enabled ? "ACTIVE" : "INACTIVE";
}
function statusPill(status?: string) {
  const s = normalizeStatus(status);
  if (!s) return { label: "UNKNOWN", cls: "border-white/10 bg-white/5 text-slate-200" };
  if (s === "ACTIVE" || s === "VERIFIED")
    return { label: s, cls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" };
  if (s === "PENDING_VERIFY")
    return { label: "PENDING_VERIFY", cls: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200" };
  if (s === "INACTIVE" || s === "DISABLED" || s === "PAUSED")
    return { label: s, cls: "border-slate-700 bg-slate-900/60 text-slate-200" };
  return { label: s, cls: "border-rose-500/20 bg-rose-500/10 text-rose-200" };
}

/** cTrader redirect */
const CTRADER_CLIENT_ID =
  "19864_DpBIU4nNUHVa3Rj01eJG7zZFta16nCsfkStt3n5xRI2niE7Ne7";
const CTRADER_REDIRECT_URI = "https://backend.tradebro.io/ctrader/callback";
const CTRADER_GRANT_URL_BASE = "https://id.ctrader.com/my/settings/openapi/grantingaccess/";
function buildCtraderGrantUrl(accountId?: string) {
  const u = new URL(CTRADER_GRANT_URL_BASE);
  u.searchParams.set("client_id", CTRADER_CLIENT_ID);
  u.searchParams.set("redirect_uri", CTRADER_REDIRECT_URI);
  u.searchParams.set("scope", "trading");
  u.searchParams.set("product", "web");
  u.searchParams.set("state", accountId || "");
  return u.toString();
}

const MT5_BRIDGE_API_BASE = "https://backend.tradebro.io";

/** ✅ subscription parsing (your backend returns: { message, subscription: { data:[...], followers:[] } } ) */
function pickSubscriptionPayload(subRes: any) {
  const root =
    subRes?.subscription ??
    subRes?.data?.subscription ??
    subRes?.data ??
    subRes ??
    null;

  const arr =
    (Array.isArray(root?.data) && root.data) ||
    (Array.isArray(root) && root) ||
    [];

  return {
    subs: Array.isArray(arr) ? arr.filter(Boolean) : [],
  };
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 rounded-full border transition",
        checked ? "bg-emerald-500/90 border-emerald-400" : "bg-slate-800 border-slate-700",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-pressed={checked}
    >
      <span
        className={clsx(
          "absolute top-[3px] h-4 w-4 rounded-full bg-slate-950 transition",
          checked ? "left-6" : "left-[3px]"
        )}
      />
    </button>
  );
}

function Menu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button type="button" onClick={() => setOpen((p) => !p)} className="rounded-lg p-2 hover:bg-white/5">
        <MoreVertical size={18} className="text-slate-300" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-[60] w-44 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl">


          <button
            className="w-full px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Request modal */
function CopyTradingRequestModal({
  open,
  onClose,
  onSubmit,
  loading,
  accountId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  loading?: boolean;
  accountId?: number | null;
}) {
  const [email, setEmail] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setEmail("");
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const submit = () => {
    const v = email.trim();
    if (!v) return;
    onSubmit(v);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={boxRef}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <div className="text-sm font-semibold text-slate-100">Request Copy Trading</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Send request for account #{accountId ?? "—"} to the user email.
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/5" aria-label="Close">
                <X size={18} className="text-slate-300" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="text-[11px] font-semibold text-slate-300">USER EMAIL</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
                <Mail size={16} className="text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abhishek1dulat@gmail.com"
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  type="email"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || !email.trim()}
                  className={clsx(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                    loading || !email.trim()
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  )}
                >
                  <Send size={16} />
                  {loading ? "Sending..." : "Send Request"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                After user approves in the notification bell, copy trading will be enabled.
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function ForexAccountsPage() {
  /** ✅ your API returns multiple subs; we must filter FOREX ourselves */
  const { data: subRes } = useGetMyCurrentSubscriptionQuery({ market: MarketType.FOREX } as any);

  const { subs } = useMemo(() => pickSubscriptionPayload(subRes as any), [subRes]);

  /** ✅ ONLY FOREX subs (by market.code OR marketId fallback) */
  const forexSubs = useMemo(() => {
    return (subs || []).filter((s: any) => {
      const code = String(s?.plan?.market?.code || "").toUpperCase();
      const marketId = Number(s?.plan?.marketId ?? s?.plan?.market?.id ?? s?.marketId ?? 0);
      return code === "FOREX" || marketId === 1;
    });
  }, [subs]);

  /** ✅ prefer ACTIVE forex subs */
  const forexActiveSubs = useMemo(() => {
    const active = forexSubs.filter(
      (s: any) => String(s?.statusV2 ?? s?.status ?? "").toLowerCase() === "active"
    );
    return active.length ? active : forexSubs;
  }, [forexSubs]);

  const hasPlan = forexActiveSubs.length > 0;

  /** ✅ store REAL planId only */
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => getLS("fx.selectedPlanId.v2", ""));

  /** ✅ validate LS planId against FOREX subs; pick latest endDate */
  useEffect(() => {
    if (!forexActiveSubs.length) return;

    const valid = new Set(forexActiveSubs.map((s: any) => String(s.planId)));
    const current = String(selectedPlanId || "");

    if (!current || !valid.has(current)) {
      const sorted = [...forexActiveSubs].sort((a: any, b: any) => {
        const ta = a?.endDate ? new Date(a.endDate).getTime() : 0;
        const tb = b?.endDate ? new Date(b.endDate).getTime() : 0;
        return tb - ta;
      });

      const next = String(sorted[0].planId);
      setSelectedPlanId(next);
      setLS("fx.selectedPlanId.v2", next);
    } else {
      setLS("fx.selectedPlanId.v2", current);
    }
  }, [forexActiveSubs, selectedPlanId]);

  const selectedSub = useMemo(() => {
    if (!selectedPlanId) return null;
    return forexActiveSubs.find((s: any) => String(s.planId) === String(selectedPlanId)) ?? null;
  }, [forexActiveSubs, selectedPlanId]);

  /** ✅ ONLY THIS planId must be used for trading-accounts */
  const effectivePlanId = String(selectedSub?.planId ?? "").trim();

  const webhookToken = String(selectedSub?.webhookToken ?? "").trim();
  const FOREX_TV_WEBHOOK_URL =
    `https://backend.tradebro.io/tradingview/alerts?token=${encodeURIComponent(webhookToken || "")}`;

  /** ✅ plan dropdown options from forex subs (not dummy ids) */
  const plans = useMemo<ForexPlanInstance[]>(() => {
    const mapped = forexActiveSubs
      .map((x: any) => {
        const planId = String(x?.planId ?? "").trim();
        if (!planId) return null;

        const planName = String(x?.plan?.name ?? "Forex Plan");
        const limits = x?.plan?.limits ?? undefined;

        return { planId, planName, limits } as ForexPlanInstance;
      })
      .filter(Boolean) as ForexPlanInstance[];

    // de-dupe
    const uniq = new Map<string, ForexPlanInstance>();
    mapped.forEach((p) => {
      if (!uniq.has(p.planId)) uniq.set(p.planId, p);
    });

    // Return only real forex-subscription plans. When the user has none,
    // return [] so the page shows its proper "no plan / locked" state
    // instead of fake plans.
    return Array.from(uniq.values());
  }, [forexActiveSubs]);

  const selectedPlan: ForexPlanInstance | null = useMemo(
    () => plans.find((p) => String(p.planId) === String(selectedPlanId)) ?? null,
    [plans, selectedPlanId]
  );

  /** per-plan toggles */
  const [planSignals, setPlanSignals] = useState<ForexPlanSignalSettings>(() => getLS("fx.planSignals.v1", {}));
  useEffect(() => setLS("fx.planSignals.v1", planSignals), [planSignals]);
  useEffect(() => {
    if (selectedPlan?.planId) setPlanSignals((prev) => ensurePlanDefaults(selectedPlan.planId, prev));
  }, [selectedPlan?.planId]);

  /** strategy selections per plan */
  const [strategySelections, setStrategySelections] = useState<ForexStrategySelections>(() =>
    getLS("fx.strategySelections.v1", {})
  );
  useEffect(() => setLS("fx.strategySelections.v1", strategySelections), [strategySelections]);

  const signals = selectedPlan?.planId ? planSignals[selectedPlan.planId] : undefined;
  const strategiesEnabled = !!signals?.strategiesEnabled;
  const webhookEnabled = !!signals?.webhookEnabled;

  const enabledStrategyCount = useMemo(() => {
    if (!selectedPlan) return 0;
    return (strategySelections[selectedPlan.planId] ?? []).length;
  }, [selectedPlan, strategySelections]);

  /** MT5 secrets (local) */
  const [mt5Secrets, setMt5Secrets] = useState<Record<string, string>>(() => getLS("fx.mt5Secrets.v1", {}));
  useEffect(() => setLS("fx.mt5Secrets.v1", mt5Secrets), [mt5Secrets]);

  /** ✅ GET trading accounts ONLY with effectivePlanId */
  const canQueryAccounts = !!effectivePlanId && !Number.isNaN(Number(effectivePlanId));

  const {
    data: forexDetailsRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetMyForexTraderDetailsQuery(
    canQueryAccounts ? ({ planId: effectivePlanId } as any) : (undefined as any),
    { refetchOnMountOrArgChange: true } as any
  );

  // const rows = useMemo<ForexAccountRow[]>(() => {
  //   // service already returns ForexAccountRow[] usually
  //   if (Array.isArray(forexDetailsRes)) return forexDetailsRes as any;

  //   // fallback tolerant parsing
  //   const raw = (forexDetailsRes as any)?.data ?? forexDetailsRes ?? null;
  //   const accounts = Array.isArray(raw?.accounts) ? raw.accounts : Array.isArray(raw) ? raw : [];
  //   return accounts as any;
  // }, [forexDetailsRes]);

  const rows = useMemo<ForexAccountRow[]>(() => {
    const raw = (forexDetailsRes as any)?.data ?? forexDetailsRes ?? null;

    // your API: { accounts: [...] }
    const accounts = Array.isArray(raw?.accounts) ? raw.accounts : Array.isArray(raw) ? raw : [];

    return accounts.map((a: any) => {
      const brokerCode = String(a?.broker?.code ?? a?.brokerCode ?? a?.broker_code ?? "").toUpperCase();
      const brokerName = String(a?.broker?.name ?? a?.accountLabel ?? "").toLowerCase();

      const hasCtraderMeta = !!a?.accountMeta?.ctraderAccountId;
      const looksCtrader = hasCtraderMeta || brokerCode === "CT" || brokerName.includes("ctrader");

      const forexType: ForexTradeCategory = looksCtrader ? "CTRADER" : "MT5";

      // what you want to display as "Account :"
      const forexTraderUserId = String(
        looksCtrader
          ? (a?.accountMeta?.ctraderAccountId ?? a?.accountId ?? "")
          : (a?.accountMeta?.mt5LoginId ?? a?.accountId ?? "")
      ).trim();

      return {
        id: a?.id,
        forexType,
        forexTraderUserId,
        isMaster: !!a?.isMaster,
        status: a?.status,
        lastVerifiedAt: a?.lastVerifiedAt ?? null,
        createdAt: a?.createdAt ?? null,
        updatedAt: a?.updatedAt ?? null,
      } as ForexAccountRow;
    });
  }, [forexDetailsRes]);

  /** ensure MT5 secrets */
  useEffect(() => {
    let changed = false;
    const next = { ...mt5Secrets };
    rows.forEach((r) => {
      const isMt5 = String(r.forexType).toUpperCase() !== "CTRADER";
      if (!isMt5) return;
      const key = String(r.id);
      if (!next[key]) {
        next[key] = genSecret();
        changed = true;
      }
    });
    if (changed) setMt5Secrets(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const used = rows.length;
  const limit = selectedPlan?.limits?.maxConnectedAccounts;
  const limitReached = typeof limit === "number" ? used >= limit : false;

  const [upsertFx, { isLoading: savingNew }] = useUpsertMyForexTraderDetailsMutation();
  const [patchFx, { isLoading: savingEdit }] = usePatchForexTraderDetailByIdMutation();
  const [deleteFx, { isLoading: deleting }] = useDeleteForexTraderDetailByIdMutation();

  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook, setOpenWebhook] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [fxType, setFxType] = useState<ForexTradeCategory>("MT5");
  const [isMaster, setIsMaster] = useState(true);
  const [userId, setUserId] = useState("");

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [statusBusy, setStatusBusy] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const [mt5Open, setMt5Open] = useState(false);
  const [mt5Row, setMt5Row] = useState<ForexAccountRow | null>(null);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => {
      const key = String(r.id);
      next[key] = isEnabledFromStatus(r.status);
    });
    setEnabledMap(next);
  }, [rows]);

  const actionableRows = useMemo(() => rows.filter((r) => !isPendingVerify(r.status)), [rows]);
  const allOn = actionableRows.length > 0 && actionableRows.every((r) => enabledMap[String(r.id)] !== false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forex_accounts_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** ✅ always use effectivePlanId in patch */
  const setAccountEnabled = async (id: number, enabled: boolean) => {
    if (!canQueryAccounts) return toast.error("Forex planId not found");
    const key = String(id);
    setEnabledMap((p) => ({ ...p, [key]: enabled }));
    setStatusBusy((p) => ({ ...p, [key]: true }));

    try {
      await patchFx({ planId: effectivePlanId, id, patch: { status: toPatchStatus(enabled) } } as any).unwrap();
      toast.success(enabled ? "Account turned ON" : "Account turned OFF");
      refetch();
    } catch (e: any) {
      setEnabledMap((p) => ({ ...p, [key]: !enabled }));
      toast.error(e?.data?.message || "Failed to update status");
    } finally {
      setStatusBusy((p) => ({ ...p, [key]: false }));
    }
  };

  const toggleAll = async () => {
    if (!canQueryAccounts) return toast.error("Forex planId not found");
    if (actionableRows.length === 0) return;

    const next = !allOn;
    setBulkBusy(true);

    const m: Record<string, boolean> = { ...enabledMap };
    actionableRows.forEach((r) => (m[String(r.id)] = next));
    setEnabledMap(m);

    try {
      const results = await Promise.allSettled(
        actionableRows.map((r) =>
          patchFx({ planId: effectivePlanId, id: Number(r.id), patch: { status: toPatchStatus(next) } } as any).unwrap()
        )
      );

      const failed = results.filter((x) => x.status === "rejected").length;
      if (failed === 0) toast.success(next ? "All accounts turned ON" : "All accounts turned OFF");
      else toast.warning(`Updated with ${failed} failure(s). Refreshing…`);

      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to toggle all");
      refetch();
    } finally {
      setBulkBusy(false);
    }
  };

  const resetForm = () => {
    setFxType("MT5");
    setIsMaster(true);
    setUserId("");
    setEditingId(null);
  };

  const openCreate = () => {
    if (limitReached && !UI_DEBUG_UNLOCK_ALL) {
      toast.error("Account limit reached for your plan");
      return;
    }
    resetForm();
    setDrawerMode("CREATE");
    setDrawerOpen(true);
  };

  const openEdit = (r: ForexAccountRow) => {
    resetForm();
    setDrawerMode("EDIT");
    setEditingId(Number(r.id));
    setFxType(String(r.forexType).toUpperCase() as ForexTradeCategory);
    setIsMaster(!!r.isMaster);
    setUserId(String(r.forexTraderUserId ?? ""));
    setDrawerOpen(true);
  };

  const submit = async () => {
    if (!canQueryAccounts) return toast.error("Forex planId not found");

    if (drawerMode === "CREATE") {
      if (limitReached && !UI_DEBUG_UNLOCK_ALL) return toast.error("Account limit reached for your plan");

      try {
        const typeUpper = String(fxType).toUpperCase();
        if (!userId.trim()) {
          return toast.error(typeUpper === "MT5" ? "MT5 Login ID is required" : "cTrader Account ID is required");
        }

        await upsertFx({
          planId: effectivePlanId,
          forexType: typeUpper === "CTRADER" ? "CTRADER" : "MT5",
          forexTraderUserId: userId.trim(),
          isMaster,
        } as any).unwrap();

        toast.success(
          typeUpper === "CTRADER"
            ? "Account saved. Click Verify to grant access."
            : "MT5 account saved. Open MT5 Setup to get TradingView JSON + MQL5 script."
        );

        setDrawerOpen(false);
        resetForm();
        refetch();
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to save");
      }
      return;
    }

    if (!editingId) return;

    try {
      if (!userId.trim()) return toast.error("User ID is required");

      const patch: any = {
        forexTraderUserId: userId.trim(),
        isMaster,
        forexType: fxType,
      };

      await patchFx({ planId: effectivePlanId, id: editingId, patch } as any).unwrap(); // ✅ FIXED
      toast.success("Updated");
      setDrawerOpen(false);
      resetForm();
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update");
    }
  };

  const setMaster = async (id: number) => {
    if (!canQueryAccounts) return toast.error("Forex planId not found");
    try {
      await patchFx({ planId: effectivePlanId, id, patch: { isMaster: true } } as any).unwrap(); // ✅ FIXED
      toast.success("Master set");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed");
    }
  };

  const remove = async (id: number) => {
    if (!canQueryAccounts) return toast.error("Forex planId not found");
    try {
      await deleteFx({ planId: effectivePlanId, id } as any).unwrap(); // ✅ FIXED
      toast.success("Deleted");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed");
    }
  };

  const accountsLite: ForexAccountRowLite[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        forexType: r.forexType,
        forexTraderUserId: r.forexTraderUserId,
        isMaster: !!r.isMaster,
      })),
    [rows]
  );

  const redirectCtraderGrant = (row?: ForexAccountRow) => {
    const accountId = row?.forexTraderUserId ? String(row.forexTraderUserId) : "";
    if (accountId) toast.info(`On cTrader screen, grant access for account: ${accountId}`);
    else toast.info("Grant access on cTrader screen.");
    window.location.assign(buildCtraderGrantUrl(accountId));
  };

  const openMt5Setup = (row: ForexAccountRow) => {
    setMt5Row(row);
    setMt5Open(true);
  };

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForAccountId, setRequestForAccountId] = useState<number | null>(null);
  const [handleCopyReq, { isLoading: sendingReq }] = useHandleCopyTradingRequestMutation();

  const openRequestModal = (accountId: number) => {
    setRequestForAccountId(accountId);
    setRequestModalOpen(true);
  };

  const submitRequest = async (email: string) => {
    if (!requestForAccountId) return;
    try {
      await handleCopyReq({
        userTradingAccountId: requestForAccountId,
        userEmail: email,
      } as any).unwrap();

      toast.success("Request sent successfully");
      setRequestModalOpen(false);
      setRequestForAccountId(null);
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className={pageWrap}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-100">Forex Accounts</h1>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Plan:</span>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="rounded-lg border border-slate-200/15 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 outline-none"
              disabled={!plans.length || !hasPlan}
            >
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {p.planName}
                </option>
              ))}
            </select>

            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]",
                strategiesEnabled
                  ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                  : "text-slate-200 bg-white/5 border-white/10"
              )}
            >
              Strategies: {strategiesEnabled ? "ON" : "OFF"} ({enabledStrategyCount}/
              {selectedPlan?.limits?.maxActiveStrategies ?? "—"})
            </span>

            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]",
                webhookEnabled
                  ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                  : "text-slate-200 bg-white/5 border-white/10"
              )}
            >
              Webhook: {webhookEnabled ? "ON" : "OFF"}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Accounts used: <span className="text-slate-200 font-semibold">{used}</span>
            {typeof limit === "number" ? (
              <>
                {" "}
                / <span className="text-slate-200 font-semibold">{limit}</span>
              </>
            ) : null}
            {limitReached && !UI_DEBUG_UNLOCK_ALL ? (
              <span className="ml-2 text-amber-300">Plan limit reached</span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setOpenWebhook(true)} className={clsx(btn, btnOutline)}>
            Webhook
          </button>
          <button type="button" onClick={() => setOpenStrategies(true)} className={clsx(btn, btnOutline)}>
            Strategies
          </button>

          {/* <button type="button" onClick={exportJson} className={clsx(btn, btnOutline)}>
            <Download size={14} />
            Export
          </button> */}

          {/* <button
            type="button"
            onClick={toggleAll}
            disabled={actionableRows.length === 0 || bulkBusy || !canQueryAccounts}
            className={clsx(
              btn,
              allOn
                ? "border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/20"
                : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
            )}
          >
            <Power size={14} />
            {bulkBusy ? "Updating..." : "ALL API ON / OFF"}
          </button> */}

          <button type="button" onClick={() => refetch()} className={clsx(btn, btnOutline)} disabled={!canQueryAccounts}>
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={(limitReached && !UI_DEBUG_UNLOCK_ALL) || !canQueryAccounts}
            className={clsx(btn, btnPrimary)}
          >
            <Plus size={14} />
            Add New
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={card}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={card}>
          <p className="text-slate-200 font-semibold">No accounts added yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click “Add New” to connect MT5 or cTrader.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const id = Number(r.id);
            const key = String(r.id);
            const isCtrader = String(r.forexType).toUpperCase() === "CTRADER";
            const enabled = enabledMap[key] !== false;

            const statusMeta = statusPill(r.status);
            const pendingVerify = isPendingVerify(r.status);
            const ctraderNeeds = isCtrader && needsCtraderAuth(r);

            const switchDisabled =
              !!statusBusy[key] || bulkBusy || pendingVerify || (isCtrader && ctraderNeeds);

            return (
              <div key={key} className={card}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-slate-100">{isCtrader ? "cTrader" : "MT5"}</p>

                      <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]", statusMeta.cls)}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">Account :</p>
                    <p className="text-sm text-slate-200 font-medium truncate">{r.forexTraderUserId}</p>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {r.isMaster ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2.5 py-1 text-[11px] text-yellow-200">
                          <Crown size={12} /> Master
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-900/60 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-200">
                          Child
                        </span>
                      )}

                      {isCtrader ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-200">
                          <ShieldCheck size={12} />
                          {isVerifiedStatus(r.status) ? "Verified" : "Not Verified"}
                        </span>
                      ) : null}
                    </div>

                    {isCtrader && ctraderNeeds ? (
                      <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                        <div className="text-xs font-semibold text-yellow-200">Action required</div>
                        <div className="text-[11px] text-yellow-100/80 mt-1">
                          Click Verify/Reconnect → login to cTrader → grant access. After redirect back, refresh this page.
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={enabled} disabled={switchDisabled} onChange={(v) => setAccountEnabled(id, v)} />
                    <Menu onEdit={() => openEdit(r)} onDelete={() => remove(id)} />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Verified :</span>
                    <span>{formatDate(r.lastVerifiedAt ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Created :</span>
                    <span>{formatDate(r.createdAt ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Updated :</span>
                    <span>{formatDate(r.updatedAt ?? null)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                    Id : {String(r.id)}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isCtrader ? (
                      <button
                        type="button"
                        onClick={() => redirectCtraderGrant(r)}
                        className={clsx(btn, btnGreen, "px-3 py-2")}
                      >
                        <ExternalLink size={14} />
                        {ctraderNeeds ? "Verify / Reconnect" : "Reconnect"}
                      </button>
                    ) : null}

                    {!r.isMaster ? (
                      <button
                        type="button"
                        onClick={() => openRequestModal(id)}
                        className={clsx(
                          btn,
                          "px-3 py-2 border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                        )}
                      >
                        Request Copy Trading
                      </button>
                    ) : null}

                    {!r.isMaster ? (
                      <button
                        type="button"
                        onClick={() => setMaster(id)}
                        disabled={savingEdit}
                        className={clsx(btn, btnAmber, "px-3 py-2")}
                      >
                        <Crown size={14} />
                        Set Master
                      </button>
                    ) : null}

                    {!isCtrader ? (
                      <button
                        type="button"
                        onClick={() => openMt5Setup(r)}
                        className={clsx(btn, "px-3 py-2 border border-indigo-300/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15")}
                      >
                        MT5 Setup
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SlideOver
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          resetForm();
        }}
        title={drawerMode === "CREATE" ? "Add New Account" : "Edit Account"}
        subtitle={drawerMode === "CREATE" ? "Add MT5 or cTrader account" : "Update account details"}
        widthClass="w-full sm:w-[520px]"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300">SELECT TYPE</label>
            <select
              value={fxType}
              onChange={(e) => setFxType(e.target.value as ForexTradeCategory)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
              disabled={drawerMode === "EDIT"}
            >
              <option value="MT5">MT5</option>
              <option value="CTRADER">cTrader</option>
            </select>
          </div>

          {String(fxType).toUpperCase() === "CTRADER" ? (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="text-xs font-semibold text-yellow-200">cTrader token is not entered here</div>
              <div className="text-[11px] text-yellow-100/80 mt-1">
                After saving account, click <b>Verify / Reconnect</b> to grant access on cTrader.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
              <div className="text-xs font-semibold text-indigo-200">MT5 uses VPS script</div>
              <div className="text-[11px] text-indigo-100/80 mt-1">
                After saving, open <b>MT5 Setup</b> on the account card.
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-300">ROLE</label>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-200">
              <input type="checkbox" checked={isMaster} onChange={(e) => setIsMaster(e.target.checked)} className="h-4 w-4" />
              isMaster (unchecked = Child)
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300">
              {String(fxType).toUpperCase() === "CTRADER" ? "CTRADER ACCOUNT ID" : "MT5 LOGIN ID"}
            </label>
            <input
              className={input}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={String(fxType).toUpperCase() === "CTRADER" ? "cTrader Account ID" : "MT5 Login ID"}
            />
          </div>

          {drawerMode === "EDIT" && String(fxType).toUpperCase() === "CTRADER" ? (
            <button
              type="button"
              onClick={() =>
                redirectCtraderGrant({
                  id: editingId ?? 0,
                  forexType: "CTRADER",
                  forexTraderUserId: userId,
                  isMaster,
                } as any)
              }
              className={clsx(btn, btnOutline, "w-full justify-center")}
            >
              <ExternalLink size={14} />
              Verify / Reconnect cTrader
            </button>
          ) : null}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={savingNew || savingEdit || deleting || !canQueryAccounts}
              className="rounded-xl bg-emerald-500/90 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Save size={16} />
                {drawerMode === "CREATE"
                  ? savingNew
                    ? "Saving..."
                    : "Submit"
                  : savingEdit
                    ? "Saving..."
                    : "Save Changes"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                resetForm();
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>

          {drawerMode === "EDIT" && editingId ? (
            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => remove(editingId)}
                disabled={deleting || !canQueryAccounts}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete this account"}
              </button>
            </div>
          ) : null}
        </div>
      </SlideOver>

      <MarketWebhookDrawer
        open={openWebhook}
        market="FOREX"
        onClose={() => setOpenWebhook(false)}
        plan={(selectedSub as any)?.plan ?? null}
        accounts={accountsLite as any}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        webhookUrl={FOREX_TV_WEBHOOK_URL}
        downloadPath="signalPoller.ex5"
      />

 <MarketStrategiesDrawer
  open={openStrategies}
  onClose={() => setOpenStrategies(false)}
  plan={
    selectedSub
      ? {
          ...(selectedSub.plan ?? {}),
          strategy: selectedSub.strategy ?? null,
        }
      : null
  }
  planSignals={planSignals}
  setPlanSignals={setPlanSignals}
  selections={strategySelections}
  setSelections={setStrategySelections}
  uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
/>
      <ForexMT5SetupDrawer
        open={mt5Open}
        onClose={() => {
          setMt5Open(false);
          setMt5Row(null);
        }}
        plan={selectedPlan}
        account={mt5Row}
        webhookUrl={FOREX_TV_WEBHOOK_URL}
        mt5BridgeApiBase={MT5_BRIDGE_API_BASE}
        secret={mt5Row ? mt5Secrets[String(mt5Row.id)] : ""}
        webhookEnabled={webhookEnabled}
      />

      <CopyTradingRequestModal
        open={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setRequestForAccountId(null);
        }}
        onSubmit={submitRequest}
        loading={sendingReq}
        accountId={requestForAccountId}
      />
    </div>
  );
}
