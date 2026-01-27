import React, { useMemo, useState } from "react";
import Drawer from "../../shared/Drawer";
import { btn, btnGhost, clsx, input, soft } from "../../shared/ui";
import type { CopyPlanInstance, PlanSignalSettings } from "../copyIndia.types";
import { setLS } from "../../shared/storage";
import { Copy, Check } from "lucide-react";

function pretty(obj: any) {
  return JSON.stringify(obj, null, 2);
}

export default function IndiaWebhookDrawer({
  open,
  onClose,
  plan,
  planSignals,
  setPlanSignals,
}: {
  open: boolean;
  onClose: () => void;
  plan: CopyPlanInstance | null;
  planSignals: PlanSignalSettings;
  setPlanSignals: React.Dispatch<React.SetStateAction<PlanSignalSettings>>;
}) {
  const planId = plan?.planId ?? "";
  const enabled = !!(planId && planSignals[planId]?.webhookEnabled);

  const webhookUrl = useMemo(() => {
    // later from backend per-plan. Keep deterministic for UI.
    if (!planId) return "";
    return `https://api.yourdomain.com/webhook/copy/india/${planId}`;
  }, [planId]);

  const samplePayload = useMemo(
    () => ({
      planId,
      masterId: "IND-CT-482913",
      symbol: "NIFTY",
      side: "BUY",
      qty: 1,
      orderType: "MARKET",
      product: "MIS",
      userTag: "tv-alert-1",
      ts: new Date().toISOString(),
    }),
    [planId]
  );

  const [copied, setCopied] = useState<"URL" | "JSON" | null>(null);
  const copyText = async (kind: "URL" | "JSON", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 900);
    } catch {}
  };

  return (
    <Drawer open={open} onClose={onClose} title="Webhook (TradingView)">
      {!plan ? (
        <div className="text-sm text-slate-300">Select a plan first.</div>
      ) : (
        <div className="space-y-4">
          <div className={clsx(soft, "p-4")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">Webhook Toggle</div>
                <div className="text-xs text-slate-400 mt-1">Enable/disable TradingView signals for this plan.</div>
              </div>
              <button
                type="button"
                className={clsx(btn, btnGhost)}
                onClick={() => {
                  setPlanSignals((prev) => {
                    const next = {
                      ...prev,
                      [planId]: {
                        ...(prev[planId] ?? { strategiesEnabled: true, webhookEnabled: false }),
                        webhookEnabled: !enabled,
                      },
                    };
                    setLS("india.planSignals.v1", next);
                    return next;
                  });
                }}
              >
                {enabled ? "Webhook: ON" : "Webhook: OFF"}
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-300">Webhook URL</div>
            <div className="mt-2 flex gap-2">
              <input className={input} value={webhookUrl} readOnly />
              <button
                type="button"
                className={clsx(btn, btnGhost, "px-3")}
                onClick={() => copyText("URL", webhookUrl)}
              >
                {copied === "URL" ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Put this URL in TradingView alert → Webhook URL.
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-300">Sample JSON Message</div>
            <div className={clsx(soft, "p-3 mt-2")}>
              <pre className="text-[12px] leading-5 text-slate-200 overflow-auto max-h-[280px]">
                {pretty(samplePayload)}
              </pre>
            </div>

            <button
              type="button"
              className={clsx(btn, btnGhost, "mt-2")}
              onClick={() => copyText("JSON", pretty(samplePayload))}
            >
              {copied === "JSON" ? <Check size={16} /> : <Copy size={16} />}
              Copy JSON
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Note: Webhook is per-plan. You can keep webhook ON and strategies OFF, or vice-versa.
          </div>
        </div>
      )}
    </Drawer>
  );
}
