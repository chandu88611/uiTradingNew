// src/routes/RequireUserAuth.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { useMeQuery } from "./services/userApi";

const RequireUserAuth: React.FC = () => {
  const location = useLocation();

  // calls GET /auth/me with cookies
  const { data, isLoading, isError } = useMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  } as any);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.65)] backdrop-blur"
          >
            {/* glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.14),_transparent_55%)]" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Getting things ready…
                  </p>
                  <p className="text-xs text-slate-400">
                    One moment. We’ll take you to your page.
                  </p>
                </div>
              </div>

              {/* progress shimmer */}
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                <motion.div
                  initial={{ x: "-60%" }}
                  animate={{ x: "120%" }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-1/2 rounded-full bg-emerald-400/70"
                />
              </div>

              {/* small benefits row (non-technical) */}
              <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-slate-300/90">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-950/40 border border-slate-800 px-3 py-2">
                  <Zap size={14} className="text-emerald-400" />
                  <span>Fast & secure access</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-950/40 border border-slate-800 px-3 py-2">
                  <ArrowRight size={14} className="text-emerald-400" />
                  <span>Continuing…</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // not logged in
  // NOTE: adjust according to your /me response shape
  const authed = Boolean((data as any)?.data?.id || (data as any)?.user?.id);

  if (isError || !authed) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: location.pathname || "/dashboard" }}
      />
    );
  }

  return <Outlet />;
};

export default RequireUserAuth;
