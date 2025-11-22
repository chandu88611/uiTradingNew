import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";

const mockSettlements = [
  {
    month: "January 2025",
    date: "01 Feb 2025",
    profit: 21400,
    userShare: 4280,
    masterShare: 17120,
    status: "Settled",
  },
  {
    month: "December 2024",
    date: "01 Jan 2025",
    profit: 26000,
    userShare: 5200,
    masterShare: 20800,
    status: "Settled",
  },
  {
    month: "November 2024",
    date: "01 Dec 2024",
    profit: 18000,
    userShare: 3600,
    masterShare: 14400,
    status: "Settled",
  },
];

const statusColors = {
  Settled: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  Failed: "bg-red-500/20 text-red-400 border-red-500/40",
};

const SubscriptionSettlementsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const filtered = useMemo(() => {
    return mockSettlements.filter((s) =>
      s.month.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-semibold">Settlement History</h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete monthly breakdown of trading profits and your revenue share.
        </p>
      </div>

      {/* Search + Filters Section */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-2.5 text-slate-500"
            size={18}
          />
          <input
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:border-emerald-400"
            placeholder="Search month..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters (Future expansion: year filter, status filter) */}
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-lg hover:bg-slate-800 text-sm">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-slate-900/70 border border-slate-800 rounded-xl">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-300">
            <tr>
              <th className="p-3 text-left">Month</th>
              <th className="p-3 text-left">Settlement Date</th>
              <th className="p-3 text-left">Total Profit</th>
              <th className="p-3 text-left">Your Share</th>
              <th className="p-3 text-left">Master Share</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((s, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-slate-800 hover:bg-slate-800/50"
              >
                <td className="p-3">{s.month}</td>

                <td className="p-3 flex items-center gap-1">
                  <Calendar size={16} /> {s.date}
                </td>

                <td className="p-3 text-emerald-400 font-semibold flex items-center gap-1">
                  <IndianRupee size={16} />
                  {s.profit.toLocaleString()}
                </td>

                <td className="p-3 text-blue-400 font-semibold flex items-center gap-1">
                  <IndianRupee size={16} />
                  {s.userShare.toLocaleString()}
                </td>

                <td className="p-3 text-slate-300 flex items-center gap-1">
                  <IndianRupee size={16} />
                  {s.masterShare.toLocaleString()}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-lg border  `}
                  >
                    {s.status}
                  </span>
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
          className="p-2 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-slate-400">Page {page}</span>

        <button
          disabled={paginated.length < itemsPerPage}
          onClick={() => setPage((p) => p + 1)}
          className="p-2 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionSettlementsPage;
