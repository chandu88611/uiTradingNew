import React from "react";
import { X } from "lucide-react";
import { clsx } from "./ui";

export default function Drawer({
  open,
  title,
  onClose,
  children,
  widthClass = "max-w-[520px]",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className={clsx("absolute right-0 top-0 h-full w-full bg-slate-950 text-white shadow-2xl border-l border-white/10", widthClass)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="text-base font-semibold">{title}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
