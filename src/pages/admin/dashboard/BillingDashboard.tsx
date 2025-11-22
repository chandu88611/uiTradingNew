import React from "react";
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Clock,
  IndianRupee,
  RefreshCcw,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

/* ------------------------------
   MOCK DATA
------------------------------ */
const metrics = {
  revenueThisMonth: 48000,
  revenueThisYear: 523000,
  activeSubscribers: 337,
  trials: 52,
  failedPayments: 7,
  expiringSoon: 14,
  churnRate: 3.2,
  newToday: 6,
  refundsToday: 1,
};

const recentPayments = [
  { name: "Amit Kumar", amount: 999, date: "2025-02-06", status: "Paid" },
  { name: "Rohit Shah", amount: 499, date: "2025-02-05", status: "Paid" },
  { name: "Neha Jain", amount: 999, date: "2025-02-05", status: "Failed" },
  { name: "Arun Singh", amount: 1999, date: "2025-02-04", status: "Paid" },
];

const planDistribution = [
  { name: "Basic", percentage: 35 },
  { name: "Pro", percentage: 45 },
  { name: "Premium", percentage: 20 },
];

/* ------------------------------
   MAIN COMPONENT
------------------------------ */

const AdminBillingDashboard: React.FC = () => {
  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 px-6 py-8 text-slate-100 space-y-10">

      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Billing Dashboard
        </h1>
        <p className="text-slate-400 text-sm">
          Monitor revenue, subscriptions, payments & financial health.
        </p>
      </header>

      {/* TOP METRICS GRID */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Revenue This Month"
          value={`₹${metrics.revenueThisMonth.toLocaleString()}`}
          icon={<IndianRupee className="text-emerald-400" />}
        />
        <MetricCard
          label="Active Subscribers"
          value={metrics.activeSubscribers}
          icon={<Users className="text-blue-400" />}
        />
        <MetricCard
          label="Failed Payments"
          value={metrics.failedPayments}
          icon={<AlertTriangle className="text-rose-400" />}
        />
        <MetricCard
          label="Churn Rate"
          value={`${metrics.churnRate}%`}
          icon={<RefreshCcw className="text-yellow-400" />}
        />
      </section>

      {/* MIDDLE GRID */}
      <section className="grid lg:grid-cols-3 gap-6">

        {/* Revenue Chart Mock */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" /> Revenue Overview
          </h2>

          <div className="h-56 flex items-end gap-3">
            {[40, 60, 45, 75, 90, 110, 70, 120, 95, 150, 180, 200].map(
              (v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: v }}
                  transition={{ duration: 0.5 }}
                  className="w-full bg-emerald-500/40 rounded-t"
                />
              )
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Month-on-month revenue chart (in ₹ thousands)
          </p>
        </div>

        {/* Plan Distribution */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="text-emerald-400" /> Plan Distribution
          </h2>

          <div className="space-y-4">
            {planDistribution.map((p) => (
              <div key={p.name}>
                <p className="text-sm mb-1">{p.name}</p>
                <div className="w-full bg-slate-800 h-3 rounded-full">
                  <div
                    className="h-3 bg-emerald-500 rounded-full"
                    style={{ width: `${p.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {p.percentage}% of subscribers
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT PAYMENTS */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="text-emerald-400" /> Recent Payments
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-slate-300">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentPayments.map((p, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">₹{p.amount}</td>
                  <td className="p-3">{p.date}</td>
                  <td className="p-3">
                    {p.status === "Paid" ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check size={14} /> Paid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400">
                        <X size={14} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

/* ------------------------------
   METRIC CARD COMPONENT
------------------------------ */
const MetricCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: any;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-xl"
  >
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-400">{label}</p>
      {icon}
    </div>
    <h2 className="text-xl font-semibold mt-2">{value}</h2>
  </motion.div>
);

export default AdminBillingDashboard;
