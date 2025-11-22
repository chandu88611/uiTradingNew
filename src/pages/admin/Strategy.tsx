import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Settings,
  LayoutGrid,
  Table,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Strategy Type ---------------- */
type Strategy = {
  id: string;
  name: string;
  type: string;
  status: "active" | "paused" | "draft";
  description: string;
  winRate: number;
  lastRun: string;
  capital: number;
};

/* ---------------- Mock Data ---------------- */
const initialStrategies: Strategy[] = [
  {
    id: "s1",
    name: "Breakout Booster",
    type: "Intraday",
    status: "active",
    description: "A breakout-based intraday momentum strategy.",
    winRate: 68,
    lastRun: "2025-02-01 10:30 AM",
    capital: 150000,
  },
  {
    id: "s2",
    name: "RSI Reversal",
    type: "Swing",
    status: "paused",
    description: "Reversals based on RSI oversold/overbought zones.",
    winRate: 54,
    lastRun: "2025-01-31 03:15 PM",
    capital: 100000,
  },
  {
    id: "s3",
    name: "Option Scalper",
    type: "Options",
    status: "draft",
    description: "Quick scalping strategy for weekly options.",
    winRate: 0,
    lastRun: "-",
    capital: 0,
  },
];

/* ---------------- Badge Colors ---------------- */
const badgeColors = {
  active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
  paused: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
  draft: "bg-slate-700 text-slate-300 border border-slate-600",
};

/* ---------------- Drawer Animation ---------------- */
const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: "0%", opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

const StrategyManagementPage: React.FC = () => {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editStrategy, setEditStrategy] = useState<Strategy | null>(null);

  const itemsPerPage = 6;

  /* ---------------- Filtering ---------------- */
  const filtered = useMemo(() => {
    return strategies.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, strategies]);

  /* ---------------- Pagination ---------------- */
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  /* ---------------- Drawer Logic ---------------- */
  const openDrawerForNew = () => {
    setEditStrategy(null);
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (strategy: Strategy) => {
    setEditStrategy(strategy);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setEditStrategy(null), 200);
  };

  const saveStrategy = (data: any) => {
    if (editStrategy) {
      // Update existing
      setStrategies((prev) =>
        prev.map((s) => (s.id === editStrategy.id ? { ...s, ...data } : s))
      );
    } else {
      // Create new
      const newStrategy: Strategy = {
        id: "s" + (Math.random() * 9999).toFixed(0),
        winRate: 0,
        lastRun: "-",
        capital: 0,
        status: "draft",
        ...data,
      };
      setStrategies((prev) => [...prev, newStrategy]);
    }
    closeDrawer();
  };

  const deleteStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  /* ---------------------------------------------- */
  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-6 relative">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Strategy Management
          </h1>
          <p className="text-slate-400 text-sm">
            Create, edit, configure and manage all your trading strategies.
          </p>
        </div>

        <button
          className="flex items-center gap-2 bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl shadow-soft-glow hover:bg-emerald-400 transition"
          onClick={openDrawerForNew}
        >
          <Plus size={18} />
          Add Strategy
        </button>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 focus:border-emerald-400 focus:ring-1 focus:outline-none text-sm"
            placeholder="Search strategies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters + View Mode */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-sm">
            <Filter size={16} /> Filters
          </button>

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

      {/* ---------------- GRID VIEW ---------------- */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* ADD STRATEGY CARD */}
            <div
              onClick={openDrawerForNew}
              className="cursor-pointer bg-slate-900/60 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/40 hover:bg-slate-900 transition flex flex-col justify-center items-center text-center group"
            >
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/20 transition">
                <Plus size={32} className="text-slate-400 group-hover:text-emerald-400" />
              </div>
              <p className="mt-4 text-lg text-slate-200 font-semibold">
                Add Strategy
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Create a new trading strategy
              </p>
            </div>

            {/* EXISTING STRATEGIES */}
            {paginated.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/40 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${badgeColors[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mb-3">{s.description}</p>

                <div className="text-sm text-slate-400 space-y-1">
                  <p>
                    <span className="text-slate-300 font-medium">Type:</span>{" "}
                    {s.type}
                  </p>
                  <p>
                    <span className="text-slate-300 font-medium">Win Rate:</span>{" "}
                    {s.winRate}%
                  </p>
                  <p>
                    <span className="text-slate-300 font-medium">Last Run:</span>{" "}
                    {s.lastRun}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 text-xs hover:bg-slate-700"
                    onClick={() => openDrawerForEdit(s)}
                  >
                    <Settings size={14} />
                    Configure
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                      onClick={() => openDrawerForEdit(s)}
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                      onClick={() => deleteStrategy(s.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* ---------------- TABLE VIEW ---------------- */
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto"
          >
            <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl">
              <thead className="bg-slate-900/70 border-b border-slate-800">
                <tr className="text-left text-slate-300">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Win Rate</th>
                  <th className="p-3">Last Run</th>
                  <th className="p-3 text-right">
                    <button
                      onClick={openDrawerForNew}
                      className="flex items-center gap-1 bg-emerald-500 text-slate-900 px-3 py-1 rounded-lg text-xs hover:bg-emerald-400"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.type}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs ${badgeColors[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3">{s.winRate}%</td>
                    <td className="p-3">{s.lastRun}</td>
                    <td className="p-3 text-right flex gap-2 justify-end">
                      <button
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                        onClick={() => openDrawerForEdit(s)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                        onClick={() => deleteStrategy(s.id)}
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

      {/* ---------------- Drawer (Add / Edit) ---------------- */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            transition={{ duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 z-50 overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editStrategy ? "Edit Strategy" : "Create Strategy"}
              </h2>
              <button onClick={closeDrawer}>
                <X size={22} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Form */}
            <DrawerForm
              onSubmit={saveStrategy}
              onCancel={closeDrawer}
              defaultValues={editStrategy || undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mobile Add Button */}
      <button
        onClick={openDrawerForNew}
        className="md:hidden fixed bottom-6 right-6 bg-emerald-500 text-slate-950 p-4 rounded-full shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 transition z-50"
      >
        <Plus size={22} />
      </button>
    </div>
  );
};

/* ---------------- Drawer Form ---------------- */
const DrawerForm = ({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState(
    defaultValues || {
      name: "",
      type: "Intraday",
      description: "",
      status: "draft",
    }
  );

  const update = (key: string, val: any) => {
    setForm((prev: any) => ({ ...prev, [key]: val }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      {/* NAME */}
      <div>
        <label className="text-sm">Strategy Name</label>
        <input
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </div>

      {/* TYPE */}
      <div>
        <label className="text-sm">Strategy Type</label>
        <select
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
        >
          <option>Intraday</option>
          <option>Swing</option>
          <option>Options</option>
          <option>Scalping</option>
        </select>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-sm">Description</label>
        <textarea
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm h-24 focus:border-emerald-400"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      {/* STATUS */}
      <div>
        <label className="text-sm">Status</label>
        <select
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* FORM BUTTONS */}
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
          Save Strategy
        </button>
      </div>
    </form>
  );
};

export default StrategyManagementPage;
