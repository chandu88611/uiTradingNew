import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  User,
  Banknote,
  MapPin,
  ArrowRight,
  CheckCircle,
  Info,
} from "lucide-react";
import SubscriptionStepper from "./SubscriptionStepper";

const BillingDetailsPage: React.FC = () => {
  const [form, setForm] = useState({
    pan: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branch: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now: just log and redirect
    console.log("Billing details (dummy):", form);
    window.location.href = "/subscriptions/payment";
  };

  return (
    <div className="min-h-screen px-6 pt-16 md:pt-28 bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-5xl w-full space-y-8">
        <SubscriptionStepper currentStep={3} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Banknote size={32} className="text-emerald-400" />
              Billing & Settlement Details
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              These details are used to generate invoices and transfer your
              profit-share amount at the end of each profitable month.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex gap-3">
            <Info size={16} className="text-emerald-400 mt-0.5" />
            <p>
              Make sure PAN, bank account and IFSC are correct. Payouts will be
              processed to this account only.
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[2fr,1.1fr] gap-6">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-8"
          >
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <User size={20} className="text-emerald-400" />
                PAN / Personal Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm">PAN Number</label>
                  <input
                    required
                    maxLength={10}
                    value={form.pan}
                    onChange={(e) =>
                      updateField("pan", e.target.value.toUpperCase())
                    }
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Landmark size={20} className="text-emerald-400" />
                Bank Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Account Holder Name</label>
                  <input
                    required
                    value={form.accountName}
                    onChange={(e) =>
                      updateField("accountName", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm">Account Number</label>
                  <input
                    required
                    value={form.accountNumber}
                    onChange={(e) =>
                      updateField("accountNumber", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm">IFSC Code</label>
                  <input
                    required
                    maxLength={11}
                    value={form.ifsc}
                    onChange={(e) =>
                      updateField("ifsc", e.target.value.toUpperCase())
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm">Bank Name</label>
                  <input
                    required
                    value={form.bankName}
                    onChange={(e) =>
                      updateField("bankName", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm">Branch</label>
                  <input
                    value={form.branch}
                    onChange={(e) =>
                      updateField("branch", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-emerald-400" />
                Address (for GST & invoices)
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm">Address Line 1</label>
                  <input
                    required
                    value={form.addressLine1}
                    onChange={(e) =>
                      updateField("addressLine1", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    placeholder="Flat / House / Building"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm">Address Line 2</label>
                  <input
                    value={form.addressLine2}
                    onChange={(e) =>
                      updateField("addressLine2", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    placeholder="Road / Area / Locality"
                  />
                </div>

                <div>
                  <label className="text-sm">City</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) =>
                      updateField("city", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm">State</label>
                  <input
                    required
                    value={form.state}
                    onChange={(e) =>
                      updateField("state", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm">Pincode</label>
                  <input
                    required
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) =>
                      updateField("pincode", e.target.value)
                    }
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition"
            >
              <CheckCircle size={18} />
              Save & Continue to Payment
              <ArrowRight size={18} />
            </button>
          </motion.form>

          {/* SIDE SUMMARY */}
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-2">Plan Summary</h3>
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-emerald-400">
                  Copy Trading – Profit Sharing (20%)
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                You will be charged 20% of net realized monthly profit.
                No fixed fee is charged in loss-making months.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">
                Why we need this?
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>To generate GST-compliant invoices.</li>
                <li>To process monthly payouts for your profit share.</li>
                <li>To comply with basic KYC norms.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetailsPage;
