import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetTradesHistoryQuery } from "../../services/trades.api";

type Trade = {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  avgPrice: number;
  status: "completed" | "rejected" | "pending";
  broker: string;
  timestamp: string;
  pnl: number;
};

const statusColors = {
  completed: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30",
  rejected: "text-red-400 bg-red-500/10 border border-red-500/30",
  pending: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30",
};

const TradeHistoryPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [broker, setBroker] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const itemsPerPage = 8;
  const { data: historyData, isLoading, isFetching } = useGetTradesHistoryQuery({ start: (page - 1) * itemsPerPage, count: itemsPerPage });

  const rawTrades = useMemo(() => {
    const arr = historyData?.data ?? historyData;
    return Array.isArray(arr) ? arr : [];
  }, [historyData]);

  const trades: Trade[] = useMemo(() => rawTrades.map((t: any) => ({
    id: String(t.id ?? ""),
    symbol: String(t.symbol ?? ""),
    type: String(t.action ?? t.side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
    quantity: Number(t.volume ?? t.qty ?? t.quantity ?? 0),
    avgPrice: Number(t.price ?? t.avgPrice ?? 0),
    status: (String(t.status ?? "").toLowerCase().includes("complet") ? "completed" : String(t.status ?? "").toLowerCase().includes("reject") ? "rejected" : "pending") as "completed" | "rejected" | "pending",
    broker: String(t.broker ?? t.brokerCode ?? ""),
    timestamp: t.signalTime ?? t.openedAt ?? t.createdAt ?? "",
    pnl: Number(t.pnl ?? 0),
  })), [rawTrades]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      return (
        (broker === "all" || t.broker === broker) &&
        (type === "all" || t.type === type) &&
        t.symbol.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [trades, search, broker, type]);

  const exportCSV = () => {
    const csv = filtered
      .map(
        (t) =>
          `${t.id},${t.symbol},${t.type},${t.quantity},${t.avgPrice},${t.broker},${t.timestamp},${t.status},${t.pnl}`
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "trade_history.csv";
    a.click();
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Trade History</h1>
          <p className="text-slate-400 text-sm">
            View all executed, pending, and rejected trades.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl hover:bg-emerald-400 transition"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 focus:border-emerald-400 text-sm"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Broker filter */}
        <select
          className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full lg:w-40"
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
        >
          <option value="all">All Brokers</option>
          <option value="Zerodha">Zerodha</option>
          <option value="Dhan">Dhan</option>
          <option value="Zebu">Zebu</option>
        </select>

        {/* Type filter */}
        <select
          className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full lg:w-40"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>

        {/* Date filter (placeholder) */}
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg hover:bg-slate-800 text-sm">
          <Calendar size={16} /> Date Range
        </button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-x-auto"
      >
        <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl">
          <thead className="bg-slate-900/70 border-b border-slate-800">
            <tr className="text-left text-slate-300">
              <th className="p-3">Symbol</th>
              <th className="p-3">Type</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Avg Price</th>
              <th className="p-3">Broker</th>
              <th className="p-3">Time</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">P/L</th>
            </tr>
          </thead>

          <tbody>
            {(isLoading || isFetching) ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">Loading trades…</td>
              </tr>
            ) : !isLoading && trades.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">No trades found.</td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="p-3">{t.symbol}</td>
                  <td className="p-3">
                    {t.type === "BUY" ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ArrowUpRight size={16} /> BUY
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400">
                        <ArrowDownRight size={16} /> SELL
                      </span>
                    )}
                  </td>
                  <td className="p-3">{t.quantity}</td>
                  <td className="p-3">₹{t.avgPrice}</td>
                  <td className="p-3">{t.broker}</td>
                  <td className="p-3">{t.timestamp}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${statusColors[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}
                    >
                      ₹{t.pnl}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

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
          disabled={rawTrades.length < itemsPerPage}
          onClick={() => setPage((p) => p + 1)}
          className="p-2 rounded-lg disabled:opacity-40 bg-slate-800 hover:bg-slate-700"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default TradeHistoryPage;
