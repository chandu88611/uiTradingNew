// src/components/user/forex/ForexCopyMarket.tsx
import React, { useMemo, useState } from "react";
import { RefreshCw, Save, Pencil, Trash2, Crown, X } from "lucide-react";
import { toast } from "react-toastify";

import {
  useUpsertMyForexTraderDetailsMutation,
  usePatchForexTraderDetailByIdMutation,
  useDeleteForexTraderDetailByIdMutation,
  ForexTradeCategory,
} from "../../services/forexTraderUserDetails.api";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const softCard = "rounded-2xl border border-white/10 bg-white/5 p-4";

export default function ForexCopyMarket({
  canForex,
  rows,
  loading,
  fetching,
  refetch,
}: {
  canForex: boolean;
  rows: any[];
  loading: boolean;
  fetching: boolean;
  refetch: () => void;
}) {
  if (!canForex) {
    return <div className="text-sm text-slate-300">Your plan does not include FOREX.</div>;
  }

  const [upsertFx, { isLoading: saving }] = useUpsertMyForexTraderDetailsMutation();
  const [patchFx, { isLoading: patching }] = usePatchForexTraderDetailByIdMutation();
  const [deleteFx, { isLoading: deleting }] = useDeleteForexTraderDetailByIdMutation();

  // Create form
  const [fxType, setFxType] = useState<ForexTradeCategory>("MT5");
  const [isMaster, setIsMaster] = useState(true);
  const [mt5LoginId, setMt5LoginId] = useState("");
  const [ctraderAccountId, setCtraderAccountId] = useState("");
  const [ctraderToken, setCtraderToken] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editIsMaster, setEditIsMaster] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [editToken, setEditToken] = useState(""); // optional; never prefill

  const normalizedRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  function resetForm() {
    setFxType("MT5");
    setIsMaster(true);
    setMt5LoginId("");
    setCtraderAccountId("");
    setCtraderToken("");
  }

  function startEdit(r: any) {
    setEditingId(Number(r.id));
    setEditIsMaster(!!r.isMaster);
    setEditUserId(String(r.forexTraderUserId ?? ""));
    setEditToken("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditIsMaster(false);
    setEditUserId("");
    setEditToken("");
  }

  async function onSaveNew() {
    try {
      const typeUpper = String(fxType).toUpperCase();

      if (typeUpper === "MT5") {
        if (!mt5LoginId.trim()) return toast.error("MT5 Login ID is required");

        await upsertFx({
          forexType: "MT5",
          forexTraderUserId: mt5LoginId.trim(),
          isMaster,
        }).unwrap();

        toast.success("Saved");
        resetForm();
        refetch();
        return;
      }

      // CTRADER
      if (!ctraderAccountId.trim()) return toast.error("cTrader Account ID is required");
      if (!ctraderToken.trim()) return toast.error("cTrader Access Token is required");

      await upsertFx({
        forexType: "CTRADER",
        forexTraderUserId: ctraderAccountId.trim(),
        token: ctraderToken.trim(),
        isMaster,
      }).unwrap();

      toast.success("Saved");
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save");
    }
  }

  async function onSaveEdit(id: number) {
    try {
      if (!editUserId.trim()) return toast.error("User ID is required");

      const patch: any = {
        forexTraderUserId: editUserId.trim(),
        isMaster: editIsMaster,
      };

      if (editToken.trim()) patch.token = editToken.trim();

      await patchFx({ id, patch } as any).unwrap();
      toast.success("Updated");
      cancelEdit();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update");
    }
  }

  async function onSetMaster(id: number) {
    try {
      await patchFx({ id, patch: { isMaster: true } } as any).unwrap();
      toast.success("Master set");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this row?")) return;
    try {
      await deleteFx({ id } as any).unwrap();
      toast.success("Deleted");
      if (editingId === id) cancelEdit();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete");
    }
  }

  return (
    <div className="space-y-5">
      {/* top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-white">Forex Trader Details</p>
          <p className="text-xs text-slate-400 mt-1">MT5: Login ID only • cTrader: Account ID + Access Token</p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
        >
          <RefreshCw size={14} />
          {fetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* add form */}
      <div className={softCard}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-white">Add Master / Child</p>
            <p className="text-xs text-slate-400 mt-1">
              Master is decided by <span className="text-slate-200 font-semibold">isMaster</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={onSaveNew}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Forex Type *</label>
            <select
              value={fxType}
              onChange={(e) => setFxType(e.target.value as ForexTradeCategory)}
              className={clsx(inputBase, "!mt-1")}
            >
              <option value="MT5">MT5</option>
              <option value="CTRADER">CTRADER</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Role</label>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={isMaster}
                onChange={(e) => setIsMaster(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950"
              />
              isMaster = true (unchecked = Child)
            </div>
          </div>

          {String(fxType).toUpperCase() === "MT5" ? (
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-300">MT5 Login ID *</label>
              <input value={mt5LoginId} onChange={(e) => setMt5LoginId(e.target.value)} className={inputBase} placeholder="e.g. 12345678" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300">cTrader Account ID *</label>
                <input value={ctraderAccountId} onChange={(e) => setCtraderAccountId(e.target.value)} className={inputBase} placeholder="e.g. 10001234" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">cTrader Access Token *</label>
                <input value={ctraderToken} onChange={(e) => setCtraderToken(e.target.value)} className={inputBase} placeholder="Paste access token" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* rows */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : normalizedRows.length === 0 ? (
          <div className="text-sm text-slate-400">No rows yet.</div>
        ) : (
          normalizedRows.map((r: any) => {
            const isEditing = editingId === Number(r.id);
            const isCTrader = String(r.forexType || "").toUpperCase() === "CTRADER";

            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-[260px]">
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {String(r.forexType || "MT5").toUpperCase()}
                      {r.isMaster ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-1 text-[11px] text-yellow-200">
                          <Crown size={12} /> Master
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200">
                          Child
                        </span>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="text-xs text-slate-400 mt-1">
                        User ID: <span className="text-slate-200">{r.forexTraderUserId}</span>
                        {isCTrader && (
                          <>
                            {" "}
                            • hasToken: <span className="text-slate-200">{r.hasToken ? "yes" : "no"}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-slate-300">User ID *</label>
                          <input value={editUserId} onChange={(e) => setEditUserId(e.target.value)} className={inputBase} />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300">Role</label>
                          <div className="mt-2 flex items-center gap-3 text-sm text-slate-200">
                            <input
                              type="checkbox"
                              checked={editIsMaster}
                              onChange={(e) => setEditIsMaster(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                            />
                            isMaster
                          </div>
                        </div>

                        {isCTrader && (
                          <div className="md:col-span-3">
                            <label className="text-xs font-medium text-slate-300">
                              cTrader Token (optional)
                              <span className="text-[11px] text-slate-500 ml-2">leave blank to keep existing</span>
                            </label>
                            <input value={editToken} onChange={(e) => setEditToken(e.target.value)} className={inputBase} placeholder="New token (optional)" />
                          </div>
                        )}

                        <div className="md:col-span-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSaveEdit(Number(r.id))}
                            disabled={patching}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                          >
                            <Save size={16} />
                            {patching ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!r.isMaster && (
                        <button
                          type="button"
                          onClick={() => onSetMaster(Number(r.id))}
                          disabled={patching}
                          className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-yellow-300 disabled:opacity-60"
                        >
                          <Crown size={14} />
                          Set Master
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(Number(r.id))}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-rose-400 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {(fetching || loading) && <div className="text-[11px] text-slate-500">Syncing…</div>}
    </div>
  );
}
