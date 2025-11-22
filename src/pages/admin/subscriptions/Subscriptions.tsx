import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";

type SubscriptionStatus = "active" | "expired" | "cancelled";

interface SubscriptionUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  rate: string;
  status: SubscriptionStatus;
  nextBilling: string;
  joined: string;
}

const mockData: SubscriptionUser[] = [
  {
    id: "USR001",
    name: "Rohit Sharma",
    email: "rohit@example.com",
    plan: "Profit Sharing",
    rate: "20%",
    status: "active",
    nextBilling: "01 Mar 2025",
    joined: "12 Jan 2025",
  },
  {
    id: "USR002",
    name: "Aakash Singh",
    email: "aakash@example.com",
    plan: "Profit Sharing",
    rate: "25%",
    status: "expired",
    nextBilling: "01 Feb 2025",
    joined: "05 Dec 2024",
  },
  {
    id: "USR003",
    name: "Meghana",
    email: "meghana@example.com",
    plan: "Profit Sharing",
    rate: "18%",
    status: "cancelled",
    nextBilling: "-",
    joined: "15 Oct 2024",
  },
];

const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  expired: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
};

const AdminSubscriptionsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const itemsPerPage = 6;

  const filtered = useMemo(() => {
    return mockData.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-semibold">All Subscriptions</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage all subscribed users, next billing dates, and statuses.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            size={18}
            className="absolute top-2.5 left-3 text-slate-500"
          />
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:border-emerald-400"
            placeholder="Search by name / email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-sm">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-slate-900/70 border border-slate-800 rounded-xl">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Plan</th>
              <th className="p-3 text-left">Rate</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Next Billing</th>
              <th className="p-3 text-left">Joined</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((u) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-slate-800 hover:bg-slate-800/40"
              >
                <td className="p-3 font-medium flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  {u.name}
                </td>

                <td className="p-3 text-slate-300">{u.email}</td>

                <td className="p-3">{u.plan}</td>

                <td className="p-3 text-emerald-400 font-semibold">
                  {u.rate}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs border ${statusColors[u.status]}`}
                  >
                    {u.status}
                  </span>
                </td>

                <td className="p-3 flex items-center gap-1">
                  <Calendar size={16} />
                  {u.nextBilling}
                </td>

                <td className="p-3">{u.joined}</td>

                <td className="p-3 text-right">
                  <a
                    href={`/admin/subscriptions/user/${u.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs hover:bg-slate-700"
                  >
                    <Eye size={14} /> View
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

export default AdminSubscriptionsPage;
