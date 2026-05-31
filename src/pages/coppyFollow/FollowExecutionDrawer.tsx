import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import type { NormalizedFollow } from "./normalizeFollow";
import SlideOver from "../user/forex/components/SlideOver";

function clsx(...p: any[]) {
  return p.filter(Boolean).join(" ");
}

// same constants (keep once in shared util if you want)
const CTRADER_CLIENT_ID = "19864_DpBIU4nNUHVa3Rj01eJG7zZFta16nCsfkStt3n5xRI2niE7Ne7";
const CTRADER_REDIRECT_URI = "https://backend.tradebro.io/ctrader/callback";
const CTRADER_GRANT_URL_BASE = "https://id.ctrader.com/my/settings/openapi/grantingaccess/";

function buildCtraderGrantUrl(state?: string) {
  const u = new URL(CTRADER_GRANT_URL_BASE);
  u.searchParams.set("client_id", CTRADER_CLIENT_ID);
  u.searchParams.set("redirect_uri", CTRADER_REDIRECT_URI);
  u.searchParams.set("scope", "trading");
  u.searchParams.set("product", "web");
  u.searchParams.set("state", state || "");
  return u.toString();
}

function isFollowCtrader(f: NormalizedFollow) {
  const hint =
    String((f as any)?.meta?.executionBroker ?? (f as any)?.meta?.broker ?? f.brokerLabel ?? "").toLowerCase();
  return hint.includes("ctrader") || hint.includes("c trader") || !!(f as any)?.meta?.ctraderAccountId;
}

const input =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none " +
  "focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40";

export default function FollowExecutionDrawer({
  open,
  follow,
  onClose,
  onSave,
}: {
  open: boolean;
  follow: NormalizedFollow | null;
  onClose: () => void;
  onSave: (patch: any) => void;
}) {
  const [status, setStatus] = useState("ACTIVE");
  const [riskMode, setRiskMode] = useState("multiplier");
  const [riskValue, setRiskValue] = useState("1");

  // execution fields
  const [executionBroker, setExecutionBroker] = useState("");
  const [executionAccountId, setExecutionAccountId] = useState("");

  // credentials (for Indian / Crypto etc)
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [token, setToken] = useState("");

  const market = follow?.market;

  const ctrader = useMemo(() => (follow ? follow.market === "FOREX" && isFollowCtrader(follow) : false), [follow]);

  useEffect(() => {
    if (!open || !follow) return;

    setStatus(String(follow.status ?? "ACTIVE"));
    setRiskMode(String((follow as any).riskMode ?? "multiplier"));
    setRiskValue(String((follow as any).riskValue ?? "1"));

    setExecutionBroker(String((follow as any)?.meta?.executionBroker ?? follow.brokerLabel ?? ""));
    setExecutionAccountId(String((follow as any)?.meta?.executionAccountId ?? follow.followerTradingAccountId ?? ""));

    const creds = (follow as any)?.meta?.executionCredentials || {};
    setApiKey(String(creds.apiKey ?? ""));
    setApiSecret(String(creds.apiSecret ?? ""));
    setToken(String(creds.token ?? ""));
  }, [open, follow]);

  if (!follow) return null;

  const save = () => {
    const patch = {
      status,
      riskMode,
      riskValue,
      executionBroker,
      executionAccountId,
      executionCredentials: {
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        token: token || undefined,
      },
    };
    onSave(patch);
  };

  const doCtraderRedirect = () => {
    const state = String((follow as any)?.meta?.ctraderAccountId ?? follow.followerTradingAccountId ?? follow.id ?? "");
    window.location.assign(buildCtraderGrantUrl(state));
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={`Follow #${follow.id} · Execution Setup`}
      subtitle="Connect your execution account (token / OAuth) and edit follow settings."
      widthClass="w-full sm:w-[560px]"
    >
      <div className="space-y-5">
        {/* Top summary */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-slate-100">{follow.accountLabel || "Master Account"}</div>
          <div className="mt-1 text-[12px] text-slate-400">
            Master ID: <span className="text-slate-200">{follow.masterId ?? "—"}</span>
            {"  ·  "}
            Follower Account ID: <span className="text-slate-200">{follow.followerTradingAccountId ?? "—"}</span>
          </div>
        </div>

        {/* Status + Risk */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-300">STATUS</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-300">RISK MODE</div>
            <select value={riskMode} onChange={(e) => setRiskMode(e.target.value)} className={input}>
              <option value="multiplier">multiplier</option>
              <option value="fixed">fixed</option>
              <option value="percent">percent</option>
            </select>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-300">RISK VALUE</div>
            <input value={riskValue} onChange={(e) => setRiskValue(e.target.value)} className={input} />
          </div>
        </div>

        {/* Execution */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-100">Execution Account</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-300">BROKER</div>
              <input
                value={executionBroker}
                onChange={(e) => setExecutionBroker(e.target.value)}
                className={input}
                placeholder={market === "INDIAN" ? "Zebu / Dhan / Kite ..." : "cTrader / MT5 / Exchange"}
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-300">EXECUTION ACCOUNT ID</div>
              <input
                value={executionAccountId}
                onChange={(e) => setExecutionAccountId(e.target.value)}
                className={input}
                placeholder="Account id / client id"
              />
            </div>
          </div>

          {/* ✅ Forex cTrader OAuth flow */}
          {ctrader ? (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="text-xs font-semibold text-yellow-200">Action required: cTrader OAuth</div>
              <div className="mt-1 text-[11px] text-yellow-100/80">
                Click Verify/Reconnect → login to cTrader → grant access → after redirect back, refresh this page.
              </div>

              <button
                type="button"
                onClick={doCtraderRedirect}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                <ExternalLink size={16} />
                Verify / Reconnect cTrader
              </button>
            </div>
          ) : null}

          {/* ✅ Indian token / keys (Zebu etc) */}
          {market === "INDIAN" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold text-slate-300">API KEY</div>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={input} placeholder="Zebu apiKey" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-300">API SECRET</div>
                <input
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className={input}
                  placeholder="Zebu apiSecret"
                  type="password"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-[11px] font-semibold text-slate-300">ACCESS TOKEN</div>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={input}
                  placeholder="Zebu access token"
                  type="password"
                />
              </div>
            </div>
          ) : null}

          {/* If you want Crypto keys here similarly later */}
        </div>

        <button
          type="button"
          onClick={save}
          className={clsx(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
            "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          )}
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </SlideOver>
  );
}
