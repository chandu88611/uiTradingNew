import React, { useMemo, useState } from "react";
import {
  Search,
  LayoutGrid,
  Table,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  User,
  Wallet,
  Signal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Subscriber = {
  id: string;
  name: string;
  email: string;
  broker: string;
  accountId: string;
  capital: number;
  status: "connected" | "disconnected";
  copyEnabled: boolean;
  risk: number; // percent
  multiplier: number;
};

const initialSubscribers: Subscriber[] = [
  {
    id: "u1",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    broker: "Zerodha",
    accountId: "ZR12345",
    capital: 150000,
    status: "connected",
    copyEnabled: true,
    risk: 50,
    multiplier: 1.5,
  },
  {
    id: "u2",
    name: "Priya Singh",
    email: "priya@example.com",
    broker: "Angel One",
    accountId: "AN99887",
    capital: 75000,
    status: "disconnected",
    copyEnabled: false,
    risk: 30,
    multiplier: 1,
  },
  {
    id: "u3",
    name: "Vikas Kumar",
    email: "vikas@example.com",
    broker: "Dhan",
    accountId: "DH55421",
    capital: 230000,
    status: "connected",
    copyEnabled: true,
    risk: 70,
    multiplier: 2,
  },
];

const statusBadge = {
  connected: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
  disconnected:
    "bg-rose-500/20 text-rose-400 border border-rose-500/40",
};

const SubscriberManagementPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Subscriber | null>(null);

  const itemsPerPage = 6;

  const filtered = useMemo(() => {
    return subscribers.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, subscribers]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const openModal = (sub: Subscriber) => {
    setEditData(sub);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setEditData(null), 200);
  };

  const toggleCopy = (id: string) => {
    setSubscribers((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, copyEnabled: !s.copyEnabled } : s
      )
    );
  };

  const deleteSubscriber = (id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  const saveSubscriber = (data: Subscriber) => {
    setSubscribers((prev) =>
      prev.map((s) => (s.id === data.id ? data : s))
    );
    closeModal();
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Subscribers
        </h1>
        <p className="text-slate-400 text-sm">
          Manage subscribers, broker connections, risk settings & copy status.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search
            className="absolute left-3 top-2.5 text-slate-500"
            size={18}
          />
          <input
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 focus:border-emerald-400 focus:ring-1 focus:outline-none text-sm"
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-3">
          <button
            className={`p-2 rounded-lg border ${
              viewMode === "grid"
                ? "bg-emerald-500/20 border-emerald-500/40"
                : "bg-slate-900/80 border-slate-700"
            }`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={18} />
          </button>

          <button
            className={`p-2 rounded-lg border ${
              viewMode === "table"
                ? "bg-emerald-500/20 border-emerald-500/40"
                : "bg-slate-900/80 border-slate-700"
            }`}
            onClick={() => setViewMode("table")}
          >
            <Table size={18} />
          </button>
        </div>
      </div>

      {/* Subscriber List */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginated.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/40 transition"
              >
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${statusBadge[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>

                <p className="text-slate-400 text-xs mt-1">{s.email}</p>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <User size={15} className="text-slate-500" />
                    Broker: {s.broker}
                  </p>

                  <p className="flex items-center gap-2">
                    <Wallet size={15} className="text-slate-500" />
                    Account ID: {s.accountId}
                  </p>

                  <p className="flex items-center gap-2">
                    <Signal size={15} className="text-slate-500" />
                    Capital: ₹{s.capital.toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={() => openModal(s)}
                    className="flex items-center gap-1 bg-slate-800 px-3 py-1 text-xs rounded-lg hover:bg-slate-700"
                  >
                    <Settings size={14} />
                    Settings
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCopy(s.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                    >
                      {s.copyEnabled ? (
                        <ToggleRight size={18} className="text-emerald-400" />
                      ) : (
                        <ToggleLeft size={18} className="text-slate-500" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteSubscriber(s.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto"
          >
            <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl text-sm">
              <thead className="bg-slate-900/70 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Broker</th>
                  <th className="p-3 text-left">Capital</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Copy</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40"
                  >
                    <td className="p-3 text-slate-200">{s.name}</td>
                    <td className="p-3 text-slate-400">{s.email}</td>
                    <td className="p-3">{s.broker}</td>
                    <td className="p-3">₹{s.capital.toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs ${statusBadge[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleCopy(s.id)}>
                        {s.copyEnabled ? (
                          <ToggleRight
                            size={20}
                            className="text-emerald-400"
                          />
                        ) : (
                          <ToggleLeft
                            size={20}
                            className="text-slate-500"
                          />
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openModal(s)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteSubscriber(s.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="p-2 rounded-lg disabled:opacity-40 bg-slate-800 hover:bg-slate-700"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-slate-400">Page {page}</span>

        <button
          disabled={paginated.length < itemsPerPage}
          onClick={() => setPage((p) => p + 1)}
          className="p-2 rounded-lg disabled:opacity-40 bg-slate-800 hover:bg-slate-700"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {modalOpen && editData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Edit Subscriber
                </h2>
                <button onClick={closeModal}>
                  <X
                    size={22}
                    className="text-slate-400 hover:text-white"
                  />
                </button>
              </div>

              <SubscriberSettingsForm
                data={editData}
                onSave={saveSubscriber}
                onCancel={closeModal}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* Settings Form Component */
const SubscriberSettingsForm = ({
  data,
  onSave,
  onCancel,
}: {
  data: Subscriber;
  onSave: (d: Subscriber) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState({ ...data });

  const update = (key: keyof Subscriber, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-5"
    >
      <div>
        <label className="text-sm">Name</label>
        <input
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm">Email</label>
        <input
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm">Broker</label>
        <select
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={form.broker}
          onChange={(e) => update("broker", e.target.value)}
        >
          <option>Zerodha</option>
          <option>Angel One</option>
          <option>Dhan</option>
          <option>Motilal Oswal</option>
          <option>Upstox</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Capital (₹)</label>
        <input
          type="number"
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={form.capital}
          onChange={(e) => update("capital", Number(e.target.value))}
        />
      </div>

      <div>
        <label className="text-sm">Risk (%)</label>
        <input
          type="number"
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={form.risk}
          onChange={(e) => update("risk", Number(e.target.value))}
        />
      </div>

      <div>
        <label className="text-sm">Multiplier</label>
        <input
          type="number"
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          value={form.multiplier}
          onChange={(e) => update("multiplier", Number(e.target.value))}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default SubscriberManagementPage;
