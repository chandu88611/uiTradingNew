import React, { useMemo, useState } from "react";
import { Layers, Search, RefreshCw, ChevronRight, X, Link2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import { useGetFollowerUserTradingAccountsQuery } from "../../services/followers.api";
import { usePatchForexTraderDetailByIdMutation } from "../../services/forexTraderUserDetails.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const panel =
  "rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur " +
  "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

const softBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm hover:bg-slate-900/70 transition disabled:opacity-60 disabled:cursor-not-allowed";

const inputBase =
  "w-full rounded-xl border border-slate-700 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none " +
  "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed";

/** ✅ EXACT same style: cTrader grant access redirect (like your Forex plan page) */
const CTRADER_CLIENT_ID =
  "19864_DpBIU4nNUHVa3Rj01eJG7zZFta16nCsfkStt3n5xRI2niE7Ne7";
const CTRADER_REDIRECT_URI =
  "https://backend.tradebro.io/ctrader/callback";
const CTRADER_GRANT_URL_BASE =
  "https://id.ctrader.com/my/settings/openapi/grantingaccess/";

function buildCtraderGrantUrl(state?: string) {
  const u = new URL(CTRADER_GRANT_URL_BASE);
  u.searchParams.set("client_id", CTRADER_CLIENT_ID);
  u.searchParams.set("redirect_uri", CTRADER_REDIRECT_URI);
  u.searchParams.set("scope", "trading");
  u.searchParams.set("product", "web");
  u.searchParams.set("state", state || "");
  return u.toString();
}

/** ✅ Robust detection (code/name/label/meta) so redirect never “disappears” */
function isCtraderFollow(row: any) {
  const acc = row?.followerTradingAccount;
  const broker = acc?.broker;

  const code = String(broker?.code ?? "").toUpperCase();
  const name = String(broker?.name ?? "").toUpperCase();
  const label = String(acc?.accountLabel ?? "").toUpperCase();

  const meta = acc?.accountMeta || {};
  const hasCtraderMeta = !!(meta as any)?.ctraderAccountId;

  return (
    code.includes("CTRADER") ||
    name.includes("CTRADER") ||
    label.includes("CTRADER") ||
    label.includes("C TRADER") ||
    hasCtraderMeta
  );
}

function needsConnect(row: any) {
  const acc = row?.followerTradingAccount;
  if (!acc) return true;

  // ✅ cTrader => needs OAuth result
  if (isCtraderFollow(row)) return !String(acc?.accessToken || "").trim();

  // ✅ others => needs stored token/keys
  return !String(acc?.credentialsEncrypted || "").trim();
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "ACTIVE"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : "border-slate-700 bg-slate-900/40 text-slate-200";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold", cls)}>
      {s}
    </span>
  );
}

