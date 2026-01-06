// src/components/user/india/IndiaCopyMarket.tsx
import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  RefreshCw,
  Plus,
  Copy,
  Send,
  ShieldCheck,
  Trash2,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Users,
  KeyRound,
} from "lucide-react";

import {
  useCreateTradingAccountMutation,
  useDeleteTradingAccountMutation,
  useVerifyTradingAccountMutation,
  MarketCategory,
  TradingAccount,
} from "../../services/tradingAccounts.api";
import { INDIA_BROKERS, IndiaBroker } from "../brokers/indiaBrokers";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const card =
  "rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_45px_rgba(0,0,0,0.35)]";

const soft =
  "rounded-2xl border border-white/10 bg-black/20 p-4";

type TokenState = "OK_TODAY" | "STALE" | "MISSING";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getTokenState(a: any): TokenState {
  const hasToken = !!(a?.credentials?.accessToken || a?.credentials?.token || a?.accessToken);
  if (!hasToken) return "MISSING";

  // Try multiple possible fields
  const updatedTodayFlag = !!(a?.tokenUpdatedToday || a?.credentials?.tokenUpdatedToday);
  if (updatedTodayFlag) return "OK_TODAY";

  const updatedAtRaw =
    a?.tokenUpdatedAt ||
    a?.credentials?.tokenUpdatedAt ||
    a?.credentials?.updatedAt ||
    a?.updatedAt;

  if (updatedAtRaw) {
    const d = new Date(updatedAtRaw);
    if (!Number.isNaN(d.getTime())) {
      if (isSameLocalDay(d, new Date())) return "OK_TODAY";
      return "STALE";
    }
  }

  // Has token but no timestamp => treat as stale
  return "STALE";
}

function tokenBadge(state: TokenState) {
  if (state === "OK_TODAY")
    return {
      text: "Token updated today",
      icon: <CheckCircle2 size={14} className="text-emerald-300" />,
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    };
  if (state === "STALE")
    return {
      text: "Token stale",
      icon: <Clock3 size={14} className="text-yellow-300" />,
      cls: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
    };
  return {
    text: "Token missing",
    icon: <AlertTriangle size={14} className="text-rose-300" />,
    cls: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  };
}

async function swalConfirm(opts: { title: string; text: string; confirmText?: string }) {
  const res = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: opts.confirmText || "Yes",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    background: "#070b16",
    color: "#e5e7eb",
    confirmButtonColor: "#10b981",
    cancelButtonColor: "#334155",
  });
  return res.isConfirmed;
}

async function swalInfo(title: string, text: string, icon: "success" | "error" | "info" = "info") {
  await Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "OK",
    background: "#070b16",
    color: "#e5e7eb",
    confirmButtonColor: "#10b981",
  });
}

function buildIndiaTokenLink(params: {
  origin: string;
  broker: string;
  tradingAccountId: string | number; // your internal trading account record id
  externalAccountId?: string; // optional
}) {
  const { origin, broker, tradingAccountId, externalAccountId } = params;
  const qs = new URLSearchParams();
  qs.set("market", "INDIA");
  qs.set("broker", broker || "ZERODHA");
  qs.set("tradingAccountId", String(tradingAccountId));
  if (externalAccountId) qs.set("externalAccountId", externalAccountId);
  return `${origin}/connect/india?${qs.toString()}`;
}

export default function IndiaCopyMarket({
  canIndia,
  accounts,
  loading,
  fetching,
  refetch,
}: {
  canIndia: boolean;
  accounts: TradingAccount[];
  loading: boolean;
  fetching: boolean;
  refetch: () => void;
}) {

    const [broker, setBroker] = useState<IndiaBroker>("ZERODHA");

  if (!canIndia) {
    return <div className="text-sm text-slate-300">Your plan does not include INDIA.</div>;
  }

  return (
    <IndiaAccountsCard
      loading={loading}
      fetching={fetching}
      accounts={accounts || []}
      refetch={refetch}
    />
  );
}

