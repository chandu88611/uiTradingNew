import React, { useMemo } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "react-toastify";
import SlideOver from "./SlideOver";
import type { ForexPlanInstance } from "../forex.types";
import type { ForexAccountRow } from "../../../../services/forexTraderUserDetails.api";

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

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildTradingViewJson(args: {
  planId: string;
  accountRowId: string;
  mt5LoginId: string;
  secret: string;
}) {
  return JSON.stringify(
    {
      market: "FOREX",
      broker: "MT5",
      planId: args.planId || "<PLAN_ID>",
      accountId: args.accountRowId || "<ACCOUNT_ROW_ID>",
      mt5LoginId: args.mt5LoginId || "<MT5_LOGIN_ID>",
      secret: args.secret || "<SECRET>",

      symbol: "{{ticker}}",
      action: "{{strategy.order.action}}",
      volume: "{{strategy.order.contracts}}",
      price: "{{close}}",
      time: "{{time}}",
      comment: "{{strategy.order.comment}}",

      orderType: "MARKET",
    },
    null,
    2
  );
}

/**
 * ✅ Minimal MT5 EA skeleton:
 * - polls backend endpoint for commands
 * - executes BUY/SELL
 *
 * Backend should return plain text lines:
 *   NONE
 *   OR
 *   BUY|EURUSD|0.10
 *   SELL|XAUUSD|0.01
 */
function buildMt5EaCode(args: {
  apiBase: string;
  mt5LoginId: string;
  secret: string;
}) {
  const apiBase = args.apiBase || "https://backend.tradebro.io";
  const loginId = args.mt5LoginId || "";
  const secret = args.secret || "";

  return `// =======================================================
// TradeBro MT5 Bridge (MQL5) - Minimal Skeleton
// =======================================================
// 1) Put this file into: MQL5/Experts/
// 2) Restart MT5 or refresh Navigator
// 3) In MT5: Tools -> Options -> Expert Advisors
//    ✅ "Allow WebRequest for listed URL"
//    Add: ${apiBase}
// 4) Attach EA to chart + enable Algo Trading
//
// Backend endpoint expected (implement on your server):
//   GET ${apiBase}/api/mt5/bridge/poll?mt5LoginId=<id>&secret=<secret>
//
// Response:
//   "NONE"
//   OR multiple lines like:
//   "BUY|EURUSD|0.10"
//   "SELL|XAUUSD|0.01"
// =======================================================

#property strict
#include <Trade/Trade.mqh>

CTrade trade;

input string API_BASE   = "${apiBase}";
input string MT5_LOGIN  = "${loginId}";
input string SECRET     = "${secret}";
input int    POLL_SEC   = 1;

string Trim(string s) {
  s = StringTrimLeft(s);
  s = StringTrimRight(s);
  return s;
}

int OnInit() {
  Print("TradeBro MT5 Bridge started. MT5_LOGIN=", MT5_LOGIN);
  EventSetTimer(POLL_SEC);
  return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
  EventKillTimer();
}

void OnTimer() {
  string url = API_BASE + "/api/mt5/bridge/poll?mt5LoginId=" + MT5_LOGIN + "&secret=" + SECRET;

  string headers = "Accept: text/plain\\r\\n";
  char data[];
  ArrayResize(data, 0);

  char result[];
  string result_headers;

  ResetLastError();
  int code = WebRequest("GET", url, headers, 5000, data, result, result_headers);

  if(code == -1) {
    int err = GetLastError();
    // common: 4060 (URL not allowed) if you did not whitelist API_BASE in MT5
    if(err != 0) Print("WebRequest failed. err=", err, " (Whitelist API_BASE in MT5 options)");
    return;
  }

  if(code != 200) {
    Print("HTTP ", code, " from server");
    return;
  }

  string body = CharArrayToString(result, 0, -1, CP_UTF8);
  body = Trim(body);

  if(body == "" || body == "NONE") return;

  // multiple commands supported as new lines
  string lines[];
  int n = StringSplit(body, '\\n', lines);
  if(n <= 0) {
    ProcessCommand(body);
    return;
  }
  for(int i=0; i<n; i++) {
    string line = Trim(lines[i]);
    if(line == "") continue;
    ProcessCommand(line);
  }
}

void ProcessCommand(string cmd) {
  // format: ACTION|SYMBOL|VOLUME
  string parts[];
  int n = StringSplit(cmd, '|', parts);
  if(n < 3) {
    Print("Invalid cmd: ", cmd);
    return;
  }

  string action = StringToUpper(Trim(parts[0]));
  string symbol = Trim(parts[1]);
  double vol    = StrToDouble(Trim(parts[2]));

  if(vol <= 0) {
    Print("Invalid volume: ", parts[2]);
    return;
  }

  bool ok=false;
  if(action == "BUY") ok = trade.Buy(vol, symbol);
  else if(action == "SELL") ok = trade.Sell(vol, symbol);
  else {
    Print("Unknown action: ", action);
    return;
  }

  if(!ok) {
    Print("Trade failed. ret=", trade.ResultRetcode(), " ", trade.ResultRetcodeDescription());
  } else {
    Print("Trade OK: ", action, " ", symbol, " vol=", DoubleToString(vol, 2));
  }
}
`;
}

