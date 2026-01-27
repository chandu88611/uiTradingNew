// src/pages/copytrading/forex/pages/CopyTradingForexFollowerPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "react-toastify";

import { pageWrap, clsx, btn, btnOutline } from "./ui";
import { ForexCopyAccount, ForexCopySettings, ForexFollowerLinkState } from "./forex.types";

import ForexFollowerConnectCard from "./components/ForexFollowerConnectCard";
import ForexCopyAccountsPanel from "./components/ForexCopyAccountsPanel";
import ForexCopySettingsDrawer from "./components/ForexCopySettingsDrawer";

function getLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function setLS(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function CopyTradingForexFollowerPage() {
  // trader link
  const [link, setLink] = useState<ForexFollowerLinkState>(() =>
    getLS("copy.fx.follower.link.v1", { traderCode: "", status: "NONE" })
  );
  useEffect(() => setLS("copy.fx.follower.link.v1", link), [link]);

  // follower accounts (child accounts)
  const [accounts, setAccounts] = useState<ForexCopyAccount[]>(() =>
    getLS("copy.fx.follower.accounts.v1", [])
  );
  useEffect(() => setLS("copy.fx.follower.accounts.v1", accounts), [accounts]);

  // copy settings
  const [settings, setSettings] = useState<ForexCopySettings>(() =>
    getLS("copy.fx.follower.settings.v1", {
      multiplier: 1,
      maxSlippagePips: 2,
      perTradeRiskCap: 500,
      pauseCopy: false,
    })
  );
  useEffect(() => setLS("copy.fx.follower.settings.v1", settings), [settings]);

  const [openSettings, setOpenSettings] = useState(false);

  const canCopy = link.status === "CONNECTED" && accounts.length > 0 && !settings.pauseCopy;

  useEffect(() => {
    if (link.status === "CONNECTED" && accounts.length === 0) {
      toast.info("Connected. Add at least one account to start copying.", { autoClose: 2200 });
    }
  }, [link.status, accounts.length]);

  return (
    <div className={pageWrap}>
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Copy Trading • Forex (Follower)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect to a trader → add your account(s) → configure copy risk.
          </p>
        </div>

        <button className={clsx(btn, btnOutline)} onClick={() => setOpenSettings(true)}>
          <Settings2 size={14} />
          Copy Settings
        </button>
      </div>

      <ForexFollowerConnectCard value={link} onChange={setLink} />

      <div className="mt-5">
        <ForexCopyAccountsPanel roleMode="FOLLOWER" maxAccounts={10} value={accounts} onChange={setAccounts} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/5 bg-slate-950/30 p-4 text-sm">
        Status:{" "}
        <span className={clsx("font-semibold", canCopy ? "text-emerald-300" : "text-amber-300")}>
          {canCopy ? "Copying READY" : "Not ready"}
        </span>
        <div className="text-xs text-slate-500 mt-1">
          Requirements: Connected trader + at least one account + copy not paused.
        </div>
      </div>

      <ForexCopySettingsDrawer
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        value={settings}
        onChange={setSettings}
      />
    </div>
  );
}
