import React, { useEffect, useMemo, useState } from "react";
import { page, card, btn, btnGhost, btnPrimary, clsx, input, soft } from "../shared/ui";
import { getLS, setLS } from "../shared/storage";
import { Plus, Save } from "lucide-react";
import { IndiaFollowRequest } from "./copyIndia.types";

/**
 * UI-only user flow:
 * - user enters Master ID
 * - request is appended into same LS list used by trader page
 * - trader approves
 * - user sees approved request and adds token
 */

export default function CopyTradingIndiaFollowerPage() {
  const [masterId, setMasterId] = useState("");
  const [label, setLabel] = useState("");

  const [requests, setRequests] = useState<IndiaFollowRequest[]>(() => getLS("ct.india.followRequests.v1", []));
  useEffect(() => setLS("ct.india.followRequests.v1", requests), [requests]);

  // In real app, filter by current user id; for UI, keep "me"
  const myName = "You";

  const myRequests = useMemo(() => requests.filter((r) => r.followerName === myName), [requests]);

  const sendRequest = () => {
    const id = masterId.trim().toUpperCase();
    if (!id) return;

    const now = new Date().toISOString();

    setRequests((prev) => [
      {
        id: `req_${Date.now()}`,
        masterId: id,
        followerName: myName,
        followerEmail: "you@mail.com",
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);

    setMasterId("");
  };

  const saveToken = (reqId: string, token: string, accountLabel: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              followerToken: token,
              followerAccountLabel: accountLabel,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  return (
    <div className={page}>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Copy Trading • India (Follower)</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter a Master ID shared by a trader. After approval, you can add your token/credentials.
        </p>
      </div>

      {/* Join */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-slate-100">Follow a Master</div>
            <div className="text-xs text-slate-400 mt-1">Example: IND-CT-482913</div>
          </div>

          <button type="button" className={clsx(btn, btnPrimary)} onClick={sendRequest} disabled={!masterId.trim()}>
            <Plus size={16} />
            Send Request
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-300">Master ID</div>
            <input className={input} value={masterId} onChange={(e) => setMasterId(e.target.value)} placeholder="IND-CT-XXXXXX" />
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-300">Account label (optional)</div>
            <input className={input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My Dhan / My Kite" />
            <div className="text-[11px] text-slate-500 mt-2">You can add label later when adding token.</div>
          </div>
        </div>
      </div>

      {/* Requests */}
      <div className={clsx(card, "mt-6")}>
        <div className="text-sm font-semibold text-slate-100">My Requests</div>

        {myRequests.length === 0 ? (
          <div className={clsx(soft, "p-4 mt-4 text-sm text-slate-300")}>No requests yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {myRequests.map((r) => {
              const approved = r.status === "APPROVED";
              const canAddToken = approved;

              const [token, setToken] = useState(r.followerToken ?? "");
              const [accLabel, setAccLabel] = useState(r.followerAccountLabel ?? "");

              return (
                <div key={r.id} className={clsx(soft, "p-4")}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{r.masterId}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Status: <b className="text-slate-200">{r.status}</b>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Updated: {new Date(r.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  {canAddToken ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-300">Account label</div>
                        <input className={input} value={accLabel} onChange={(e) => setAccLabel(e.target.value)} placeholder="My Dhan / My Kite" />
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-300">Token / Credential</div>
                        <input className={input} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token" />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className={clsx(btn, btnGhost)}
                          onClick={() => {
                            setAccLabel(r.followerAccountLabel ?? "");
                            setToken(r.followerToken ?? "");
                          }}
                        >
                          Reset
                        </button>

                        <button
                          type="button"
                          className={clsx(btn, btnPrimary)}
                          onClick={() => saveToken(r.id, token, accLabel)}
                          disabled={!token.trim()}
                        >
                          <Save size={16} />
                          Save Token
                        </button>
                      </div>

                      <div className="md:col-span-2 text-[11px] text-slate-500">
                        After you save token, trader sees “token added” and copy execution can begin.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-slate-500">
                      Waiting for trader approval. Once approved, token input appears here.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
