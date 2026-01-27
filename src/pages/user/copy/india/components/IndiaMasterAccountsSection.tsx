import React, { useMemo, useState } from "react";
import { Copy, Save, Trash2, Plus, Power, Check } from "lucide-react";
import { btn, btnDanger, btnGhost, btnPrimary, clsx, input, soft } from "../../shared/ui";
import type { IndiaMasterSlot } from "../copyIndia.types";

function genMasterId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `IND-CT-${n}`;
}

export default function IndiaMasterAccountsSection({
  slots,
  setSlots,
  maxAccounts,
}: {
  slots: IndiaMasterSlot[];
  setSlots: React.Dispatch<React.SetStateAction<IndiaMasterSlot[]>>;
  maxAccounts: number;
}) {
  const used = slots.length;
  const limitReached = maxAccounts > 0 && used >= maxAccounts;

  const [copied, setCopied] = useState<string | null>(null);

  const copyId = async (masterId: string) => {
    try {
      await navigator.clipboard.writeText(masterId);
      setCopied(masterId);
      setTimeout(() => setCopied(null), 900);
    } catch {}
  };

  const toggleAll = () => {
    const anyOff = slots.some((s) => !s.enabled);
    setSlots((prev) => prev.map((s) => ({ ...s, enabled: anyOff })));
  };

  const addSlot = () => {
    if (limitReached) return;
    const now = new Date().toISOString();
    setSlots((prev) => [
      {
        id: `slot_${Date.now()}`,
        masterId: genMasterId(),
        broker: "KITE",
        nickname: "New Master",
        enabled: true,
        token: "",
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
  };

  const remove = (id: string) => setSlots((prev) => prev.filter((x) => x.id !== id));

  const update = (id: string, patch: Partial<IndiaMasterSlot>) =>
    setSlots((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x))
    );

  const anyOn = slots.some((s) => s.enabled);

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-slate-100">Master Accounts (shareable)</div>
          <div className="text-xs text-slate-400 mt-1">
            Create master slots, share Master ID with followers. Token is optional (followers can attach token after approval).
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className={clsx(btn, btnGhost)} onClick={toggleAll} disabled={slots.length === 0}>
            <Power size={16} />
            {anyOn ? "ALL ON/OFF" : "ALL ON/OFF"}
          </button>

          <button type="button" className={clsx(btn, btnPrimary)} onClick={addSlot} disabled={limitReached}>
            <Plus size={16} />
            Add Master
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Accounts used: <span className="text-slate-200 font-semibold">{used}</span>
        {maxAccounts > 0 ? (
          <>
            {" "}
            / <span className="text-slate-200 font-semibold">{maxAccounts}</span>
          </>
        ) : null}
        {limitReached ? <span className="ml-2 text-amber-300">Plan limit reached</span> : null}
      </div>

      {/* Cards */}
      {slots.length === 0 ? (
        <div className={clsx(soft, "p-4 text-sm text-slate-300")}>No master accounts yet. Click “Add Master”.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((s) => {
            const tokenMissing = !s.token || s.token.trim() === "";

            return (
              <div key={s.id} className={clsx(soft, "p-4")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100">{s.nickname}</div>
                    <div className="text-xs text-slate-400 mt-1">Broker: {s.broker}</div>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                        Master ID:
                        <b className="text-slate-100">{s.masterId}</b>
                      </span>

                      <button
                        type="button"
                        className={clsx(btn, btnGhost, "h-8 px-3 text-xs")}
                        onClick={() => copyId(s.masterId)}
                      >
                        {copied === s.masterId ? <Check size={14} /> : <Copy size={14} />}
                        Copy
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={clsx(
                      "h-9 w-14 rounded-full border transition relative",
                      s.enabled ? "bg-emerald-500/80 border-emerald-400/40" : "bg-white/5 border-white/10"
                    )}
                    onClick={() => update(s.id, { enabled: !s.enabled })}
                    aria-pressed={s.enabled}
                  >
                    <span
                      className={clsx(
                        "absolute top-[5px] h-6 w-6 rounded-full bg-slate-950 transition",
                        s.enabled ? "left-7" : "left-[5px]"
                      )}
                    />
                  </button>
                </div>

                {/* Editable fields */}
                <div className="mt-4 grid gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400">Nickname</div>
                    <input className={input} value={s.nickname} onChange={(e) => update(s.id, { nickname: e.target.value })} />
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Broker</div>
                    <select
                      className={input}
                      value={s.broker}
                      onChange={(e) => update(s.id, { broker: e.target.value as any })}
                    >
                      <option value="KITE">Kite</option>
                      <option value="DHAN">Dhan</option>
                      <option value="ANGEL">Angel</option>
                      <option value="UPSTOX">Upstox</option>
                      <option value="FYERS">Fyers</option>
                      <option value="SHOONYA">Shoonya</option>
                      <option value="ALICEBLUE">AliceBlue</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">Token (optional)</div>
                      {tokenMissing ? (
                        <span className="text-[11px] text-amber-300">Missing</span>
                      ) : (
                        <span className="text-[11px] text-emerald-300">Present</span>
                      )}
                    </div>
                    <input
                      className={input}
                      value={s.token ?? ""}
                      onChange={(e) => update(s.id, { token: e.target.value })}
                      placeholder="Paste token if trader will execute from this master"
                    />
                    <div className="mt-2 text-[11px] text-slate-500">
                      If follower doesn't want to share token, keep this blank → follower adds token after approval.
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button type="button" className={clsx(btn, btnGhost)} onClick={() => copyId(s.masterId)}>
                      <Copy size={16} />
                      Share Master ID
                    </button>

                    <button type="button" className={clsx(btn, btnDanger)} onClick={() => remove(s.id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
