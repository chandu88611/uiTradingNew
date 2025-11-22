import React, { useState } from "react";
import {
  CreditCard,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------
   MOCK DATA
------------------------------ */
const invoices = [
  {
    id: "INV-2025-001",
    date: "2025-02-01",
    amount: 999,
    status: "Paid",
  },
  {
    id: "INV-2025-002",
    date: "2025-01-01",
    amount: 999,
    status: "Paid",
  },
  {
    id: "INV-2024-012",
    date: "2024-12-01",
    amount: 499,
    status: "Paid",
  },
];

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 499,
    features: [
      "Copy trading for 1 strategy",
      "Up to 2 broker accounts",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    features: [
      "Copy trading for ALL strategies",
      "Up to 10 broker accounts",
      "Priority support",
      "Trade logs access",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 1999,
    features: [
      "Unlimited trading accounts",
      "Dedicated VPS slot",
      "Zero fanout delay",
      "Dedicated manager",
    ],
  },
];

/* ------------------------------
   MAIN COMPONENT
------------------------------ */
const BillingSubscriptionPage: React.FC = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Active user plan (mocked)
  const activePlan = plans[1]; // Pro plan

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-sm text-slate-400">
          Manage your plan, payments, invoices and renewals.
        </p>
      </div>

      {/* ---------- CURRENT PLAN CARD ---------- */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="text-emerald-400" size={20} />
              Current Plan: {activePlan.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              ₹{activePlan.price}/month — Renews on <b>March 1, 2025</b>
            </p>
          </div>

          <button
            onClick={() => setUpgradeOpen(true)}
            className="px-4 py-2 bg-emerald-500 text-slate-900 rounded-lg font-medium hover:bg-emerald-400 transition"
          >
            Upgrade / Change Plan
          </button>
        </div>

        {/* Features */}
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {activePlan.features.map((f: string, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> {f}
            </li>
          ))}
        </ul>

        {/* Cancel Plan */}
        <button className="flex items-center gap-2 text-rose-400 mt-4 text-sm hover:underline">
          <AlertTriangle size={16} /> Cancel Subscription
        </button>
      </div>

      {/* ---------- PAYMENT METHOD ---------- */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <CreditCard size={18} className="text-emerald-400" />
          Payment Method
        </h2>

        <div className="bg-slate-800/40 border border-slate-700 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-medium">Razorpay AutoPay</p>
            <p className="text-sm text-slate-400">UPI Auto Debit Enabled</p>
          </div>
          <button className="text-sm text-emerald-400 hover:underline">
            Change
          </button>
        </div>
      </div>

      {/* ---------- INVOICES TABLE ---------- */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-emerald-400" />
          Billing History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-slate-300">
              <tr>
                <th className="p-3 text-left">Invoice ID</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Download</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-800">
                  <td className="p-3">{inv.id}</td>
                  <td className="p-3">{inv.date}</td>
                  <td className="p-3">₹{inv.amount}</td>
                  <td className="p-3 text-emerald-400">{inv.status}</td>
                  <td className="p-3 text-right">
                    <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700">
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- UPGRADE PLAN DRAWER ---------- */}
      <AnimatePresence>
        {upgradeOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl p-6 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Choose a Plan</h2>
              <button onClick={() => setUpgradeOpen(false)}>
                <X size={22} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mb-4 hover:border-emerald-400 cursor-pointer transition"
                onClick={() => setSelectedPlan(p)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-emerald-400 font-semibold">
                    ₹{p.price}/mo
                  </span>
                </div>

                <ul className="mt-2 text-sm text-slate-300 space-y-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2 items-center">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button className="mt-3 w-full flex justify-center items-center gap-2 bg-emerald-500 text-slate-900 py-2 rounded-lg hover:bg-emerald-400 transition">
                  Select <ChevronRight size={16} />
                </button>
              </div>
            ))}

            {selectedPlan && (
              <div className="p-4 bg-slate-800 rounded-lg mt-6 border border-slate-700">
                <h3 className="font-semibold mb-2">Selected Plan</h3>
                <p className="text-slate-300">{selectedPlan.name}</p>
                <p className="text-emerald-400 font-bold mt-1">
                  ₹{selectedPlan.price}/month
                </p>
                <button className="w-full mt-4 py-2 bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-400 transition">
                  Proceed to Payment
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingSubscriptionPage;
