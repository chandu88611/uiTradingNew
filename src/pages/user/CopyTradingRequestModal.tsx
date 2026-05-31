// src/pages/.../CopyTradingRequestModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { X, Mail, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function CopyTradingRequestModal({
  open,
  onClose,
  onSubmit,
  loading,
  accountId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  loading?: boolean;
  accountId?: number;
}) {
  const [email, setEmail] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail("");
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const submit = () => {
    const v = email.trim();
    if (!v) return;
    onSubmit(v);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={boxRef}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <div className="text-sm font-semibold text-slate-100">Request Copy Trading</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Send request to master user email{accountId ? ` for account #${accountId}` : ""}.
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-white/5"
                aria-label="Close"
              >
                <X size={18} className="text-slate-300" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="text-[11px] font-semibold text-slate-300">MASTER USER EMAIL</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
                <Mail size={16} className="text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  type="email"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || !email.trim()}
                  className={clsx(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                    loading || !email.trim()
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  )}
                >
                  <Send size={16} />
                  {loading ? "Sending..." : "Send Request"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                After master approves in notification bell, copy trading will be enabled.
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
