import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  MoreVertical,
  Download,
  Power,
  X,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import { toast } from "react-toastify";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ApiFieldType = "text" | "password";

export type ApiTypeOption = {
  value: string; // "KITE" | "DHAN" | "DELTA" etc
  label: string; // "Kite" | "Dhan" | "Delta"
  fields: Array<{
    key: string; // "apiName" | "apiKey" etc
    label: string;
    placeholder?: string;
    type?: ApiFieldType;
    required?: boolean;
  }>;
};

export type ApiAccountItem = {
  id: string | number;
  type: string; // matches ApiTypeOption.value
  apiName: string;
  enabled: boolean;

  createdAt?: string; // ISO
  updatedAt?: string; // ISO

  // store extra typed values here (apiKey, secret, clientId, etc)
  meta: Record<string, any>;
};

type Props = {
  title: string;
  typeLabel: string; // "API TYPE" label in drawer
  typeOptions: ApiTypeOption[];

  // Optional plan caps
  maxAccounts?: number;

  // Plan gating
  locked?: boolean;
  lockedReason?: string;

  // Controlled mode (optional)
  items?: ApiAccountItem[];
  onItemsChange?: (next: ApiAccountItem[]) => void;

  // If you want to wire backend later (optional hooks)
  onCreate?: (payload: {
    type: string;
    apiName: string;
    meta: Record<string, any>;
  }) => Promise<ApiAccountItem> | ApiAccountItem;

  onDelete?: (id: string | number) => Promise<any> | any;
  onToggle?: (id: string | number, enabled: boolean) => Promise<any> | any;

  // UI debug
  uiDebugUnlockAll?: boolean;
};

function formatDate(ts?: string) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 rounded-full border transition",
        checked ? "bg-emerald-500/90 border-emerald-400" : "bg-slate-800 border-slate-700",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-pressed={checked}
    >
      <span
        className={clsx(
          "absolute top-[3px] h-4 w-4 rounded-full bg-slate-950 transition",
          checked ? "left-6" : "left-[3px]"
        )}
      />
    </button>
  );
}

function Drawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-base font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Menu({
  onDelete,
}: {
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="rounded-lg p-2 hover:bg-slate-100/10"
      >
        <MoreVertical size={18} className="text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ item }: { item: ApiAccountItem }) {
  // You can extend this with server status later
  const ok = item.enabled;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border",
        ok
          ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
          : "bg-rose-500/10 text-rose-700 border-rose-200"
      )}
    >
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {ok ? "Active" : "Off"}
    </span>
  );
}

