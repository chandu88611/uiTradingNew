import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Pencil,
  Lock,
  CreditCard,
  MapPin,
  Building2,
  Hash,
  Settings2,
  Save,
  CandlestickChart,
} from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../components/Model";

import {
  useGetMeQuery,
  useUpdateMeMutation,
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
  useChangePasswordMutation,
} from "../../services/userApi";

import PineConnectorSettings, {
  PineConnectorSettingsValue,
} from "./PineConnectorSettings";
import IndianMarketSettings, {
  IndianMarketSettingsValue,
} from "./IndianMarketSettings";
import CryptoDeltaSettings, {
  CryptoDeltaSettingsValue,
} from "./CryptoDeltaSettings";

// ✅ subscription current (webhook url)
import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

/** helpers */
const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

const sectionBase = "rounded-2xl border border-slate-800 bg-slate-900/40 p-6";

function pickUser(res: any) {
  // supports: { user }, { data }, { message, data }
  return res?.user || res?.data || null;
}

function pickBilling(res: any) {
  // supports: { data }, { message, data }
  return res?.data || null;
}

type TradeSettings = {
  pineConnector?: PineConnectorSettingsValue;
  indianMarket?: IndianMarketSettingsValue;
  crypto?: CryptoDeltaSettingsValue;
};

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "trading">(
    "profile"
  );

  // MODALS
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editBillingOpen, setEditBillingOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  // QUERIES
  const {
    data: meRes,
    isLoading: meLoading,
    isFetching: meFetching,
    refetch: refetchMe,
  } = useGetMeQuery();

  const {
    data: billingRes,
    isLoading: billingLoading,
    isFetching: billingFetching,
    refetch: refetchBilling,
  } = useGetBillingDetailsQuery();

  // ✅ Current subscription (for webhook url)
  const {
    data: subRes,
    isLoading: subLoading,
    isFetching: subFetching,
    refetch: refetchSub,
  } = useGetMyCurrentSubscriptionQuery();

  const user = useMemo(() => pickUser(meRes), [meRes]);
  const billing = useMemo(() => pickBilling(billingRes), [billingRes]);

  const mySub = (subRes as any)?.data ?? null;

  // If your backend returns plan relation:
  const isPineUser = Boolean(mySub?.plan?.executionFlow === "PINE_CONNECTOR");

  // if backend returns webhookUrl computed in transformResponse
  const webhookUrl: string | null =`https://backend.globalalgotrading.com/tradingview/alert/${mySub?.webhookToken}`;
 
  // MUTATIONS
  const [updateMe, { isLoading: updatingMe }] = useUpdateMeMutation();
  const [saveBilling, { isLoading: savingBilling }] =
    useSaveBillingDetailsMutation();
  const [changePassword, { isLoading: changingPass }] =
    useChangePasswordMutation();

  const loading = meLoading || meFetching;

  const [tradingTab, setTradingTab] = useState<"pine" | "india" | "crypto">(
    "pine"
  );

  const tradeSettings: TradeSettings = user?.tradeSettings || {};
  const [localTradeSettings, setLocalTradeSettings] = useState<TradeSettings>(
    tradeSettings
  );

  // Keep in sync when user changes
  useEffect(() => {
    setLocalTradeSettings(tradeSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tradeSettings]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-16 md:pt-28 px-4 md:px-6 pb-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal details, billing info & security.
          </p>
        </div>

        {/* TOP TABS */}
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={<UserIcon size={16} />}
            label="Profile"
          />
          <TabButton
            active={activeTab === "billing"}
            onClick={() => setActiveTab("billing")}
            icon={<CreditCard size={16} />}
            label="Billing"
          />
          <TabButton
            active={activeTab === "trading"}
            onClick={() => setActiveTab("trading")}
            icon={<CandlestickChart size={16} />}
            label="Trading"
          />
          <div className="flex-1" />
          <button
            onClick={() => setChangePassOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            <Lock size={16} />
            Change Password
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <ProfileSkeleton />
        ) : !user ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
            Unable to load profile.{" "}
            <button
              onClick={() => refetchMe()}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <>
                <section className={sectionBase}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold">
                      Personal Information
                    </h2>

                    <button
                      onClick={() => setEditProfileOpen(true)}
                      className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                  </div>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <InfoRow
                      label="Full Name"
                      value={user?.name || "—"}
                      icon={<UserIcon />}
                    />
                    <InfoRow
                      label="Email"
                      value={user?.email || "—"}
                      icon={<Mail />}
                    />
                    <InfoRow
                      label="Verification"
                      value={user?.isEmailVerified ? "Verified" : "Not Verified"}
                      icon={<ShieldCheck />}
                      valueClass={
                        user?.isEmailVerified
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }
                    />
                    <InfoRow
                      label="User ID"
                      value={String(user?.id ?? "—")}
                      icon={<Hash />}
                    />
                  </div>
                </section>

                {/* SECURITY NOTE */}
                <section className={sectionBase}>
                  <h2 className="text-xl font-semibold">Security</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Keep your password strong. If you logged in via Google, you
                    can still set a password later.
                  </p>
                </section>
              </>
            )}

            {/* BILLING TAB */}
            {activeTab === "billing" && (
              <>
                <section className={sectionBase}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-xl font-semibold">Billing Details</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        PAN is optional ✅. Add bank + address for
                        invoices/withdrawals.
                      </p>
                    </div>

                    <button
                      onClick={() => setEditBillingOpen(true)}
                      className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                    >
                      <Pencil size={15} />
                      Edit Billing
                    </button>
                  </div>

                  {billingLoading || billingFetching ? (
                    <div className="mt-6 text-sm text-slate-400">
                      Loading billing…
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <InfoRow
                        label="PAN Number"
                        value={billing?.panNumber || "—"}
                        icon={<Hash />}
                      />
                      <InfoRow
                        label="Account Holder"
                        value={billing?.accountHolderName || "—"}
                        icon={<UserIcon />}
                      />
                      <InfoRow
                        label="Account Number"
                        value={
                          billing?.accountNumber
                            ? maskAccount(billing.accountNumber)
                            : "—"
                        }
                        icon={<CreditCard />}
                      />
                      <InfoRow
                        label="IFSC Code"
                        value={billing?.ifscCode || "—"}
                        icon={<Building2 />}
                      />
                      <InfoRow
                        label="Bank / Branch"
                        value={`${billing?.bankName || "—"}${
                          billing?.branch ? ` • ${billing.branch}` : ""
                        }`}
                        icon={<Building2 />}
                      />
                      <InfoRow
                        label="Address"
                        value={formatAddress(billing)}
                        icon={<MapPin />}
                      />
                    </div>
                  )}
                </section>
              </>
            )}

            {/* TRADING TAB */}
            {activeTab === "trading" && user && (
              <section className={sectionBase}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <CandlestickChart size={18} />
                      Trading Settings
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure Pine Connector, Indian Market & Crypto (Delta
                      Exchange).
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await updateMe({
                          tradeSettings: localTradeSettings,
                        } as any).unwrap();
                        toast.success("Trading settings saved");
                        refetchMe();
                      } catch (err: any) {
                        toast.error(
                          err?.data?.message || "Failed to save trading settings"
                        );
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                  >
                    <Save size={16} />
                    Save Trading
                  </button>
                </div>

                {/* SUB TABS */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <SubTab
                    active={tradingTab === "pine"}
                    onClick={() => setTradingTab("pine")}
                    label="Pine Connector"
                  />
                  <SubTab
                    active={tradingTab === "india"}
                    onClick={() => setTradingTab("india")}
                    label="Indian Market"
                  />
                  <SubTab
                    active={tradingTab === "crypto"}
                    onClick={() => setTradingTab("crypto")}
                    label="Crypto (Delta)"
                  />
                </div>

                <div className="mt-6">
                  {/* ✅ PINE CONNECTOR + WEBHOOK URL */}
                  {tradingTab === "pine" && (
                    <div className="space-y-6">
                      {/* WEBHOOK URL CARD */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold flex items-center gap-2">
                              <ShieldCheck
                                size={16}
                                className="text-emerald-400"
                              />
                              TradingView Webhook URL
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Use this URL in TradingView alert → Webhook URL
                              field.
                            </p>
                          </div>

                          <button
                            onClick={() => refetchSub()}
                            className="rounded-full bg-slate-800 px-4 py-2 text-xs hover:bg-slate-700"
                          >
                            {subLoading || subFetching
                              ? "Refreshing..."
                              : "Refresh"}
                          </button>
                        </div>

                        <div className="mt-4">
                          {subLoading || subFetching ? (
                            <div className="text-sm text-slate-400">
                              Loading subscription…
                            </div>
                          ) : !mySub ? (
                            <div className="text-sm text-slate-300">
                              No active subscription found. Subscribe to a{" "}
                              <span className="text-emerald-300 font-semibold">
                                Pine Connector
                              </span>{" "}
                              plan to get your webhook URL.
                            </div>
                          ) : !isPineUser ? (
                            <div className="text-sm text-slate-300">
                              Your current plan is{" "}
                              <span className="text-slate-100 font-semibold">
                                {mySub?.plan?.name || "—"}
                              </span>
                              . Webhook URL is available only for{" "}
                              <span className="text-emerald-300 font-semibold">
                                Pine Connector
                              </span>{" "}
                              plans.
                            </div>
                          ) : !webhookUrl ? (
                            <div className="text-sm text-slate-300">
                              Webhook URL not generated yet. Please re-login or
                              contact support.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  readOnly
                                  value={webhookUrl}
                                  className={`${inputBase} !mt-0`}
                                />
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        webhookUrl
                                      );
                                      toast.success("Webhook URL copied");
                                    } catch {
                                      toast.error("Failed to copy");
                                    }
                                  }}
                                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                                >
                                  Copy
                                </button>
                              </div>

                              <div className="text-[11px] text-slate-400">
                                Tip: In TradingView alert, enable “Webhook URL”
                                and paste this.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* YOUR EXISTING SETTINGS */}
                      <PineConnectorSettings
                        value={localTradeSettings.pineConnector}
                        onChange={(next) =>
                          setLocalTradeSettings((p) => ({
                            ...p,
                            pineConnector: next,
                          }))
                        }
                      />
                    </div>
                  )}

                  {tradingTab === "india" && (
                    <IndianMarketSettings
                      value={localTradeSettings.indianMarket}
                      onChange={(next) =>
                        setLocalTradeSettings((p) => ({
                          ...p,
                          indianMarket: next,
                        }))
                      }
                    />
                  )}

                  {tradingTab === "crypto" && (
                    <CryptoDeltaSettings
                      value={localTradeSettings.crypto}
                      onChange={(next) =>
                        setLocalTradeSettings((p) => ({ ...p, crypto: next }))
                      }
                    />
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* MODALS */}

      {/* EDIT PROFILE */}
      <Modal open={editProfileOpen} onClose={() => setEditProfileOpen(false)}>
        <ProfileEditForm
          user={user}
          loading={updatingMe}
          onClose={() => setEditProfileOpen(false)}
          onSave={async (payload) => {
            try {
              await updateMe(payload as any).unwrap();
              toast.success("Profile updated");
              setEditProfileOpen(false);
              refetchMe();
            } catch (err: any) {
              toast.error(err?.data?.message || "Failed to update profile");
            }
          }}
        />
      </Modal>

      {/* EDIT BILLING */}
      <Modal open={editBillingOpen} onClose={() => setEditBillingOpen(false)}>
        <BillingEditForm
          billing={billing}
          loading={savingBilling}
          onClose={() => setEditBillingOpen(false)}
          onSave={async (payload) => {
            try {
              await saveBilling(payload as any).unwrap();
              toast.success("Billing details saved");
              setEditBillingOpen(false);
              refetchBilling();
            } catch (err: any) {
              toast.error(err?.data?.message || "Failed to save billing");
            }
          }}
        />
      </Modal>

      {/* CHANGE PASSWORD */}
      <Modal open={changePassOpen} onClose={() => setChangePassOpen(false)}>
        <ChangePasswordForm
          loading={changingPass}
          onClose={() => setChangePassOpen(false)}
          onSave={async (payload) => {
            try {
              await changePassword(payload as any).unwrap();
              toast.success("Password updated");
              setChangePassOpen(false);
            } catch (err: any) {
              toast.error(err?.data?.message || "Failed to change password");
            }
          }}
        />
      </Modal>
    </div>
  );
}

