import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { btn, btnDanger, btnGhost, clsx, input, soft } from "../../shared/ui";
import type { IndiaFollowRequest } from "../copyIndia.types";

export default function IndiaFollowerRequestsSection({
  requests,
  setRequests,
}: {
  requests: IndiaFollowRequest[];
  setRequests: React.Dispatch<React.SetStateAction<IndiaFollowRequest[]>>;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return requests;
    return requests.filter((r) => (r.masterId + " " + r.followerName + " " + (r.followerEmail ?? "")).toLowerCase().includes(t));
  }, [q, requests]);

  const setStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );
  };

  const icon =
    (s: IndiaFollowRequest["status"]) =>
      s === "APPROVED" ? <CheckCircle2 size={14} className="text-emerald-300" /> :
      s === "REJECTED" ? <XCircle size={14} className="text-rose-300" /> :
      <Clock size={14} className="text-amber-300" />;

  const badge =
    (s: IndiaFollowRequest["status"]) =>
      s === "APPROVED"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        : s === "REJECTED"
        ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
        : "border-amber-500/20 bg-amber-500/10 text-amber-200";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-slate-100">Follower Requests</div>
          <div className="text-xs text-slate-400 mt-1">
            Followers enter Master ID → request appears here → approve/reject.
          </div>
        </div>

        <div className="w-full max-w-sm relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
          <input className={clsx(input, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search masterId / name" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={clsx(soft, "p-4 text-sm text-slate-300")}>No requests yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className={clsx(soft, "p-4")}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-semibold text-slate-100">{r.followerName}</div>
                    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs", badge(r.status))}>
                      {icon(r.status)} {r.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-1">
                    Master ID: <b className="text-slate-200">{r.masterId}</b>
                    {r.followerEmail ? (
                      <>
                        {" "}
                        • <span className="text-slate-300">{r.followerEmail}</span>
                      </>
                    ) : null}
                  </div>

                  {r.status === "APPROVED" ? (
                    <div className="mt-2 text-[11px] text-slate-500">
                      {r.followerToken ? "Follower token added." : "Waiting for follower token/credentials."}
                    </div>
                  ) : null}
                </div>

                {r.status === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <button type="button" className={clsx(btn, btnGhost)} onClick={() => setStatus(r.id, "APPROVED")}>
                      Approve
                    </button>
                    <button type="button" className={clsx(btn, btnDanger)} onClick={() => setStatus(r.id, "REJECTED")}>
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">Updated: {new Date(r.updatedAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
