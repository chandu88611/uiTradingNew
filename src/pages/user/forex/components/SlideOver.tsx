import React from "react";
import { X } from "lucide-react";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function SlideOver({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClass = "w-full sm:w-[520px]",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className={clsx("fixed inset-0 z-[90]", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={clsx("absolute inset-0 bg-black/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
      />

      <div
        className={clsx(
          "absolute right-0 top-0 h-full bg-slate-950 border-l border-white/10 shadow-2xl transition-transform",
          widthClass,
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white">{title}</div>
                {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
              </div>
              <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-2">
                <X size={16} className="text-slate-200" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
