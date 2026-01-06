// src/pages/connect/ConnectIndiaBrokerPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  Trash2,
  Info,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { IndiaBroker, isIndiaBroker } from "./indiaBrokers";

type BrokerStatus = "Waiting" | "Ready" | "Saved" | "Error";

interface BrokerConfig {
  id: IndiaBroker;
  name: string;
  portalUrl: string;
  requiresPaste: boolean;
  helpText?: string;
  redirectHint?: string; // helpful hint shown near "Copy Redirect URI"
}

const BROKERS: BrokerConfig[] = [
  {
    id: "ZERODHA",
    name: "Zerodha",
    portalUrl: "https://kite.zerodha.com/",
    requiresPaste: false,
    helpText:
      "Login and approve access. If your app is configured properly, you’ll be redirected back and the token/code will auto-fill here.",
  },
  {
    id: "UPSTOX",
    name: "Upstox",
    portalUrl: "https://upstox.com/",
    requiresPaste: false,
    helpText:
      "Login and authorize. You may be redirected back with a code/token depending on your app configuration.",
  },
  {
    id: "FYERS",
    name: "Fyers",
    portalUrl: "https://fyers.in/",
    requiresPaste: false,
    helpText:
      "Login and authorize. You may be redirected back with an auth code depending on your app configuration.",
  },
  {
    id: "DHAN",
    name: "Dhan",
    portalUrl: "https://web.dhan.co/",
    requiresPaste: true,
    helpText:
      "Dhan often uses token generation from the portal. Generate an access token in the portal and paste it here.",
    redirectHint: "Use this in Dhan developer settings if required.",
  },
  {
    id: "ANGELONE",
    name: "Angel One",
    portalUrl: "https://smartapi.angelbroking.com/",
    requiresPaste: true,
    helpText:
      "Angel One SmartAPI usually requires generating a session token/JWT via the portal or your app flow. Paste it here.",
    redirectHint: "Use this in SmartAPI app settings if required.",
  },
  // Add more brokers here when needed:
  // { id: "ALICEBLUE", name: "Alice Blue", portalUrl: "https://aliceblueonline.com/", requiresPaste: false/true },
  // { id: "ZEBU", name: "Zebu", portalUrl: "https://zebuetrade.com/", requiresPaste: true },
];

/** Tailwind class joiner */
const clsx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

function sanitizeToken(v: string) {
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  // prevent user pasting full URL accidentally
  if (t.startsWith("http://") || t.startsWith("https://")) return "";
  // avoid huge accidental pastes
  return t.slice(0, 4096);
}

function StatusBadge({ status }: { status: BrokerStatus }) {
  const cfg: Record<BrokerStatus, string> = {
    Waiting: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Ready: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    Saved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
        cfg[status],
      )}
    >
      <div className={clsx("h-1.5 w-1.5 rounded-full", status === "Waiting" ? "bg-slate-400" : "bg-current")} />
      {status}
    </div>
  );
}