/* ---------------- UI pieces ---------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition ${
        active
          ? "bg-emerald-500 text-slate-950 border-emerald-500"
          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoRow({
  label,
  value,
  icon,
  valueClass = "",
}: any) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm font-medium truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse">
        <div className="h-5 w-52 bg-slate-800 rounded" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="h-4 w-28 bg-slate-800 rounded" />
              <div className="h-4 w-40 bg-slate-800 rounded mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Forms ---------------- */

function ProfileEditForm({
  user,
  loading,
  onClose,
  onSave,
}: {
  user: any;
  loading: boolean;
  onClose: () => void;
  onSave: (payload: { name?: string }) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const email = user?.email || "";

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  return (
    <div className="text-slate-100">
      <h3 className="text-lg font-semibold mb-1">Edit Profile</h3>
      <p className="text-xs text-slate-400 mb-5">
        Email change is disabled for now (can be added later).
      </p>

      <div className="space-y-4">
        <Field label="Full Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputBase}
            placeholder="Enter your name"
          />
        </Field>

        <Field label="Email">
          <input
            value={email}
            disabled
            className={`${inputBase} opacity-70 cursor-not-allowed`}
          />
        </Field>
      </div>

      <FooterActions
        onClose={onClose}
        mainText={loading ? "Saving..." : "Save Changes"}
        disabled={loading}
        onMain={() => onSave({ name: name.trim() })}
      />
    </div>
  );
}

function BillingEditForm({
  billing,
  loading,
  onClose,
  onSave,
}: {
  billing: any;
  loading: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
}) {
  const [form, setForm] = useState({
    panNumber: billing?.panNumber ?? "",
    accountHolderName: billing?.accountHolderName ?? "",
    accountNumber: billing?.accountNumber ?? "",
    ifscCode: billing?.ifscCode ?? "",
    bankName: billing?.bankName ?? "",
    branch: billing?.branch ?? "",
    addressLine1: billing?.addressLine1 ?? "",
    addressLine2: billing?.addressLine2 ?? "",
    city: billing?.city ?? "",
    state: billing?.state ?? "",
    pincode: billing?.pincode ?? "",
  });

  useEffect(() => {
    setForm({
      panNumber: billing?.panNumber ?? "",
      accountHolderName: billing?.accountHolderName ?? "",
      accountNumber: billing?.accountNumber ?? "",
      ifscCode: billing?.ifscCode ?? "",
      bankName: billing?.bankName ?? "",
      branch: billing?.branch ?? "",
      addressLine1: billing?.addressLine1 ?? "",
      addressLine2: billing?.addressLine2 ?? "",
      city: billing?.city ?? "",
      state: billing?.state ?? "",
      pincode: billing?.pincode ?? "",
    });
  }, [billing]);

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="text-slate-100">
      <h3 className="text-lg font-semibold mb-1">Edit Billing Details</h3>
      <p className="text-xs text-slate-400 mb-5">
        PAN is optional ✅. Fill what you have — you can update later.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="PAN Number (Optional)">
          <input
            value={form.panNumber}
            onChange={(e) => set("panNumber", e.target.value)}
            className={inputBase}
            placeholder="ABCDE1234F"
          />
        </Field>

        <Field label="Account Holder Name">
          <input
            value={form.accountHolderName}
            onChange={(e) => set("accountHolderName", e.target.value)}
            className={inputBase}
            placeholder="Name as per bank"
          />
        </Field>

        <Field label="Account Number">
          <input
            value={form.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value)}
            className={inputBase}
            placeholder="XXXXXX"
          />
        </Field>

        <Field label="IFSC Code">
          <input
            value={form.ifscCode}
            onChange={(e) => set("ifscCode", e.target.value)}
            className={inputBase}
            placeholder="HDFC0001234"
          />
        </Field>

        <Field label="Bank Name">
          <input
            value={form.bankName}
            onChange={(e) => set("bankName", e.target.value)}
            className={inputBase}
            placeholder="HDFC / SBI / ICICI..."
          />
        </Field>

        <Field label="Branch (Optional)">
          <input
            value={form.branch}
            onChange={(e) => set("branch", e.target.value)}
            className={inputBase}
            placeholder="Branch name"
          />
        </Field>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-200 mb-3">Address</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address Line 1">
            <input
              value={form.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
              className={inputBase}
              placeholder="House / Street"
            />
          </Field>

          <Field label="Address Line 2 (Optional)">
            <input
              value={form.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
              className={inputBase}
              placeholder="Area / Landmark"
            />
          </Field>

          <Field label="City">
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputBase}
              placeholder="City"
            />
          </Field>

          <Field label="State">
            <input
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className={inputBase}
              placeholder="State"
            />
          </Field>

          <Field label="Pincode">
            <input
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value)}
              className={inputBase}
              placeholder="560001"
            />
          </Field>
        </div>
      </div>

      <FooterActions
        onClose={onClose}
        mainText={loading ? "Saving..." : "Save Billing"}
        disabled={loading}
        onMain={() => onSave({ ...normalizeEmptyToNull(form) })}
      />
    </div>
  );
}

