import React from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Download,
  IndianRupee,
  FileText,
} from "lucide-react";

const invoice = {
  id: "INV-2025-001",
  month: "January 2025",
  date: "01 Feb 2025",
  profit: 21400,
  userShare: 4280,
  masterShare: 17120,
  gst: 771.0,
  total: 5051.0,
  status: "Paid",
  pan: "ABCDE1234F",
  bank: "HDFC Bank •••• 2391",
};

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6">

      <a
        href="/subscriptions/invoices"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"
      >
        <ArrowLeft size={16} />
        Back to Invoices
      </a>

      {/* Invoice Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Invoice #{invoice.id}</h1>
            <p className="text-slate-400 text-sm">
              Profit-sharing settlement for <b>{invoice.month}</b>
            </p>
          </div>

          <a
            href="#"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-900 rounded-lg text-sm font-semibold hover:bg-emerald-400"
          >
            <Download size={16} />
            Download PDF
          </a>
        </div>

        <div className="text-sm flex items-center gap-2 text-slate-400">
          <Calendar size={16} />
          Invoice Date: {invoice.date}
        </div>

        {/* Invoice Breakdown */}
        <div className="divide-y divide-slate-800 text-sm">
          <div className="py-3 flex justify-between">
            <span>Total Profit</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <IndianRupee size={16} /> {invoice.profit.toLocaleString()}
            </span>
          </div>

          <div className="py-3 flex justify-between">
            <span>Your Share (20%)</span>
            <span className="text-blue-400 font-semibold flex items-center gap-1">
              <IndianRupee size={16} /> {invoice.userShare.toLocaleString()}
            </span>
          </div>

          <div className="py-3 flex justify-between">
            <span>Master Share</span>
            <span className="text-slate-300 flex items-center gap-1">
              <IndianRupee size={16} />
              {invoice.masterShare.toLocaleString()}
            </span>
          </div>

          <div className="py-3 flex justify-between">
            <span>GST (18%)</span>
            <span className="text-yellow-400 flex items-center gap-1">
              <IndianRupee size={16} /> {invoice.gst.toLocaleString()}
            </span>
          </div>

          <div className="py-3 flex justify-between font-semibold text-lg">
            <span>Total Payable</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <IndianRupee size={18} /> {invoice.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* User Billing Info */}
        <div className="pt-6">
          <h3 
            className="text-slate-300 font-semibold mb-2"
          >
            Billing Details
          </h3>

          <div className="text-sm space-y-1 text-slate-400">
            <p>PAN: {invoice.pan}</p>
            <p>Bank: {invoice.bank}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
