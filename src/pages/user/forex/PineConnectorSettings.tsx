import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Download,
  Power,
  MoreVertical,
  X,
  Save,
  Trash2,
  Crown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
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

import ForexStrategiesDrawer from "./components/ForexStrategiesDrawer";
import ForexWebhookDrawer from "./components/ForexWebhookDrawer";
import { dummyForexPlans, dummyForexPlanStrategies } from "./forex.dummy";
import {
  ForexPlanInstance,
  ForexPlanSignalSettings,
  ForexStrategySelections,
  ForexAccountRowLite,
} from "./forex.types";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ✅ UI debug
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
  } catch {}
}

function ensurePlanDefaults(
  planId: string,
  map: ForexPlanSignalSettings
): ForexPlanSignalSettings {
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
  return normalizeStatus(status) === "PENDING_VERIFY";
}

function isVerifiedStatus(status?: string) {
  const s = normalizeStatus(status);
  return s === "ACTIVE" || s === "VERIFIED";
}

function needsCtraderAuth(row: ForexAccountRow) {
  if (String(row.forexType).toUpperCase() !== "CTRADER") return false;
  const s = normalizeStatus(row.status);
  // if backend sends something like TOKEN_EXPIRED / REAUTH_REQUIRED, handle it too
  if (s === "PENDING_VERIFY" || s === "TOKEN_EXPIRED" || s === "REAUTH_REQUIRED") return true;
  // fallback: if not verified, treat as needs auth
  if (!isVerifiedStatus(s)) return true;
  return false;
}

/**
 * ✅ status helpers (for ON/OFF switch)
 * If status is missing, default ON.
 * For PENDING_VERIFY, we disable the switch.
 */
function isEnabledFromStatus(status?: string) {
  const s = normalizeStatus(status);
  if (!s) return true;
  if (s === "INACTIVE" || s === "DISABLED" || s === "PAUSED") return false;
  // PENDING_VERIFY should not be treated as enabled/disabled toggleable
  if (s === "PENDING_VERIFY") return false;
  return true;
}

function toPatchStatus(enabled: boolean) {
  return enabled ? "ACTIVE" : "INACTIVE";
}

