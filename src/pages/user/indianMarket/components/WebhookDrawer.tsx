import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "react-toastify";
import SlideOver from "./SlideOver";
import ToggleRow from "./ToggleRow";
import { clsx, soft, input, btn, btnGhost, btnPrimary, chip } from "../ui";
import { PlanInstance, PlanSignalSettings } from "../india.types";
import { ApiAccountItem } from "../../ApiAccountsManager";

function safeOrigin() {
  if (typeof window === "undefined") return "https://your-domain.com";
  return window.location.origin || "https://your-domain.com";
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

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

export default function WebhookDrawer({
  open,
  onClose,
  plan,
  accounts,

  planSignals,
  setPlanSignals,
}: {
  open: boolean;
  onClose: () => void;

  plan: PlanInstance | null;
  accounts: ApiAccountItem[];

  planSignals: PlanSignalSettings;
  setPlanSignals: (v: PlanSignalSettings) => void;
}) {
  const planId = plan?.planId ?? "";
  const signals = planId ? planSignals[planId] : undefined;

  const webhookEnabled = !!signals?.webhookEnabled;

  const url = useMemo(() => {
    // ✅ change to your real endpoint
    return `${safeOrigin()}/api/webhooks/tradingview/india`;
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
    setPlanSignals({
      ...planSignals,
      [planId]: { ...(planSignals[planId] ?? {}), webhookEnabled: v },
    });
  };

  const setDefaultAccount = (id: string) => {
    if (!planId) return;
    setPlanSignals({
      ...planSignals,
      [planId]: { ...(planSignals[planId] ?? {}), webhookDefaultAccountId: id },
    });
  };

  const jsonTemplate = useMemo(() => {
    return JSON.stringify(
      {
        market: "INDIA",
        planId: planId || "<PLAN_ID>",
        accountId: defaultAccountId || "<ACCOUNT_ID>",
        secret: secret || "<SECRET>",

        symbol: "{{ticker}}",
        exchange: "{{exchange}}",
        action: "{{strategy.order.action}}",
        quantity: "{{strategy.order.contracts}}",
        price: "{{close}}",
        time: "{{time}}",

        orderType: "MARKET",
        strategyName: "{{strategy.name}}",
        comment: "{{strategy.order.comment}}",
      },
      null,
      2
    );
  }, [planId, defaultAccountId, secret]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="TradingView Webhook"
      subtitle="Enable webhook and copy URL + JSON into TradingView alert. You can keep webhook OFF and use only built-in strategies if you want."
    >
      {!plan ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">Select a plan first.</div>
      ) : (
        <div className="space-y-4">
          <div className={clsx(soft, "p-4")}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-slate-100">{plan.planName}</div>
                <div className="text-xs text-slate-400 mt-1">Webhook is per-plan. Secret should be validated by backend.</div>
              </div>
              <span
                className={clsx(
                  chip,
                  webhookEnabled ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20" : "text-slate-200 bg-white/5 border-white/10"
                )}
              >
                {webhookEnabled ? "Webhook ON" : "Webhook OFF"}
              </span>
            </div>
          </div>

          <ToggleRow
            label="Enable TradingView Webhook"
            hint="If OFF, TradingView alerts won’t trigger trades for this plan."
            value={webhookEnabled}
            onChange={setWebhookEnabled}
          />

          <div className={clsx(webhookEnabled ? "" : "opacity-60")}>
            <div className={clsx(soft, "p-4")}>
              <div className="text-sm font-semibold text-slate-100">Webhook URL</div>
              <div className="text-xs text-slate-400 mt-1">TradingView Alert → Webhook URL</div>
              <div className="mt-3 flex gap-2">
                <input className={clsx(input, "mt-0")} readOnly value={url} />
                <button type="button" className={clsx(btn, btnGhost)} onClick={() => copyText(url)}>
                  <Copy size={16} /> Copy
                </button>
              </div>
            </div>

            <div className={clsx(soft, "p-4")}>
              <div className="text-sm font-semibold text-slate-100">Secret</div>
              <div className="text-xs text-slate-400 mt-1">Put this inside JSON and validate on server.</div>
              <div className="mt-3 flex gap-2">
                <input className={clsx(input, "mt-0")} readOnly value={secret || ""} />
                <button type="button" className={clsx(btn, btnGhost)} onClick={() => copyText(secret || "")}>
                  <Copy size={16} /> Copy
                </button>
              </div>
            </div>

            <div className={clsx(soft, "p-4")}>
              <div className="text-sm font-semibold text-slate-100">Default Account</div>
              <div className="text-xs text-slate-400 mt-1">This accountId is inserted in the JSON template.</div>
              <select className={input} value={defaultAccountId} onChange={(e) => setDefaultAccount(e.target.value)}>
                {accounts.length === 0 ? <option value="">No accounts added</option> : null}
                {accounts.map((a) => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {a.apiName} • {a.type} • {a.enabled ? "Enabled" : "Disabled"}
                  </option>
                ))}
              </select>
            </div>

            <div className={clsx(soft, "p-4")}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-100">TradingView JSON Message</div>
                  <div className="text-xs text-slate-400 mt-1">TradingView Alert → Message</div>
                </div>
                <button type="button" className={clsx(btn, btnGhost)} onClick={() => copyText(jsonTemplate)}>
                  <Copy size={16} /> Copy JSON
                </button>
              </div>

              <pre className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-[12px] text-slate-200 overflow-auto">
{jsonTemplate}
              </pre>
            </div>
          </div>

          <button type="button" className={clsx(btn, btnPrimary, "w-full")} onClick={() => toast.success("Saved (dummy)")}>
            Save
          </button>

          <div className="text-[11px] text-slate-500">
            If both <b>Strategies</b> and <b>Webhook</b> are ON, engine accepts signals from both sources.
          </div>
        </div>
      )}
    </SlideOver>
  );
}
