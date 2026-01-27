import React from "react";
import { ArrowRight, FileText, BookOpen, CreditCard } from "lucide-react";
import { btn, btnGhost, card, clsx } from "../ui";

export default function QuickLinks({
  onTrades,
  onOrders,
  onInvoices,
}: {
  onTrades: () => void;
  onOrders: () => void;
  onInvoices: () => void;
}) {
  return (
    <div className={card}>
      <div className="text-base font-semibold text-slate-100">Quick Links</div>
      <div className="text-xs text-slate-400 mt-1">Logs and billing shortcuts.</div>

      <div className="mt-4 grid gap-2">
        <button type="button" className={clsx(btn, btnGhost, "justify-between")} onClick={onTrades}>
          <span className="inline-flex items-center gap-2">
            <FileText size={16} /> Trade Logs
          </span>
          <ArrowRight size={16} />
        </button>

        <button type="button" className={clsx(btn, btnGhost, "justify-between")} onClick={onOrders}>
          <span className="inline-flex items-center gap-2">
            <BookOpen size={16} /> Live Positions
          </span>
          <ArrowRight size={16} />
        </button>

        <button type="button" className={clsx(btn, btnGhost, "justify-between")} onClick={onInvoices}>
          <span className="inline-flex items-center gap-2">
            <CreditCard size={16} /> Invoices
          </span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
