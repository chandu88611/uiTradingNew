import React from "react";
import type { NormalizedFollow } from "./normalizeFollow";
import FollowCardShell from "./FollowCardShell";

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="text-[12px] text-slate-400">{label}</div>
      <div className="text-[13px] font-semibold text-slate-100 truncate max-w-[65%] text-right">
        {value ?? "—"}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-white/5" />;
}

export default function CryptoFollowing({
  list,
  onEdit,
  onConnect,
  onQuickStatus,
}: {
  list: NormalizedFollow[];
  onEdit: (f: NormalizedFollow) => void;
  onConnect: (f: NormalizedFollow) => void;
  onQuickStatus: (f: NormalizedFollow, status: any) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {list.map((f) => {
        const meta: any = (f as any).meta || {};

        // execution account (keep flexible)
        const exchange = meta.exchange ?? meta.broker ?? f.brokerLabel ?? "—";
        const subAccount = meta.subAccount ?? meta.sub_account ?? meta.accountName ?? "—";
        const apiLabel = meta.apiName ?? meta.label ?? meta.name ?? "";

        // risk (keep minimal)
        const riskMode = (f as any).riskMode ?? meta.riskMode ?? "—";
        const riskValue = (f as any).riskValue ?? meta.riskValue ?? "—";
        const maxLot = (f as any).maxLot ?? meta.maxLot ?? "—";
        const slippage = (f as any).slippageTolerance ?? meta.slippageTolerance ?? meta.slippage ?? "—";

        return (
          <FollowCardShell
            key={(f as any).id}
            f={f}
            onEdit={onEdit as any}
            onConnect={onConnect as any}
            onQuickStatus={onQuickStatus as any}
          >
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 px-4">
              <Row label="Exchange" value={exchange} />
              <Divider />
              <Row label="Account" value={apiLabel || subAccount} />
              <Divider />
              <Row label="Sub Account" value={subAccount} />

              <div className="my-3 h-px bg-white/5" />

              <Row label="Risk Mode" value={riskMode} />
              <Divider />
              <Row label="Risk Value" value={riskValue} />
              <Divider />
              <Row label="Max Lot" value={maxLot} />
              <Divider />
              <Row label="Slippage" value={slippage} />
            </div>
          </FollowCardShell>
        );
      })}
    </div>
  );
}