export default function ForexMT5SetupDrawer({
  open,
  onClose,
  plan,
  account,
  webhookUrl,
  mt5BridgeApiBase,
  secret,
  webhookEnabled,
}: {
  open: boolean;
  onClose: () => void;

  plan: ForexPlanInstance | null;
  account: ForexAccountRow | null;

  webhookUrl: string;
  mt5BridgeApiBase: string;

  secret: string;
  webhookEnabled: boolean;
}) {
  const planId = plan?.planId ?? "";
  const rowId = account?.id != null ? String(account.id) : "";
  const mt5LoginId = account?.forexTraderUserId ? String(account.forexTraderUserId) : "";

  const tvJson = useMemo(
    () =>
      buildTradingViewJson({
        planId,
        accountRowId: rowId,
        mt5LoginId,
        secret,
      }),
    [planId, rowId, mt5LoginId, secret]
  );

  const eaCode = useMemo(
    () =>
      buildMt5EaCode({
        apiBase: mt5BridgeApiBase,
        mt5LoginId,
        secret,
      }),
    [mt5BridgeApiBase, mt5LoginId, secret]
  );

  const warnWebhookOff = !webhookEnabled;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="MT5 Setup"
      subtitle="Copy TradingView JSON message and download MQL5 EA for VPS MT5."
      widthClass="w-full sm:w-[560px]"
    >
      {!plan || !account ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          Select a plan and an MT5 account first.
        </div>
      ) : (
        <div className="space-y-4">
          {warnWebhookOff ? (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="text-xs font-semibold text-yellow-200">Webhook is OFF for this plan</div>
              <div className="text-[11px] text-yellow-100/80 mt-1">
                TradingView alerts won’t reach your backend unless Webhook is enabled for the plan.
                (Top bar → Webhook → Enable)
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">Webhook URL</div>
            <div className="text-xs text-slate-400 mt-1">TradingView Alert → Webhook URL</div>
            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                readOnly
                value={webhookUrl}
              />
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200"
                onClick={() => copyText(webhookUrl)}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">Secret (MT5 Account)</div>
            <div className="text-xs text-slate-400 mt-1">
              This secret is embedded in TradingView JSON + EA file (you should validate on backend).
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                readOnly
                value={secret || ""}
              />
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200"
                onClick={() => copyText(secret || "")}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-100">TradingView JSON Message</div>
                <div className="text-xs text-slate-400 mt-1">TradingView Alert → Message</div>
              </div>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200"
                onClick={() => copyText(tvJson)}
              >
                <Copy size={16} />
              </button>
            </div>

            <pre className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-[12px] text-slate-200 overflow-auto">
{tvJson}
            </pre>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">Download MQL5 EA</div>
            <div className="text-xs text-slate-400 mt-1">
              Put it on VPS MT5: <b>MQL5/Experts/</b> and whitelist <b>{mt5BridgeApiBase}</b> in MT5 WebRequest.
            </div>

            <button
              type="button"
              onClick={() => {
                const filename = `TradeBro_MT5_Bridge_${mt5LoginId || rowId}.mq5`;
                downloadTextFile(filename, eaCode);
                toast.success("MQL5 file downloaded");
              }}
              className={clsx(
                "mt-3 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
              )}
            >
              <Download size={16} />
              Download MQL5 EA
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              toast.success("Saved");
              onClose();
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 px-4 py-3 text-sm font-semibold"
          >
            Done
          </button>
        </div>
      )}
    </SlideOver>
  );
}
