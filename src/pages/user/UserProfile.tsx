import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  PlusCircle,
  Pencil,
  Trash2,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Modal from "../../components/Model";

// --------------------------------------------------------------------
// MOCK DATA
// --------------------------------------------------------------------
const mockUser = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+91 9876543210",
  verified: true,
  brokers: [
    { id: 1, name: "Zerodha", accountId: "Z12345", status: "Connected" },
    { id: 2, name: "Dhan", accountId: "DH99872", status: "Connected" },
  ],
  apiKeys: [
    { id: "key_1", value: "sk_live_abc123df456" },
    { id: "key_2", value: "sk_live_xyz987qp321" },
  ],
};

// --------------------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------------------
export default function UserProfilePage() {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addBrokerOpen, setAddBrokerOpen] = useState(false);
  const [editBroker, setEditBroker] = useState<any>(null);
  const [changePassOpen, setChangePassOpen] = useState(false);

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 px-4 py-8 bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-8">

        {/* ------------------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------------------ */}
        <div>
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal details, brokers, API keys & security settings
          </p>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* PROFILE SECTION */}
        {/* ------------------------------------------------------------ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Personal Information</h2>

            <button
              onClick={() => setEditProfileOpen(true)}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <InfoRow label="Full Name" value={mockUser.name} icon={<User />} />
            <InfoRow label="Email" value={mockUser.email} icon={<Mail />} />
            <InfoRow label="Phone" value={mockUser.phone} icon={<Phone />} />
            <InfoRow
              label="Verification"
              value={mockUser.verified ? "Verified" : "Not Verified"}
              icon={<ShieldCheck />}
            />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* BROKER ACCOUNTS */}
        {/* ------------------------------------------------------------ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Connected Brokers</h2>

            <button
              onClick={() => setAddBrokerOpen(true)}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              <PlusCircle size={16} />
              Add Broker
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {mockUser.brokers.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {b.name}
                  </h4>
                  <p className="text-xs text-slate-400">Account: {b.accountId}</p>
                  <p className="text-xs text-emerald-400">Status: {b.status}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditBroker(b)}
                    className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
                  >
                    <Pencil size={14} />
                  </button>

                  <button className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* API KEYS */}
        {/* ------------------------------------------------------------ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">API Keys</h2>

            <button className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400">
              <PlusCircle size={16} />
              Generate API Key
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {mockUser.apiKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div>
                  <p className="text-sm text-slate-200">{k.value}</p>
                </div>
                <button className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* SECURITY */}
        {/* ------------------------------------------------------------ */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Security</h2>

            <button
              onClick={() => setChangePassOpen(true)}
              className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              <Lock size={16} />
              Change Password
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Manage your account security and authentication.
          </p>
        </section>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* MODALS */}
      {/* ------------------------------------------------------------ */}

      {/* Edit Profile */}
      <Modal open={editProfileOpen} onClose={() => setEditProfileOpen(false)}>
        <ProfileEditForm onClose={() => setEditProfileOpen(false)} />
      </Modal>

      {/* Add Broker */}
      <Modal open={addBrokerOpen} onClose={() => setAddBrokerOpen(false)}>
        <AddBrokerForm onClose={() => setAddBrokerOpen(false)} />
      </Modal>

      {/* Edit Broker */}
      <Modal open={!!editBroker} onClose={() => setEditBroker(null)}>
        {editBroker && (
          <EditBrokerForm broker={editBroker} onClose={() => setEditBroker(null)} />
        )}
      </Modal>

      {/* Change Password */}
      <Modal open={changePassOpen} onClose={() => setChangePassOpen(false)}>
        <ChangePasswordForm onClose={() => setChangePassOpen(false)} />
      </Modal>
    </div>
  );
}

// --------------------------------------------------------------------
// REUSABLE INFO ROW
// --------------------------------------------------------------------
function InfoRow({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------
// FORMS
// --------------------------------------------------------------------

// PERSONAL INFO EDIT
function ProfileEditForm({ onClose }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

      <div className="space-y-4">
        <Input label="Full Name" defaultValue={mockUser.name} />
        <Input label="Email" defaultValue={mockUser.email} />
        <Input label="Phone" defaultValue={mockUser.phone} />
      </div>

      <Actions onClose={onClose} />
    </div>
  );
}

// ADD BROKER
function AddBrokerForm({ onClose }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Add Broker</h3>

      <div className="space-y-4">
        <Input label="Broker Name" placeholder="Zerodha / Dhan / Angel" />
        <Input label="Account ID" placeholder="Enter your broker ID" />
      </div>

      <Actions onClose={onClose} />
    </div>
  );
}

// EDIT BROKER
function EditBrokerForm({ broker, onClose }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Edit Broker</h3>

      <div className="space-y-4">
        <Input label="Broker Name" defaultValue={broker.name} />
        <Input label="Account ID" defaultValue={broker.accountId} />
      </div>

      <Actions onClose={onClose} />
    </div>
  );
}

// CHANGE PASSWORD
function ChangePasswordForm({ onClose }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Change Password</h3>

      <div className="space-y-4">
        <Input label="Current Password" type="password" />
        <Input label="New Password" type="password" />
        <Input label="Confirm New Password" type="password" />
      </div>

      <Actions onClose={onClose} mainText="Update Password" onCloseText="Close" />
    </div>
  );
}

// --------------------------------------------------------------------
// REUSABLE ELEMENTS
// --------------------------------------------------------------------
function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <input
        {...props}
        className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Actions({
  onClose,
  mainText = "Save Changes",
  onCloseText = "Cancel",
}: any) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        onClick={onClose}
        className="rounded-full bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
      >
        {onCloseText}
      </button>

      <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-slate-950 hover:bg-emerald-400">
        {mainText}
      </button>
    </div>
  );
}
