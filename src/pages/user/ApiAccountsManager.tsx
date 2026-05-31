// import React, { useEffect, useMemo, useState } from "react";
// import { Plus, MoreVertical, Download, Power, X, CheckCircle2, XCircle, KeyRound } from "lucide-react";
// import { toast } from "react-toastify";

// function clsx(...parts: Array<string | false | null | undefined>) {
//   return parts.filter(Boolean).join(" ");
// }

// export type ApiFieldType = "text" | "password" | "boolean";

// export type ApiTypeOption = {
//   value: string;
//   label: string;
//   fields: Array<{
//     key: string;
//     label: string;
//     placeholder?: string;
//     type?: ApiFieldType;
//     required?: boolean;
//   }>;
//   tokenFlow?: {
//     label: string;
//     placeholder?: string;
//     helpText?: string;
//   };
// };

// export type ApiAccountItem = {
//   id: string | number;
//   type: string;
//   apiName: string;

//   enabled: boolean;     // used by toggle
//   status?: string;      // used for display

//   isMaster?: boolean;

//   createdAt?: string;
//   updatedAt?: string;

//   accountId?: string;
//   apiKey?: string;

//   secretSet?: boolean;
//   tokenSet?: boolean;

//   meta?: Record<string, any>;
// };

// type Props = {
//   title: string;
//   typeLabel: string;
//   typeOptions: ApiTypeOption[];

//   maxAccounts?: number;

//   locked?: boolean;
//   lockedReason?: string;

//   items?: ApiAccountItem[];
//   onItemsChange?: (next: ApiAccountItem[]) => void;

//   onCreate?: (payload: { type: string; apiName: string; meta: Record<string, any> }) => Promise<ApiAccountItem> | ApiAccountItem;
//   onDelete?: (id: string | number) => Promise<any> | any;
//   onToggle?: (id: string | number, enabled: boolean) => Promise<any> | any;

//   onSaveToken?: (id: string | number, token: string, item: ApiAccountItem) => Promise<any> | any;

//   renderItemDetails?: (item: ApiAccountItem, opt?: ApiTypeOption) => React.ReactNode;
//   showIdPill?: boolean;

//   uiDebugUnlockAll?: boolean;
// };

// function formatDate(ts?: string) {
//   if (!ts) return "—";
//   try {
//     const d = new Date(ts);
//     return new Intl.DateTimeFormat("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     }).format(d);
//   } catch {
//     return "—";
//   }
// }

// function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
//   return (
//     <button
//       type="button"
//       disabled={disabled}
//       onClick={() => onChange(!checked)}
//       className={clsx(
//         "relative h-6 w-11 rounded-full border transition",
//         checked ? "bg-emerald-500/90 border-emerald-400" : "bg-slate-800 border-slate-700",
//         disabled && "opacity-60 cursor-not-allowed"
//       )}
//     >
//       <span className={clsx("absolute top-[3px] h-4 w-4 rounded-full bg-slate-950 transition", checked ? "left-6" : "left-[3px]")} />
//     </button>
//   );
// }

// function Drawer({
//   open,
//   onClose,
//   children,
//   title,
// }: {
//   open: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   title: React.ReactNode;
// }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-[80]">
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />
//       <div className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-white text-slate-900 shadow-2xl">
//         <div className="flex items-center justify-between px-5 py-4 border-b">
//           <p className="text-base font-semibold">{title}</p>
//           <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
//             <X size={18} />
//           </button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// }

// function Menu({ onDelete }: { onDelete: () => void }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div className="relative">
//       <button onClick={() => setOpen((p) => !p)} className="rounded-lg p-2 hover:bg-slate-100/10">
//         <MoreVertical size={18} className="text-slate-400" />
//       </button>
//       {open && (
//         <div className="absolute right-0 top-10 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
//           <button
//             className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
//             onClick={() => {
//               setOpen(false);
//               onDelete();
//             }}
//           >
//             Delete
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// function StatusPill({ item }: { item: ApiAccountItem }) {
//   const st = String(item.status ?? "").toLowerCase();