function UtilityBtn({
  label,
  icon,
  onClick,
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-emerald-400 transition-colors"
      title={hint || label}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function InvalidLinkView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050810] p-6">
      <div className="max-w-md rounded-3xl border border-white/10 bg-[#070b16] p-8 text-center shadow-2xl">
        <XCircle className="mx-auto mb-4 text-rose-500" size={48} />
        <h2 className="text-xl font-bold">Invalid Connection Link</h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          This page requires a valid <code className="text-slate-200">accountId</code> to link your broker.
          Please contact your admin/support and request a correct link.
        </p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
          <div className="text-[11px] text-slate-400">Example</div>
          <div className="mt-2 font-mono text-[12px] text-slate-200 break-all">
            {window.location.origin}/connect-broker?accountId=123&broker=ZERODHA
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectIndiaBrokerPage() {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(search), [search]);

  // required
  const accountId = (query.get("accountId") || "").trim();

  // optional
  const redirect = (query.get("redirect") || "").trim();
  const qsBrokerRaw = (query.get("broker") || "").trim().toUpperCase();

  const safeBrokerId: IndiaBroker = isIndiaBroker(qsBrokerRaw as any)
    ? (qsBrokerRaw as IndiaBroker)
    : BROKERS[0].id;

  const initialBroker = useMemo(() => {
    return BROKERS.find((b) => b.id === safeBrokerId) || BROKERS[0];
  }, [safeBrokerId]);

  const [selectedBroker, setSelectedBroker] = useState<BrokerConfig>(initialBroker);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<BrokerStatus>("Waiting");
  const [autoCaptured, setAutoCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect URI that user might need to put in broker developer portal settings
  // Prefer a stable callback path if you have one; for now we use the current route path.
  const redirectUri = useMemo(() => {
    // If you have a dedicated callback route, replace with:
    // return `${window.location.origin}/connect/callback`;
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  // Session storage key (scoped to accountId)
  const storageKey = useMemo(() => {
    return accountId ? `broker-connect:${accountId}` : "broker-connect:unknown";
  }, [accountId]);

  // Toast helper
  const toast = useMemo(
    () =>
      Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      }),
    [],
  );

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.fire({ icon: "success", title: `${label} copied` });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: "Your browser blocked clipboard access. Please copy manually.",
      });
    }
  }

  // ✅ Restore session progress (token + broker) so switching tabs doesn’t lose state
  useEffect(() => {
    if (!accountId) return;
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);

      if (saved?.brokerId) {
        const b = BROKERS.find((x) => x.id === saved.brokerId);
        if (b) setSelectedBroker(b);
      }

      if (typeof saved?.token === "string" && saved.token) {
        setToken(saved.token);
        setStatus(saved.status === "Saved" ? "Saved" : "Ready");
      } else if (saved?.status && typeof saved.status === "string") {
        // keep minimal status restore
        if (["Waiting", "Ready", "Saved", "Error"].includes(saved.status)) setStatus(saved.status);
      }

      if (typeof saved?.autoCaptured === "boolean") setAutoCaptured(saved.autoCaptured);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, storageKey]);

  // ✅ Persist progress to sessionStorage
  useEffect(() => {
    if (!accountId) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        brokerId: selectedBroker.id,
        token,
        status,
        autoCaptured,
      }),
    );
  }, [accountId, storageKey, selectedBroker.id, token, status, autoCaptured]);

  // ✅ Auto-capture callback params (but DO NOT override already pasted token)
  useEffect(() => {
    if (!accountId) return;
    if (token) return;

    const keys = [
      "token",
      "access_token",
      "accessToken",
      "request_token",
      "requestToken",
      "auth_code",
      "authCode",
      "code",
      "session_token",
      "sessionToken",
    ];

    for (const k of keys) {
      const v = query.get(k);
      if (v) {
        const clean = sanitizeToken(v);
        if (clean) {
          setToken(clean);
          setAutoCaptured(true);
          setStatus("Ready");
        }
        break;
      }
    }
  }, [accountId, query, token]);

  // clear storage after success (good hygiene)
  useEffect(() => {
    if (!accountId) return;
    if (status === "Saved") {
      sessionStorage.removeItem(storageKey);
    }
  }, [status, accountId, storageKey]);

  function resetAll(keepBroker = false) {
    if (!keepBroker) setSelectedBroker(initialBroker);
    setToken("");
    setAutoCaptured(false);
    setSubmitting(false);
    setStatus("Waiting");
    if (accountId) sessionStorage.removeItem(storageKey);
  }

  function handleBrokerSelect(b: BrokerConfig) {
    setSelectedBroker(b);
    setToken("");
    setAutoCaptured(false);
    setSubmitting(false);
    setStatus("Waiting");
    if (accountId) {
      // keep separate progress per account; overwrite session with new broker
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ brokerId: b.id, token: "", status: "Waiting", autoCaptured: false }),
      );
    }
  }

  function handleLogin() {
    window.open(selectedBroker.portalUrl, "_blank", "noopener,noreferrer");
  }

  async function clearTokenConfirm() {
    const res = await Swal.fire({
      icon: "question",
      title: "Clear token?",
      text: "This will remove the token/code you entered.",
      showCancelButton: true,
      confirmButtonText: "Clear",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!res.isConfirmed) return;

    setToken("");
    setAutoCaptured(false);
    setStatus("Waiting");
  }

  async function handleSubmit() {
    const clean = sanitizeToken(token);
    if (!clean) {
      Swal.fire({
        icon: "warning",
        title: "Token required",
        text: "Paste a valid token/code. (Do not paste the full URL.)",
      });
      setToken("");
      setStatus("Waiting");
      return;
    }

    // If already saved, do nothing
    if (status === "Saved") return;

    setSubmitting(true);
    setStatus("Waiting");

    try {
      // ✅ TODO: wire backend later
      // Example:
      // await api.post("/broker/connect", { accountId, broker: selectedBroker.id, token: clean });

      await new Promise((r) => setTimeout(r, 700)); // fake delay

      setStatus("Saved");
      toast.fire({ icon: "success", title: "Broker linked successfully" });

      if (redirect) {
        setTimeout(() => navigate(redirect), 900);
      }
    } catch (err: any) {
      console.error(err);
      setStatus("Error");
      Swal.fire({
        icon: "error",
        title: "Connection failed",
        text: err?.response?.data?.message || err?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!accountId) return <InvalidLinkView />;

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Connect Broker</h1>
          <p className="mt-2 text-slate-400">
            Securely link your trading account to enable automated execution.
          </p>
        </div>

        {/* Broker Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {BROKERS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleBrokerSelect(b)}
              className={clsx(
                "group relative rounded-2xl border p-4 transition-all",
                selectedBroker.id === b.id
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/50"
                  : "border-white/5 bg-white/[0.02] hover:border-white/20",
              )}
            >
              <div
                className={clsx(
                  "text-sm font-semibold",
                  selectedBroker.id === b.id ? "text-emerald-400" : "text-slate-300",
                )}
              >
                {b.name}
              </div>
            </button>
          ))}
        </div>

        {/* Action Card */}
        <div className="rounded-3xl border border-white/10 bg-[#070b16] p-6 shadow-2xl md:p-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-semibold">Setup {selectedBroker.name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Target Account:{" "}
                <code className="text-emerald-400 break-all">{accountId}</code>
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* ✅ Premium success card (replaces steps to prevent ghost submissions) */}
          {status === "Saved" ? (
            <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-300" size={22} />
                <div className="flex-1">
                  <div className="text-lg font-semibold text-emerald-200">
                    Connection verified
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    Your <b>{selectedBroker.name}</b> broker is linked for account{" "}
                    <span className="font-mono text-slate-200">{accountId}</span>.
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {redirect ? (
                      <button
                        type="button"
                        onClick={() => navigate(redirect)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
                      >
                        Continue <ArrowRight size={16} />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => resetAll(true)} // keep broker, clear token
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/15"
                    >
                      Link again <RefreshCw size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => resetAll(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Connect another broker
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 border-t border-white/10 pt-5">
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Broker Portal"
                  onClick={() => copyToClipboard(selectedBroker.portalUrl, "Portal URL")}
                />
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Account ID"
                  onClick={() => copyToClipboard(accountId, "Account ID")}
                />
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Redirect URI"
                  hint={selectedBroker.redirectHint}
                  onClick={() => copyToClipboard(redirectUri, "Redirect URI")}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      1
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Authorize
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Login to {selectedBroker.name} <ExternalLink size={18} />
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-2">
                      <Info size={16} className="mt-0.5 text-slate-300" />
                      <p className="text-xs leading-relaxed text-slate-400">
                        {selectedBroker.helpText ||
                          "This opens the broker portal in a new tab. Complete login/authorization there."}
                      </p>
                    </div>

                    {selectedBroker.requiresPaste ? (
                      <div className="mt-3 text-[11px] text-amber-300/90">
                        This broker usually requires manual token generation. Please generate the token in the portal and paste it in Step 2.
                      </div>
                    ) : (
                      <div className="mt-3 text-[11px] text-slate-500">
                        If you’re redirected back here, the token/code will auto-fill.
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-400">
                      2
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Verify Token
                    </h3>
                  </div>

                  <div className="group relative">
                    <input
                      type="text"
                      placeholder="Paste token or code..."
                      value={token}
                      onChange={(e) => {
                        const clean = sanitizeToken(e.target.value);
                        setToken(clean);
                        setAutoCaptured(false);
                        setStatus(clean ? "Ready" : "Waiting");
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-4 pl-4 pr-12 text-sm outline-none transition-all focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50"
                    />

                    {token ? (
                      <button
                        type="button"
                        onClick={clearTokenConfirm}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400"
                        title="Clear token"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </div>

                  {autoCaptured ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <CheckCircle2 size={14} /> Auto-captured from callback
                    </div>
                  ) : null}

                  {status === "Error" ? (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-200">
                      Connection failed. Please verify your token/code and try again.
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={!token || submitting}
                    onClick={handleSubmit}
                    className={clsx(
                      "w-full rounded-xl py-4 font-bold transition-all",
                      token && !submitting
                        ? "bg-sky-500 text-black hover:bg-sky-400 shadow-lg shadow-sky-500/20"
                        : "bg-white/5 text-slate-500 cursor-not-allowed",
                    )}
                  >
                    {submitting ? "Processing..." : "Complete Connection"}
                  </button>

                  <div className="text-[11px] text-slate-500">
                    Tip: Don’t paste the full URL. Paste only the token/code value.
                  </div>
                </div>
              </div>

              {/* Footer Utilities */}
              <div className="mt-10 flex flex-wrap gap-6 border-t border-white/5 pt-6">
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Broker Portal"
                  onClick={() => copyToClipboard(selectedBroker.portalUrl, "Portal URL")}
                />
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy My Account ID"
                  onClick={() => copyToClipboard(accountId, "Account ID")}
                />
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Redirect URI"
                  hint={selectedBroker.redirectHint}
                  onClick={() => copyToClipboard(redirectUri, "Redirect URI")}
                />
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy This Page Link"
                  onClick={() => copyToClipboard(window.location.href, "Page link")}
                />
              </div>

              {/* Secondary actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => resetAll(true)}
                  className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/15"
                >
                  Reset token
                </button>
                <button
                  type="button"
                  onClick={() => resetAll(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Reset all
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
