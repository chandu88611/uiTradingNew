import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, X } from "lucide-react";
import { toast } from "react-toastify";
import { useSaveWebhookSettingsMutation } from "../../../services/profileSubscription.api";

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

function toNumberOrDefault(value: string | undefined, fallback: number) {
  const s = String(value ?? "").trim();
  if (!s) return fallback;

  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

/* ===== types ===== */

export type PlanLike = {
  planId?: string | number;
  id?: string | number;
  name?: string;
};

export type AccountLiteLike = {
  id: string | number;
  isMaster?: boolean;
  forexType?: string;
  forexTraderUserId?: string;
  type?: string;
  apiName?: string;
  accountId?: string | number;
};

export type PlanSignalsMap = Record<string, any>;

type MarketType = "FOREX" | "CRYPTO" | "INDIAN";
type TradeAction = "BUY" | "SELL";
type ExecutionMode = "OPEN" | "CLOSE";
type OrderType = "MARKET" | "LIMIT";

type WebhookCfg = {
  webhookEnabled: boolean;
  webhookDefaultAccountId: string;

  tvMarket: MarketType;
  tvAction: TradeAction;
  tvExecutionMode: ExecutionMode;
  tvOrderType: OrderType;
  tvTradingStrength: string;

  tvStopLossDistance: string;
  tvTakeProfitDistance: string;
  tvTrailingStopLoss: boolean;

  // Indian market specific fields
  tvIndianInstrumentType?: string;
  tvIndianProduct?: string;
  tvIndianOptionType?: string;
  tvIndianStrike?: string;
};

/* ===== UI ===== */

function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "w-full sm:w-[620px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className={clsx(
          "absolute right-0 top-0 h-full bg-slate-950 text-white shadow-2xl border-l border-white/10",
          widthClass
        )}
      >
        <div className="border-b border-white/10 p-4">
          <div className="text-base font-semibold text-slate-100">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          ) : null}
        </div>

        <div className="p-4 overflow-auto h-[calc(100%-72px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{label}</div>
          {hint ? (
            <div className="mt-1 text-xs text-slate-400">{hint}</div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onChange(!value)}
          className={clsx(
            "relative h-6 w-11 rounded-full border transition",
            value
              ? "bg-emerald-500/90 border-emerald-400/40"
              : "bg-slate-800 border-slate-700"
          )}
          aria-pressed={value}
        >
          <span
            className={clsx(
              "absolute top-[3px] h-4 w-4 rounded-full bg-slate-950 transition",
              value ? "left-6" : "left-[3px]"
            )}
          />
        </button>
      </div>
    </div>
  );
}

function CenterModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[calc(100vw-24px)] max-w-[900px] rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-slate-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-auto p-4">{children}</div>

        {footer ? (
          <div className="border-t border-white/10 p-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function accountLabel(a: AccountLiteLike) {
  const t = String(a.forexType ?? a.type ?? "ACC").toUpperCase();
  const id = String(a.accountId ?? a.forexTraderUserId ?? a.apiName ?? a.id);

  return `${t} • ${id}${a.isMaster ? " • Master" : ""}`;
}

/* ===== component ===== */

export default function MarketWebhookDrawer({
  open,
  onClose,
  plan,
  accounts,
  planSignals,
  setPlanSignals,
  webhookUrl,
  market,
  title = "Webhook",
  subtitle = "Use TradingView alert and paste the template below.",
  downloadPath,
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanLike | null;
  accounts: AccountLiteLike[];
  planSignals: PlanSignalsMap;
  setPlanSignals: (v: PlanSignalsMap) => void;
  webhookUrl: string;
  market: MarketType;
  title?: string;
  subtitle?: string;
  downloadPath?: string;
}) {
  const planId = String(plan?.id ?? plan?.planId ?? "").trim();
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveWebhookSettings, { isLoading: savingWebhook }] =
    useSaveWebhookSettingsMutation();

  const master = accounts.find((a) => a.isMaster);

  const fallbackId =
    master?.id != null
      ? String(master.id)
      : accounts[0]?.id != null
      ? String(accounts[0].id)
      : "";

  const getCfg = (): WebhookCfg => {
    const existing = planId
      ? ((planSignals[planId] ?? {}) as Partial<WebhookCfg>)
      : undefined;

    return {
      webhookEnabled: existing?.webhookEnabled ?? true,
      webhookDefaultAccountId:
        existing?.webhookDefaultAccountId ?? fallbackId,

      tvMarket: existing?.tvMarket ?? market,
      tvAction: existing?.tvAction ?? "BUY",
      tvExecutionMode: existing?.tvExecutionMode ?? "OPEN",
      tvOrderType: existing?.tvOrderType ?? "MARKET",
      tvTradingStrength: existing?.tvTradingStrength ?? "0.8",

      tvStopLossDistance: existing?.tvStopLossDistance ?? "7",
      tvTakeProfitDistance: existing?.tvTakeProfitDistance ?? "10",
      tvTrailingStopLoss: existing?.tvTrailingStopLoss ?? true,

      tvIndianInstrumentType: existing?.tvIndianInstrumentType ?? "EQUITY",
      tvIndianProduct: existing?.tvIndianProduct ?? "INTRADAY",
      tvIndianOptionType: existing?.tvIndianOptionType ?? "CE",
      tvIndianStrike: existing?.tvIndianStrike ?? "",
    };
  };

  const cfg = planId ? getCfg() : undefined;

  const webhookEnabled = !!cfg?.webhookEnabled;
  const defaultAccountId = String(cfg?.webhookDefaultAccountId ?? fallbackId);
  const webhookToken = useMemo(() => {
    try {
      return new URL(webhookUrl).searchParams.get("token") ?? "";
    } catch {
      return "";
    }
  }, [webhookUrl]);

  const selectedMarket = (cfg?.tvMarket ?? market) as MarketType;
  const action = (cfg?.tvAction ?? "BUY") as TradeAction;
  const executionMode = (cfg?.tvExecutionMode ?? "OPEN") as ExecutionMode;
  const orderType = (cfg?.tvOrderType ?? "MARKET") as OrderType;

  const tradingStrength = String(cfg?.tvTradingStrength ?? "0.8");
  const stopLossDistance = String(cfg?.tvStopLossDistance ?? "7");
  const takeProfitDistance = String(cfg?.tvTakeProfitDistance ?? "10");
  const trailingStopLoss = !!cfg?.tvTrailingStopLoss;

  const indianInstrumentType = String(cfg?.tvIndianInstrumentType ?? "EQUITY");
  const indianProduct = String(cfg?.tvIndianProduct ?? "INTRADAY");
  const indianOptionType = String(cfg?.tvIndianOptionType ?? "CE");
  const indianStrike = String(cfg?.tvIndianStrike ?? "");

  useEffect(() => {
    if (!planId) return;

    const current = getCfg();

    let changed = false;

    const next: WebhookCfg = {
      ...current,
    };

    if (next.tvMarket !== market) {
      next.tvMarket = market;
      changed = true;
    }

    if (!changed) return;

    setPlanSignals({
      ...planSignals,
      [planId]: next,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, market]);

  const patchCfg = (patch: Partial<WebhookCfg>) => {
    if (!planId) return;

    const current = getCfg();

    setPlanSignals({
      ...planSignals,
      [planId]: {
        ...current,
        ...patch,
      },
    });
  };

  const messageTemplate = useMemo(() => {
    const tradingStrengthNum = toNumberOrDefault(tradingStrength, 0.8);
    const stopLossDistanceNum = toNumberOrDefault(stopLossDistance, 7);
    const takeProfitDistanceNum = toNumberOrDefault(takeProfitDistance, 10);

    // Base fields common to all markets
    const baseTemplate = `{
  "market": "${selectedMarket}",
  "ticker": "{{ticker}}",
  "exchange": "{{exchange}}",
  "interval": "{{interval}}",
  "entryRef": "{{ticker}}-{{time}}",
  "barTime": "{{time}}",
  "alertTime": "{{timenow}}",
  "open": {{open}},
  "close": {{close}},
  "high": {{high}},
  "low": {{low}},
  "volume": {{volume}},
  "action": "${action}",
  "executionMode": "${executionMode}",
  "orderType": "${orderType}",
  "tradingStrength": ${tradingStrengthNum},
  "stopLossDistance": ${stopLossDistanceNum},
  "takeProfitDistance": ${takeProfitDistanceNum},
  "trailingStopLoss": ${trailingStopLoss}`;

    // Add Indian market specific fields
    if (selectedMarket === "INDIAN") {
      const strikeVal = indianStrike ? Number(indianStrike) : null;
      const optTypeVal = indianInstrumentType === "OPTIONS" ? `"${indianOptionType}"` : "null";
      const strikeFieldVal = indianInstrumentType === "OPTIONS" ? strikeVal : "null";
      const expiryVal = indianInstrumentType === "FUTURES" || indianInstrumentType === "OPTIONS" ? `"{{expiry}}"` : "null";

      return `${baseTemplate},
  "instrumentType": "${indianInstrumentType}",
  "product": "${indianProduct}",
  "underlying": "{{ticker}}",
  "expiry": ${expiryVal},
  "optionType": ${optTypeVal},
  "strike": ${strikeFieldVal},
  "tradingSymbol": "{{tradingSymbol}}"
}`;
    }

    return `${baseTemplate}
}`;
  }, [
    selectedMarket,
    action,
    executionMode,
    orderType,
    tradingStrength,
    stopLossDistance,
    takeProfitDistance,
    trailingStopLoss,
    indianInstrumentType,
    indianProduct,
    indianOptionType,
    indianStrike,
  ]);

  const save = async () => {
    if (!planId) return;
    try {
      await saveWebhookSettings({
        planId,
        isWebhookEnabled: webhookEnabled,
        defaultTradingAccountId: defaultAccountId || null,
        payloadDefaults: {
          market: selectedMarket,
          action,
          executionMode,
          orderType,
          tradingStrength: toNumberOrDefault(tradingStrength, 0.8),
          stopLossDistance: toNumberOrDefault(stopLossDistance, 7),
          takeProfitDistance: toNumberOrDefault(takeProfitDistance, 10),
          trailingStopLoss,
        },
      }).unwrap();
      toast.success("Webhook settings saved");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Webhook save failed");
    }
  };

  return (
    <>
      <CenterModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Edit Payload Options"
        subtitle="Same payload structure is used for FOREX, CRYPTO and INDIAN. Only market value changes."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => copyText(messageTemplate)}
              className="w-full sm:w-auto rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold"
            >
              <span className="inline-flex items-center gap-2">
                <Copy size={16} /> Copy Template
              </span>
            </button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Market
            </div>
            <div className="text-xs text-slate-400 mt-1">
              This is fixed from current trading page.
            </div>

            <input
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none opacity-80"
              value={selectedMarket}
              readOnly
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Action
            </div>
            <div className="text-xs text-slate-400 mt-1">
              This will be sent as action in the webhook payload.
            </div>

            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
              value={action}
              onChange={(e) =>
                patchCfg({ tvAction: e.target.value as TradeAction })
              }
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Execution Mode
            </div>
            <div className="text-xs text-slate-400 mt-1">
              OPEN for new trade, CLOSE for closing trade.
            </div>

            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
              value={executionMode}
              onChange={(e) =>
                patchCfg({
                  tvExecutionMode: e.target.value as ExecutionMode,
                })
              }
            >
              <option value="OPEN">OPEN</option>
              <option value="CLOSE">CLOSE</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Order Type
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Default is MARKET.
            </div>

            <select
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
              value={orderType}
              onChange={(e) =>
                patchCfg({ tvOrderType: e.target.value as OrderType })
              }
            >
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Trading Strength
            </div>
            <div className="text-xs text-slate-400 mt-1">Example: 0.8</div>

            <input
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
              value={tradingStrength}
              onChange={(e) =>
                patchCfg({ tvTradingStrength: e.target.value })
              }
              placeholder="0.8"
              inputMode="decimal"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Stop Loss Distance
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Common for all markets. Example: 7
            </div>

            <input
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
              value={stopLossDistance}
              onChange={(e) =>
                patchCfg({ tvStopLossDistance: e.target.value })
              }
              placeholder="7"
              inputMode="decimal"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">
              Take Profit Distance
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Common for all markets. Example: 10
            </div>

            <input
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
              value={takeProfitDistance}
              onChange={(e) =>
                patchCfg({ tvTakeProfitDistance: e.target.value })
              }
              placeholder="10"
              inputMode="decimal"
            />
          </div>

          <ToggleRow
            label="Trailing Stop Loss"
            hint="Common for FOREX, CRYPTO and INDIAN."
            value={trailingStopLoss}
            onChange={(v) => patchCfg({ tvTrailingStopLoss: v })}
          />

          {selectedMarket === "INDIAN" && (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-slate-100">
                  Instrument Type
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  EQUITY, FUTURES, or OPTIONS
                </div>

                <select
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
                  value={indianInstrumentType}
                  onChange={(e) =>
                    patchCfg({ tvIndianInstrumentType: e.target.value })
                  }
                >
                  <option value="EQUITY">EQUITY</option>
                  <option value="FUTURES">FUTURES</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-slate-100">
                  Product Type
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  INTRADAY, DELIVERY, or MARGIN
                </div>

                <select
                  className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
                  value={indianProduct}
                  onChange={(e) =>
                    patchCfg({ tvIndianProduct: e.target.value })
                  }
                >
                  <option value="INTRADAY">INTRADAY</option>
                  <option value="DELIVERY">DELIVERY</option>
                  <option value="MARGIN">MARGIN</option>
                </select>
              </div>

              {indianInstrumentType === "OPTIONS" && (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-slate-100">
                      Option Type
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      CE (Call) or PE (Put)
                    </div>

                    <select
                      className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
                      value={indianOptionType}
                      onChange={(e) =>
                        patchCfg({ tvIndianOptionType: e.target.value })
                      }
                    >
                      <option value="CE">CE (Call)</option>
                      <option value="PE">PE (Put)</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-slate-100">
                      Strike Price
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Example: 25000 for NIFTY
                    </div>

                    <input
                      className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none"
                      value={indianStrike}
                      onChange={(e) =>
                        patchCfg({ tvIndianStrike: e.target.value })
                      }
                      placeholder="25000"
                      inputMode="decimal"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div className="text-xs font-semibold text-slate-200">
                Template Preview
              </div>

              <button
                type="button"
                onClick={() => copyText(messageTemplate)}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-slate-200"
              >
                <span className="inline-flex items-center gap-2">
                  <Copy size={14} /> Copy
                </span>
              </button>
            </div>

            <pre className="max-h-72 overflow-auto p-3 text-[12px] leading-relaxed text-slate-200">
              {messageTemplate}
            </pre>
          </div>
        </div>
      </CenterModal>

      <SlideOver
        open={open}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
      >
        {!planId ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
            Select a plan first.
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={clsx(
                "rounded-2xl border border-white/10 bg-white/5 p-4",
                webhookEnabled ? "" : "opacity-60"
              )}
            >
              <div className="text-sm font-semibold text-slate-100">
                Webhook URL
              </div>
              <div className="text-xs text-slate-400 mt-1">
                TradingView Alert → Webhook URL
              </div>

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

            <div
              className={clsx(
                "rounded-2xl border border-white/10 bg-white/5 p-4",
                webhookEnabled ? "" : "opacity-60"
              )}
            >
              <div className="text-sm font-semibold text-slate-100">
                Webhook token
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Backend validates the token embedded in the webhook URL.
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
                  readOnly
                  value={webhookToken || ""}
                />

                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-slate-200"
                  onClick={() => copyText(webhookToken || "")}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div
              className={clsx(
                "rounded-2xl border border-white/10 bg-white/5 p-4",
                webhookEnabled ? "" : "opacity-60"
              )}
            >
              <div className="text-sm font-semibold text-slate-100">
                Default Account
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Used by backend as fallback.
              </div>

              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 outline-none"
                value={defaultAccountId}
                onChange={(e) =>
                  patchCfg({ webhookDefaultAccountId: e.target.value })
                }
              >
                {accounts.length === 0 ? (
                  <option value="">No accounts added</option>
                ) : null}

                {accounts.map((a) => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {accountLabel(a)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold"
            >
              Edit Payload Options
            </button>

            <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Message Template
                  </div>
                  <div className="text-[11px] text-slate-400">
                    TradingView Alert → Message
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-slate-200"
                  onClick={() => copyText(messageTemplate)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy size={14} /> Copy
                  </span>
                </button>
              </div>

              <pre className="max-h-44 overflow-auto p-3 text-[12px] leading-relaxed text-slate-200">
                {messageTemplate}
              </pre>
            </div>

            {downloadPath ? (
              <a
                href={downloadPath}
                download
                className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/20 px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download
              </a>
            ) : null}

            <button
              type="button"
              onClick={save}
              disabled={savingWebhook}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold"
            >
              {savingWebhook ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </SlideOver>
    </>
  );
}