//   const isPending = st.includes("pending");
//   const isActive = item.enabled === true || st === "active";

//   return (
//     <span
//       className={clsx(
//         "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border",
//         isActive
//           ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/30"
//           : isPending
//           ? "bg-amber-500/10 text-amber-200 border-amber-400/30"
//           : "bg-rose-500/10 text-rose-200 border-rose-400/30"
//       )}
//     >
//       {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
//       {isActive ? "Active" : isPending ? "Pending" : "Off"}
//     </span>
//   );
// }

// export default function ApiAccountsManager({
//   title,
//   typeLabel,
//   typeOptions,
//   maxAccounts,
//   locked,
//   lockedReason,
//   items,
//   onItemsChange,
//   onCreate,
//   onDelete,
//   onToggle,
//   onSaveToken,
//   renderItemDetails,
//   showIdPill = true,
//   uiDebugUnlockAll = false,
// }: Props) {
//   const lockedEffective = uiDebugUnlockAll ? false : !!locked;

//   const [localItems, setLocalItems] = useState<ApiAccountItem[]>([]);
//   const data = items ?? localItems;
//   const setData = onItemsChange ?? setLocalItems;

//   const [open, setOpen] = useState(false);
//   const [selectedType, setSelectedType] = useState<string>(typeOptions[0]?.value ?? "");

//   const selected = useMemo(
//     () => typeOptions.find((t) => t.value === selectedType) ?? typeOptions[0],
//     [typeOptions, selectedType]
//   );

//   const [form, setForm] = useState<Record<string, any>>({});
//   useEffect(() => {
//     const next: Record<string, any> = {};
//     (selected?.fields ?? []).forEach((f) => {
//       next[f.key] = f.type === "boolean" ? false : "";
//     });
//     setForm(next);
//   }, [selectedType, selected]);

//   const used = data.length;
//   const canAdd = !lockedEffective && (maxAccounts ? used < maxAccounts : true);
//   const allOn = data.length > 0 && data.every((x) => x.enabled);

//   const toggleAll = async () => {
//     if (lockedEffective) return;
//     const next = !allOn;
//     setData(data.map((x) => ({ ...x, enabled: next })));
//   };

//   const doToggle = async (id: string | number, enabled: boolean) => {
//     if (lockedEffective) return;
//     const prev = data;
//     setData(prev.map((x) => (x.id === id ? { ...x, enabled } : x)));
//     try {
//       await onToggle?.(id, enabled);
//     } catch (e: any) {
//       setData(prev);
//       toast.error(e?.data?.message || "Failed to update");
//     }
//   };

//   const doDelete = async (id: string | number) => {
//     const prev = data;
//     setData(prev.filter((x) => x.id !== id));
//     try {
//       await onDelete?.(id);
//       toast.success("Deleted");
//     } catch (e: any) {
//       setData(prev);
//       toast.error(e?.data?.message || "Failed to delete");
//     }
//   };

//   const doExport = () => {
//     const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_export.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const submit = async () => {
//     if (lockedEffective) return;

//     const requiredFields = selected?.fields?.filter((f) => f.required) ?? [];
//     for (const f of requiredFields) {
//       if (f.type === "boolean") continue; // allow false
//       const v = String(form[f.key] ?? "").trim();
//       if (!v) return toast.error(`${f.label} is required`);
//     }

//     const apiName = String(form.apiName ?? "").trim() || `${selected?.label ?? "API"} ${used + 1}`;
//     const meta: Record<string, any> = { ...form };
//     delete meta.apiName;

//     try {
//       let created: ApiAccountItem;

//       if (onCreate) {
//         const res = await onCreate({ type: selectedType, apiName, meta });
//         if (!res || typeof res !== "object") throw new Error("onCreate must return ApiAccountItem");
//         created = res;
//       } else {
//         created = {
//           id: `${Date.now()}`,
//           type: selectedType,
//           apiName,
//           enabled: true,
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//           meta,
//         };
//       }

