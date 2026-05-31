import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "react-toastify";
import SlideOver from "./SlideOver";
import type { ApiAccountItem } from "../../ApiAccountsManager";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

/* ================= JSON BUILDER ================= */

function buildIndianTradingViewJson(args: {
  planId: string;
  accountRowId: string;
  clientId: string;
  apiKey: string;
}) {
  return JSON.stringify(
    {
      market: "INDIAN",
      broker: "ZEBU", // or dynamic later
      planId: args.planId || "<PLAN_ID>",
      accountId: args.accountRowId || "<ACCOUNT_ROW_ID>",
      clientId: args.clientId || "<CLIENT_ID>",
      apiKey: args.apiKey || "<API_KEY>",

      symbol: "{{ticker}}",
      action: "{{strategy.order.action}}",
      quantity: "{{strategy.order.contracts}}",
      price: "{{close}}",
      time: "{{time}}",

      orderType: "MARKET",
    },
    null,
    2
  );
}

/* ================= COMPONENT ================= */

export default function IndianTradingSetupDrawer({
  open,
  onClose,
  planId,
  account,
  webhookUrl,
  webhookEnabled,
}: {
  open: boolean;
  onClose: () => void;

  planId: string;
  account: ApiAccountItem | null;

  webhookUrl: string;
  webhookEnabled: boolean;
}) {
  const accountRowId = account?.id
    ? String(account.id)
    : "";

  const clientId =
    account?.meta?.clientId
      ? String(account.meta.clientId)
      : "";

  const apiKey =
    account?.meta?.apiKey
      ? String(account.meta.apiKey)
      : "";

  const tvJson = useMemo(
    () =>
      buildIndianTradingViewJson({
        planId,
        accountRowId,
        clientId,
        apiKey,
      }),
    [planId, accountRowId, clientId, apiKey]
  );

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Indian Broker Setup"
      subtitle="Copy TradingView JSON for Indian market brokers."
      widthClass="w-full sm:w-[560px]"
    >
      {!account ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          Select an Indian account first.
        </div>
      ) : (
        <div className="space-y-4">

          {!webhookEnabled ? (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="text-xs font-semibold text-yellow-200">
                Webhook is OFF
              </div>
              <div className="text-[11px] text-yellow-100/80 mt-1">
                Enable webhook from top bar.
              </div>
            </div>
          ) : null}

          {/* Webhook URL */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Webhook URL
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                readOnly
                value={webhookUrl}
              />
              <button
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200"
                onClick={() => copyText(webhookUrl)}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* TradingView JSON */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  TradingView JSON
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  TradingView → Alert → Message
                </div>
              </div>
              <button
                onClick={() => copyText(tvJson)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200"
              >
                <Copy size={16} />
              </button>
            </div>

            <pre className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-[12px] text-slate-200 overflow-auto">
{tvJson}
            </pre>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 px-4 py-3 text-sm font-semibold"
          >
            Done
          </button>
        </div>
      )}
    </SlideOver>
  );
}
