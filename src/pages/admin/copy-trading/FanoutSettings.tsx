import React, { useMemo, useState } from "react";
import {
  Search,
  Settings,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------------------
   MOCK SUBSCRIBERS
---------------------------- */
type Subscriber = {
  id: string;
  name: string;
  broker: string;
  balance: number;
  status: "connected" | "disconnected";
  overrideEnabled: boolean;
  multiplier: number;
  slippage: number;
  mode: "multiplier" | "fixed" | "capital";
  onlyBuy: boolean;
  onlySell: boolean;
  maxLots: number;
};

const initialSubscribers: Subscriber[] = [
  {
    id: "u1",
    name: "Rahul Kumar",
    broker: "Zerodha",
    balance: 150000,
    status: "connected",
    overrideEnabled: false,
    multiplier: 1,
    slippage: 0.5,
    mode: "multiplier",
    onlyBuy: false,
    onlySell: false,
    maxLots: 10,
  },
  {
    id: "u2",
    name: "Priya Sharma",
    broker: "Angel One",
    balance: 90000,
    status: "connected",
    overrideEnabled: true,
    multiplier: 1.5,
    slippage: 0.7,
    mode: "capital",
    onlyBuy: false,
    onlySell: false,
    maxLots: 5,
  },
  {
    id: "u3",
    name: "Amit Verma",
    broker: "Dhan",
    balance: 40000,
    status: "disconnected",
    overrideEnabled: false,
    multiplier: 0.5,
    slippage: 1,
    mode: "fixed",
    onlyBuy: true,
    onlySell: false,
    maxLots: 2,
  },
];

/* Drawer Animation */
const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: "0%", opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

/* ----------------------------
   MAIN PAGE
----------------------------- */
const FanoutSettingsPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* Drawer State */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Subscriber | null>(null);

  /* Global Settings */
  const [globalSettings, setGlobalSettings] = useState({
    mode: "multiplier",
    globalMultiplier: 1,
    globalSlippage: 0.5,
    spreadLimit: 0.3,
    executionMode: "fast",
    maxTrades: 15,
    hedgeMode: false,
    autoStop: false,
  });

  const itemsPerPage = 5;

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) =>
      sub.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, subscribers]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredSubscribers.slice(start, start + itemsPerPage);
  }, [filteredSubscribers, page]);

  const openDrawer = (user: Subscriber) => {
    setEditingUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setEditingUser(null), 250);
  };

  const saveOverride = (updated: Subscriber) => {
    setSubscribers((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    closeDrawer();
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-6">

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold">Fanout Settings</h1>
        <p className="text-slate-400 text-sm">
          Configure how trades are copied across subscribers (global + overrides).
        </p>
      </div>

      {/* --------------------------
          GLOBAL SETTINGS PANEL
      --------------------------- */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <SlidersHorizontal size={20} /> Global Fanout Settings
        </h2>

        {/* Mode */}
        <div>
          <label className="text-sm">Sizing Mode</label>
          <select
            value={globalSettings.mode}
            onChange={(e) =>
              setGlobalSettings({ ...globalSettings, mode: e.target.value })
            }
            className="w-full mt-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
          >
            <option value="multiplier">Lot Multiplier</option>
            <option value="fixed">Fixed Lot</option>
            <option value="capital">Capital-Based</option>
          </select>
        </div>

        {/* Multiplier */}
        <div>
          <label className="text-sm">Global Lot Multiplier</label>
          <input
            type="number"
            step="0.1"
            value={globalSettings.globalMultiplier}
            onChange={(e) =>
              setGlobalSettings({
                ...globalSettings,
                globalMultiplier: parseFloat(e.target.value),
              })
            }
            className="w-full mt-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {/* Slippage */}
        <div>
          <label className="text-sm">Slippage Limit (%)</label>
          <input
            type="number"
            step="0.1"
            value={globalSettings.globalSlippage}
            onChange={(e) =>
              setGlobalSettings({
                ...globalSettings,
                globalSlippage: parseFloat(e.target.value),
              })
            }
            className="w-full mt-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {/* Spread */}
        <div>
          <label className="text-sm">Spread Limit (%)</label>
          <input
            type="number"
            step="0.1"
            value={globalSettings.spreadLimit}
            onChange={(e) =>
              setGlobalSettings({
                ...globalSettings,
                spreadLimit: parseFloat(e.target.value),
              })
            }
            className="w-full mt-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4">
          <Toggle
            label="Hedge Mode"
            enabled={globalSettings.hedgeMode}
            onClick={() =>
              setGlobalSettings({
                ...globalSettings,
                hedgeMode: !globalSettings.hedgeMode,
              })
            }
          />

          <Toggle
            label="Auto Stop Mode"
            enabled={globalSettings.autoStop}
            onClick={() =>
              setGlobalSettings({
                ...globalSettings,
                autoStop: !globalSettings.autoStop,
              })
            }
          />
        </div>
      </div>

      {/* -------------------------------
          SUBSCRIBER OVERRIDES
      -------------------------------- */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Per-Subscriber Overrides</h2>

        {/* Controls */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input
              placeholder="Search subscribers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm rounded-lg border border-slate-800 bg-slate-900/40">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr className="text-slate-300 text-left">
                <th className="p-3">Subscriber</th>
                <th className="p-3">Broker</th>
                <th className="p-3">Override</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Multiplier</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s) => (
                <tr key={s.id} className="border-b border-slate-800">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.broker}</td>
                  <td className="p-3">
                    {s.overrideEnabled ? (
                      <span className="text-emerald-400">Enabled</span>
                    ) : (
                      <span className="text-slate-400">Default</span>
                    )}
                  </td>
                  <td className="p-3">{s.mode}</td>
                  <td className="p-3">{s.multiplier}×</td>

                  <td className="p-3 text-right">
                    <button
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                      onClick={() => openDrawer(s)}
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-slate-400">Page {page}</span>

          <button
            disabled={paginated.length < itemsPerPage}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && editingUser && (
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 z-50 overflow-y-auto"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            transition={{ duration: 0.3 }}
          >
            <DrawerForm user={editingUser} onSave={saveOverride} onCancel={closeDrawer} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ----------------------------
   TOGGLE COMPONENT
----------------------------- */
const Toggle = ({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
  >
    {enabled ? (
      <ToggleRight size={20} className="text-emerald-400" />
    ) : (
      <ToggleLeft size={20} className="text-slate-500" />
    )}
    <span className="text-sm">{label}</span>
  </button>
);

/* ---------------------------
   DRAWER FORM
---------------------------- */
const DrawerForm = ({
  user,
  onSave,
  onCancel,
}: {
  user: Subscriber;
  onSave: (u: Subscriber) => void;
  onCancel: () => void;
}) => {
  const [state, setState] = useState(user);

  const update = (key: string, val: any) => {
    setState((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <button onClick={onCancel}>
          <X size={22} className="text-slate-400 hover:text-white" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Override toggle */}
        <Toggle
          label="Enable Override"
          enabled={state.overrideEnabled}
          onClick={() => update("overrideEnabled", !state.overrideEnabled)}
        />

        {/* Mode */}
        <div>
          <label className="text-sm">Sizing Mode</label>
          <select
            value={state.mode}
            onChange={(e) => update("mode", e.target.value)}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="multiplier">Lot Multiplier</option>
            <option value="fixed">Fixed Lot</option>
            <option value="capital">Capital Based</option>
          </select>
        </div>

        {/* Multiplier */}
        <div>
          <label className="text-sm">Lot Multiplier</label>
          <input
            type="number"
            step="0.1"
            value={state.multiplier}
            onChange={(e) => update("multiplier", parseFloat(e.target.value))}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Slippage */}
        <div>
          <label className="text-sm">Slippage Limit (%)</label>
          <input
            type="number"
            step="0.1"
            value={state.slippage}
            onChange={(e) => update("slippage", parseFloat(e.target.value))}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Max Lots */}
        <div>
          <label className="text-sm">Max Lots</label>
          <input
            type="number"
            step="1"
            value={state.maxLots}
            onChange={(e) => update("maxLots", parseInt(e.target.value))}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Only Buy / Sell */}
        <div className="flex gap-4">
          <Toggle
            label="Only Buy"
            enabled={state.onlyBuy}
            onClick={() => update("onlyBuy", !state.onlyBuy)}
          />
          <Toggle
            label="Only Sell"
            enabled={state.onlySell}
            onClick={() => update("onlySell", !state.onlySell)}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>

        <button
          onClick={() => onSave(state)}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400"
        >
          Save Settings
        </button>
      </div>
    </>
  );
};

export default FanoutSettingsPage;