//       setData([created, ...data]);
//       toast.success("API added");
//       setOpen(false);
//     } catch (e: any) {
//       toast.error(e?.message || e?.data?.message || "Failed to add API");
//     }
//   };

//   // token drawer
//   const [tokenOpen, setTokenOpen] = useState(false);
//   const [tokenItem, setTokenItem] = useState<ApiAccountItem | null>(null);
//   const [tokenValue, setTokenValue] = useState("");
//   const [tokenSaving, setTokenSaving] = useState(false);

//   const openToken = (it: ApiAccountItem) => {
//     setTokenItem(it);
//     setTokenValue("");
//     setTokenOpen(true);
//   };

//   const saveToken = async () => {
//     if (!tokenItem) return;
//     const token = String(tokenValue || "").trim();
//     if (!token) return toast.error("Access token is required");

//     try {
//       setTokenSaving(true);
//       await onSaveToken?.(tokenItem.id, token, tokenItem);
//       setData(data.map((x) => (x.id === tokenItem.id ? { ...x, tokenSet: true } : x)));

//       toast.success("Access token saved");
//       setTokenOpen(false);
//       setTokenItem(null);
//       setTokenValue("");
//     } catch (e: any) {
//       toast.error(e?.data?.message || e?.message || "Failed to save token");
//     } finally {
//       setTokenSaving(false);
//     }
//   };

//   const tokenTitle = useMemo(() => {
//     if (!tokenItem) return "Set Access Token";
//     const opt = typeOptions.find((t) => t.value === tokenItem.type);
//     return opt?.tokenFlow?.label || "Set Access Token";
//   }, [tokenItem, typeOptions]);

//   return (
//     <div className="w-full">
//       <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
//         <div>
//           <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
//           <p className="text-xs text-slate-400 mt-1">
//             {maxAccounts ? (
//               <>
//                 Accounts used: <span className="text-slate-200 font-semibold">{used}</span> /{" "}
//                 <span className="text-slate-200 font-semibold">{maxAccounts}</span>
//               </>
//             ) : (
//               <>Manage your connected APIs</>
//             )}
//           </p>
//           {lockedEffective ? (
//             <p className="text-xs text-amber-300 mt-1">{lockedReason || "Locked by plan"}</p>
//           ) : null}
//         </div>

//         <div className="flex items-center gap-2 flex-wrap">
//           <button
//             onClick={doExport}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/80"
//           >
//             <Download size={14} />
//             Export
//           </button>

//           <button
//             disabled={lockedEffective || data.length === 0}
//             onClick={toggleAll}
//             className={clsx(
//               "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold",
//               allOn
//                 ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
//                 : "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
//               (lockedEffective || data.length === 0) && "opacity-60 cursor-not-allowed"
//             )}
//           >
//             <Power size={14} />
//             ALL API ON / OFF
//           </button>

//           <button
//             disabled={!canAdd}
//             onClick={() => setOpen(true)}
//             className={clsx(
//               "inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400",
//               !canAdd && "opacity-60 cursor-not-allowed"
//             )}
//           >
//             <Plus size={14} />
//             Add New Api
//           </button>
//         </div>
//       </div>

//       {data.length === 0 ? (
//         <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
//           No APIs added yet. Click <b>Add New Api</b>.
//         </div>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
//           {data.map((it) => {
//             const opt = typeOptions.find((t) => t.value === it.type);
//             const tokenCapable = !!opt?.tokenFlow && typeof onSaveToken === "function";
//             const tokenSet = typeof it.tokenSet === "boolean" ? it.tokenSet : !!it.meta?.hasToken;

