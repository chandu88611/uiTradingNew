import React, { useMemo, useState } from "react";
import {
  CheckCircle,
  XCircle,
  RefreshCcw,
  Plus,
  Trash2,
  ArrowRight,
  Grid2x2,
  List,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* -------------------- Types -------------------- */
type Broker = "zerodha" | "dhan" | "angel" | "upstox";

interface TradingAccount {
  id: string;
  broker: Broker;
  name: string;
  clientId: string;
  status: "connected" | "disconnected" | "expired";
  balance: number;
  lastSync: string;
}

/* -------------------- Mock Data -------------------- */
const MOCK_ACCOUNTS: TradingAccount[] = [
  {
    id: "1",
    broker: "zerodha",
    name: "Main Equity",
    clientId: "ZR12345",
    status: "connected",
    balance: 152430.52,
    lastSync: "2 mins ago",
  },
  {
    id: "2",
    broker: "dhan",
    name: "Scalping Account",
    clientId: "DH99887",
    status: "expired",
    balance: 45000.0,
    lastSync: "Session expired",
  },
  {
    id: "3",
    broker: "angel",
    name: "Options Auto",
    clientId: "AG77112",
    status: "disconnected",
    balance: 72500.1,
    lastSync: "10 hours ago",
  },
  {
    id: "4",
    broker: "upstox",
    name: "Swing Account",
    clientId: "UP55991",
    status: "connected",
    balance: 98900,
    lastSync: "Just now",
  },
];

const brokerLogos: Record<Broker, string> = {
  zerodha: "/brokers/zerodha.png",
  dhan: "/brokers/dhan.png",
  angel: "/brokers/angel.png",
  upstox: "/brokers/upstox.png",
};

/* -------------------- Component -------------------- */
const TradingAccountsPage: React.FC = () => {
  const [accounts, setAccounts] =
    useState<TradingAccount[]>(MOCK_ACCOUNTS);

  const [openModal, setOpenModal] = useState(false);
  const [selectedBroker, setSelectedBroker] =
    useState<Broker>("zerodha");

  /* Search + Filters */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<TradingAccount["status"] | "all">("all");

  /* View Mode */
  const [viewMode, setViewMode] = useState<"grid" | "table">(
    "grid"
  );

  /* Pagination */
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  /* -------------------- Actions -------------------- */
  const removeAccount = (id: string) =>
    setAccounts((prev) => prev.filter((a) => a.id !== id));

  const reconnect = (id: string) =>
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "connected", lastSync: "Just now" }
          : a
      )
    );

  const addAccount = () => {
    const newAcc: TradingAccount = {
      id: Date.now().toString(),
      broker: selectedBroker,
      name: selectedBroker.toUpperCase() + " Account",
      clientId:
        selectedBroker.slice(0, 2).toUpperCase() +
        Math.floor(Math.random() * 99999),
      status: "connected",
      balance: 0,
      lastSync: "Just now",
    };

    setAccounts((prev) => [...prev, newAcc]);
    setOpenModal(false);
  };

  /* -------------------- Helpers -------------------- */
  const statusBadge = (status: TradingAccount["status"]) => {
    switch (status) {
      case "connected":
        return (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <CheckCircle size={14} /> Connected
          </span>
        );
      case "disconnected":
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-xs">
            <XCircle size={14} /> Disconnected
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1 text-rose-400 text-xs">
            <XCircle size={14} /> Expired
          </span>
        );
    }
  };

  /* -------------------- Filter + Search + Paginate -------------------- */
  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.clientId.toLowerCase().includes(search.toLowerCase()) ||
        acc.broker.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || acc.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, accounts]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="px-4 pt-16  md:pt-28 sm:px-6 bg-slate-950 lg:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* -------------------- Top Section -------------------- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Trading Accounts
            </h1>
            <p className="text-sm text-slate-400">
              Connect Indian broker accounts to enable auto-trading.
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl font-medium shadow-[0_0_18px_rgba(16,185,129,0.4)] transition"
          >
            <Plus size={18} /> Add Account
          </button>
        </div>

        {/* -------------------- Filters -------------------- */}
        <div className="mt-6 flex flex-wrap items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search account / broker / client ID…"
              className="bg-transparent outline-none text-sm w-full"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
            <option value="expired">Expired</option>
          </select>

          {/* View Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl border ${
                viewMode === "grid"
                  ? "border-emerald-500 bg-emerald-500/20"
                  : "border-slate-700"
              }`}
            >
              <Grid2x2 size={16} />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl border ${
                viewMode === "table"
                  ? "border-emerald-500 bg-emerald-500/20"
                  : "border-slate-700"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* -------------------- GRID VIEW -------------------- */}
        {viewMode === "grid" && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((acc) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={brokerLogos[acc.broker]}
                      className="h-8 w-8 rounded-lg"
                      alt=""
                    />
                    <div>
                      <h2 className="text-sm font-semibold">{acc.name}</h2>
                      <p className="text-xs text-slate-400">
                        {acc.clientId}
                      </p>
                    </div>
                  </div>

                  {statusBadge(acc.status)}
                </div>

                {/* Balance */}
                <div className="mt-4">
                  <p className="text-[11px] text-slate-400">Balance</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    ₹ {acc.balance.toLocaleString("en-IN")}
                  </p>
                </div>

                <p className="text-[12px] text-slate-400 mt-1">
                  Last sync: {acc.lastSync}
                </p>

                {/* ACTIONS */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => reconnect(acc.id)}
                    className="flex items-center gap-1 text-[13px] text-emerald-400 hover:text-emerald-300"
                  >
                    <RefreshCcw size={14} /> Refresh
                  </button>

                  <button
                    onClick={() => removeAccount(acc.id)}
                    className="flex items-center gap-1 text-[13px] text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* -------------------- TABLE VIEW -------------------- */}
        {viewMode === "table" && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/70 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left">Broker</th>
                  <th className="px-4 py-3 text-left">Client ID</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Last Sync</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((acc) => (
                  <tr
                    key={acc.id}
                    className="border-b border-slate-800/60 hover:bg-slate-900/50"
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <img
                        src={brokerLogos[acc.broker]}
                        className="h-6 w-6 rounded"
                      />
                      {acc.name}
                    </td>

                    <td className="px-4 py-3">{acc.clientId}</td>

                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      ₹ {acc.balance.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3">{statusBadge(acc.status)}</td>

                    <td className="px-4 py-3">{acc.lastSync}</td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => reconnect(acc.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <RefreshCcw size={16} />
                        </button>

                        <button
                          onClick={() => removeAccount(acc.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* -------------------- Pagination -------------------- */}
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-xl border border-slate-700 disabled:opacity-40 hover:border-slate-500"
          >
            <ChevronLeft size={16} />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-2 rounded-xl text-sm ${
                page === i + 1
                  ? "bg-emerald-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : "bg-slate-900 border border-slate-700 hover:border-slate-500"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-xl border border-slate-700 disabled:opacity-40 hover:border-slate-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* -------------------- Add Account Modal -------------------- */}
      <AnimatePresence>
        {openModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-slate-100">
                Add Broker Account
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Choose your broker to begin integration.
              </p>

              {/* Broker list */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Object.entries(brokerLogos).map(([key, logo]) => {
                  const b = key as Broker;
                  return (
                    <button
                      key={b}
                      onClick={() => setSelectedBroker(b)}
                      className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition ${
                        selectedBroker === b
                          ? "border-emerald-500 bg-emerald-500/20"
                          : "border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      <img src={logo} className="h-6 w-6 rounded" />
                      <span className="text-sm capitalize">{b}</span>
                    </button>
                  );
                })}
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={addAccount}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl font-medium shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingAccountsPage;