function IndiaAccountsCard({
  loading,
  fetching,
  accounts,
  refetch,
}: {
  loading: boolean;
  fetching: boolean;
  accounts: TradingAccount[];
  refetch: () => void;
}) {
  const [verifyAcc, { isLoading: verifying }] = useVerifyTradingAccountMutation();
  const [deleteAcc, { isLoading: deleting }] = useDeleteTradingAccountMutation();
  const [createAcc, { isLoading: creating }] = useCreateTradingAccountMutation();

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "https://yourapp.com";
    return window.location.origin || "https://yourapp.com";
  }, []);

  // ADD form
  const [showAdd, setShowAdd] = useState(false);
  const [broker, setBroker] = useState("ZERODHA");
  const [label, setLabel] = useState("");
  const [externalAccountId, setExternalAccountId] = useState("");

  // 2 modes: INTERNAL USER vs MANUAL CREDS
  const [mode, setMode] = useState<"INTERNAL" | "MANUAL">("INTERNAL");
  const [platformAccountId, setPlatformAccountId] = useState(""); // user gives accountId if already in platform

  // manual creds JSON
  const [credentialsJson, setCredentialsJson] = useState(
    JSON.stringify({ accessToken: "", apiKey: "" }, null, 2)
  );

  const accountsView = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    return list.map((a: any) => {
      const state = getTokenState(a);
      const badge = tokenBadge(state);
      return {
        raw: a,
        tokenState: state,
        badge,
      };
    });
  }, [accounts]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      await swalInfo("Copied", "Link copied to clipboard.", "success");
    } catch {
      await swalInfo("Copy failed", "Please copy manually.", "error");
    }
  }

  async function onCreate() {
    try {
      if (!broker.trim()) return swalInfo("Missing broker", "Broker is required.", "error");

      // Build payload
      const payload: any = {
        market: "INDIA" as MarketCategory,
        broker: broker.trim(),
        label: label.trim() || undefined,
        externalAccountId: externalAccountId.trim() || undefined,
      };

      if (mode === "INTERNAL") {
        if (!platformAccountId.trim()) {
          return swalInfo("Account ID required", "Enter platform Account ID to link existing user.", "error");
        }

        // Keep it generic (backend can map this to user/customer)
        payload.credentials = {
          mode: "INTERNAL",
          platformAccountId: platformAccountId.trim(),
        };
      } else {
        let creds: any = {};
        try {
          creds = JSON.parse(credentialsJson || "{}");
        } catch {
          return swalInfo("Invalid JSON", "Credentials must be valid JSON.", "error");
        }
        payload.credentials = { ...creds, mode: "MANUAL" };
      }

      await createAcc(payload).unwrap();

      setShowAdd(false);
      setLabel("");
      setExternalAccountId("");
      setPlatformAccountId("");
      setCredentialsJson(JSON.stringify({ accessToken: "", apiKey: "" }, null, 2));

      await swalInfo("Saved", "India account added.", "success");
      refetch();
    } catch (e: any) {
      await swalInfo("Failed", e?.data?.message || "Failed to create account", "error");
    }
  }

  async function onVerify(id: number) {
    try {
      await verifyAcc({ id } as any).unwrap();
      await swalInfo("Verified", "Account verification completed.", "success");
      refetch();
    } catch (e: any) {
      await swalInfo("Verify failed", e?.data?.message || "Verify failed", "error");
    }
  }

  async function onDelete(id: number) {
    const ok = await swalConfirm({
      title: "Delete account?",
      text: "This will remove the account and it won’t be used for execution.",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      await deleteAcc({ id } as any).unwrap();
      await swalInfo("Deleted", "Account removed.", "success");
      refetch();
    } catch (e: any) {
      await swalInfo("Delete failed", e?.data?.message || "Delete failed", "error");
    }
  }

  // Bulk action: send token link to ALL accounts (backend will decide email/mobile)
  async function onSendAllLinks() {
    if (!accountsView.length) return swalInfo("No accounts", "Add accounts first.", "info");

    const res = await Swal.fire({
      title: "Send token link to all accounts?",
      text: "Backend will send to user email/mobile stored in our system (UI preview).",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send to all",
      cancelButtonText: "Cancel",
      background: "#070b16",
      color: "#e5e7eb",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#334155",
    });

    if (!res.isConfirmed) return;

    // TODO: call backend bulk endpoint later
    await swalInfo("Queued", "Token link send request queued for all accounts (UI preview).", "success");
  }

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-white">India Copy Accounts</p>
          <p className="text-xs text-slate-400 mt-1">
            Add multiple broker accounts. Track token freshness (updated today / stale / missing).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
          >
            <RefreshCw size={14} />
            {fetching ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={onSendAllLinks}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs hover:bg-white/15"
          >
            <Send size={14} />
            Send link to all
          </button>

          <button
            type="button"
            onClick={() => setShowAdd((s) => !s)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
          >
            <Plus size={14} />
            Add account
          </button>
        </div>
      </div>

      {/* Add Panel */}
      {showAdd && (
        <div className={card}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-white">Add India Account</div>
              <div className="mt-1 text-xs text-slate-400">
                Choose: link an existing platform user by <span className="text-slate-200 font-semibold">Account ID</span>,
                or add credentials manually.
              </div>
            </div>

            <button
              type="button"
              onClick={onCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {creating ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300">Broker *</label>
              <div>
  <label className="text-xs font-medium text-slate-300">Broker *</label>
  <select
    value={broker}
    onChange={(e) => setBroker(e.target.value as IndiaBroker)}
    className={inputBase}
  >
    {INDIA_BROKERS.map((b) => (
      <option key={b.value} value={b.value}>
        {b.label}
      </option>
    ))}
  </select>
  <p className="mt-1 text-[11px] text-slate-500">
    Choose broker. Token link will be generated with this broker.
  </p>
</div>

            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputBase}
                placeholder="e.g. Zerodha Main"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">External Broker Account ID (optional)</label>
              <input
                value={externalAccountId}
                onChange={(e) => setExternalAccountId(e.target.value)}
                className={inputBase}
                placeholder="e.g. AB1234"
              />
            </div>

            {/* Mode selector */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">Onboarding Mode</label>
              <div className="mt-2 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setMode("INTERNAL")}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold",
                    mode === "INTERNAL" ? "bg-emerald-500 text-black" : "text-slate-300 hover:bg-white/10"
                  )}
                >
                  <Users size={14} />
                  Link existing user
                </button>
                <button
                  type="button"
                  onClick={() => setMode("MANUAL")}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold",
                    mode === "MANUAL" ? "bg-emerald-500 text-black" : "text-slate-300 hover:bg-white/10"
                  )}
                >
                  <KeyRound size={14} />
                  Add credentials
                </button>
              </div>
            </div>

            {mode === "INTERNAL" ? (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-300">Platform Account ID *</label>
                <input
                  value={platformAccountId}
                  onChange={(e) => setPlatformAccountId(e.target.value)}
                  className={inputBase}
                  placeholder="Enter internal user accountId"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Backend will use this Account ID to fetch user email/mobile and send token-link automatically.
                </p>
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-300">Credentials (JSON) *</label>
                <textarea
                  value={credentialsJson}
                  onChange={(e) => setCredentialsJson(e.target.value)}
                  className={clsx(inputBase, "min-h-[140px] font-mono text-[12px]")}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Temporary UI: store what backend expects (accessToken/apiKey/etc). Later you can replace with token-flow.
                </p>
              </div>
            )}

            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold text-white">Accounts</div>
          <div className="text-[11px] text-slate-500">
            {loading ? "Loading..." : `${accountsView.length} account(s)`}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : accountsView.length === 0 ? (
            <div className="text-sm text-slate-400">No accounts yet.</div>
          ) : (
            accountsView.map(({ raw: a, tokenState, badge }) => {
              const link = buildIndiaTokenLink({
                origin,
                broker: String(a.broker || broker || "ZERODHA").toUpperCase(),
                tradingAccountId: a.id,
                externalAccountId: a.externalAccountId,
              });

              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-[280px]">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-100">
                          {a.label || a.accountLabel || `${a.broker} • ${a.externalAccountId || a.id}`}
                        </div>

                        <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold", badge.cls)}>
                          {badge.icon}
                          {badge.text}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>
                          Broker: <span className="text-slate-200">{String(a.broker || "").toUpperCase()}</span>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>
                          Status: <span className="text-slate-200">{a.status || "—"}</span>
                        </span>

                        {a.externalAccountId ? (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>
                              External ID: <span className="text-slate-200">{a.externalAccountId}</span>
                            </span>
                          </>
                        ) : null}

                        {/* show last verified if present */}
                        {a.lastVerifiedAt || (a as any).last_verified_at ? (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>
                              Last verified:{" "}
                              <span className="text-slate-200">{a.lastVerifiedAt || (a as any).last_verified_at}</span>
                            </span>
                          </>
                        ) : null}
                      </div>

                      {/* Only show link inline (no top-by-default) */}
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <Link2 size={14} className="text-slate-400" />
                        <div className="text-[12px] text-slate-200 truncate">{link}</div>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Use this link for this account. Backend can send it to the user’s email/mobile automatically.
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => copyText(link)}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
                      >
                        <Copy size={14} />
                        Copy link
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          // TODO: call backend to send for this account
                          await swalInfo(
                            "Send requested",
                            "Backend will send token link to this account’s user (UI preview).",
                            "success"
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
                      >
                        <Send size={14} />
                        Send
                      </button>

                      <button
                        type="button"
                        onClick={() => onVerify(a.id)}
                        disabled={verifying}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700 disabled:opacity-60"
                      >
                        <ShieldCheck size={14} />
                        {verifying ? "Verifying..." : "Verify"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(a.id)}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-black hover:bg-rose-400 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {tokenState !== "OK_TODAY" && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-400">
                      Action needed: ask user to update token today, then verify before executing trades.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {(fetching || loading) && <div className="text-[11px] text-slate-500">Syncing…</div>}
    </div>
  );
}