function ChangePasswordForm({
  loading,
  onClose,
  onSave,
}: {
  loading: boolean;
  onClose: () => void;
  onSave: (payload: { currentPassword: string; newPassword: string }) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const canSubmit =
    currentPassword.length >= 1 &&
    newPassword.length >= 6 &&
    newPassword === confirm;

  return (
    <div className="text-slate-100">
      <h3 className="text-lg font-semibold mb-1">Change Password</h3>
      <p className="text-xs text-slate-400 mb-5">
        Use a strong password. Minimum 6 characters.
      </p>

      <div className="space-y-4">
        <Field label="Current Password">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputBase}
            placeholder="Enter current password"
          />
        </Field>

        <Field label="New Password">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputBase}
            placeholder="Create a new password"
          />
        </Field>

        <Field label="Confirm New Password">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputBase}
            placeholder="Re-enter new password"
          />
          {confirm.length > 0 && newPassword !== confirm && (
            <p className="mt-1 text-xs text-rose-400">Passwords do not match</p>
          )}
        </Field>
      </div>

      <FooterActions
        onClose={onClose}
        mainText={loading ? "Updating..." : "Update Password"}
        disabled={loading || !canSubmit}
        onMain={() => onSave({ currentPassword, newPassword })}
      />
    </div>
  );
}

/* ---------------- Small UI helpers ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function FooterActions({
  onClose,
  mainText,
  disabled,
  onMain,
}: {
  onClose: () => void;
  mainText: string;
  disabled?: boolean;
  onMain: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        onClick={onClose}
        className="rounded-full bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
      >
        Cancel
      </button>

      <button
        disabled={disabled}
        onClick={onMain}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {mainText}
      </button>
    </div>
  );
}

/* ---------------- Formatting helpers ---------------- */

function maskAccount(n: string) {
  const s = String(n);
  if (s.length <= 4) return s;
  return `${"•".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

function formatAddress(b: any) {
  if (!b) return "—";
  const parts = [b.addressLine1, b.addressLine2, b.city, b.state, b.pincode].filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : "—";
}

function normalizeEmptyToNull(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    out[k] = typeof v === "string" && v.trim() === "" ? null : v;
  });
  return out;
}

function SubTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition ${
        active
          ? "bg-slate-100 text-slate-950 border-slate-100"
          : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
      }`}
    >
      <Settings2 size={16} />
      {label}
    </button>
  );
}
