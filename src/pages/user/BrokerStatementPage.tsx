import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  FileDown,
  Filter,
  BarChart3,
} from "lucide-react";

type StatementRow = {
  id: string;
  date: string;
  symbol: string;
  qty: number;
  buy: number;
  sell: number;
  turnover: number;
  pnl: number;
  brokerage: number;
  stt: number;
  gst: number;
  exchangeFee: number;
};

const mockData: StatementRow[] = [
  {
    id: "1",
    date: "2025-02-04",
    symbol: "BANKNIFTY24FEBFUT",
    qty: 25,
    buy: 49200,
    sell: 49320,
    turnover: 985500,
    pnl: 3000,
    brokerage: 40,
    stt: 18,
    gst: 7.2,
    exchangeFee: 4,
  },
  {
    id: "2",
    date: "2025-02-04",
    symbol: "NIFTY24FEBFUT",
    qty: 50,
    buy: 22150,
    sell: 22110,
    turnover: 1107500,
    pnl: -2000,
    brokerage: 40,
    stt: 15,
    gst: 7.2,
    exchangeFee: 4,
  },
];

const BrokerStatementPage: React.FC = () => {
  const [data] = useState(mockData);

  const totals = data.reduce(
    (acc, row) => {
      acc.pnl += row.pnl;
      acc.brokerage += row.brokerage;
      acc.stt += row.stt;
      acc.gst += row.gst;
      acc.exchangeFee += row.exchangeFee;
      acc.turnover += row.turnover;
      return acc;
    },
    {
      pnl: 0,
      brokerage: 0,
      stt: 0,
      gst: 0,
      exchangeFee: 0,
      turnover: 0,
    }
  );

  const netCharges = totals.brokerage + totals.stt + totals.gst + totals.exchangeFee;
  const netPnl = totals.pnl - netCharges;

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100  space-y-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Broker Statement Summary</h1>
        <p className="text-slate-400 text-sm mt-1">
          View P&L, charges, turnover and export your report.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Date Range */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="date"
              className="pl-10 pr-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm focus:border-emerald-400"
            />
          </div>

          <span className="text-slate-400">to</span>

          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="date"
              className="pl-10 pr-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm focus:border-emerald-400"
            />
          </div>

          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm">
            <Filter size={16} /> Apply
          </button>
        </div>

        {/* Export */}
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg flex items-center gap-2 text-sm">
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* PNL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-slate-400">Gross P&L</h3>
            {totals.pnl >= 0 ? (
              <TrendingUp className="text-emerald-400" />
            ) : (
              <TrendingDown className="text-red-400" />
            )}
          </div>
          <h2
            className={`text-2xl font-bold mt-2 ${
              totals.pnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            ₹{totals.pnl.toFixed(2)}
          </h2>
        </motion.div>

        {/* NET CHARGES */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-slate-400">Total Charges</h3>
            <BarChart3 className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-400 mt-2">
            ₹{netCharges.toFixed(2)}
          </h2>
        </motion.div>

        {/* NET PNL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-slate-400">Net P&L</h3>
            {netPnl >= 0 ? (
              <TrendingUp className="text-emerald-400" />
            ) : (
              <TrendingDown className="text-red-400" />
            )}
          </div>
          <h2
            className={`text-2xl font-bold mt-2 ${
              netPnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            ₹{netPnl.toFixed(2)}
          </h2>
        </motion.div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full bg-slate-900/60 border border-slate-800 rounded-xl">
          <thead className="bg-slate-900 border-b border-slate-800">
            <tr className="text-left text-slate-300 text-sm">
              <th className="p-3">Date</th>
              <th className="p-3">Symbol</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Buy</th>
              <th className="p-3">Sell</th>
              <th className="p-3">Turnover</th>
              <th className="p-3">P/L</th>
              <th className="p-3">Charges</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => {
              const totalCharges = row.brokerage + row.stt + row.gst + row.exchangeFee;

              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-800 text-sm hover:bg-slate-800/40"
                >
                  <td className="p-3">{row.date}</td>
                  <td className="p-3 font-medium">{row.symbol}</td>
                  <td className="p-3">{row.qty}</td>
                  <td className="p-3">₹{row.buy}</td>
                  <td className="p-3">₹{row.sell}</td>
                  <td className="p-3">₹{row.turnover.toFixed(0)}</td>

                  <td
                    className={`p-3 font-semibold ${
                      row.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    ₹{row.pnl.toFixed(2)}
                  </td>

                  <td className="p-3 text-yellow-400 font-semibold">
                    ₹{totalCharges.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BrokerStatementPage;
