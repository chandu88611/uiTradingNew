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
  ShieldCheck,
  KeyRound,
  Lock,
} from "lucide-react";

import {
  extractTokenAny,
  useGenerateIndianAuthTokenMutation,
  useGenerateZebuAuthTokenMutation,
  useSaveTradingAccountTokenMutation,
} from "../../services/brokerConnect.api";

type BrokerStatus = "Waiting" | "Ready" | "Saved" | "Error";
type ConnectMode = "PASTE_TOKEN" | "GENERATE_TOTP";

type IndiaBroker = "ZEBU" | "DHAN" | "ZERODHA" | "UPSTOX" | "FYERS" | "ANGELONE";

interface BrokerConfig {
  id: IndiaBroker;
  name: string;
  portalUrl: string;
  supportsTotp: boolean;
  requiresPassword?: boolean; // ✅ ZEBU
  helpText?: string;
  redirectHint?: string;
}

const BROKERS: BrokerConfig[] = [
  {
    id: "ZEBU",
    name: "Zebu",
    portalUrl: "https://zebuetrade.com/",
    supportsTotp: true,
    requiresPassword: true,
    helpText:
      "You can either paste an access token (if you already have it), or generate it using your Zebu password + TOTP.",
    redirectHint: "Usually not needed for Zebu.",
  },
  {
    id: "DHAN",
    name: "Dhan",
    portalUrl: "https://web.dhan.co/",
    supportsTotp: true,
    requiresPassword: false,
    helpText:
      "You can either paste your Dhan access token, or generate it via TOTP.",
    redirectHint: "Use this in Dhan developer settings if required.",
  },
  {
    id: "ZERODHA",
    name: "Zerodha",
    portalUrl: "https://kite.zerodha.com/",
    supportsTotp: false,
    helpText:
      "Login and approve access. If your app is configured properly, you may be redirected back with a token/code.",
  },
  {
    id: "UPSTOX",
    name: "Upstox",
    portalUrl: "https://upstox.com/",
    supportsTotp: false,
    helpText:
      "Login and authorize. You may be redirected back with a code/token depending on your app configuration.",
  },
  {
    id: "FYERS",
    name: "Fyers",
    portalUrl: "https://fyers.in/",
    supportsTotp: false,
    helpText:
      "Login and authorize. You may be redirected back with an auth code depending on your app configuration.",
  },
  {
    id: "ANGELONE",
    name: "Angel One",
    portalUrl: "https://smartapi.angelbroking.com/",
    supportsTotp: false,
    helpText:
      "Angel One typically uses portal/app flow. Paste the token/code if you receive it.",
  },
];

const clsx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

function sanitizeValue(v: string) {
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return "";
  return t.slice(0, 4096);
}

