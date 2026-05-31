import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import {
  useToggleStrategyPlanMutation,
  useUpdateStrategyPlanVolumeMutation,
} from "../../../services/strategy.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Feature = { featureKey: string; featureValue: string };

export type PlanFromSub = {
  id?: number | string;
  planId?: number | string;
  name?: string;
  planType?: { code?: string };
  limits?: { maxActiveStrategies?: number | null } | null;
  features?: Feature[] | null;
  planStrategies?: PlanStrategyRow[] | null;
  market?: { code?: string; name?: string } | string;
  metadata?: { market?: string } | any;

  strategy?: {
    instanceId?: number;
    status?: string;
    volume?: number;
    hedgingEnabled?: boolean;
    definition?: {
      id?: number | string;
      strategyCode?: string;
      name?: string;
      isActive?: boolean;
    };
    managedByAdminWebhook?: boolean;
  } | null;
};

export type PlanStrategyRow = {
  id: string;
  planId: number | string;
  strategyId: string;
  createdAt?: string;
  instanceId?: number;
  enabled?: boolean;
  strategy?: {
    id: string;
    strategyCode?: string;
    name: string;
    description?: string;
    category?: string;
    version?: number;
    riskProfile?: string;
    isActive?: boolean;
    isDeprecated?: boolean;
  };
};

export type PlanSignalsMap = Record<string, any>;
export type StrategySelectionsMap = Record<string, string[]>;

function getMaxStrategiesFromPlan(plan: PlanFromSub | null) {
  const direct = plan?.limits?.maxActiveStrategies;
  if (typeof direct === "number") return direct;

  const fv = (plan?.features ?? []).find(
    (f) => String(f.featureKey).toLowerCase() === "max_strategies"
  )?.featureValue;

  if (fv != null) {
    const n = Number(String(fv));
    if (Number.isFinite(n)) return n;
  }

  return 0;
}

function normalizeVolumeInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");

  if (!cleaned) return "";

  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }

  return cleaned;
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0.01;
  if (value < 0.01) return 0.01;
  if (value > 0.1) return 0.1;
  return Number(value.toFixed(2));
}

function formatVolume(value: number) {
  return value.toFixed(2);
}

function parseVolumeInput(input: string, fallback: number) {
  if (!input || input === ".") return fallback;

  const parsed = Number(input);
  if (Number.isNaN(parsed)) return fallback;

  return clampVolume(parsed);
}

function normalizeStrategyStatus(status?: string) {
  const s = String(status ?? "").trim().toLowerCase();

  if (!s) return "inactive";
  if (["active", "enabled", "running", "on"].includes(s)) return "active";
  if (["paused", "pause"].includes(s)) return "paused";
  if (["disabled", "inactive", "stopped", "off"].includes(s)) return "inactive";

  return s;
}

function isStrategyEnabledFromStatus(status?: string) {
  return normalizeStrategyStatus(status) === "active";
}

