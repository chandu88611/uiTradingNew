import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  IndianRupee,
} from "lucide-react";

const mockInvoices = [
  {
    id: "INV-2025-001",
    month: "January 2025",
    date: "01 Feb 2025",
    amount: 4280,
    status: "Paid",
  },
  {
    id: "INV-2024-012",
    month: "December 2024",
    date: "01 Jan 2025",
    amount: 5200,
    status: "Paid",
  },
  {
    id: "INV-2024-011",
    month: "November 2024",
    date: "01 Dec 2024",
    amount: 3600,
    status: "Paid",
  },
];

const statusColors = {
  Paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  Failed: "bg-red-500/20 text-red-400 border-red-500/40",
};

const SubscriptionInvoicesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const filtered = useMemo(() => {
    return mockInvoices.filter((inv) =>
      inv.month.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-slate-400 text-sm mt-1">
          View and download your monthly profit-sharing invoices.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:border-emerald-400"
            placeholder="Search by month..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg hover:bg-slate-800 text-sm">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Invoice Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-slate-900/70 border border-slate-800 rounded-xl">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-300">
            <tr>
              <th className="p-3 text-left">Invoice ID</th>
              <th className="p-3 text-left">Month</th>
              <th className="p-3 text-left">Invoice Date</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Download</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((inv) => (
              <motion.tr
                key={inv.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-slate-800 hover:bg-slate-800/40"
              >
                <td className="p-3 font-medium">{inv.id}</td>

                <td className="p-3">{inv.month}</td>

                <td className="p-3 flex items-center gap-1">
                  <Calendar size={16} /> {inv.date}
                </td>

                <td className="p-3 flex items-center gap-1 text-emerald-400 font-semibold">
                  <IndianRupee size={16} />
                  {inv.amount.toLocaleString()}
                </td>

                <td className="p-3">
                  <span
                    // className={`px-2 py-1 rounded-lg text-xs border ${statusColors[inv.status]}`}
                    className={`px-2 py-1 rounded-lg text-xs border `}
                  >
                    {inv.status}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <a
                    href={`/subscriptions/invoices/${inv.id}`}
                    className="inline-flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-700"
                  >
                    <Download size={14} />
                    PDF
                  </a>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="p-2 rounded-lg bg-slate-800 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-slate-400">Page {page}</span>

        <button
          disabled={paginated.length < itemsPerPage}
          onClick={() => setPage((p) => p + 1)}
          className="p-2 rounded-lg bg-slate-800 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionInvoicesPage;
