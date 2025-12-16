import React, { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import SubscriptionStepper from "./SubscriptionStepper";

import {
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
} from "../../services/userApi";

type FormState = {
  panNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

const initialForm: FormState = {
  panNumber: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  branch: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
};

const BillingDetailsPage: React.FC = () => {
  const nav = useNavigate();

  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>(
    {} as any
  );

  const { data: billingRes, isLoading: loadingBilling } =
    useGetBillingDetailsQuery();
  const [saveBilling, { isLoading: saving }] = useSaveBillingDetailsMutation();

  // ✅ Prefill exactly from API response keys
  useEffect(() => {
    const existing = billingRes?.data;
    if (!existing) return;

    setForm({
      panNumber: (existing.panNumber ?? "").toUpperCase(),
      accountHolderName: existing.accountHolderName ?? "",
      accountNumber: existing.accountNumber ?? "",
      ifscCode: (existing.ifscCode ?? "").toUpperCase(),
      bankName: existing.bankName ?? "",
      branch: existing.branch ?? "",
      addressLine1: existing.addressLine1 ?? "",
      addressLine2: existing.addressLine2 ?? "",
      city: existing.city ?? "",
      state: existing.state ?? "",
      pincode: existing.pincode ?? "",
    });
  }, [billingRes]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // ✅ Validators match these fields
  const validators = useMemo(() => {
    const pan = form.panNumber.trim().toUpperCase();
    const ifsc = form.ifscCode.trim().toUpperCase();
    const pin = form.pincode.trim();
    const acc = form.accountNumber.trim();

    // PAN optional (backend allows nullable). If you want mandatory, require pan length too.
    const panOk = !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const ifscOk = !!ifsc && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
    const pinOk = !!pin && /^[0-9]{6}$/.test(pin);
    const accOk = !!acc && /^[0-9]{6,20}$/.test(acc);

    const requiredOk =
      form.accountHolderName.trim() &&
      form.accountNumber.trim() &&
      form.ifscCode.trim() &&
      form.bankName.trim() &&
      form.addressLine1.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.pincode.trim();

    return { panOk, ifscOk, pinOk, accOk, requiredOk };
  }, [form]);

  const canSubmit =
    validators.requiredOk &&
    validators.ifscOk &&
    validators.pinOk &&
    validators.accOk &&
    validators.panOk;

  const showErr = (field: keyof FormState, ok: boolean) =>
    Boolean(touched[field]) && !ok;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      panNumber: true,
      accountHolderName: true,
      accountNumber: true,
      ifscCode: true,
      bankName: true,
      branch: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      pincode: true,
    });

    if (!canSubmit) return;

    try {
      // ✅ Send payload exactly as backend expects
      await saveBilling({
        panNumber: form.panNumber.trim()
          ? form.panNumber.trim().toUpperCase()
          : null,
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        bankName: form.bankName.trim(),
        branch: form.branch.trim() || null,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      }).unwrap();

      nav("/subscriptions/payment");
    } catch (err) {
      console.error("Save billing failed:", err);
      alert("Failed to save billing details. Please try again.");
    }
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
            {/* Personal */}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <User size={20} className="text-emerald-400" />
                PAN / Personal Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm">PAN Number</label>
                  <input
                    maxLength={10}
                    value={form.panNumber}
                    onChange={(e) =>
                      updateField("panNumber", e.target.value.toUpperCase())
                    }
                    onBlur={() => markTouched("panNumber")}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 outline-none"
                    placeholder="ABCDE1234F"
                    disabled={loadingBilling}
                  />
                  {showErr("panNumber", validators.panOk) && (
                    <p className="text-xs text-red-300 mt-1">
                      Enter a valid PAN (ABCDE1234F)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank */}
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
                    value={form.accountHolderName}
                    onChange={(e) =>
                      updateField("accountHolderName", e.target.value)
                    }
                    onBlur={() => markTouched("accountHolderName")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
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
                    onBlur={() => markTouched("accountNumber")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                  {showErr("accountNumber", validators.accOk) && (
                    <p className="text-xs text-red-300 mt-1">
                      Enter a valid account number
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">IFSC Code</label>
                  <input
                    required
                    maxLength={11}
                    value={form.ifscCode}
                    onChange={(e) =>
                      updateField("ifscCode", e.target.value.toUpperCase())
                    }
                    onBlur={() => markTouched("ifscCode")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                  {showErr("ifscCode", validators.ifscOk) && (
                    <p className="text-xs text-red-300 mt-1">
                      Enter a valid IFSC (e.g. HDFC0XXXXXX)
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm">Bank Name</label>
                  <input
                    required
                    value={form.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    onBlur={() => markTouched("bankName")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                </div>

                <div>
                  <label className="text-sm">Branch</label>
                  <input
                    value={form.branch}
                    onChange={(e) => updateField("branch", e.target.value)}
                    onBlur={() => markTouched("branch")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
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
                    onBlur={() => markTouched("addressLine1")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    placeholder="Flat / House / Building"
                    disabled={loadingBilling}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm">Address Line 2</label>
                  <input
                    value={form.addressLine2}
                    onChange={(e) =>
                      updateField("addressLine2", e.target.value)
                    }
                    onBlur={() => markTouched("addressLine2")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    placeholder="Road / Area / Locality"
                    disabled={loadingBilling}
                  />
                </div>

                <div>
                  <label className="text-sm">City</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    onBlur={() => markTouched("city")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                </div>

                <div>
                  <label className="text-sm">State</label>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    onBlur={() => markTouched("state")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                </div>

                <div>
                  <label className="text-sm">Pincode</label>
                  <input
                    required
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    onBlur={() => markTouched("pincode")}
                    className="mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:border-emerald-400 outline-none"
                    disabled={loadingBilling}
                  />
                  {showErr("pincode", validators.pinOk) && (
                    <p className="text-xs text-red-300 mt-1">
                      Pincode must be 6 digits
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || loadingBilling}
              className="w-full bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle size={18} />
              {saving ? "Saving..." : "Save & Continue to Payment"}
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
                You will be charged 20% of net realized monthly profit. No fixed
                fee is charged in loss-making months.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Why we need this?</p>
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
