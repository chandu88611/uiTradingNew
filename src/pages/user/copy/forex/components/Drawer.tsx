// src/pages/copytrading/forex/components/Drawer.tsx
import React from "react";
import { X } from "lucide-react";

export default function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[460px] bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-base font-semibold">{title}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