function getStrategyStatusText(status?: string) {
  const normalized = normalizeStrategyStatus(status);
  if (normalized === "active") return "Active";
  if (normalized === "paused") return "Paused";
  if (normalized === "inactive") return "Inactive";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "w-full sm:w-[640px]",
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
          "absolute right-0 top-0 h-full border-l border-white/10 bg-slate-950 text-white shadow-2xl",
          widthClass
        )}
      >
        <div className="border-b border-white/10 p-4">
          <div className="text-base font-semibold text-slate-100">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          ) : null}
        </div>

        <div className="h-[calc(100%-72px)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function StatusPill({
  children,
  active = false,
  tone = "default",
}: {
  children: React.ReactNode;
  active?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
      : tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : active
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-slate-300";

  return (
    <span
      className={clsx(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium",
        toneClass
      )}
    >
      {children}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function ToggleControl({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={clsx(
        "relative h-6 w-11 rounded-full border transition",
        value
          ? "border-emerald-400/40 bg-emerald-500/90"
          : "border-slate-700 bg-slate-800",
        disabled && "cursor-not-allowed opacity-60"
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
  );
}

export default function MarketStrategiesDrawer({
  open,
  onClose,
  plan,
  planSignals,
  setPlanSignals,
  selections,
  setSelections,
  uiDebugUnlockAll,
  title = "Strategies",
  subtitle = "Manage strategy status and desired lot size separately.",
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanFromSub | null;
  planSignals: PlanSignalsMap;
  setPlanSignals: (v: PlanSignalsMap) => void;
  selections: StrategySelectionsMap;
  setSelections: (v: StrategySelectionsMap) => void;
  uiDebugUnlockAll: boolean;
  title?: string;
  subtitle?: string;
}) {
  const planId = String(plan?.id ?? plan?.planId ?? "").trim();
  const maxActive = getMaxStrategiesFromPlan(plan);
  const planStrategies = (plan?.planStrategies ?? []) as PlanStrategyRow[];

  const liveStrategyStatus = plan?.strategy?.status;
  const liveStrategyEnabled = isStrategyEnabledFromStatus(liveStrategyStatus);
  const liveStrategyVolume = clampVolume(Number(plan?.strategy?.volume ?? 0.01));
  const liveHedgingEnabled = Boolean(
    planSignals?.[planId]?.hedgingEnabled ?? plan?.strategy?.hedgingEnabled ?? false
  );

  const list = useMemo(() => {
    return planStrategies.map((ps) => {
      const s = ps.strategy ?? ({} as any);
      const sid = String(ps.strategyId ?? s.id ?? ps.id);

      return {
        key: sid,
        name: String(s.name ?? `Strategy ${sid}`),
        description: String(s.description ?? ""),
        tags: [
          s.category ? String(s.category) : null,
          s.riskProfile ? String(s.riskProfile) : null,
          s.version != null ? `v${s.version}` : null,
        ].filter(Boolean) as string[],
      };
    });
  }, [planStrategies]);

  const allKeys = useMemo(() => list.map((item) => item.key), [list]);

  const [savedStrategyEnabled, setSavedStrategyEnabled] = useState(false);
  const [draftStrategyEnabled, setDraftStrategyEnabled] = useState(false);

  const [savedVolume, setSavedVolume] = useState(0.01);
  const [volumeInput, setVolumeInput] = useState("0.01");

  const [savedHedgingEnabled, setSavedHedgingEnabled] = useState(false);
  const [draftHedgingEnabled, setDraftHedgingEnabled] = useState(false);

  useEffect(() => {
    if (!open || !planId) return;

    const initialVolume = clampVolume(
      Number(planSignals?.[planId]?.desiredVolume ?? liveStrategyVolume ?? 0.01)
    );

    const initialHedging = Boolean(
      planSignals?.[planId]?.hedgingEnabled ?? liveHedgingEnabled
    );

    setSavedStrategyEnabled(liveStrategyEnabled);
    setDraftStrategyEnabled(liveStrategyEnabled);

    setSavedVolume(initialVolume);
    setVolumeInput(formatVolume(initialVolume));

    setSavedHedgingEnabled(initialHedging);
    setDraftHedgingEnabled(initialHedging);
  }, [
    open,
    planId,
    planSignals,
    liveStrategyEnabled,
    liveStrategyVolume,
    liveHedgingEnabled,
  ]);

  const draftVolume = useMemo(() => {
    return parseVolumeInput(volumeInput, savedVolume);
  }, [volumeInput, savedVolume]);

  const strategyDirty = draftStrategyEnabled !== savedStrategyEnabled;
  const volumeDirty =
    Number(draftVolume.toFixed(2)) !== Number(savedVolume.toFixed(2));
  const hedgingDirty = draftHedgingEnabled !== savedHedgingEnabled;

  const previewSelectedCount = draftStrategyEnabled ? allKeys.length : 0;

  const [togglePlan, { isLoading: strategySaving }] =
    useToggleStrategyPlanMutation();

  const [updateStrategyPlanVolume, { isLoading: volumeSaving }] =
    useUpdateStrategyPlanVolumeMutation();

  const [hedgingSaving, setHedgingSaving] = useState(false);

  const syncStrategyToParent = (enabled: boolean) => {
    if (!planId) return;

    setPlanSignals({
      ...planSignals,
      [planId]: {
        ...(planSignals[planId] ?? {}),
        strategiesEnabled: enabled,
        strategyStatus: enabled ? "active" : "inactive",
        hedgingEnabled:
          planSignals?.[planId]?.hedgingEnabled ?? savedHedgingEnabled,
        desiredVolume: planSignals?.[planId]?.desiredVolume ?? savedVolume,
      },
    });

    setSelections({
      ...selections,
      [planId]: enabled ? allKeys : [],
    });
  };

  const syncVolumeToParent = (volume: number) => {
    if (!planId) return;

    setPlanSignals({
      ...planSignals,
      [planId]: {
        ...(planSignals[planId] ?? {}),
        strategiesEnabled:
          planSignals?.[planId]?.strategiesEnabled ?? savedStrategyEnabled,
        strategyStatus:
          planSignals?.[planId]?.strategyStatus ??
          (savedStrategyEnabled ? "active" : "inactive"),
        hedgingEnabled:
          planSignals?.[planId]?.hedgingEnabled ?? savedHedgingEnabled,
        desiredVolume: volume,
      },
    });
  };

  const syncHedgingToParent = (enabled: boolean) => {
    if (!planId) return;

    setPlanSignals({
      ...planSignals,
      [planId]: {
        ...(planSignals[planId] ?? {}),
        strategiesEnabled:
          planSignals?.[planId]?.strategiesEnabled ?? savedStrategyEnabled,
        strategyStatus:
          planSignals?.[planId]?.strategyStatus ??
          (savedStrategyEnabled ? "active" : "inactive"),
        hedgingEnabled: enabled,
        desiredVolume:
          planSignals?.[planId]?.desiredVolume ?? savedVolume,
      },
    });
  };

  const handleDraftStrategyChange = (next: boolean) => {
    if (!planId) {
      toast.error("planId missing");
      return;
    }

    if (!uiDebugUnlockAll && maxActive <= 0) {
      toast.error("Your plan doesn't allow strategies.");
      return;
    }

    setDraftStrategyEnabled(next);
  };

  const handleDraftHedgingChange = (next: boolean) => {
    if (!planId) {
      toast.error("planId missing");
      return;
    }

    setDraftHedgingEnabled(next);
  };

  const handleVolumePreset = (value: number) => {
    setVolumeInput(formatVolume(clampVolume(value)));
  };

  const handleVolumeBlur = () => {
    setVolumeInput(formatVolume(draftVolume));
  };

  const saveVolume = async () => {
    if (!planId) return toast.error("planId missing");

    const finalVolume = clampVolume(draftVolume);

    if (Number(finalVolume.toFixed(2)) === Number(savedVolume.toFixed(2))) {
      toast.info("No volume changes to save.");
      return;
    }

    const result = await Swal.fire({
      title: "Update volume?",
      text: `Desired volume will be set to ${formatVolume(finalVolume)}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save volume",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await updateStrategyPlanVolume({
        planId,
        volume: finalVolume,
      }).unwrap();

      setSavedVolume(finalVolume);
      setVolumeInput(formatVolume(finalVolume));
      syncVolumeToParent(finalVolume);

      toast.success(`Volume updated to ${formatVolume(finalVolume)}`);
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to update volume");
    }
  };

  const saveHedging = async () => {
    if (!planId) return toast.error("planId missing");

    if (draftHedgingEnabled === savedHedgingEnabled) {
      toast.info("No hedging changes to save.");
      return;
    }

    const result = await Swal.fire({
      title: "Apply hedging setting?",
      text: draftHedgingEnabled
        ? "This will enable hedging for this plan."
        : "This will disable hedging for this plan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Apply",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setHedgingSaving(true);

      setSavedHedgingEnabled(draftHedgingEnabled);
      syncHedgingToParent(draftHedgingEnabled);

      toast.success(
        draftHedgingEnabled ? "Hedging enabled" : "Hedging disabled"
      );
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to update hedging");
    } finally {
      setHedgingSaving(false);
    }
  };

  const saveStrategyStatus = async () => {
    if (!planId) return toast.error("planId missing");

    if (draftStrategyEnabled === savedStrategyEnabled) {
      toast.info("No strategy status changes to save.");
      return;
    }

    const result = await Swal.fire({
      title: "Apply strategy status?",
      text: draftStrategyEnabled
        ? "This will enable all strategies in this plan."
        : "This will disable all strategies in this plan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Apply",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await togglePlan({
        planId,
        enabled: draftStrategyEnabled,
      }).unwrap();

      setSavedStrategyEnabled(draftStrategyEnabled);
      syncStrategyToParent(draftStrategyEnabled);

      toast.success(
        draftStrategyEnabled
          ? "Plan strategies enabled"
          : "Plan strategies disabled"
      );
    } catch (e: any) {
      toast.error(
        e?.data?.message || e?.message || "Failed to update strategy status"
      );
    }
  };

  const liveStatusLabel = getStrategyStatusText(liveStrategyStatus);

  return (
    <SlideOver open={open} onClose={onClose} title={title} subtitle={subtitle}>
      {!planId ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          Select a plan first.
        </div>
      ) : (
        <div className="space-y-4">
          <SectionCard
            title="Desired Volume"
            subtitle="This saves only the lot size. It does not enable or disable strategies."
            right={
              <StatusPill active={volumeDirty}>
                {volumeDirty ? "Unsaved" : "Saved"}
              </StatusPill>
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-slate-400">
                Allowed range: 0.01 to 0.10
              </div>

              <div className="text-right text-[11px] text-slate-500">
                <div>
                  Saved:{" "}
                  <span className="text-slate-300">
                    {formatVolume(savedVolume)}
                  </span>
                </div>
                <div className="mt-1">
                  Draft:{" "}
                  <span className="text-emerald-300">
                    {formatVolume(draftVolume)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Lot Size
              </label>
              <input
                type="text"
                value={volumeInput}
                onChange={(e) =>
                  setVolumeInput(normalizeVolumeInput(e.target.value))
                }
                onBlur={handleVolumeBlur}
                disabled={volumeSaving}
                placeholder="0.01"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[0.01, 0.02, 0.05, 0.1].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleVolumePreset(preset)}
                  disabled={volumeSaving}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-xs transition",
                    Number(draftVolume.toFixed(2)) === preset
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                    volumeSaving && "cursor-not-allowed opacity-60"
                  )}
                >
                  {preset.toFixed(2)}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={saveVolume}
                disabled={volumeSaving || !volumeDirty}
                className={clsx(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                  volumeDirty
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                    : "cursor-not-allowed border-white/10 bg-white/5 text-slate-400",
                  volumeSaving && "cursor-not-allowed opacity-60"
                )}
              >
                {volumeSaving ? "Saving volume..." : "Save volume"}
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Hedging Settings"
            subtitle="This controls whether hedging is allowed for this plan."
            right={
              <div className="flex items-center gap-2">
                <StatusPill active={draftHedgingEnabled}>
                  {draftHedgingEnabled ? "Enabled" : "Disabled"}
                </StatusPill>
                <ToggleControl
                  value={draftHedgingEnabled}
                  onChange={handleDraftHedgingChange}
                  disabled={hedgingSaving}
                />
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill active={hedgingDirty}>
                {hedgingDirty ? "Unsaved" : "Saved"}
              </StatusPill>

              <StatusPill active={savedHedgingEnabled}>
                Current saved: {savedHedgingEnabled ? "Enabled" : "Disabled"}
              </StatusPill>

              <StatusPill active={draftHedgingEnabled}>
                Draft: {draftHedgingEnabled ? "Enabled" : "Disabled"}
              </StatusPill>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
              <div>
                Live hedging:{" "}
                <span className="font-semibold text-slate-200">
                  {savedHedgingEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="mt-1">
                This setting is stored in plan signal settings and used by the UI flow.
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={saveHedging}
                disabled={hedgingSaving || !hedgingDirty}
                className={clsx(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                  hedgingDirty
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                    : "cursor-not-allowed border-white/10 bg-white/5 text-slate-400",
                  hedgingSaving && "cursor-not-allowed opacity-60"
                )}
              >
                {hedgingSaving ? "Saving hedging..." : "Save hedging setting"}
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Strategy Status"
            subtitle="This applies only enable or disable for all strategies in this plan."
            right={
              <div className="flex items-center gap-2">
                <StatusPill active={draftStrategyEnabled}>
                  {draftStrategyEnabled ? "Enabled" : "Disabled"}
                </StatusPill>
                <ToggleControl
                  value={draftStrategyEnabled}
                  onChange={handleDraftStrategyChange}
                  disabled={strategySaving}
                />
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                tone={
                  normalizeStrategyStatus(liveStrategyStatus) === "active"
                    ? "success"
                    : normalizeStrategyStatus(liveStrategyStatus) === "paused"
                    ? "warning"
                    : "danger"
                }
              >
                Live status: {liveStatusLabel}
              </StatusPill>

              <StatusPill active={strategyDirty}>
                {strategyDirty ? "Unsaved" : "Saved"}
              </StatusPill>

              <StatusPill active={savedStrategyEnabled}>
                Current saved: {savedStrategyEnabled ? "Enabled" : "Disabled"}
              </StatusPill>

              <StatusPill active={draftStrategyEnabled}>
                Draft: {draftStrategyEnabled ? "Enabled" : "Disabled"}
              </StatusPill>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
              <div>
                Live strategy status:{" "}
                <span className="font-semibold text-slate-200">
                  {liveStatusLabel}
                </span>
              </div>
              <div className="mt-1">
                Instance ID:{" "}
                <span className="font-semibold text-slate-200">
                  {plan?.strategy?.instanceId ?? "—"}
                </span>
              </div>
              <div className="mt-1">
                Managed by admin webhook:{" "}
                <span className="font-semibold text-slate-200">
                  {plan?.strategy?.managedByAdminWebhook ? "Yes" : "No"}
                </span>
              </div>
              <div className="mt-2">
                Preview selected:{" "}
                <span className="font-semibold text-slate-200">
                  {previewSelectedCount}
                </span>{" "}
                /{" "}
                <span className="font-semibold text-slate-200">
                  {allKeys.length}
                </span>
                <span className="text-slate-500"> • backend applies to all</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {list.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                  No strategies found in this plan.
                </div>
              ) : (
                list.map((item) => (
                  <div
                    key={item.key}
                    className={clsx(
                      "rounded-xl border p-4",
                      draftStrategyEnabled
                        ? "border-emerald-500/20 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100">
                          {item.name}
                        </div>
                        {item.description ? (
                          <div className="mt-1 text-xs text-slate-400">
                            {item.description}
                          </div>
                        ) : null}

                        {item.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <StatusPill active={draftStrategyEnabled}>
                        {draftStrategyEnabled
                          ? "Will be enabled"
                          : "Will be disabled"}
                      </StatusPill>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={saveStrategyStatus}
                disabled={strategySaving || !strategyDirty}
                className={clsx(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                  strategyDirty
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
                    : "cursor-not-allowed border-white/10 bg-white/5 text-slate-400",
                  strategySaving && "cursor-not-allowed opacity-60"
                )}
              >
                {strategySaving
                  ? "Applying strategy status..."
                  : "Apply strategy status"}
              </button>
            </div>
          </SectionCard>
        </div>
      )}
    </SlideOver>
  );
}