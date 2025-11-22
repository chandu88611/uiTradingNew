import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Settings,
  Users,
  Cpu,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutGrid,
  Table,
  Link2,
  ArrowRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Strategy = {
  id: string;
  name: string;
  type: string;
};

type Subscriber = {
  id: string;
  name: string;
  accountId: string;
};

type LinkConfig = {
  id: string;
  strategyId: string;
  subscriberId: string;
  lotMultiplier: number;
  riskScale: number;
  tradeType: "BUY" | "SELL" | "BOTH";
  status: "active" | "paused";
};

const strategies: Strategy[] = [
  { id: "st1", name: "Breakout Booster", type: "Intraday" },
  { id: "st2", name: "RSI Reversal", type: "Swing" },
  { id: "st3", name: "Option Scalper", type: "Options" },
];

const subscribers: Subscriber[] = [
  { id: "sub1", name: "Rahul Sharma", accountId: "ACC-101" },
  { id: "sub2", name: "Priya Singh", accountId: "ACC-102" },
  { id: "sub3", name: "Karan Patel", accountId: "ACC-103" },
  { id: "sub4", name: "Vikas Gupta", accountId: "ACC-104" },
];

const initialLinks: LinkConfig[] = [
  {
    id: "l1",
    strategyId: "st1",
    subscriberId: "sub1",
    lotMultiplier: 1,
    riskScale: 1,
    tradeType: "BOTH",
    status: "active",
  },
  {
    id: "l2",
    strategyId: "st2",
    subscriberId: "sub2",
    lotMultiplier: 2,
    riskScale: 1,
    tradeType: "BUY",
    status: "paused",
  },
];

const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

