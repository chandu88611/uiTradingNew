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

export default function IndianFollowing({
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

        const broker = meta.broker ?? (f as any).brokerLabel ?? "—";
        const apiName = meta.apiName ?? meta.label ?? (f as any).accountLabel ?? "—";

        // keep minimal, common for indian brokers
        const clientId = meta.clientId ?? meta.userId ?? meta.customerId ?? "—";
        const exchange = meta.exchange ?? "—";
        const product = meta.product ?? "—";

        // minimal risk fields
        const riskMode = (f as any).riskMode ?? meta.riskMode ?? "—";
        const riskValue = (f as any).riskValue ?? meta.riskValue ?? "—";
        const maxPositions = (f as any).maxOpenPositions ?? meta.maxOpenPositions ?? meta.maxPositions ?? "—";
        const maxDailyLoss = (f as any).maxDailyLoss ?? meta.maxDailyLoss ?? "—";

        return (
          <FollowCardShell
            key={(f as any).id}
            f={f}
            onEdit={onEdit as any}
            onConnect={onConnect as any} // IMPORTANT: open token/apiKey modal here
            onQuickStatus={onQuickStatus as any}
          >
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 px-4">
              <Row label="Broker" value={broker} />
              <Divider />
              <Row label="Account" value={apiName} />
              <Divider />
              <Row label="Client ID" value={clientId} />
              <Divider />
              <Row label="Exchange / Product" value={`${exchange} / ${product}`} />

              <div className="my-3 h-px bg-white/5" />

              <Row label="Risk Mode" value={riskMode} />
              <Divider />
              <Row label="Risk Value" value={riskValue} />
              <Divider />
              <Row label="Max Positions" value={maxPositions} />
              <Divider />
              <Row label="Max Daily Loss" value={maxDailyLoss} />
            </div>

            {meta?.needsAuth ? (
              <div className="mt-3 text-[12px] text-yellow-200/90">
                Action required: Connect/Update to enable copying.
              </div>
            ) : null}
          </FollowCardShell>
        );
      })}
    </div>
  );
}
