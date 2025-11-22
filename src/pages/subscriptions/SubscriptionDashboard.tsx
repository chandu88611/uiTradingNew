import React from "react";
import { motion } from "framer-motion";
import {
  Wallet2,
  TrendingUp,
  Calendar,
  FileText,
  ArrowRight,
  IndianRupee,
  Clock,
} from "lucide-react";

const SubscriptionDashboardPage: React.FC = () => {
  // mock data
  const subscription = {
    status: "Active",
    plan: "Profit Sharing (20%)",
    nextSettlement: "01 Feb 2025",
    startDate: "12 Jan 2025",
    totalProfit: 42800,
    userShare: 8560, // 20%
    invoices: [
      { id: "INV-001", amount: 6200, date: "01 Jan 2025", status: "Paid" },
      { id: "INV-002", amount: 7800, date: "01 Dec 2024", status: "Paid" },
    ],
    settlements: [
      { month: "January 2025", profit: 21400, userShare: 4280, status: "Settled" },
      { month: "December 2024", profit: 26000, userShare: 5200, status: "Settled" },
    ],
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 p-6 bg-slate-950 text-slate-100 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Subscription Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Track your subscription, settlements & profit-share performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Profit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Total Profit</h3>
            <TrendingUp size={22} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-semibold flex items-center gap-1">
            <IndianRupee size={28} />
            {subscription.totalProfit.toLocaleString()}
          </p>
          <p className="text-slate-500 text-xs mt-1">Accumulated till date</p>
        </motion.div>

        {/* User Share */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Your Share (20%)</h3>
            <Wallet2 size={22} className="text-blue-400" />
          </div>
          <p className="text-3xl font-semibold text-blue-400 flex items-center gap-1">
            <IndianRupee size={28} />
            {subscription.userShare.toLocaleString()}
          </p>
          <p className="text-slate-500 text-xs mt-1">Total earnings</p>
        </motion.div>

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800 rounded-xl p-5"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Subscription Status</h3>
            <Calendar size={22} className="text-yellow-400" />
          </div>
          <p className="text-xl font-semibold">{subscription.status}</p>
          <p className="text-slate-500 text-xs mt-1">
            Next settlement: {subscription.nextSettlement}
          </p>
        </motion.div>
      </div>

      {/* Settlements */}
      <div>
        <h2 className="text-lg font-semibold">Monthly Settlements</h2>
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          {subscription.settlements.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl"
            >
              <div className="flex justify-between">
                <p className="font-medium">{s.month}</p>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                  {s.status}
                </span>
              </div>

              <div className="mt-2 text-sm text-slate-300 space-y-1">
                <p>
                  Profit:{" "}
                  <span className="text-emerald-400 font-semibold">
                    ₹{s.profit.toLocaleString()}
                  </span>
                </p>
                <p>
                  Your Share:{" "}
                  <span className="text-blue-400 font-semibold">
                    ₹{s.userShare.toLocaleString()}
                  </span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Invoice History <FileText size={18} />
        </h2>

        <div className="overflow-x-auto mt-3">
          <table className="w-full bg-slate-900/50 border border-slate-800 rounded-xl">
            <thead className="bg-slate-900/70 text-slate-300 text-sm">
              <tr>
                <th className="p-3 text-left">Invoice ID</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {subscription.invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="p-3">{inv.id}</td>
                  <td className="p-3">₹{inv.amount.toLocaleString()}</td>
                  <td className="p-3">{inv.date}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1 ml-auto">
                      Download <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDashboardPage;
