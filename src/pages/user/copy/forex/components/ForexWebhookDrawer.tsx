// src/pages/copytrading/forex/components/ForexWebhookDrawer.tsx
import React, { useMemo } from "react";
import { Copy, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import Drawer from "./Drawer";
import Switch from "./Switch";

import { btn, clsx } from "../ui";
import { ForexCopyPlanInstance, ForexPlanSignalSettings } from "../forex.types";
import { webhookPayloadExample } from "../forex.dummy";

export default function ForexWebhookDrawer({
  open,
  onClose,
  plan,
  planSignals,
  setPlanSignals,
}: {
  open: boolean;
  onClose: () => void;
  plan: ForexCopyPlanInstance | null;
  planSignals: ForexPlanSignalSettings;
  setPlanSignals: (v: ForexPlanSignalSettings) => void;
}) {
  const enabled = plan ? !!planSignals[plan.planId]?.webhookEnabled : false;

  const payload = useMemo(() => (plan ? webhookPayloadExample(plan.planId) : null), [plan]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  if (!plan) return null;

  return (
    <Drawer open={open} title="Webhook (TradingView)" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Enable Webhook</div>
              <div className="text-xs text-slate-600 mt-1">
                Webhook is per-plan. Keep it OFF if you only use built-in strategies.
              </div>
            </div>
            <Switch
              checked={enabled}
              onChange={(v) => {
                setPlanSignals({
                  ...planSignals,
                  [plan.planId]: {
                    strategiesEnabled: !!planSignals[plan.planId]?.strategiesEnabled,
                    webhookEnabled: v,
                  },
                });
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-xs font-semibold text-slate-600">WEBHOOK URL</div>
          <div className="mt-2 flex items-center gap-2">
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={plan.webhook.endpointUrl} readOnly />
            <button type="button" className={clsx(btn, "text-slate-700 border border-slate-200 bg-white hover:bg-slate-50")} onClick={() => copy(plan.webhook.endpointUrl)}>
              <Copy size={14} />
              Copy
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600" />
            Secret: <span className="font-semibold">{plan.webhook.secretMasked}</span>
            <span className="text-slate-400">(masked)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-xs font-semibold text-slate-600">TRADINGVIEW ALERT JSON</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Paste this JSON in TradingView alert message.
          </div>

          <pre className="mt-3 max-h-[260px] overflow-auto rounded-lg bg-slate-950 text-slate-100 p-3 text-[12px]">
{JSON.stringify(payload, null, 2)}
          </pre>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className={clsx(btn, "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}
              onClick={() => copy(JSON.stringify(payload, null, 2))}
            >
              <Copy size={14} />
              Copy JSON
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Tip: Keep webhook enabled **only for the plan you actually use**.
        </div>
      </div>
    </Drawer>
  );
}
