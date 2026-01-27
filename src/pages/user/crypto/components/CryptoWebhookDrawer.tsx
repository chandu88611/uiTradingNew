import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "react-toastify";
 
import { CryptoPlanInstance, CryptoPlanSignalSettings } from "../crypto.types";
import { ApiAccountItem } from "../../ApiAccountsManager";
import ToggleRow from "../../forex/components/ToggleRow";
import SlideOver from "../../forex/components/SlideOver";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeOrigin() {
  if (typeof window === "undefined") return "https://your-domain.com";
  return window.location.origin || "https://your-domain.com";
}

function genSecret() {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

export default function CryptoWebhookDrawer({
  open,
  onClose,
  plan,
  accounts,
  planSignals,
  setPlanSignals,
}: {
  open: boolean;
  onClose: () => void;

  plan: CryptoPlanInstance | null;
  accounts: ApiAccountItem[];

  planSignals: CryptoPlanSignalSettings;
  setPlanSignals: (v: CryptoPlanSignalSettings) => void;
}) {
  const planId = plan?.planId ?? "";
  const signals = planId ? planSignals[planId] : undefined;

  const webhookEnabled = !!signals?.webhookEnabled;

  const url = useMemo(() => {
    return `${safeOrigin()}/api/webhooks/tradingview/crypto`;
  }, []);

  const secret = useMemo(() => {
    if (!planId) return "";
    const existing = planSignals[planId]?.webhookSecret;
    if (existing) return existing;

    const s = genSecret();
    setPlanSignals({
      ...planSignals,
      [planId]: { ...(planSignals[planId] ?? {}), webhookSecret: s },
    });
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const defaultAccountId = signals?.webhookDefaultAccountId ?? (accounts[0]?.id ? String(accounts[0].id) : "");

  const setWebhookEnabled = (v: boolean) => {
    if (!planId) return;
    setPlanSignals({ ...planSignals, [planId]: { ...(planSignals[planId] ?? {}), webhookEnabled: v } });
  };

  const setDefaultAccount = (id: string) => {
    if (!planId) return;
    setPlanSignals({ ...planSignals, [planId]: { ...(planSignals[planId] ?? {}), webhookDefaultAccountId: id } });
  };

  const jsonTemplate = useMemo(() => {
    return JSON.stringify(
      {
        market: "CRYPTO",
        planId: planId || "<PLAN_ID>",
        accountId: defaultAccountId || "<ACCOUNT_ID>",
        secret: secret || "<SECRET>",

        symbol: "{{ticker}}",
        action: "{{strategy.order.action}}", // buy/sell
        quantity: "{{strategy.order.contracts}}",
        price: "{{close}}",
        time: "{{time}}",
        strategyName: "{{strategy.name}}",
        comment: "{{strategy.order.comment}}",

        exchangeType: "SPOT_OR_FUTURES", // backend decides based on account type
        orderType: "MARKET",
      },
      null,
      2
    );
  }, [planId, defaultAccountId, secret]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Crypto Webhook"
      subtitle="Enable webhook for this plan and copy URL + JSON into TradingView alert."
    >
      {!plan ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">Select a plan first.</div>
      ) : (
        <div className="space-y-4">
          <ToggleRow
            label="Enable TradingView Webhook"
            hint="If OFF, TradingView alerts won't trigger trades for this plan."
            value={webhookEnabled}
            onChange={setWebhookEnabled}
          />

          <div className={clsx(webhookEnabled ? "" : "opacity-60")}>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-slate-100">Webhook URL</div>
              <div className="text-xs text-slate-400 mt-1">TradingView Alert → Webhook URL</div>
              <div className="mt-3 flex gap-2">
                <input className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100" readOnly value={url} />
                <button type="button" className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200" onClick={() => copyText(url)}>
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-slate-100">Secret</div>
              <div className="text-xs text-slate-400 mt-1">Validate this secret on backend.</div>
              <div className="mt-3 flex gap-2">
                <input className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100" readOnly value={secret || ""} />
                <button type="button" className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200" onClick={() => copyText(secret || "")}>
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-slate-100">Default Account</div>
              <div className="text-xs text-slate-400 mt-1">Used in JSON template.</div>
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 outline-none"
                value={defaultAccountId}
                onChange={(e) => setDefaultAccount(e.target.value)}
              >
                {accounts.length === 0 ? <option value="">No accounts added</option> : null}
                {accounts.map((a) => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {a.apiName} • {a.type} • {a.enabled ? "Enabled" : "Disabled"}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-100">TradingView JSON Message</div>
                  <div className="text-xs text-slate-400 mt-1">TradingView Alert → Message</div>
                </div>
                <button type="button" className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200" onClick={() => copyText(jsonTemplate)}>
                  <Copy size={16} />
                </button>
              </div>

              <pre className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-[12px] text-slate-200 overflow-auto">
{jsonTemplate}
              </pre>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.success("Saved (dummy)")}
            className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold"
          >
            Save
          </button>
        </div>
      )}
    </SlideOver>
  );
}