//             return (
//               <div key={String(it.id)} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
//                 <div className="flex items-start justify-between gap-2">
//                   <div>
//                     <p className="text-base font-semibold text-slate-100">{opt?.label ?? it.type}</p>
//                     <p className="text-xs text-slate-400 mt-1">Name</p>
//                     <p className="text-sm text-slate-200 font-medium">{it.apiName}</p>

//                     <p className="text-xs text-slate-400 mt-2">Role</p>
//                     <p className="text-sm text-slate-200 font-medium">{it.isMaster ? "MASTER" : "SLAVE"}</p>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <Switch checked={it.enabled} onChange={(v) => doToggle(it.id, v)} disabled={lockedEffective} />
//                     <Menu onDelete={() => doDelete(it.id)} />
//                   </div>
//                 </div>

//                 {renderItemDetails ? renderItemDetails(it, opt) : null}

//                 <div className="mt-4 space-y-2 text-sm text-slate-300">
//                   <div className="flex justify-between">
//                     <span className="text-slate-400">Created</span>
//                     <span>{formatDate(it.createdAt)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-slate-400">Updated</span>
//                     <span>{formatDate(it.updatedAt)}</span>
//                   </div>
//                 </div>

//                 <div className="mt-4 flex items-center justify-between gap-2">
//                   <div className="flex items-center gap-2">
//                     {showIdPill ? (
//                       <span className="inline-flex items-center rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
//                         Api Id: {String(it.id)}
//                       </span>
//                     ) : null}

//                     {tokenCapable ? (
//                       <button
//                         type="button"
//                         onClick={() => openToken(it)}
//                         className={clsx(
//                           "inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs",
//                           tokenSet
//                             ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
//                             : "border-amber-400/30 bg-amber-500/10 text-amber-200"
//                         )}
//                       >
//                         <KeyRound size={14} />
//                         {tokenSet ? "Update Token" : "Add Token"}
//                       </button>
//                     ) : null}
//                   </div>

//                   <StatusPill item={it} />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Add drawer */}
//       <Drawer open={open} onClose={() => setOpen(false)} title="Add New API">
//         <div className="space-y-4">
//           <div>
//             <label className="text-[11px] font-semibold text-indigo-600">SELECT {typeLabel}</label>
//             <select
//               value={selectedType}
//               onChange={(e) => setSelectedType(e.target.value)}
//               className="mt-2 w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
//             >
//               {typeOptions.map((t) => (
//                 <option key={t.value} value={t.value}>
//                   {t.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {(selected?.fields ?? []).map((f) => {
//             if (f.type === "boolean") {
//               return (
//                 <div key={f.key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
//                   <div>
//                     <p className="text-[11px] font-semibold text-slate-700">{f.label.toUpperCase()}</p>
//                     <p className="text-xs text-slate-500">If enabled, this account acts as MASTER.</p>
//                   </div>
//                   <input
//                     type="checkbox"
//                     checked={!!form[f.key]}
//                     onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.checked }))}
//                     className="h-4 w-4"
//                   />
//                 </div>
//               );
//             }

//             return (
//               <div key={f.key}>
//                 <label className="text-[11px] font-semibold text-slate-600">{f.label.toUpperCase()}</label>
//                 <input
//                   type={f.type === "password" ? "password" : "text"}
//                   value={form[f.key] ?? ""}
//                   onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
//                   placeholder={f.placeholder}
//                   className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
//                 />
//               </div>
//             );
//           })}

//           <div className="pt-2 flex gap-3">
//             <button onClick={submit} className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
//               Submit
//             </button>
//             <button onClick={() => setOpen(false)} className="rounded-lg bg-rose-100 px-6 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-200">
//               Cancel
//             </button>
//           </div>
//         </div>
//       </Drawer>

