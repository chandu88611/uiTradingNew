// src/pages/copytrading/forex/components/ForexFollowerConnectCard.tsx
import React from "react";
import { Link2 } from "lucide-react";
import { card, clsx, btn, btnPrimary, input } from "../ui";
import { ForexFollowerLinkState } from "../forex.types";
import { toast } from "react-toastify";

export default function ForexFollowerConnectCard({
  value,
  onChange,
}: {
  value: ForexFollowerLinkState;
  onChange: (v: ForexFollowerLinkState) => void;
}) {
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Link2 size={18} />
            Follow a Trader
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Enter Trader Code → connect your account(s) and start copying.
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Status:{" "}
          <span
            className={clsx(
              "font-semibold",
              value.status === "CONNECTED" ? "text-emerald-300" : value.status === "PENDING" ? "text-amber-300" : "text-slate-300"
            )}
          >
            {value.status}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="text-xs font-semibold text-slate-300">TRADER CODE</div>
          <input
            className={input.replace("mt-2", "mt-2")}
            value={value.traderCode}
            onChange={(e) => onChange({ ...value, traderCode: e.target.value })}
            placeholder="e.g. FXTRADER-7K9A"
          />
        </div>

        <div className="flex items-end">
          <button
            className={clsx(btn, btnPrimary, "w-full justify-center")}
            onClick={() => {
              if (!value.traderCode.trim()) return toast.error("Trader code required");
              // Dummy: connect instantly
              onChange({ ...value, status: "CONNECTED" });
              toast.success("Connected (dummy)");
            }}
          >
            Connect
          </button>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        In real flow you can keep status as PENDING until trader approves, but for forex you said it can be one-time/simple.
      </div>
    </div>
  );
}