function statusPill(status?: string) {
  const s = normalizeStatus(status);
  if (!s) {
    return { label: "UNKNOWN", cls: "border-white/10 bg-white/5 text-slate-200" };
  }
  if (s === "ACTIVE" || s === "VERIFIED") {
    return { label: s, cls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" };
  }
  if (s === "PENDING_VERIFY") {
    return { label: "PENDING_VERIFY", cls: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200" };
  }
  if (s === "INACTIVE" || s === "DISABLED" || s === "PAUSED") {
    return { label: s, cls: "border-slate-700 bg-slate-900/60 text-slate-200" };
  }
  return { label: s, cls: "border-rose-500/20 bg-rose-500/10 text-rose-200" };
}

/**
 * ✅ cTrader redirect (OAuth Granting Access)
 * Using only client_id + redirect_uri in the browser.
 * Secret must stay on backend for token exchange.
 *
 * Docs-style URL:
 * https://id.ctrader.com/my/settings/openapi/grantingaccess/
 *   ?client_id=...
 *   &redirect_uri=...
 *   &scope=trading
 *   &product=web
 */
const CTRADER_CLIENT_ID =
  // you can move this to env later; keeping as requested
  "19864_DpBIU4nNUHVa3Rj01eJG7zZFta16nCsfkStt3n5xRI2niE7Ne7";

const CTRADER_REDIRECT_URI =
  "https://backend.globalalgotrading.com/ctrader/callback";

const CTRADER_GRANT_URL_BASE =
  "https://id.ctrader.com/my/settings/openapi/grantingaccess/";

function buildCtraderGrantUrl() {
  const u = new URL(CTRADER_GRANT_URL_BASE);
  u.searchParams.set("client_id", CTRADER_CLIENT_ID);
  u.searchParams.set("redirect_uri", CTRADER_REDIRECT_URI);
  u.searchParams.set("scope", "trading");
  u.searchParams.set("product", "web");
  return u.toString();
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
        checked
          ? "bg-emerald-500/90 border-emerald-400"
          : "bg-slate-800 border-slate-700",
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

function Drawer({
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
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-base font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Menu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="rounded-lg p-2 hover:bg-slate-100/10"
      >
        <MoreVertical size={18} className="text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 text-rose-600"
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

export default function ForexAccountsPage() {
  // ✅ plans (dummy for now — wire from subscription later)
  const plans = useMemo(() => dummyForexPlans, []);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() =>
    getLS("fx.selectedPlanId.v1", plans[0]?.planId ?? "")
  );
  useEffect(() => setLS("fx.selectedPlanId.v1", selectedPlanId), [selectedPlanId]);

  const selectedPlan: ForexPlanInstance | null = useMemo(
    () => plans.find((p) => p.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  // ✅ per-plan toggles + webhook secret/default account (local for now)
  const [planSignals, setPlanSignals] = useState<ForexPlanSignalSettings>(() =>
    getLS("fx.planSignals.v1", {})
  );
  useEffect(() => setLS("fx.planSignals.v1", planSignals), [planSignals]);
  useEffect(() => {
    if (selectedPlan?.planId)
      setPlanSignals((prev) => ensurePlanDefaults(selectedPlan.planId, prev));
  }, [selectedPlan?.planId]);

  // ✅ strategy selections per plan (local for now)
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

  // ✅ API
  const { data: forexDetailsRes, isLoading, isFetching, refetch } =
    useGetMyForexTraderDetailsQuery(undefined as any);

  const rows = useMemo<ForexAccountRow[]>(() => {
    // supports either "array" or an envelope {data: array}
    const raw = (forexDetailsRes as any)?.data ?? forexDetailsRes ?? [];
    return Array.isArray(raw) ? (raw as ForexAccountRow[]) : [];
  }, [forexDetailsRes]);

  const used = rows.length;
  const limit = selectedPlan?.limits?.maxConnectedAccounts;
  const limitReached = typeof limit === "number" ? used >= limit : false;

  const [upsertFx, { isLoading: savingNew }] =
    useUpsertMyForexTraderDetailsMutation();
  const [patchFx, { isLoading: savingEdit }] =
    usePatchForexTraderDetailByIdMutation();
  const [deleteFx, { isLoading: deleting }] =
    useDeleteForexTraderDetailByIdMutation();

  // drawers: strategies + webhook
  const [openStrategies, setOpenStrategies] = useState(false);
  const [openWebhook, setOpenWebhook] = useState(false);

  // Drawer (Create/Edit account)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [fxType, setFxType] = useState<ForexTradeCategory>("MT5");
  const [isMaster, setIsMaster] = useState(true);
  const [userId, setUserId] = useState("");

  /**
   * ✅ Enabled map uses server status.
   * Switching will PATCH status.
   * For PENDING_VERIFY, switch is disabled.
   */
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [statusBusy, setStatusBusy] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => {
      const key = String(r.id);
      next[key] = isEnabledFromStatus(r.status);
    });
    setEnabledMap(next);
  }, [rows]);

  const actionableRows = useMemo(
    () => rows.filter((r) => !isPendingVerify(r.status)),
    [rows]
  );

  const allOn =
    actionableRows.length > 0 &&
    actionableRows.every((r) => enabledMap[String(r.id)] !== false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forex_accounts_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setAccountEnabled = async (id: number, enabled: boolean) => {
    const key = String(id);

    // optimistic update
    setEnabledMap((p) => ({ ...p, [key]: enabled }));
    setStatusBusy((p) => ({ ...p, [key]: true }));

    try {
      await patchFx({ id, patch: { status: toPatchStatus(enabled) } } as any).unwrap();
      toast.success(enabled ? "Account turned ON" : "Account turned OFF");
      refetch();
    } catch (e: any) {
      // revert
      setEnabledMap((p) => ({ ...p, [key]: !enabled }));
      toast.error(e?.data?.message || "Failed to update status");
    } finally {
      setStatusBusy((p) => ({ ...p, [key]: false }));
    }
  };

  const toggleAll = async () => {
    if (actionableRows.length === 0) return;

    const next = !allOn;
    setBulkBusy(true);

    // optimistic update
    const m: Record<string, boolean> = { ...enabledMap };
    actionableRows.forEach((r) => (m[String(r.id)] = next));
    setEnabledMap(m);

    try {
      const results = await Promise.allSettled(
        actionableRows.map((r) =>
          patchFx({ id: Number(r.id), patch: { status: toPatchStatus(next) } } as any).unwrap()
        )
      );

      const failed = results.filter((x) => x.status === "rejected").length;
      if (failed === 0) {
        toast.success(next ? "All accounts turned ON" : "All accounts turned OFF");
      } else {
        toast.warning(`Updated with ${failed} failure(s). Refreshing…`);
      }
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
    if (drawerMode === "CREATE") {
      if (limitReached && !UI_DEBUG_UNLOCK_ALL)
        return toast.error("Account limit reached for your plan");

      try {
        const typeUpper = String(fxType).toUpperCase();

        if (!userId.trim()) {
          return toast.error(
            typeUpper === "MT5" ? "MT5 Login ID is required" : "cTrader Account ID is required"
          );
        }

        // ✅ IMPORTANT: we do NOT ask for cTrader token here anymore.
        // After create, status becomes PENDING_VERIFY, user must click Verify/Reconnect on card.
        await upsertFx({
          forexType: typeUpper === "CTRADER" ? "CTRADER" : "MT5",
          forexTraderUserId: userId.trim(),
          isMaster,
        } as any).unwrap();

        toast.success("Account saved. If cTrader, click Verify to grant access.");
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
      };

      await patchFx({ id: editingId, patch } as any).unwrap();

      toast.success("Updated");
      setDrawerOpen(false);
      resetForm();
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update");
    }
  };

  const setMaster = async (id: number) => {
    try {
      await patchFx({ id, patch: { isMaster: true } } as any).unwrap();
      toast.success("Master set");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed");
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteFx({ id } as any).unwrap();
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
    // row is optional; we show info to user so they select correct cTrader account
    const accountId = row?.forexTraderUserId ? String(row.forexTraderUserId) : "";
    if (accountId) {
      toast.info(`On cTrader screen, grant access for account: ${accountId}`);
    } else {
      toast.info("Grant access on cTrader screen.");
    }
    window.location.assign(buildCtraderGrantUrl());
  };

  return (
    <div className={pageWrap}>
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-100">Forex Accounts</h1>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Plan:</span>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="rounded-lg border border-slate-200/15 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 outline-none"
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
              Strategies: {strategiesEnabled ? "ON" : "OFF"} (
              {enabledStrategyCount}/{selectedPlan?.limits?.maxActiveStrategies ?? "—"})
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
            Accounts used:{" "}
            <span className="text-slate-200 font-semibold">{used}</span>
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
          <button
            type="button"
            onClick={() => setOpenWebhook(true)}
            className={clsx(btn, btnOutline)}
          >
            Webhook
          </button>
          <button
            type="button"
            onClick={() => setOpenStrategies(true)}
            className={clsx(btn, btnOutline)}
          >
            Strategies
          </button>

          <button type="button" onClick={exportJson} className={clsx(btn, btnOutline)}>
            <Download size={14} />
            Export
          </button>

          <button
            type="button"
            onClick={toggleAll}
            disabled={actionableRows.length === 0 || bulkBusy}
            className={clsx(
              btn,
              allOn
                ? "border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/20"
                : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
            )}
          >
            <Power size={14} />
            {bulkBusy ? "Updating..." : "ALL API ON / OFF"}
          </button>

          <button type="button" onClick={() => refetch()} className={clsx(btn, btnOutline)}>
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={limitReached && !UI_DEBUG_UNLOCK_ALL}
            className={clsx(btn, btnPrimary)}
          >
            <Plus size={14} />
            Add New
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className={card}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={card}>
          <p className="text-slate-200 font-semibold">No accounts added yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click “Add New” to connect MT5 or cTrader.
          </p>
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
                      <p className="text-base font-semibold text-slate-100">
                        {isCtrader ? "cTrader" : "MT5"}
                      </p>

                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]",
                          statusMeta.cls
                        )}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">Account :</p>
                    <p className="text-sm text-slate-200 font-medium truncate">
                      {r.forexTraderUserId}
                    </p>

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
                        <div className="text-xs font-semibold text-yellow-200">
                          Action required
                        </div>
                        <div className="text-[11px] text-yellow-100/80 mt-1">
                          Click Verify/Reconnect → login to cTrader → grant access. After redirect back, refresh this page.
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enabled}
                      disabled={switchDisabled}
                      onChange={(v) => setAccountEnabled(id, v)}
                    />
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

                  <div className="flex items-center gap-2">
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
                        onClick={() => setMaster(id)}
                        disabled={savingEdit}
                        className={clsx(btn, btnAmber, "px-3 py-2")}
                      >
                        <Crown size={14} />
                        Set Master
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer (Create/Edit) */}
      <Drawer
        open={drawerOpen}
        title={drawerMode === "CREATE" ? "Add New Account" : "Edit Account"}
        onClose={() => {
          setDrawerOpen(false);
          resetForm();
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-indigo-600">SELECT TYPE</label>
            <select
              value={fxType}
              onChange={(e) => setFxType(e.target.value as ForexTradeCategory)}
              className="mt-2 w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={drawerMode === "EDIT"}
            >
              <option value="MT5">MT5</option>
              <option value="CTRADER">cTrader</option>
            </select>
          </div>

          {String(fxType).toUpperCase() === "CTRADER" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-900">
                cTrader token is not entered here
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                After saving account, click <b>Verify / Reconnect</b> to grant access on cTrader.
                Backend callback will store token securely.
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-[11px] font-semibold text-slate-600">ROLE</label>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isMaster}
                onChange={(e) => setIsMaster(e.target.checked)}
                className="h-4 w-4"
              />
              isMaster (unchecked = Child)
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              {String(fxType).toUpperCase() === "CTRADER"
                ? "CTRADER ACCOUNT ID"
                : "MT5 LOGIN ID"}
            </label>
            <input
              className={input.replace("mt-2", "")}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={
                String(fxType).toUpperCase() === "CTRADER"
                  ? "cTrader Account ID"
                  : "MT5 Login ID"
              }
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
              disabled={savingNew || savingEdit || deleting}
              className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
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
              className="rounded-lg bg-rose-100 px-6 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-200"
            >
              Cancel
            </button>
          </div>

          {drawerMode === "EDIT" && editingId ? (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => remove(editingId)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete this account"}
              </button>
            </div>
          ) : null}
        </div>
      </Drawer>

      {/* plan strategies + webhook slide overs */}
      <ForexWebhookDrawer
        open={openWebhook}
        onClose={() => setOpenWebhook(false)}
        plan={selectedPlan}
        accounts={accountsLite}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
      />

      <ForexStrategiesDrawer
        open={openStrategies}
        onClose={() => setOpenStrategies(false)}
        plan={selectedPlan}
        strategyDefs={dummyForexPlanStrategies}
        planSignals={planSignals}
        setPlanSignals={setPlanSignals}
        selections={strategySelections}
        setSelections={setStrategySelections}
        uiDebugUnlockAll={UI_DEBUG_UNLOCK_ALL}
      />
    </div>
  );
}
