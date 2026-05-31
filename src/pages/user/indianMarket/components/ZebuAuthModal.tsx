import React, { useState } from "react";
import { useGenerateZebuTokenMutation } from "../../../../services/indiaMarket.api";
import { clsx, btn, btnGhost } from "../ui";

type Props = {
  tradingAccountId: number;
  onClose: () => void;
};

export default function ZebuAuthModal({ tradingAccountId, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [totp, setTotp]         = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [generateToken, { isLoading }] = useGenerateZebuTokenMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password) { setErrorMsg("Password is required."); return; }
    if (!totp || totp.length !== 6) { setErrorMsg("Enter your 6-digit TOTP code."); return; }

    try {
      const result = await generateToken({
        tradingAccountId,
        password,
        factor2: totp,
      }).unwrap();

      if ((result as any).ok === false) {
        setErrorMsg((result as any).message ?? "Authentication failed.");
      } else {
        setSuccessMsg("Zebu authenticated successfully. Your session is active.");
        setTimeout(onClose, 1500);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message ?? err?.message ?? "Authentication failed. Check your credentials and TOTP code.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-100">Zebu Login</h2>
        <p className="mb-5 text-xs text-slate-400">
          Enter your Zebu password and the current TOTP code from your authenticator app to
          generate a trading session token.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Password</label>
            <input
              type="password"
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 outline-none focus:border-emerald-400/60"
              placeholder="Zebu login password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">TOTP Code (6 digits)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 outline-none focus:border-emerald-400/60"
              placeholder="123456"
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="one-time-code"
              disabled={isLoading}
            />
          </div>

          {errorMsg && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              {successMsg}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={clsx(btn, btnGhost)} onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isLoading ? "Authenticating…" : "Authenticate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
