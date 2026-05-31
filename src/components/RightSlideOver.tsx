// src/components/RightSlideOver.tsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function RightSlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "w-full sm:w-[560px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[2147483646] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={clsx(
              "fixed right-0 top-0 z-[2147483647] h-[100dvh]",
              widthClass,
              "bg-slate-950",
              "border-l border-white/15",
              "shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_30px_120px_rgba(0,0,0,0.85)]"
            )}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-100">
                  {title}
                </div>

                {subtitle ? (
                  <div className="mt-0.5 truncate text-xs text-slate-400">
                    {subtitle}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-[calc(100dvh-73px)] overflow-auto px-5 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}