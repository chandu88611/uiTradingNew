import React, { useEffect, useMemo, useState } from "react";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Pencil,
  Lock,
  CreditCard,
  MapPin,
  Hash,
  RefreshCw,
  Zap,
  ExternalLink,
  Layers,
  PlugZap,
  Crown,
} from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../components/Model";
import { useNavigate } from "react-router-dom";

import {
  useGetMeQuery,
  useUpdateMeMutation,
  useGetBillingDetailsQuery,
  useSaveBillingDetailsMutation,
  useChangePasswordMutation,
} from "../../services/userApi";

import { useGetMyCurrentSubscriptionQuery } from "../../services/profileSubscription.api";

/** ---------------- styles ---------------- */
const container = "mx-auto w-full max-w-6xl px-4 md:px-6";
const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";
const sectionBase = `${cardBase} p-5 md:p-6`;
const subtle = "text-slate-400 text-sm";

const inputBase =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** ---------------- helpers ---------------- */
function pickUser(res: any) {
  return res?.user || res?.data || null;
}
function pickBilling(res: any) {
  return res?.data || null;
}

type TopTabKey = "profile" | "billing";

function Divider() {
  return <div className="my-4 h-px w-full bg-slate-800/80" />;
}

function PlanChip({ label, tone }: { label: string; tone?: "emerald" | "amber" | "sky" }) {
  const toneCls =
    tone === "amber"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
      : tone === "sky"
      ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";

  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold", toneCls)}>
      <Layers size={14} className="opacity-80" />
      {label}
    </span>
  );
}

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
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition",
        active
          ? "bg-emerald-500 text-slate-950 border-emerald-500"
          : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700"
      )}
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
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/35 p-4">
      <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={clsx("text-sm font-medium truncate", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function QuickLinkCard({
  title,
  desc,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-slate-800 bg-slate-950/35 hover:bg-slate-950/55 transition p-4 flex gap-3"
    >
      <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
      </div>
      <div className="ml-auto text-slate-500">
        <ExternalLink size={16} />
      </div>
    </button>
  );
}

/** ---------------- page ---------------- */
export default function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TopTabKey>("profile");

  // MODALS
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editBillingOpen, setEditBillingOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  // QUERIES
  const { data: meRes, isLoading: meLoading, isFetching: meFetching, refetch: refetchMe } = useGetMeQuery();
  const { data: billingRes, isLoading: billingLoading, isFetching: billingFetching, refetch: refetchBilling } =
    useGetBillingDetailsQuery();
  const { data: subRes, isLoading: subLoading, isFetching: subFetching, refetch: refetchSub } =
    useGetMyCurrentSubscriptionQuery();

  const user = useMemo(() => pickUser(meRes), [meRes]);
  const billing = useMemo(() => pickBilling(billingRes), [billingRes]);

  const mySub = (subRes as any)?.data ?? null;
  const plan = mySub?.plan ?? null;
  const planName = plan?.name ?? "No active plan";
  const planType = (plan?.planType ?? plan?.plan_type ?? "").toString().toUpperCase();

  const loading = meLoading || meFetching || subLoading || subFetching;

  // MUTATIONS
  const [updateMe, { isLoading: updatingMe }] = useUpdateMeMutation();
  const [saveBilling, { isLoading: savingBilling }] = useSaveBillingDetailsMutation();
  const [changePassword, { isLoading: changingPass }] = useChangePasswordMutation();

  const goUpgrade = () => navigate("/pricing");

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      {/* top glow */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className={clsx(container, "relative pt-10 md:pt-14 pb-6")}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Profile <span className="text-emerald-400">Settings</span>
              </h1>
              <p className={clsx(subtle, "mt-1")}>
                Manage your profile, billing, and security. Trading settings are available in their own pages.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <PlanChip
                  label={planName}
                  tone={planType === "ELITE" ? "amber" : planType === "BUNDLE" ? "sky" : "emerald"}
                />
                {planType ? <PlanChip label={planType} tone="emerald" /> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChangePassOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80 transition"
              >
                <Lock size={16} className="text-slate-300" />
                Change Password
              </button>

              <button
                type="button"
                onClick={() => {
                  refetchMe();
                  refetchBilling();
                  refetchSub();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80 transition"
              >
                <RefreshCw size={16} className="text-slate-300" />
                Refresh
              </button>

              <button
                type="button"
                onClick={goUpgrade}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Zap size={16} />
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* TOP TABS (ONLY PROFILE + BILLING) */}
          <div className="mt-6 flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      <div className={clsx(container, "mt-6")}>
        {loading ? (
          <ProfileSkeleton />
        ) : !user ? (
          <div className={clsx(cardBase, "p-6 text-slate-300")}>
            Unable to load profile.{" "}
            <button
              onClick={() => refetchMe()}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,360px] gap-6">
            {/* LEFT */}
            <div className="space-y-6">
              {activeTab === "profile" && (
                <>
                  <section className={sectionBase}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg md:text-xl font-semibold">Personal Information</h2>

                      <button
                        onClick={() => setEditProfileOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <InfoRow label="Full Name" value={user?.name || "—"} icon={<UserIcon size={18} />} />
                      <InfoRow label="Email" value={user?.email || "—"} icon={<Mail size={18} />} />
                      <InfoRow
                        label="Verification"
                        value={user?.isEmailVerified ? "Verified" : "Not Verified"}
                        icon={<ShieldCheck size={18} />}
                        valueClass={user?.isEmailVerified ? "text-emerald-300" : "text-rose-300"}
                      />
                      <InfoRow label="User ID" value={String(user?.id ?? "—")} icon={<Hash size={18} />} />
                    </div>
                  </section>

                  <section className={sectionBase}>
                    <h2 className="text-lg md:text-xl font-semibold">Security</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Use a strong password. You can change your password anytime.
                    </p>
                  </section>

                  {/* ✅ Quick navigation to split pages */}
                  <section className={sectionBase}>
                    <h2 className="text-lg md:text-xl font-semibold">Trading Pages</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Trading settings are managed in separate pages for clarity.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <QuickLinkCard
                        title="Forex Trading"
                        desc="Pine connector, MT5/cTrader, webhooks, execution."
                        icon={<PlugZap size={18} />}
                        onClick={() => navigate("/forex-trading")}
                      />
                      <QuickLinkCard
                        title="Indian Trading"
                        desc="Broker token settings for Indian market execution."
                        icon={<ShieldCheck size={18} />}
                        onClick={() => navigate("/indian-trading")}
                      />
                      <QuickLinkCard
                        title="Crypto Trading"
                        desc="Delta API keys and crypto execution settings."
                        icon={<ShieldCheck size={18} />}
                        onClick={() => navigate("/crypto-trading")}
                      />
                      <QuickLinkCard
                        title="Copy Trading"
                        desc="Your copy-trading setup and follower settings."
                        icon={<Crown size={18} />}
                        onClick={() => navigate("/copy-trading")}
                      />
                    </div>
                  </section>
                </>
              )}

              {activeTab === "billing" && (
                <section className={sectionBase}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold">Billing Details</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Only PAN + address are required for invoices.
                      </p>
                    </div>

                    <button
                      onClick={() => setEditBillingOpen(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      <Pencil size={15} />
                      Edit Billing
                    </button>
                  </div>

                  {billingLoading || billingFetching ? (
                    <div className="mt-6 text-sm text-slate-400">Loading billing…</div>
                  ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <InfoRow label="PAN Number" value={billing?.panNumber || "—"} icon={<Hash size={18} />} />

                      <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-300">
                            <MapPin size={18} />
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">Address</p>

                            {billing ? (
                              <div className="mt-1 space-y-1 text-sm text-slate-200">
                                <div>{billing.addressLine1}</div>
                                {billing.addressLine2 && <div>{billing.addressLine2}</div>}
                                <div>
                                  {billing.city}, {billing.state}
                                </div>
                                <div className="font-medium">{billing.pincode}</div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">—</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6 lg:sticky lg:top-6 h-fit">
              <div className={sectionBase}>
                <p className="text-sm font-semibold text-slate-100">Current Plan</p>
                <p className="mt-1 text-xs text-slate-400">
                  Your plan affects which trading pages/features are available.
                </p>
                <Divider />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className="text-sm font-semibold text-slate-100">{planName}</p>
                  </div>

                  {planType ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">Tier</p>
                      <p className="text-sm font-semibold text-slate-100">{planType}</p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={goUpgrade}
                    className="mt-4 w-full rounded-xl bg-emerald-500 text-slate-950 font-extrabold py-3 hover:bg-emerald-400 transition flex items-center justify-center gap-2"
                  >
                    <Zap size={18} />
                    Upgrade Plan
                  </button>
                </div>
              </div>

              <div className={clsx(cardBase, "p-5 text-[11px] text-slate-500")}>
                Tip: Trading settings are now in <b>Forex / Indian / Crypto</b> pages.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
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

/* ---------------- Skeleton ---------------- */
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse">
        <div className="h-5 w-52 bg-slate-800 rounded" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
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
        className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80 transition"
      >
        Cancel
      </button>

      <button
        disabled={disabled}
        onClick={onMain}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm text-slate-950 font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {mainText}
      </button>
    </div>
  );
}

function normalizeEmptyToNull(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    out[k] = typeof v === "string" && v.trim() === "" ? null : v;
  });
  return out;
}

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
      <p className="text-xs text-slate-400 mb-5">Email change is disabled for now.</p>

      <div className="space-y-4">
        <Field label="Full Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-50" placeholder="Enter your name" />
        </Field>

        <Field label="Email">
          <input value={email} disabled className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-400 opacity-80 cursor-not-allowed" />
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
    addressLine1: billing?.addressLine1 ?? "",
    addressLine2: billing?.addressLine2 ?? "",
    city: billing?.city ?? "",
    state: billing?.state ?? "",
    pincode: billing?.pincode ?? "",
  });

  useEffect(() => {
    setForm({
      panNumber: billing?.panNumber ?? "",
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
      <p className="text-xs text-slate-400 mb-5">Fill what you have — you can update later.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="PAN Number (Optional)">
          <input value={form.panNumber} onChange={(e) => set("panNumber", e.target.value)} className={inputBase} placeholder="ABCDE1234F" />
        </Field>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-200 mb-3">Address</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address Line 1">
            <input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} className={inputBase} placeholder="House / Street" />
          </Field>

          <Field label="Address Line 2 (Optional)">
            <input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} className={inputBase} placeholder="Area / Landmark" />
          </Field>

          <Field label="City">
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputBase} placeholder="City" />
          </Field>

          <Field label="State">
            <input value={form.state} onChange={(e) => set("state", e.target.value)} className={inputBase} placeholder="State" />
          </Field>

          <Field label="Pincode">
            <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputBase} placeholder="560001" />
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

  const canSubmit = currentPassword.length >= 1 && newPassword.length >= 6 && newPassword === confirm;

  return (
    <div className="text-slate-100">
      <h3 className="text-lg font-semibold mb-1">Change Password</h3>
      <p className="text-xs text-slate-400 mb-5">Minimum 6 characters.</p>

      <div className="space-y-4">
        <Field label="Current Password">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputBase} placeholder="Enter current password" />
        </Field>

        <Field label="New Password">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBase} placeholder="Create a new password" />
        </Field>

        <Field label="Confirm New Password">
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputBase} placeholder="Re-enter new password" />
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
