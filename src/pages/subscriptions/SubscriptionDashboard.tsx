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
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";
import { useListMyInvoicesQuery } from "../../services/billing.api";

const SubscriptionDashboardPage: React.FC = () => {
  const { data: subData, isLoading: subLoading } =
    useGetMyCurrentSubscriptionQuery();
  const { data: invData } = useListMyInvoicesQuery({ page: 1, limit: 5 });

  const subRoot: any =
    (subData as any)?.data?.subscription ??
    (subData as any)?.subscription ??
    (subData as any)?.data ??
    subData;
  const sub: any = Array.isArray(subRoot) ? subRoot[0] : subRoot;
  const plan = sub?.plan ?? null;

  const invoices = ((invData as any)?.data ?? []).map((inv: any) => ({
    id: String(inv.id),
    amount: Math.round(Number(inv.amountCents ?? 0) / 100),
    date: new Date(inv.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: inv.status === "paid" ? "Paid" : "Pending",
  }));

  const subscription = {
    status: sub?.statusV2 ?? sub?.status ?? "—",
    plan: plan?.name ?? "—",
    nextSettlement: sub?.endDate
      ? new Date(sub.endDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    startDate: sub?.startDate
      ? new Date(sub.startDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    totalProfit: 0,
    userShare: 0,
    invoices,
    settlements: invoices,
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 p-6 bg-slate-950 text-slate-100 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Subscription Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Track your subscription, settlements & profit-share performance.
        </p>
        {subLoading && (
          <p className="text-xs text-slate-400">Loading…</p>
        )}
        {!sub && !subLoading && (
          <p className="text-xs text-slate-400">No active subscription</p>
        )}
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
          {subscription.settlements.length === 0 && (
            <p className="text-sm text-slate-400">No settlements yet.</p>
          )}
          {subscription.settlements.map((s: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl"
            >
              <div className="flex justify-between">
                <p className="font-medium">{s.month ?? s.date}</p>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                  {s.status}
                </span>
              </div>

              <div className="mt-2 text-sm text-slate-300 space-y-1">
                <p>
                  Profit:{" "}
                  <span className="text-emerald-400 font-semibold">
                    ₹{(s.profit ?? s.amount ?? 0).toLocaleString()}
                  </span>
                </p>
                <p>
                  Your Share:{" "}
                  <span className="text-blue-400 font-semibold">
                    ₹{(s.userShare ?? s.amount ?? 0).toLocaleString()}
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
              {subscription.invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              )}
              {subscription.invoices.map((inv: any) => (
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