function sanitizeTotp(v: string) {
  const only = String(v ?? "").replace(/\D/g, "");
  return only.slice(0, 8); // allow 6–8 digits
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
          This page requires a valid <code className="text-slate-200">accountId</code> (tradingAccountId).
          Example:
        </p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
          <div className="text-[11px] text-slate-400">Example</div>
          <div className="mt-2 font-mono text-[12px] text-slate-200 break-all">
            {window.location.origin}/connect-broker?accountId=3&broker=ZEBU
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

  // required: tradingAccountId
  const accountIdRaw = (query.get("accountId") || "").trim();
  const tradingAccountId = Number(accountIdRaw);

  // optional
  const redirect = (query.get("redirect") || "").trim();
  const qsBrokerRaw = (query.get("broker") || "").trim().toUpperCase();
  const planId = (query.get("planId") || "").trim(); // optional (if you want to pass it)

  const initialBroker = useMemo(() => {
    const b = BROKERS.find((x) => x.id === (qsBrokerRaw as any));
    return b || BROKERS[0];
  }, [qsBrokerRaw]);

  const [selectedBroker, setSelectedBroker] = useState<BrokerConfig>(initialBroker);

  const [mode, setMode] = useState<ConnectMode>(() =>
    initialBroker.supportsTotp ? "GENERATE_TOTP" : "PASTE_TOKEN",
  );

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");

  const [status, setStatus] = useState<BrokerStatus>("Waiting");
  const [autoCaptured, setAutoCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [generateZebuAuthToken] = useGenerateZebuAuthTokenMutation();
  const [generateIndianAuthToken] = useGenerateIndianAuthTokenMutation();
  const [saveTradingAccountToken] = useSaveTradingAccountTokenMutation();

  const redirectUri = useMemo(() => `${window.location.origin}${pathname}`, [pathname]);

  const storageKey = useMemo(() => {
    return Number.isFinite(tradingAccountId) ? `broker-connect:${tradingAccountId}` : "broker-connect:unknown";
  }, [tradingAccountId]);

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

  // restore session
  useEffect(() => {
    if (!Number.isFinite(tradingAccountId) || tradingAccountId <= 0) return;

    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);

      if (saved?.brokerId) {
        const b = BROKERS.find((x) => x.id === saved.brokerId);
        if (b) {
          setSelectedBroker(b);
          setMode(b.supportsTotp ? "GENERATE_TOTP" : "PASTE_TOKEN");
        }
      }

      if (typeof saved?.mode === "string" && (saved.mode === "PASTE_TOKEN" || saved.mode === "GENERATE_TOTP")) {
        setMode(saved.mode);
      }

      if (typeof saved?.token === "string") setToken(saved.token);
      if (typeof saved?.password === "string") setPassword(saved.password);
      if (typeof saved?.totp === "string") setTotp(saved.totp);
      if (typeof saved?.autoCaptured === "boolean") setAutoCaptured(saved.autoCaptured);
      if (typeof saved?.status === "string" && ["Waiting", "Ready", "Saved", "Error"].includes(saved.status)) {
        setStatus(saved.status);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // persist session
  useEffect(() => {
    if (!Number.isFinite(tradingAccountId) || tradingAccountId <= 0) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        brokerId: selectedBroker.id,
        mode,
        token,
        password,
        totp,
        status,
        autoCaptured,
      }),
    );
  }, [storageKey, tradingAccountId, selectedBroker.id, mode, token, password, totp, status, autoCaptured]);

  // auto-capture token/code from callback URL
  useEffect(() => {
    if (!Number.isFinite(tradingAccountId) || tradingAccountId <= 0) return;
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
        const clean = sanitizeValue(v);
        if (clean) {
          setToken(clean);
          setAutoCaptured(true);
          setMode("PASTE_TOKEN");
          setStatus("Ready");
        }
        break;
      }
    }
  }, [query, token, tradingAccountId]);

  useEffect(() => {
    if (!Number.isFinite(tradingAccountId) || tradingAccountId <= 0) return;
    if (status === "Saved") sessionStorage.removeItem(storageKey);
  }, [status, storageKey, tradingAccountId]);

  function resetAll(keepBroker = false) {
    if (!keepBroker) setSelectedBroker(initialBroker);
    setMode((keepBroker ? selectedBroker : initialBroker).supportsTotp ? "GENERATE_TOTP" : "PASTE_TOKEN");
    setToken("");
    setPassword("");
    setTotp("");
    setAutoCaptured(false);
    setSubmitting(false);
    setStatus("Waiting");
    if (Number.isFinite(tradingAccountId) && tradingAccountId > 0) sessionStorage.removeItem(storageKey);
  }

  function handleBrokerSelect(b: BrokerConfig) {
    setSelectedBroker(b);
    setMode(b.supportsTotp ? "GENERATE_TOTP" : "PASTE_TOKEN");
    setToken("");
    setPassword("");
    setTotp("");
    setAutoCaptured(false);
    setSubmitting(false);
    setStatus("Waiting");
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

  const canSubmit = useMemo(() => {
    if (status === "Saved") return false;

    if (mode === "PASTE_TOKEN") {
      return !!sanitizeValue(token);
    }

    // GENERATE_TOTP
    if (!selectedBroker.supportsTotp) return false;

    const t = sanitizeTotp(totp);
    if (!t || t.length < 6) return false;

    if (selectedBroker.id === "ZEBU" && !sanitizeValue(password)) return false;
    return true;
  }, [mode, token, totp, password, selectedBroker, status]);

  useEffect(() => {
    if (status === "Saved") return;

    // set Ready if inputs valid, else Waiting
    setStatus(canSubmit ? "Ready" : "Waiting");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit]);

  async function handleSubmit() {
    if (!Number.isFinite(tradingAccountId) || tradingAccountId <= 0) return;

    if (!canSubmit) {
      Swal.fire({
        icon: "warning",
        title: "Missing details",
        text: "Please fill the required fields.",
      });
      return;
    }

    setSubmitting(true);
    setStatus("Waiting");

    try {
      // 1) If paste token: just save it
      if (mode === "PASTE_TOKEN") {
        const clean = sanitizeValue(token);
        await saveTradingAccountToken({
          tradingAccountId,
          token: clean,
          planId: planId || undefined,
        } as any).unwrap();

        setStatus("Saved");
        toast.fire({ icon: "success", title: "Token saved successfully" });

        if (redirect) setTimeout(() => navigate(redirect), 900);
        return;
      }

      // 2) Generate via TOTP
      let res: any;

      if (selectedBroker.id === "ZEBU") {
        res = await generateZebuAuthToken({
          tradingAccountId,
          totp: sanitizeTotp(totp),
          password: sanitizeValue(password),
        } as any).unwrap();
      } else if (selectedBroker.id === "DHAN") {
        res = await generateIndianAuthToken({
          broker: "DHAN",
          tradingAccountId,
          totp: sanitizeTotp(totp),
        } as any).unwrap();
      } else {
        throw new Error("This broker does not support TOTP generation.");
      }

      // If backend returns token, save it.
      const generatedToken = extractTokenAny(res);
      if (generatedToken) {
        await saveTradingAccountToken({
          tradingAccountId,
          token: generatedToken,
          planId: planId || undefined,
        } as any).unwrap();
      }

      setStatus("Saved");
      toast.fire({ icon: "success", title: res?.message || "Broker connected" });

      if (redirect) setTimeout(() => navigate(redirect), 900);
    } catch (err: any) {
      console.error(err);
      setStatus("Error");
      Swal.fire({
        icon: "error",
        title: "Connection failed",
        text: err?.data?.message || err?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!Number.isFinite(tradingAccountId) || tradingAccountId <= 0) return <InvalidLinkView />;

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Connect Broker</h1>
          <p className="mt-2 text-slate-400">
            Link your broker securely to enable automated execution.
          </p>
        </div>

        {/* Broker Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
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
              {b.supportsTotp ? (
                <div className="mt-1 text-[10px] text-slate-500">Token / TOTP</div>
              ) : (
                <div className="mt-1 text-[10px] text-slate-500">Portal flow</div>
              )}
            </button>
          ))}
        </div>

        {/* Action Card */}
        <div className="rounded-3xl border border-white/10 bg-[#070b16] p-6 shadow-2xl md:p-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-semibold">Setup {selectedBroker.name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Trading Account ID:{" "}
                <code className="text-emerald-400 break-all">{tradingAccountId}</code>
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Saved View */}
          {status === "Saved" ? (
            <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-300" size={22} />
                <div className="flex-1">
                  <div className="text-lg font-semibold text-emerald-200">Connection verified</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Your <b>{selectedBroker.name}</b> broker is linked for trading account{" "}
                    <span className="font-mono text-slate-200">{tradingAccountId}</span>.
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
                      onClick={() => resetAll(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/15"
                    >
                      Link again <RefreshCw size={16} />
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
                  label="Copy Trading Account ID"
                  onClick={() => copyToClipboard(String(tradingAccountId), "Trading Account ID")}
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
                {/* Left: portal step */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      1
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Open Broker Portal
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

                    <div className="mt-4 flex flex-wrap gap-4">
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
                  </div>
                </div>

                {/* Right: token / totp */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-400">
                      2
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Connect Method
                    </h3>
                  </div>

                  {/* Mode switch */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-2">
                    <button
                      type="button"
                      onClick={() => setMode("PASTE_TOKEN")}
                      className={clsx(
                        "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                        mode === "PASTE_TOKEN"
                          ? "bg-sky-500 text-black"
                          : "bg-white/5 text-slate-300 hover:bg-white/10",
                      )}
                    >
                      <KeyRound size={16} />
                      Paste Token
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("GENERATE_TOTP")}
                      disabled={!selectedBroker.supportsTotp}
                      className={clsx(
                        "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                        selectedBroker.supportsTotp
                          ? mode === "GENERATE_TOTP"
                            ? "bg-sky-500 text-black"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                          : "bg-white/5 text-slate-600 cursor-not-allowed",
                      )}
                      title={selectedBroker.supportsTotp ? "Generate using TOTP" : "Not supported for this broker"}
                    >
                      <ShieldCheck size={16} />
                      TOTP
                    </button>
                  </div>

                  {/* Inputs */}
                  {mode === "PASTE_TOKEN" ? (
                    <>
                      <div className="group relative">
                        <input
                          type="text"
                          placeholder="Paste access token here..."
                          value={token}
                          onChange={(e) => {
                            const clean = sanitizeValue(e.target.value);
                            setToken(clean);
                            setAutoCaptured(false);
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

                      <div className="text-[11px] text-slate-500">
                        Tip: Don’t paste the full URL. Paste only the token value.
                      </div>
                    </>
                  ) : (
                    <>
                      {!selectedBroker.supportsTotp ? (
                        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-200">
                          This broker does not support TOTP generation. Please use “Paste Token”.
                        </div>
                      ) : (
                        <>
                          {/* ZEBU password */}
                          {selectedBroker.id === "ZEBU" ? (
                            <div>
                              <label className="text-[11px] font-semibold text-slate-400">PASSWORD</label>
                              <div className="mt-2 relative">
                                <input
                                  type="password"
                                  value={password}
                                  onChange={(e) => setPassword(sanitizeValue(e.target.value))}
                                  placeholder="Enter Zebu password"
                                  className="w-full rounded-xl border border-white/10 bg-black/40 py-4 pl-4 pr-11 text-sm outline-none transition-all focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                              </div>
                              <div className="mt-2 text-[11px] text-slate-500">
                                Used only to generate token (via backend).
                              </div>
                            </div>
                          ) : null}

                          {/* TOTP */}
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400">TOTP</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={totp}
                              onChange={(e) => setTotp(sanitizeTotp(e.target.value))}
                              placeholder="Enter 6-digit TOTP"
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 py-4 pl-4 text-sm outline-none transition-all focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50"
                            />
                            <div className="mt-2 text-[11px] text-slate-500">
                              Enter the TOTP shown in your broker app.
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Error */}
                  {status === "Error" ? (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-200">
                      Connection failed. Please verify details and try again.
                    </div>
                  ) : null}

                  {/* Submit */}
                  <button
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                    className={clsx(
                      "w-full rounded-xl py-4 font-bold transition-all",
                      canSubmit && !submitting
                        ? "bg-sky-500 text-black hover:bg-sky-400 shadow-lg shadow-sky-500/20"
                        : "bg-white/5 text-slate-500 cursor-not-allowed",
                    )}
                  >
                    {submitting ? "Processing..." : mode === "PASTE_TOKEN" ? "Save Token" : "Generate & Connect"}
                  </button>

                  <div className="mt-2 text-[11px] text-slate-500">
                    This will securely link your broker for automated execution.
                  </div>
                </div>
              </div>

              {/* Bottom utilities */}
              <div className="mt-10 flex flex-wrap gap-6 border-t border-white/5 pt-6">
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Broker Portal"
                  onClick={() => copyToClipboard(selectedBroker.portalUrl, "Portal URL")}
                />
                <UtilityBtn
                  icon={<Copy size={14} />}
                  label="Copy Trading Account ID"
                  onClick={() => copyToClipboard(String(tradingAccountId), "Trading Account ID")}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => resetAll(true)}
                  className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/15"
                >
                  Reset inputs
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