//       {/* Token drawer */}
//       <Drawer
//         open={tokenOpen}
//         onClose={() => {
//           setTokenOpen(false);
//           setTokenItem(null);
//           setTokenValue("");
//         }}
//         title={tokenTitle}
//       >
//         {tokenItem ? (
//           <div className="space-y-4">
//             <div>
//               <label className="text-[11px] font-semibold text-slate-600">ACCESS TOKEN</label>
//               <input
//                 type="password"
//                 value={tokenValue}
//                 onChange={(e) => setTokenValue(e.target.value)}
//                 placeholder={typeOptions.find((t) => t.value === tokenItem.type)?.tokenFlow?.placeholder || "Paste token…"}
//                 className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
//               />
//             </div>

//             <div className="pt-2 flex gap-3">
//               <button
//                 onClick={saveToken}
//                 disabled={tokenSaving}
//                 className={clsx(
//                   "rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-400",
//                   tokenSaving && "opacity-60 cursor-not-allowed"
//                 )}
//               >
//                 {tokenSaving ? "Saving…" : "Save Token"}
//               </button>
//               <button
//                 onClick={() => {
//                   setTokenOpen(false);
//                   setTokenItem(null);
//                   setTokenValue("");
//                 }}
//                 className="rounded-lg bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         ) : null}
//       </Drawer>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  MoreVertical,
  Download,
  Power,
  X,
  CheckCircle2,
  XCircle,
  KeyRound,
} from "lucide-react";
import { toast } from "react-toastify";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ApiFieldType = "text" | "password" | "boolean";

export type ApiTypeOption = {
  value: string;
  label: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder?: string;
    type?: ApiFieldType;
    required?: boolean;
  }>;
  tokenFlow?: {
    label: string;
    placeholder?: string;
    helpText?: string;
  };
};

export type ApiAccountItem = {
  id: string | number;
  type: string;
  apiName: string;

  enabled: boolean; // used by toggle
  status?: string; // used for display

  isMaster?: boolean;

  createdAt?: string;
  updatedAt?: string;

  accountId?: string;
  apiKey?: string;

  secretSet?: boolean;
  tokenSet?: boolean;

  meta?: Record<string, any>;
};

type Props = {
  title: string;
  typeLabel: string;
  typeOptions: ApiTypeOption[];

  maxAccounts?: number;

  locked?: boolean;
  lockedReason?: string;

  items?: ApiAccountItem[];
  onItemsChange?: (next: ApiAccountItem[]) => void;

  onCreate?: (payload: {
    type: string;
    apiName: string;
    meta: Record<string, any>;
  }) => Promise<ApiAccountItem> | ApiAccountItem;
  onDelete?: (id: string | number) => Promise<any> | any;
  onToggle?: (id: string | number, enabled: boolean) => Promise<any> | any;

  onSaveToken?: (
    id: string | number,
    token: string,
    item: ApiAccountItem
  ) => Promise<any> | any;

  renderItemDetails?: (item: ApiAccountItem, opt?: ApiTypeOption) => React.ReactNode;
  showIdPill?: boolean;

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
        checked
          ? "bg-emerald-500/90 border-emerald-400/40"
          : "bg-slate-800 border-slate-700",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "absolute top-[3px] h-4 w-4 rounded-full transition",
          checked ? "left-6 bg-slate-950" : "left-[3px] bg-slate-950"
        )}
      />
    </button>
  );
}

