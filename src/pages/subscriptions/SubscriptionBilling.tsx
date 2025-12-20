import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, MapPin, ArrowRight, CheckCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SubscriptionStepper from "./SubscriptionStepper";

import {
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
} from "../../services/userApi";

type FlowState = {
  planId: number;
  mode: "strategies" | "copy" | "both";
  termsAccepted: boolean;
  acceptedAt: string;
};

const FLOW_KEY = "subscription_flow_v1";

type FormState = {
  panNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

const initialForm: FormState = {
  panNumber: "",
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

  // ✅ Guard: must accept terms before billing
  useEffect(() => {
    const raw = sessionStorage.getItem(FLOW_KEY);
    if (!raw) {
      window.location.href = "/subscriptions";
      return;
    }
    try {
      const flow = JSON.parse(raw) as FlowState;
      if (!flow?.termsAccepted || !flow?.planId) {
        const qs = new URLSearchParams();
        if (flow?.planId) qs.set("planId", String(flow.planId));
        if (flow?.mode) qs.set("mode", flow.mode);
        window.location.href = `/subscriptions/terms?${qs.toString()}`;
        return;
      }
    } catch {
      sessionStorage.removeItem(FLOW_KEY);
      window.location.href = "/subscriptions";
    }
  }, []);

  // Prefill from API
  useEffect(() => {
    const existing = (billingRes as any)?.data;
    if (!existing) return;

    setForm({
      panNumber: (existing.panNumber ?? "").toUpperCase(),
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

  const validators = useMemo(() => {
    const pan = form.panNumber.trim().toUpperCase();
    const pin = form.pincode.trim();

    const panOk = !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const pinOk = !!pin && /^[0-9]{6}$/.test(pin);

    const requiredOk =
      form.addressLine1.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.pincode.trim();

    return { panOk, pinOk, requiredOk };
  }, [form]);

  const canSubmit = validators.requiredOk && validators.pinOk && validators.panOk;

  const showErr = (field: keyof FormState, ok: boolean) =>
    Boolean(touched[field]) && !ok;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      panNumber: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      pincode: true,
    });

    if (!canSubmit) return;

    try {
      await saveBilling({
        panNumber: form.panNumber.trim()
          ? form.panNumber.trim().toUpperCase()
          : null,
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
              <User size={32} className="text-emerald-400" />
              Billing Details (Invoice)
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              We use these details only for invoices / basic KYC. Bank details are not required.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex gap-3">
            <Info size={16} className="text-emerald-400 mt-0.5" />
            <p>Provide correct address & PAN (PAN optional) for GST invoices.</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[2fr,1.1fr] gap-6">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-8"
          >
            {/* PAN */}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <User size={20} className="text-emerald-400" />
                PAN (Optional)
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

            {/* Address */}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-emerald-400" />
                Address (for GST invoices)
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm">Address Line 1</label>
                  <input
                    required
                    value={form.addressLine1}
                    onChange={(e) => updateField("addressLine1", e.target.value)}
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
                    onChange={(e) => updateField("addressLine2", e.target.value)}
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
              disabled={saving || loadingBilling || !canSubmit}
              className="w-full bg-emerald-500 text-slate-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle size={18} />
              {saving ? "Saving..." : "Save & Continue to Payment"}
              <ArrowRight size={18} />
            </button>
          </motion.form>

          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-2">Why we need this?</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                <li>To generate GST-compliant invoices.</li>
                <li>Basic identity verification (PAN optional).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetailsPage;
