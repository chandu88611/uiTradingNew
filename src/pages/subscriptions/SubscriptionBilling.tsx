import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Landmark,
  User,
  Banknote,
  MapPin,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

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

  const handleSubmit = (e: any) => {
    e.preventDefault();
    window.location.href = "/subscriptions/settlements";
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 flex justify-center">
      <div className="max-w-3xl w-full space-y-10">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Banknote size={32} className="text-emerald-400" />
            Billing Information
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Provide your PAN, bank details & address for profit-sharing settlement.
          </p>
        </motion.div>

        {/* FORM CARD */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-8"
        >
          {/* SECTION — PAN */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <User size={20} className="text-emerald-400" />
              Personal Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">PAN Number</label>
                <input
                  required
                  maxLength={10}
                  value={form.pan}
                  onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>
          </div>

          {/* SECTION — BANK DETAILS */}
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
                  onChange={(e) => updateField("accountName", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm">Account Number</label>
                <input
                  required
                  value={form.accountNumber}
                  onChange={(e) => updateField("accountNumber", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm">IFSC Code</label>
                <input
                  required
                  maxLength={11}
                  value={form.ifsc}
                  onChange={(e) => updateField("ifsc", e.target.value.toUpperCase())}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm">Bank Name</label>
                <input
                  required
                  value={form.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm">Branch</label>
                <input
                  value={form.branch}
                  onChange={(e) => updateField("branch", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* ADDRESS SECTION */}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-emerald-400" />
              Address (For GST & settlement records)
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm">Address Line 1</label>
                <input
                  required
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                  placeholder="Flat / House / Building"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm">Address Line 2</label>
                <input
                  value={form.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                  placeholder="Road / Area / Locality"
                />
              </div>

              <div>
                <label className="text-sm">City</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm">State</label>
                <input
                  required
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm">Pincode</label>
                <input
                  required
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition"
          >
            <CheckCircle size={18} />
            Save Billing Details
            <ArrowRight size={18} />
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default BillingDetailsPage;