const StrategyLinkingPage: React.FC = () => {
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editLink, setEditLink] = useState<LinkConfig | null>(null);

  const page = 1;
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return links.filter((l) => {
      const strategy = strategies.find((s) => s.id === l.strategyId)!;
      const subscriber = subscribers.find((s) => s.id === l.subscriberId)!;

      return (
        strategy.name.toLowerCase().includes(search.toLowerCase()) ||
        subscriber.name.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search, links]);

  const openDrawerNew = () => {
    setEditLink(null);
    setDrawerOpen(true);
  };

  const openDrawerEdit = (link: LinkConfig) => {
    setEditLink(link);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setEditLink(null), 200);
  };

  const saveLink = (data: any) => {
    if (editLink) {
      setLinks((prev) =>
        prev.map((l) => (l.id === editLink.id ? { ...l, ...data } : l))
      );
    } else {
      setLinks((prev) => [
        ...prev,
        { id: "l" + Math.random().toFixed(5), ...data },
      ]);
    }
    closeDrawer();
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 p-6 text-slate-100 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Link2 className="text-emerald-400" />
            Strategy Linking
          </h1>
          <p className="text-slate-400 text-sm">
            Control which strategy is linked to which subscriber.
          </p>
        </div>

        <button
          onClick={openDrawerNew}
          className="flex items-center gap-2 bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl shadow-soft-glow hover:bg-emerald-400"
        >
          <Plus size={18} /> Add Link
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="absolute top-2.5 left-3 text-slate-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 focus:border-emerald-400 text-sm"
            placeholder="Search subscriber or strategy..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-slate-900/80 border border-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-800">
            <Filter size={16} /> Filters
          </button>

          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${
              viewMode === "grid"
                ? "bg-emerald-500/20 border border-emerald-500/40"
                : "bg-slate-900/80 border border-slate-700"
            }`}
          >
            <LayoutGrid size={18} />
          </button>

          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg ${
              viewMode === "table"
                ? "bg-emerald-500/20 border border-emerald-500/40"
                : "bg-slate-900/80 border border-slate-700"
            }`}
          >
            <Table size={18} />
          </button>
        </div>
      </div>

      {/* LISTING */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((l) => {
              const strategy = strategies.find((s) => s.id === l.strategyId)!;
              const subscriber = subscribers.find(
                (s) => s.id === l.subscriberId
              )!;
              return (
                <div
                  key={l.id}
                  className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/40 transition"
                >
                  <h3 className="text-lg font-semibold mb-1">{strategy.name}</h3>
                  <p className="text-slate-400 text-sm mb-3">
                    Linked to:{" "}
                    <span className="text-slate-200">{subscriber.name}</span>
                  </p>

                  <div className="text-sm text-slate-400 space-y-1">
                    <p>Trade Type: {l.tradeType}</p>
                    <p>Lot Multiplier: {l.lotMultiplier}x</p>
                    <p>Risk Scale: {l.riskScale}x</p>
                    <p>Status: {l.status}</p>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => openDrawerEdit(l)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1"
                    >
                      <Settings size={14} /> Configure
                    </button>

                    <button
                      onClick={() => deleteLink(l.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto"
          >
            <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl">
              <thead className="bg-slate-900/70 border-b border-slate-800 text-sm text-slate-300">
                <tr>
                  <th className="p-3 text-left">Strategy</th>
                  <th className="p-3 text-left">Subscriber</th>
                  <th className="p-3 text-left">Multipliers</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">
                    <button
                      onClick={openDrawerNew}
                      className="flex items-center gap-1 bg-emerald-500 text-slate-900 px-3 py-1 rounded-lg text-xs hover:bg-emerald-400"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => {
                  const strategy = strategies.find((s) => s.id === l.strategyId)!;
                  const subscriber = subscribers.find(
                    (s) => s.id === l.subscriberId
                  )!;
                  return (
                    <tr
                      key={l.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="p-3">{strategy.name}</td>
                      <td className="p-3">{subscriber.name}</td>
                      <td className="p-3">
                        {l.lotMultiplier}x / {l.riskScale}x
                      </td>
                      <td className="p-3">{l.tradeType}</td>
                      <td className="p-3">{l.status}</td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => openDrawerEdit(l)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteLink(l.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================== DRAWER ======================== */}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editLink ? "Edit Link" : "Create Link"}
              </h2>
              <button onClick={closeDrawer}>
                <X size={22} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <DrawerForm
              defaultValues={editLink || undefined}
              onSubmit={saveLink}
              onCancel={closeDrawer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =================== FORM COMPONENT =================== */

const DrawerForm = ({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues?: LinkConfig;
  onSubmit: (x: any) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState(
    defaultValues || {
      subscriberId: subscribers[0].id,
      strategyId: strategies[0].id,
      lotMultiplier: 1,
      riskScale: 1,
      tradeType: "BOTH",
      status: "active",
    }
  );

  const update = (key: string, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      {/* Subscriber */}
      <div>
        <label className="text-sm">Subscriber</label>
        <select
          value={form.subscriberId}
          onChange={(e) => update("subscriberId", e.target.value)}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
        >
          {subscribers.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name} ({s.accountId})
            </option>
          ))}
        </select>
      </div>

      {/* Strategy */}
      <div>
        <label className="text-sm">Strategy</label>
        <select
          value={form.strategyId}
          onChange={(e) => update("strategyId", e.target.value)}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
        >
          {strategies.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name} — {s.type}
            </option>
          ))}
        </select>
      </div>

      {/* Lot Multiplier */}
      <div>
        <label className="text-sm">Lot Multiplier</label>
        <input
          type="number"
          value={form.lotMultiplier}
          onChange={(e) => update("lotMultiplier", Number(e.target.value))}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
        />
      </div>

      {/* Risk Scale */}
      <div>
        <label className="text-sm">Risk Scale</label>
        <input
          type="number"
          value={form.riskScale}
          onChange={(e) => update("riskScale", Number(e.target.value))}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-400"
        />
      </div>

      {/* Trade Type */}
      <div>
        <label className="text-sm">Trade Type</label>
        <select
          value={form.tradeType}
          onChange={(e) => update("tradeType", e.target.value)}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="BUY">Buy Only</option>
          <option value="SELL">Sell Only</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="text-sm">Status</label>
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {/* FORM ACTIONS */}
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
          Save Link
        </button>
      </div>
    </form>
  );
};

export default StrategyLinkingPage;