export default function ApiAccountsManager({
  title,
  typeLabel,
  typeOptions,
  maxAccounts,

  locked,
  lockedReason,

  items,
  onItemsChange,
  onCreate,
  onDelete,
  onToggle,

  uiDebugUnlockAll = false,
}: Props) {
  const lockedEffective = uiDebugUnlockAll ? false : !!locked;

  // uncontrolled fallback (UI-only)
  const [localItems, setLocalItems] = useState<ApiAccountItem[]>([]);
  const data = items ?? localItems;
  const setData = onItemsChange ?? setLocalItems;

  // Drawer state
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(typeOptions[0]?.value ?? "");
  const selected = useMemo(
    () => typeOptions.find((t) => t.value === selectedType) ?? typeOptions[0],
    [typeOptions, selectedType]
  );

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    // reset fields when type changes
    const next: Record<string, any> = {};
    selected?.fields?.forEach((f) => (next[f.key] = ""));
    setForm(next);
  }, [selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  const used = data.length;
  const canAdd = !lockedEffective && (typeof maxAccounts === "number" ? used < maxAccounts : true);

  const allOn = data.length > 0 && data.every((x) => x.enabled);

  const toggleAll = async () => {
    if (lockedEffective) return;

    const next = !allOn;
    // optimistic
    const prev = data;
    setData(prev.map((x) => ({ ...x, enabled: next })));

    try {
      // optional backend call in bulk (you can add later)
      toast.success(next ? "All APIs turned ON" : "All APIs turned OFF");
    } catch (e: any) {
      setData(prev);
      toast.error("Failed to toggle all");
    }
  };

  const doToggle = async (id: string | number, enabled: boolean) => {
    if (lockedEffective) return;

    const prev = data;
    setData(prev.map((x) => (x.id === id ? { ...x, enabled } : x)));

    try {
      await onToggle?.(id, enabled);
    } catch (e: any) {
      setData(prev);
      toast.error(e?.data?.message || "Failed to update");
    }
  };

  const doDelete = async (id: string | number) => {
    const prev = data;
    setData(prev.filter((x) => x.id !== id));

    try {
      await onDelete?.(id);
      toast.success("Deleted");
    } catch (e: any) {
      setData(prev);
      toast.error(e?.data?.message || "Failed to delete");
    }
  };

  const doExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    if (lockedEffective) return;

    // validate required
    const requiredFields = selected?.fields?.filter((f) => f.required) ?? [];
    for (const f of requiredFields) {
      const v = String(form[f.key] ?? "").trim();
      if (!v) return toast.error(`${f.label} is required`);
    }

    const apiName = String(form.apiName ?? "").trim() || `${selected?.label ?? "API"} ${used + 1}`;
    const meta: Record<string, any> = { ...form };
    delete meta.apiName;

    try {
      let created: ApiAccountItem;
      if (onCreate) {
        const res = await onCreate({ type: selectedType, apiName, meta });
        created = res as ApiAccountItem;
      } else {
        // UI-only mock create
        created = {
          id: `${Date.now()}`,
          type: selectedType,
          apiName,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          meta,
        };
      }

      setData([created, ...data]);
      toast.success("API added");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to add API");
    }
  };

  return (
    <div className="w-full">
      {/* top actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {typeof maxAccounts === "number" ? (
              <>
                Accounts used:{" "}
                <span className="text-slate-200 font-semibold">{used}</span> /{" "}
                <span className="text-slate-200 font-semibold">{maxAccounts}</span>
              </>
            ) : (
              <>Manage your connected APIs</>
            )}
          </p>

          {lockedEffective ? (
            <p className="text-xs text-amber-300 mt-1">
              {lockedReason || "Locked by plan"}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/80"
          >
            <Download size={14} />
            Export
          </button>

          <button
            type="button"
            disabled={lockedEffective || data.length === 0}
            onClick={toggleAll}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold",
              allOn
                ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                : "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
              (lockedEffective || data.length === 0) && "opacity-60 cursor-not-allowed"
            )}
          >
            <Power size={14} />
            {allOn ? "ALL API ON / OFF" : "ALL API ON / OFF"}
          </button>

          <button
            type="button"
            disabled={!canAdd}
            onClick={() => setOpen(true)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400",
              !canAdd && "opacity-60 cursor-not-allowed"
            )}
          >
            <Plus size={14} />
            Add New Api
          </button>
        </div>
      </div>

      {/* cards grid */}
      {data.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          No APIs added yet. Click <b>Add New Api</b>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((it) => {
            const opt = typeOptions.find((t) => t.value === it.type);
            return (
              <div
                key={String(it.id)}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-100">
                      {opt?.label ?? it.type}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Api Name :</p>
                    <p className="text-sm text-slate-200 font-medium">{it.apiName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={it.enabled}
                      onChange={(v) => doToggle(it.id, v)}
                      disabled={lockedEffective}
                    />
                    <Menu onDelete={() => doDelete(it.id)} />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Created :</span>
                    <span>{formatDate(it.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Updated :</span>
                    <span>{formatDate(it.updatedAt)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                    Api Id : {String(it.id)}
                  </span>
                  <StatusPill item={it} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} title="Add New API">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-indigo-600">
              SELECT {typeLabel}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-2 w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {(selected?.fields ?? []).map((f) => (
            <div key={f.key}>
              <label className="text-[11px] font-semibold text-slate-600">
                {f.label.toUpperCase()}
              </label>
              <input
                type={f.type === "password" ? "password" : "text"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          ))}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-rose-100 px-6 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-200"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <Clock3 size={14} />
            Secrets are hidden in UI; store encrypted server-side.
          </div>
        </div>
      </Drawer>
    </div>
  );
}
