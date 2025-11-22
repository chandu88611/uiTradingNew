import React, { useState } from "react";
import {
  PlayCircle,
  PauseCircle,
  Signal,
  Server,
  Settings,
  Users,
  Gauge,
  Zap,
  RotateCcw,
  LayoutGrid,
  Table,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const masterAccounts = [
  {
    id: "m1",
    name: "Master Account – Equity",
    broker: "Zerodha",
    accountId: "ZR88991",
    balance: 425000,
    status: "connected",
  },
  {
    id: "m2",
    name: "Master Account – Options",
    broker: "Dhan",
    accountId: "DH22314",
    balance: 310000,
    status: "connected",
  },
];

const CopyTradingControlPage: React.FC = () => {
  const [selectedMaster, setSelectedMaster] = useState(masterAccounts[0]);
  const [copyLive, setCopyLive] = useState(false);
  const [lotMultiplier, setLotMultiplier] = useState(1.0);
  const [riskScaling, setRiskScaling] = useState(50);
  const [slippageLimit, setSlippageLimit] = useState(2);

  const subscribers = [
    { id: "s1", name: "Rahul", capital: 150000, status: "copying" },
    { id: "s2", name: "Priya", capital: 75000, status: "copying" },
    { id: "s3", name: "Karan", capital: 220000, status: "paused" },
    { id: "s4", name: "Vikas", capital: 95000, status: "copying" },
  ];

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 4;

  const paginated = subscribers.slice(
    (page - 1) * perPage,
    (page - 1) * perPage + perPage
  );

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Copy Trading Control</h1>
        <p className="text-sm text-slate-400">
          Manage master accounts, fanout settings and real-time execution behaviour.
        </p>
      </div>

      {/* MASTER ACCOUNT SELECTION */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Server size={20} className="text-emerald-400" /> Master Account
        </h2>

        <select
          className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 focus:border-emerald-400 w-full"
          value={selectedMaster.id}
          onChange={(e) =>
            setSelectedMaster(
              masterAccounts.find((m) => m.id === e.target.value)!
            )
          }
        >
          {masterAccounts.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.broker}
            </option>
          ))}
        </select>

        <div className="grid md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-sm text-slate-400">Broker</p>
            <p className="text-lg font-semibold">{selectedMaster.broker}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-sm text-slate-400">Account ID</p>
            <p className="text-lg font-semibold">{selectedMaster.accountId}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-sm text-slate-400">Balance</p>
            <p className="text-lg font-semibold">
              ₹{selectedMaster.balance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* COPY CONTROL PANEL */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap size={20} className="text-emerald-400" /> Copy Trading Mode
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCopyLive(true)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition ${
              copyLive
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <PlayCircle size={20} /> Live
          </button>

          <button
            onClick={() => setCopyLive(false)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition ${
              !copyLive
                ? "bg-rose-500 text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <PauseCircle size={20} /> Off
          </button>

          <button className="ml-auto flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">
            <RotateCcw size={18} /> Reconnect Master
          </button>
        </div>

        {/* FANOUT SETTINGS */}
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          <div>
            <label className="text-sm">Lot Multiplier</label>
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              value={lotMultiplier}
              onChange={(e) => setLotMultiplier(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm">Risk Scaling (%)</label>
            <input
              type="number"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              value={riskScaling}
              onChange={(e) => setRiskScaling(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm">Slippage Limit (%)</label>
            <input
              type="number"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              value={slippageLimit}
              onChange={(e) => setSlippageLimit(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* SUBSCRIBER STATUS */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users size={20} className="text-emerald-400" /> Subscriber Status
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-sm text-slate-400">Total Subscribers</p>
            <p className="text-xl font-bold">{subscribers.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-sm text-slate-400">Active Copying</p>
            <p className="text-xl font-bold">
              {subscribers.filter((s) => s.status === "copying").length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-sm text-slate-400">Paused</p>
            <p className="text-xl font-bold">
              {subscribers.filter((s) => s.status === "paused").length}
            </p>
          </div>
        </div>

        {/* Subscriber Table */}
        <div className="overflow-x-auto pt-4">
          <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl text-sm">
            <thead className="bg-slate-900/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Capital</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">₹{s.capital.toLocaleString()}</td>
                  <td className="p-3">
                    {s.status === "copying" ? (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs">
                        Copying
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-xs">
                        Paused
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
              disabled={paginated.length < perPage}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg disabled:opacity-40 bg-slate-800 hover:bg-slate-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyTradingControlPage;
