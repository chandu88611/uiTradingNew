// AuthShell.tsx
import React from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-gradient-to-br from-[#020824] via-[#04124a] to-[#021a3a] text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-[1.2fr,1fr] gap-10 items-stretch">
        {/* Left – promo / brand side */}
        <div className="hidden md:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#041d66] via-[#031040] to-[#020824] border border-slate-700/60 shadow-2xl px-10 py-8">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="h-9 w-9 rounded-xl bg-emerald-400 flex items-center justify-center font-black text-slate-950">
              TB
            </div>
            <div className="text-lg font-semibold tracking-wide">
              Tradebro<span className="text-emerald-400">X</span>
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">
              High-Frequency · Copy Trading · TV Integration
            </p>
            <h1 className="text-3xl font-semibold leading-snug">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-300/80 text-sm">{subtitle}</p>
            )}

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span>Real-time synced trades across all your broker accounts.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span>Performance analytics built for scalpers & intraday traders.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span>TradingView webhooks plug directly into your strategies.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>© {new Date().getFullYear()} TradebroX Labs</span>
            <span className="text-slate-400/80">
              Risk Disclosure • Terms • Privacy
            </span>
          </div>
        </div>

        {/* Right – form side */}
        <div className="rounded-3xl bg-slate-950/70 border border-slate-700/70 shadow-2xl backdrop-blur-xl px-6 py-7 sm:px-8 sm:py-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
