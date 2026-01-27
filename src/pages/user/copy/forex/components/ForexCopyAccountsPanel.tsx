// src/pages/copytrading/forex/components/ForexCopyAccountsPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Download, Power, RefreshCw, Crown, Save, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import Drawer from "./Drawer";
import Menu from "./Menu";
import Switch from "./Switch";

import { btn, btnAmber, btnDanger, btnOutline, btnPrimary, card, clsx, formatDate, input } from "../ui";
import { ForexAccountType, ForexCopyAccount } from "../forex.types";

function nextId() {
  return Math.floor(1000 + Math.random() * 9000);
}

export default function ForexCopyAccountsPanel({
  roleMode, // TRADER | FOLLOWER
  maxAccounts,
  value,
  onChange,
}: {
  roleMode: "TRADER" | "FOLLOWER";
  maxAccounts: number;
  value: ForexCopyAccount[];
  onChange: (rows: ForexCopyAccount[]) => void;
}) {
  const rows = value;

  const used = rows.length;
  const limitReached = maxAccounts > 0 ? used >= maxAccounts : false;

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    rows.forEach((r) => {
      next[String(r.id)] = enabledMap[String(r.id)] ?? r.enabled ?? true;
    });
    setEnabledMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  const allOn = rows.length > 0 && rows.every((r) => enabledMap[String(r.id)] !== false);

  const masterCount = useMemo(() => rows.filter((r) => r.isMaster).length, [rows]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forex_copy_accounts_${roleMode.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAll = () => {
    const next = !allOn;
    const m: Record<string, boolean> = {};
    rows.forEach((r) => (m[String(r.id)] = next));
    setEnabledMap(m);
    toast.success(next ? "All accounts turned ON" : "All accounts turned OFF");
  };

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingId, setEditingId] = useState<number | null>(null);

  // form fields
  const [type, setType] = useState<ForexAccountType>("MT5");
  const [label, setLabel] = useState("");
  const [isMaster, setIsMaster] = useState(true); // trader only
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");

  const openCreate = () => {
    if (limitReached) return toast.error("Account limit reached for this plan");
    setDrawerMode("CREATE");
    setEditingId(null);

    setType("MT5");
    setLabel("");
    setIsMaster(roleMode === "TRADER"); // default master for trader
    setUserId("");
    setToken("");

    setDrawerOpen(true);
  };

  const openEdit = (r: ForexCopyAccount) => {
    setDrawerMode("EDIT");
    setEditingId(r.id);

    setType(r.type);
    setLabel(r.label);
    setIsMaster(roleMode === "TRADER" ? r.isMaster : false);
    setUserId(r.userId);
    setToken(""); // optional update token

    setDrawerOpen(true);
  };

  const save = () => {
    const t = String(type).toUpperCase();

    if (!label.trim()) return toast.error("Label is required");
    if (!userId.trim()) return toast.error(t === "MT5" ? "MT5 Login ID is required" : "cTrader Account ID is required");
    if (t === "CTRADER" && drawerMode === "CREATE" && !token.trim()) return toast.error("cTrader Access Token is required");

    const now = new Date().toISOString();

    if (drawerMode === "CREATE") {
      const newRow: ForexCopyAccount = {
        id: nextId(),
        type: t === "CTRADER" ? "CTRADER" : "MT5",
        label: label.trim(),
        enabled: true,
        isMaster: roleMode === "TRADER" ? !!isMaster : false,
        userId: userId.trim(),
        hasToken: t === "CTRADER" ? true : undefined,
        createdAt: now,
        updatedAt: now,
      };

      // enforce: only one master recommended (not forced)
      if (roleMode === "TRADER" && newRow.isMaster && masterCount >= 1) {
        toast.info("You already have a Master. You can still create another, but recommended is only one Master.");
      }

      onChange([newRow, ...rows]);
      setDrawerOpen(false);
      toast.success("Saved");
      return;
    }

    // EDIT
    if (!editingId) return;

    onChange(
      rows.map((r) => {
        if (r.id !== editingId) return r;
        const isCtrader = t === "CTRADER";
        return {
          ...r,
          type: isCtrader ? "CTRADER" : "MT5",
          label: label.trim(),
          userId: userId.trim(),
          isMaster: roleMode === "TRADER" ? !!isMaster : false,
          hasToken: isCtrader ? (token.trim() ? true : r.hasToken) : undefined,
          updatedAt: now,
        };
      })
    );

    setDrawerOpen(false);
    toast.success("Updated");
  };

  const remove = (id: number) => {
    onChange(rows.filter((r) => r.id !== id));
    toast.success("Deleted");
  };

  const setMaster = (id: number) => {
    if (roleMode !== "TRADER") return;
    onChange(
      rows.map((r) => ({
        ...r,
        isMaster: r.id === id,
        updatedAt: r.id === id ? new Date().toISOString() : r.updatedAt,
      }))
    );
    toast.success("Master set");
  };

  return (
    <div className="w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            {roleMode === "TRADER" ? "Forex Copy • Trader Accounts" : "Forex Copy • Your Accounts"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Accounts used: <span className="text-slate-200 font-semibold">{used}</span>
            {maxAccounts ? (
              <>
                {" "}
                / <span className="text-slate-200 font-semibold">{maxAccounts}</span>
              </>
            ) : null}
            {limitReached ? <span className="ml-2 text-amber-300">Plan limit reached</span> : null}
            {roleMode === "TRADER" ? (
              <span className="ml-2 text-slate-500">• Masters: {masterCount}</span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={exportJson} className={clsx(btn, btnOutline)}>
            <Download size={14} />
            Export
          </button>

          <button
            type="button"
            onClick={toggleAll}
            disabled={rows.length === 0}
            className={clsx(
              btn,
              allOn
                ? "border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/20"
                : "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
            )}
          >
            <Power size={14} />
            ALL API ON / OFF
          </button>

          <button type="button" onClick={() => toast.info("Dummy refresh")} className={clsx(btn, btnOutline)}>
            <RefreshCw size={14} />
            Refresh
          </button>

          <button type="button" onClick={openCreate} disabled={limitReached} className={clsx(btn, btnPrimary)}>
            <Plus size={14} />
            Add New
          </button>
        </div>
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div className={card}>
          <p className="text-slate-200 font-semibold">No accounts added yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click “Add New” to connect MT5 or cTrader.
            {roleMode === "FOLLOWER" ? " These are your child accounts used to copy the master." : ""}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const key = String(r.id);
            const enabled = enabledMap[key] !== false;
            const isCtrader = String(r.type).toUpperCase() === "CTRADER";

            return (
              <div key={key} className={card}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-100">{r.label}</p>
                    <p className="text-xs text-slate-400 mt-2">Type :</p>
                    <p className="text-sm text-slate-200 font-medium truncate">{isCtrader ? "cTrader" : "MT5"}</p>

                    <p className="text-xs text-slate-400 mt-2">Account :</p>
                    <p className="text-sm text-slate-200 font-medium truncate">{r.userId}</p>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {roleMode === "TRADER" ? (
                        r.isMaster ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2.5 py-1 text-[11px] text-yellow-200">
                            <Crown size={12} /> Master
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-900/60 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-200">
                            Child
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-900/60 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-200">
                          Child
                        </span>
                      )}

                      {isCtrader ? (
                        <span className="inline-flex items-center rounded-full bg-slate-900/60 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-200">
                          hasToken: {r.hasToken ? "yes" : "no"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={enabled} onChange={(v) => setEnabledMap((p) => ({ ...p, [key]: v }))} />
                    <Menu onEdit={() => openEdit(r)} onDelete={() => remove(r.id)} />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Created :</span>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Updated :</span>
                    <span>{formatDate(r.updatedAt)}</span>
                  </div>
                </div>

                {roleMode === "TRADER" && !r.isMaster ? (
                  <div className="mt-4 flex items-center justify-end">
                    <button type="button" onClick={() => setMaster(r.id)} className={clsx(btn, btnAmber, "px-3 py-2")}>
                      <Crown size={14} />
                      Set Master
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        title={drawerMode === "CREATE" ? "Add New Account" : "Edit Account"}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-indigo-600">SELECT TYPE</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ForexAccountType)}
              className="mt-2 w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={drawerMode === "EDIT"}
            >
              <option value="MT5">MT5</option>
              <option value="CTRADER">cTrader</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">LABEL</label>
            <input className={input.replace("mt-2", "")} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Main MT5" />
          </div>

          {roleMode === "TRADER" ? (
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-[11px] font-semibold text-slate-600">ROLE</div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <input type="checkbox" checked={isMaster} onChange={(e) => setIsMaster(e.target.checked)} className="h-4 w-4" />
                isMaster (unchecked = Child)
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Recommended: keep exactly one Master account for copy trading.
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              {String(type).toUpperCase() === "CTRADER" ? "CTRADER ACCOUNT ID" : "MT5 LOGIN ID"}
            </label>
            <input
              className={input.replace("mt-2", "")}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={String(type).toUpperCase() === "CTRADER" ? "cTrader Account ID" : "MT5 Login ID"}
            />
          </div>

          {String(type).toUpperCase() === "CTRADER" ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-600">
                CTRADER ACCESS TOKEN{" "}
                {drawerMode === "EDIT" ? <span className="text-[11px] text-slate-400">(optional)</span> : null}
              </label>
              <input
                className={input.replace("mt-2", "")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste access token"
              />
            </div>
          ) : null}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              <span className="inline-flex items-center gap-2">
                <Save size={16} />
                {drawerMode === "CREATE" ? "Submit" : "Save Changes"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg bg-rose-100 px-6 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-200"
            >
              Cancel
            </button>
          </div>

          {drawerMode === "EDIT" && editingId ? (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => remove(editingId)}
                className={clsx(btn, btnDanger, "px-4 py-2")}
              >
                <Trash2 size={14} />
                Delete this account
              </button>
            </div>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
