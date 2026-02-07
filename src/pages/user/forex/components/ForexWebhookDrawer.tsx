// ForexWebhookDrawer.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, X } from "lucide-react";
import { toast } from "react-toastify";
import SlideOver from "./SlideOver";
import ToggleRow from "./ToggleRow";
import {
  ForexAccountRowLite,
  ForexPlanInstance,
  ForexPlanSignalSettings,
  ForexPlanSignalConfig,
} from "../forex.types";

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

function toNumberOrUndefined(v: string | undefined) {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** ✅ Center modal rendered into document.body so it always appears ABOVE SlideOver */
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

  useEffect(() => setMounted(true), []);

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
        className={clsx(
          "w-[calc(100vw-24px)]",
          "max-w-[760px] md:max-w-5xl lg:max-w-6xl",
          "rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
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

        <div className="max-h-[72vh] md:max-h-[78vh] overflow-auto p-4">{children}</div>

        {footer ? (
          <div className="border-t border-white/10 p-4 bg-slate-950/70 backdrop-blur">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      {subtitle ? <div className="mt-1 text-xs text-slate-400">{subtitle}</div> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className={clsx("rounded-xl border border-white/10 bg-black/20 p-3", disabled && "opacity-60")}>
      <div className="text-xs font-semibold text-slate-200">{label}</div>
      {hint ? <div className="mt-1 text-[11px] text-slate-400">{hint}</div> : null}
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function ForexWebhookDrawer({
  open,
  onClose,
  plan,
  accounts,
  planSignals,
  setPlanSignals,
  webhookUrl,
}: {
  open: boolean;
  onClose: () => void;
  plan: ForexPlanInstance | null;
  accounts: ForexAccountRowLite[];
  planSignals: ForexPlanSignalSettings;
  setPlanSignals: (v: ForexPlanSignalSettings) => void;
  webhookUrl: string;
}) {
  // public/ download
  const mql5EaPath = `signalPoller.ex5`;
  const planId = plan?.planId ?? "";

  // options modal
  const [editorOpen, setEditorOpen] = useState(false);

  // master fallback
  const master = accounts.find((a) => a.isMaster);
  const fallbackId =
    master?.id ? String(master.id) : accounts[0]?.id ? String(accounts[0].id) : "";

  const getCfg = (): ForexPlanSignalConfig => {
    const existing = planId ? (planSignals[planId] as ForexPlanSignalConfig | undefined) : undefined;

    // ✅ STRATEGY ONLY (no indicator toggles at all)
    return (
      existing ?? {
        strategiesEnabled: true,
        webhookEnabled: false,
        webhookSecret: "",
        webhookDefaultAccountId: fallbackId,

        // optional trade params (all OFF by default)
        tvUseCustomQty: false,
        tvCustomQty: "",

        tvUseCustomSl: false,
        tvCustomSl: "",

        tvUseCustomTp: false,
        tvCustomTp: "",

        tvUseCustomTrailingSl: false,
        tvCustomTrailingSl: "",

        // edging
        tvEdgingEnabled: true,
        tvCloseOpposite: true,
      }
    );
  };

  const cfg = planId ? getCfg() : undefined;

  const webhookEnabled = !!cfg?.webhookEnabled;
  const secret = cfg?.webhookSecret ?? "";
  const defaultAccountId = cfg?.webhookDefaultAccountId ?? fallbackId;

  const useCustomQty = !!cfg?.tvUseCustomQty;
  const customQty = cfg?.tvCustomQty ?? "";

  const useCustomSl = !!cfg?.tvUseCustomSl;
  const customSl = cfg?.tvCustomSl ?? "";

  const useCustomTp = !!cfg?.tvUseCustomTp;
  const customTp = cfg?.tvCustomTp ?? "";

  const useCustomTrailingSl = !!cfg?.tvUseCustomTrailingSl;
  const customTrailingSl = cfg?.tvCustomTrailingSl ?? "";

  const edgingEnabled = cfg?.tvEdgingEnabled ?? true;
  const closeOpposite = cfg?.tvCloseOpposite ?? true;

  useEffect(() => {
    if (!planId) return;
    const current = getCfg();
    if (current.webhookSecret) return;

    const s = genSecret();
    setPlanSignals({
      ...planSignals,
      [planId]: { ...current, webhookSecret: s },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const patchCfg = (patch: Partial<ForexPlanSignalConfig>) => {
    if (!planId) return;
    const current = getCfg();
    setPlanSignals({
      ...planSignals,
      [planId]: { ...current, ...patch },
    });
  };

  /** ✅ Your provided STRATEGY payload + optional desired_* fields */
  const messageTemplate = useMemo(() => {
    const qtyNum = toNumberOrUndefined(customQty);
    const slNum = toNumberOrUndefined(customSl);
    const tpNum = toNumberOrUndefined(customTp);
    const trNum = toNumberOrUndefined(customTrailingSl);

    const payload: Record<string, unknown> = {
      ticker: "{{ticker}}",
      exchange: "{{exchange}}",
      interval: "{{interval}}",
      time: "{{time}}",
      timenow: "{{timenow}}",
      open: "{{open}}",
      close: "{{close}}",
      high: "{{high}}",
      low: "{{low}}",
      volume: "{{volume}}",
      currency: "{{syminfo.currency}}",
      baseCurrency: "{{syminfo.basecurrency}}",

      action: "{{strategy.order.action}}",

      strategy: {
        position_size: "{{strategy.position_size}}",
        market_position: "{{strategy.market_position}}",
        market_position_size: "{{strategy.market_position_size}}",
        prev_market_position: "{{strategy.prev_market_position}}",
        prev_market_position_size: "{{strategy.prev_market_position_size}}",
        order: {
          action: "{{strategy.order.action}}",
          contracts: "{{strategy.order.contracts}}",
          price: "{{strategy.order.price}}",
          id: "{{strategy.order.id}}",
          comment: "{{strategy.order.comment}}",
          alert_message: "{{strategy.order.alert_message}}",
        },
      },

      // ✅ platform-side execution knobs (backend reads these)
      edging: {
        enabled: !!edgingEnabled,
        close_opposite: !!closeOpposite,
      },
    };

    // ✅ optional overrides
    if (useCustomQty && qtyNum !== undefined) payload.desired_qty = qtyNum;
    if (useCustomSl && slNum !== undefined) payload.desired_sl = slNum;
    if (useCustomTp && tpNum !== undefined) payload.desired_tp = tpNum;
    if (useCustomTrailingSl && trNum !== undefined) payload.desired_trailing_sl = trNum;

    return JSON.stringify(payload, null, 2);
  }, [
    customQty,
    customSl,
    customTp,
    customTrailingSl,
    useCustomQty,
    useCustomSl,
    useCustomTp,
    useCustomTrailingSl,
    edgingEnabled,
    closeOpposite,
  ]);

  const save = () => {
    toast.success("Saved");
    onClose();
  };

  return (
    <>
      {/* Options modal */}
      <CenterModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Edit Options"
        subtitle="Optional parameters for execution (qty, SL/TP, trailing, edging)."
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
          <Card
            title="Quantity"
            subtitle="If enabled, sends desired_qty (number). Otherwise backend uses strategy contracts."
          >
            <ToggleRow
              label="Use Custom Quantity"
              hint="Sends desired_qty in template."
              value={useCustomQty}
              onChange={(v) => patchCfg({ tvUseCustomQty: v })}
            />
            <div className="mt-3">
              <Field
                label="Custom Qty"
                hint="Example: 0.01 or 1"
                value={customQty}
                placeholder="e.g. 1"
                disabled={!useCustomQty}
                onChange={(v) => patchCfg({ tvCustomQty: v })}
              />
            </div>
          </Card>

          <Card title="Edging" subtitle="Close opposite direction before entry.">
            <div className="space-y-3">
              <ToggleRow
                label="Enable Edging"
                hint="edging.enabled"
                value={!!edgingEnabled}
                onChange={(v) => patchCfg({ tvEdgingEnabled: v })}
              />
              <ToggleRow
                label="Close Opposite Before Entry"
                hint="edging.close_opposite"
                value={!!closeOpposite}
                onChange={(v) => patchCfg({ tvCloseOpposite: v })}
              />
            </div>
          </Card>

          <Card title="Stop Loss" subtitle="Optional. Sends desired_sl if enabled + valid number.">
            <ToggleRow
              label="Use Custom SL"
              hint="Sends desired_sl"
              value={useCustomSl}
              onChange={(v) => patchCfg({ tvUseCustomSl: v })}
            />
            <div className="mt-3">
              <Field
                label="Custom SL"
                hint="Backend interprets by rule (price/pips)."
                value={customSl}
                placeholder="e.g. 1.08250"
                disabled={!useCustomSl}
                onChange={(v) => patchCfg({ tvCustomSl: v })}
              />
            </div>
          </Card>

          <Card title="Take Profit" subtitle="Optional. Sends desired_tp if enabled + valid number.">
            <ToggleRow
              label="Use Custom TP"
              hint="Sends desired_tp"
              value={useCustomTp}
              onChange={(v) => patchCfg({ tvUseCustomTp: v })}
            />
            <div className="mt-3">
              <Field
                label="Custom TP"
                hint="Backend interprets by rule (price/pips)."
                value={customTp}
                placeholder="e.g. 1.09500"
                disabled={!useCustomTp}
                onChange={(v) => patchCfg({ tvCustomTp: v })}
              />
            </div>
          </Card>

          <Card title="Trailing Stop" subtitle="Optional. Sends desired_trailing_sl if enabled + valid number.">
            <ToggleRow
              label="Use Custom Trailing"
              hint="Sends desired_trailing_sl"
              value={useCustomTrailingSl}
              onChange={(v) => patchCfg({ tvUseCustomTrailingSl: v })}
            />
            <div className="mt-3">
              <Field
                label="Custom Trailing"
                hint="Backend interprets by rule (distance)."
                value={customTrailingSl}
                placeholder="e.g. 20"
                disabled={!useCustomTrailingSl}
                onChange={(v) => patchCfg({ tvCustomTrailingSl: v })}
              />
            </div>
          </Card>

          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div className="text-xs font-semibold text-slate-200">Template Preview</div>
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

      {/* Drawer */}
      <SlideOver
        open={open}
        onClose={onClose}
        title="Forex Webhook"
        subtitle="Use TradingView Strategy “Order fills” alert and paste the template below."
      >
        {!plan ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
            Select a plan first.
          </div>
        ) : (
          <div className="space-y-4">
            <ToggleRow
              label="Enable TradingView Webhook"
              hint="If OFF, TradingView alerts won’t trigger trades for this plan."
              value={webhookEnabled}
              onChange={(v) => patchCfg({ webhookEnabled: v })}
            />

            {/* Webhook URL */}
            <div className={clsx("rounded-2xl border border-white/10 bg-white/5 p-4", webhookEnabled ? "" : "opacity-60")}>
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
                  aria-label="Copy webhook url"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Secret */}
            <div className={clsx("rounded-2xl border border-white/10 bg-white/5 p-4", webhookEnabled ? "" : "opacity-60")}>
              <div className="text-sm font-semibold text-slate-100">Secret</div>
              <div className="text-xs text-slate-400 mt-1">Backend validates this secret.</div>
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
                  aria-label="Copy secret"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Default account */}
            <div className={clsx("rounded-2xl border border-white/10 bg-white/5 p-4", webhookEnabled ? "" : "opacity-60")}>
              <div className="text-sm font-semibold text-slate-100">Default Account</div>
              <div className="text-xs text-slate-400 mt-1">
                Used by backend as a fallback if account isn’t passed (prefer master).
              </div>
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 outline-none"
                value={defaultAccountId}
                onChange={(e) => patchCfg({ webhookDefaultAccountId: e.target.value })}
              >
                {accounts.length === 0 ? <option value="">No accounts added</option> : null}
                {accounts.map((a) => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {(a.forexType?.toUpperCase() || "FX") + " • " + (a.forexTraderUserId || a.id)}
                    {a.isMaster ? " • Master" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Edit options button */}
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold"
            >
              Edit Options
            </button>

            {/* Template preview */}
            <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Message Template</div>
                  <div className="text-[11px] text-slate-400">TradingView Alert → Message</div>
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

            {/* Download EA */}
            <a
              href={mql5EaPath}
              download="signalPoller.ex5"
              className={clsx(
                "w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
              )}
            >
              <Download size={16} />
              Download MQL5 EA
            </a>

            <button
              type="button"
              onClick={save}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20 px-4 py-3 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        )}
      </SlideOver>
    </>
  );
}