/** ✅ Dark themed drawer (matches your app theme) */
function Drawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <p className="text-base font-semibold">{title}</p>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-900 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/** ✅ Dark themed kebab menu */
function Menu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-menu-root='true']")) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" data-menu-root="true">
      <button
        onClick={() => setOpen((p) => !p)}
        className="rounded-lg p-2 hover:bg-slate-100/10"
        type="button"
      >
        <MoreVertical size={18} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-44 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
          <button
            className="w-full px-3 py-2 text-left text-sm text-rose-200 hover:bg-slate-900"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ item }: { item: ApiAccountItem }) {
  const st = String(item.status ?? "").toLowerCase();

  const isPending = st.includes("pending");
  const isActive = item.enabled === true || st === "active";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border",
        isActive
          ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/30"
          : isPending
          ? "bg-amber-500/10 text-amber-200 border-amber-400/30"
          : "bg-rose-500/10 text-rose-200 border-rose-400/30"
      )}
    >
      {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {isActive ? "Active" : isPending ? "Pending" : "Off"}
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
  onSaveToken,
  renderItemDetails,
  showIdPill = true,
  uiDebugUnlockAll = false,
}: Props) {
  const lockedEffective = uiDebugUnlockAll ? false : !!locked;

  const [localItems, setLocalItems] = useState<ApiAccountItem[]>([]);
  const data = items ?? localItems;
  const setData = onItemsChange ?? setLocalItems;

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(
    typeOptions[0]?.value ?? ""
  );

  const selected = useMemo(
    () =>
      typeOptions.find((t) => t.value === selectedType) ?? typeOptions[0],
    [typeOptions, selectedType]
  );

  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    const next: Record<string, any> = {};
    (selected?.fields ?? []).forEach((f) => {
      next[f.key] = f.type === "boolean" ? false : "";
    });
    setForm(next);
  }, [selectedType, selected]);

  const used = data.length;
  const canAdd = !lockedEffective && (maxAccounts ? used < maxAccounts : true);
  const allOn = data.length > 0 && data.every((x) => x.enabled);

  const toggleAll = async () => {
    if (lockedEffective) return;
    const next = !allOn;
    setData(data.map((x) => ({ ...x, enabled: next })));
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
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    if (lockedEffective) return;

    const requiredFields = selected?.fields?.filter((f) => f.required) ?? [];
    for (const f of requiredFields) {
      if (f.type === "boolean") continue; // allow false
      const v = String(form[f.key] ?? "").trim();
      if (!v) return toast.error(`${f.label} is required`);
    }

    const apiName =
      String(form.apiName ?? "").trim() || `${selected?.label ?? "API"} ${used + 1}`;
    const meta: Record<string, any> = { ...form };
    delete meta.apiName;

    try {
      let created: ApiAccountItem;

      if (onCreate) {
        const res = await onCreate({ type: selectedType, apiName, meta });
        if (!res || typeof res !== "object")
          throw new Error("onCreate must return ApiAccountItem");
        created = res;
      } else {
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
      toast.error(e?.message || e?.data?.message || "Failed to add API");
    }
  };

  // token drawer
  const [tokenOpen, setTokenOpen] = useState(false);
  const [tokenItem, setTokenItem] = useState<ApiAccountItem | null>(null);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenSaving, setTokenSaving] = useState(false);

  const openToken = (it: ApiAccountItem) => {
    setTokenItem(it);
    setTokenValue("");
    setTokenOpen(true);
  };

  const saveToken = async () => {
    if (!tokenItem) return;
    const token = String(tokenValue || "").trim();
    if (!token) return toast.error("Access token is required");

    try {
      setTokenSaving(true);
      await onSaveToken?.(tokenItem.id, token, tokenItem);
      setData(data.map((x) => (x.id === tokenItem.id ? { ...x, tokenSet: true } : x)));

      toast.success("Access token saved");
      setTokenOpen(false);
      setTokenItem(null);
      setTokenValue("");
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to save token");
    } finally {
      setTokenSaving(false);
    }
  };

  const tokenTitle = useMemo(() => {
    if (!tokenItem) return "Set Access Token";
    const opt = typeOptions.find((t) => t.value === tokenItem.type);
    return opt?.tokenFlow?.label || "Set Access Token";
  }, [tokenItem, typeOptions]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {maxAccounts ? (
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
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/80"
            type="button"
          >
            <Download size={14} />
            Export
          </button>

          <button
            disabled={lockedEffective || data.length === 0}
            onClick={toggleAll}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold",
              allOn
                ? "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                : "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
              (lockedEffective || data.length === 0) &&
                "opacity-60 cursor-not-allowed"
            )}
            type="button"
          >
            <Power size={14} />
            ALL API ON / OFF
          </button>

          <button
            disabled={!canAdd}
            onClick={() => setOpen(true)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400",
              !canAdd && "opacity-60 cursor-not-allowed"
            )}
            type="button"
          >
            <Plus size={14} />
            Add New Api
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          No APIs added yet. Click <b>Add New Api</b>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((it) => {
            const opt = typeOptions.find((t) => t.value === it.type);
            const tokenCapable = !!opt?.tokenFlow && typeof onSaveToken === "function";
            const tokenSet =
              typeof it.tokenSet === "boolean" ? it.tokenSet : !!it.meta?.hasToken;

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
                    <p className="text-xs text-slate-400 mt-1">Name</p>
                    <p className="text-sm text-slate-200 font-medium">
                      {it.apiName}
                    </p>

                    <p className="text-xs text-slate-400 mt-2">Role</p>
                    <p className="text-sm text-slate-200 font-medium">
                      {it.isMaster ? "MASTER" : "SLAVE"}
                    </p>
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

                {renderItemDetails ? renderItemDetails(it, opt) : null}

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created</span>
                    <span>{formatDate(it.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Updated</span>
                    <span>{formatDate(it.updatedAt)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {showIdPill ? (
                      <span className="inline-flex items-center rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                        Api Id: {String(it.id)}
                      </span>
                    ) : null}

                    {tokenCapable ? (
                      <button
                        type="button"
                        onClick={() => openToken(it)}
                        className={clsx(
                          "inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs",
                          tokenSet
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            : "border-amber-400/30 bg-amber-500/10 text-amber-200"
                        )}
                      >
                        <KeyRound size={14} />
                        {tokenSet ? "Update Token" : "Add Token"}
                      </button>
                    ) : null}
                  </div>

                  <StatusPill item={it} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Add drawer (dark) */}
      <Drawer open={open} onClose={() => setOpen(false)} title="Add New API">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300">
              SELECT {typeLabel}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-950">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {(selected?.fields ?? []).map((f) => {
            if (f.type === "boolean") {
              return (
                <div
                  key={f.key}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-3"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-slate-200">
                      {f.label.toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      If enabled, this account acts as MASTER.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [f.key]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-indigo-500"
                  />
                </div>
              );
            }

            return (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-slate-300">
                  {f.label.toUpperCase()}
                  {f.required ? <span className="text-rose-300"> *</span> : null}
                </label>
                <input
                  type={f.type === "password" ? "password" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            );
          })}

          <div className="pt-2 flex gap-3">
            <button
              onClick={submit}
              className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
              type="button"
            >
              Submit
            </button>

            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-6 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/20"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Drawer>

      {/* ✅ Token drawer (dark) */}
      <Drawer
        open={tokenOpen}
        onClose={() => {
          setTokenOpen(false);
          setTokenItem(null);
          setTokenValue("");
        }}
        title={tokenTitle}
      >
        {tokenItem ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300">
                ACCESS TOKEN
              </label>
              <input
                type="password"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                placeholder={
                  typeOptions.find((t) => t.value === tokenItem.type)?.tokenFlow
                    ?.placeholder || "Paste token…"
                }
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {typeOptions.find((t) => t.value === tokenItem.type)?.tokenFlow
                ?.helpText ? (
                <p className="mt-2 text-xs text-slate-400">
                  {
                    typeOptions.find((t) => t.value === tokenItem.type)?.tokenFlow
                      ?.helpText
                  }
                </p>
              ) : null}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={saveToken}
                disabled={tokenSaving}
                className={clsx(
                  "rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400",
                  tokenSaving && "opacity-60 cursor-not-allowed"
                )}
                type="button"
              >
                {tokenSaving ? "Saving…" : "Save Token"}
              </button>

              <button
                onClick={() => {
                  setTokenOpen(false);
                  setTokenItem(null);
                  setTokenValue("");
                }}
                className="rounded-xl border border-slate-700 bg-slate-900/40 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}