function FullPageSlider({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* ✅ more width */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[1180px] 2xl:w-[1360px] max-w-[100vw]">
        <div
          className={clsx(
            panel,
            "h-full rounded-none md:rounded-l-3xl border-l border-slate-800 bg-[#070b16] overflow-hidden flex flex-col"
          )}
        >
          <div className="p-4 md:p-5 border-b border-slate-800/70 bg-slate-900/25">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base md:text-lg font-semibold text-slate-100 truncate">
                  {title}
                </div>
                {subtitle ? (
                  <div className="text-xs text-slate-400 mt-1 truncate">{subtitle}</div>
                ) : null}
              </div>

              <button
                className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs hover:bg-slate-900/70 transition"
                onClick={onClose}
              >
                <span className="inline-flex items-center gap-2">
                  <X size={16} /> Close
                </span>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="p-3 md:p-4 2xl:p-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========================= PAGE ========================= */
export default function CopyFollowingPage() {
  const [q, setQ] = useState("");

  // ✅ ALWAYS ACTIVE
  const { data, isLoading, isFetching, isError, refetch } =
    useGetFollowerUserTradingAccountsQuery({
      start: 0,
      count: 50,
      searchParams: "active",
    });

  const loading = isLoading || isFetching;

  const rows = useMemo(() => {
    const list = (data as any)?.followers;
    return Array.isArray(list) ? list : [];
  }, [data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r: any) => {
      const master = r?.master;
      const follower = r?.followerTradingAccount;

      const hay = [
        master?.user?.name,
        master?.user?.email,
        master?.broker?.name,
        master?.accountLabel,
        follower?.broker?.name,
        follower?.accountLabel,
        r?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [rows, q]);

  // ✅ slider state
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any | null>(null);

  const [patchAccount] = usePatchForexTraderDetailByIdMutation();

  function openManage(row: any) {
    setActive(row);
    setOpen(true);
  }

  /** ✅ Verify/Connect handler (cTrader => redirect, others => slider) */
  function connectOrUpdate(row: any) {
    const acc = row?.followerTradingAccount;
    if (!acc) return;

    if (isCtraderFollow(row)) {
      const state = String(acc?.id ?? acc?.accountId ?? row?.id ?? "");
      toast.info("Opening cTrader… Login → Grant Access → return and Refresh.");
      window.location.assign(buildCtraderGrantUrl(state));
      return;
    }

    openManage(row);
  }

  /** ✅ Save token (temporary wiring using existing PATCH trading-accounts) */
  async function saveTokenOnly(token: string) {
    if (!active) return;
    const followerAcc = active?.followerTradingAccount;

    try {
      await patchAccount({
        planId: String(followerAcc?.subscription?.planId ?? followerAcc?.subscriptionId ?? "1"),
        id: Number(followerAcc?.id),
        patch: {
          token,
          accountMeta: followerAcc?.accountMeta ?? {},
        },
      } as any).unwrap();

      toast.success("Saved");
      refetch();
      setOpen(false);
      setActive(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Save failed");
    }
  }

  if (isError) {
    return (
      <div className={clsx(panel, "p-5 text-slate-300")}>
        Failed to load following accounts.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className={clsx(panel, "p-5 md:p-6 relative overflow-hidden")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-200">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-100">
                  Following Accounts
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Only active follows are shown. Verify / connect your execution account here.
                </p>
              </div>
            </div>
          </div>

          <button className={softBtn} onClick={refetch} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={clsx(panel, "p-4")}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search master / broker / account"
            className={clsx(inputBase, "pl-9")}
          />
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className={clsx(panel, "p-5 text-slate-300")}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={clsx(panel, "p-5 text-slate-300")}>
          No active following accounts found.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((r: any) => {
            const master = r?.master;
            const followerAcc = r?.followerTradingAccount;

            const masterName = master?.user?.name || "Master";
            const masterEmail = master?.user?.email || "—";

            const mBroker = master?.broker?.name || "—";
            const fBroker = followerAcc?.broker?.name || "—";

            const connectNeeded = needsConnect(r);
            const isCtrader = isCtraderFollow(r);

            return (
              <div
                key={r.id}
                className={clsx(panel, "p-4 hover:bg-slate-900/45 transition")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-200">
                        <Layers size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate">
                          {masterName}{" "}
                          <span className="text-slate-400 font-medium">
                            ({masterEmail})
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 truncate">
                          Master:{" "}
                          <span className="text-slate-200">{mBroker}</span> •{" "}
                          <span className="text-slate-200">
                            {master?.accountLabel || master?.accountId}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 truncate">
                          You:{" "}
                          <span className="text-slate-200">{fBroker}</span> •{" "}
                          <span className="text-slate-200">
                            {followerAcc?.accountLabel || followerAcc?.accountId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <StatusPill status={r.status} />

                    {connectNeeded ? (
                      <span className="text-[11px] font-semibold text-amber-200 border border-amber-400/30 bg-amber-500/10 rounded-full px-3 py-1">
                        Needs {isCtrader ? "verify" : "token"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-200 border border-emerald-400/30 bg-emerald-500/10 rounded-full px-3 py-1">
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                      "border-slate-800 bg-slate-950/20 hover:bg-slate-950/35"
                    )}
                    onClick={() => openManage(r)}
                  >
                    Manage <ChevronRight size={14} />
                  </button>

                  {/* ✅ ALWAYS visible verify/connect button */}
                  <button
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition border",
                      connectNeeded
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                        : "border-slate-800 bg-slate-950/10 text-slate-400 hover:bg-slate-950/20"
                    )}
                    onClick={() => connectOrUpdate(r)}
                    title={isCtrader ? "Verify with cTrader OAuth" : "Update token/keys"}
                  >
                    <Link2 size={14} />
                    {isCtrader ? "Verify / Connect" : "Connect / Update"}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slider */}
      <FullPageSlider
        open={open}
        onClose={() => {
          setOpen(false);
          setActive(null);
        }}
        title={
          active
            ? `${active?.master?.user?.name || "Master"} • ${active?.master?.broker?.name || "—"}`
            : "Manage Follow"
        }
        subtitle={
          active
            ? `Master: ${active?.master?.accountLabel || active?.master?.accountId} • You: ${
                active?.followerTradingAccount?.accountLabel || active?.followerTradingAccount?.accountId
              }`
            : ""
        }
      >
        {!active ? null : (
          <ManageFollowContent
            row={active}
            onVerify={() => connectOrUpdate(active)}
            onSaveToken={(token) => saveTokenOnly(token)}
          />
        )}
      </FullPageSlider>
    </div>
  );
}

/** ================= Slider content ================= */
function ManageFollowContent({
  row,
  onVerify,
  onSaveToken,
}: {
  row: any;
  onVerify: () => void;
  onSaveToken: (token: string) => void;
}) {
  const followerAcc = row?.followerTradingAccount;
  const isCtrader = isCtraderFollow(row);

  const [token, setToken] = useState("");

  return (
    <div className="space-y-4">
      <div className={clsx(panel, "p-4")}>
        <div className="text-sm font-semibold text-slate-100">Verify / Connect</div>
        <div className="mt-1 text-xs text-slate-400">
          {isCtrader
            ? "cTrader requires OAuth. Click Verify to redirect and grant access."
            : "For this broker, paste your token/keys and save."}
        </div>

        <div className="mt-4">
          <button className={softBtn} onClick={onVerify}>
            <Link2 size={16} />
            {isCtrader ? "Verify with cTrader" : "Open Connect"}
          </button>
        </div>
      </div>

      {!isCtrader ? (
        <div className={clsx(panel, "p-4")}>
          <div className="text-sm font-semibold text-slate-100">Update Token</div>
          <div className="mt-1 text-xs text-slate-400">
            Saves to your existing PATCH trading-accounts mutation (temporary until you add a follower-credentials API).
          </div>

          <div className="mt-3">
            <input
              className={inputBase}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token / api token"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className={clsx(softBtn, "font-semibold")}
              disabled={!token.trim()}
              onClick={() => onSaveToken(token.trim())}
            >
              <ShieldCheck size={16} />
              Save
            </button>
          </div>
        </div>
      ) : null}

      <div className={clsx(panel, "p-4")}>
        <div className="text-sm font-semibold text-slate-100">Details</div>
        <div className="mt-2 grid gap-2 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Your Broker:</span>{" "}
            <span className="text-slate-200">{followerAcc?.broker?.name ?? "—"}</span>
          </div>
          <div>
            <span className="text-slate-500">Your Account:</span>{" "}
            <span className="text-slate-200">{followerAcc?.accountLabel ?? followerAcc?.accountId ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
