import React from "react";
import { X } from "lucide-react";
import { clsx } from "./utils";
import { btn, btnGhost } from "./style";

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between gap-3 p-5 border-b border-white/10">
            <div className="text-base font-semibold text-white">{title}</div>
            <button type="button" onClick={onClose} className={clsx(btn, btnGhost, "px-3 py-2")}>
              <X size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer ? <div className="p-5 border-t border-white/10">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
