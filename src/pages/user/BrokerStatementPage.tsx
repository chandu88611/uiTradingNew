import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  FileDown,
  Filter,
  BarChart3,
} from "lucide-react";
import { useGetTradesHistoryQuery } from "../../services/trades.api";

/**
 * Standard SEBI/NSE fee calculation (discount broker model — ₹20 flat or 0.03% lower)
 */
function calcFees(symbol: string, exchange: string, action: string, qty: number, price: number) {
  const turnover = qty * price;
  if (turnover <= 0) return { brokerage: 0, stt: 0, exchangeFee: 0, gst: 0 };

  const sym = symbol.toUpperCase();
  const isSell = action.toUpperCase().includes("SELL") || action.toUpperCase().includes("SHORT");
  const isFutures = sym.includes("FUT");
  const isOptions = sym.includes("CE") || sym.includes("PE");
  const isMcx = exchange.toUpperCase() === "MCX";
  const isDelivery = !isFutures && !isOptions && !isMcx &&
    !["NSE_INTRADAY", "BSE_INTRADAY", "MIS", "I"].includes(exchange.toUpperCase());

  // Brokerage: ₹20 flat or 0.03% whichever is lower
  const brokerage = Math.min(20, turnover * 0.0003);

  // STT (Securities Transaction Tax) — charged on sell side for most segments
  let stt = 0;
  if (isDelivery) stt = turnover * 0.001;              // 0.1% both buy+sell (add for sell)
  else if (isFutures && isSell) stt = turnover * 0.0001;      // 0.01% sell side
  else if (isOptions && isSell) stt = price * qty * 0.0005;   // 0.05% on premium (sell)
  else if (isSell && !isDelivery) stt = turnover * 0.00025;   // 0.025% intraday sell

  // Exchange transaction charges (NSE 0.00345%, MCX 0.0026%)
  const exchRate = isMcx ? 0.000026 : 0.0000345;
  const exchangeFee = turnover * exchRate;

  // SEBI charges ₹10/crore
  const sebi = turnover * 0.0000001;

  // GST 18% on (brokerage + exchange charges + SEBI)
  const gst = (brokerage + exchangeFee + sebi) * 0.18;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    brokerage: round2(brokerage),
    stt: round2(stt),
    exchangeFee: round2(exchangeFee + sebi),
    gst: round2(gst),
  };
}

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

const BrokerStatementPage: React.FC = () => {
  const { data: historyData, isLoading } = useGetTradesHistoryQuery({ start: 0, count: 50 });

  const data: StatementRow[] = useMemo(() => {
    const arr = historyData?.data ?? historyData;
    if (!Array.isArray(arr)) return [];
    return arr.map((t: any) => ({
      id: String(t.id ?? ""),
      date: (t.signalTime ?? t.createdAt ?? "").slice(0, 10),
      symbol: String(t.symbol ?? ""),
      qty: Number(t.volume ?? t.qty ?? 0),
      buy: String(t.action ?? t.side ?? "").toLowerCase().includes("sell") ? 0 : Number(t.price ?? 0),
      sell: String(t.action ?? t.side ?? "").toLowerCase().includes("sell") ? Number(t.price ?? 0) : 0,
      turnover: Number(t.price ?? 0) * Number(t.volume ?? t.qty ?? 0),
      pnl: Number(t.pnl ?? 0),
      ...calcFees(
        String(t.symbol ?? ""),
        String(t.exchange ?? "NSE"),
        String(t.action ?? t.side ?? "BUY"),
        Number(t.volume ?? t.qty ?? 0),
        Number(t.price ?? 0),
      ),
    }));
  }, [historyData]);

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
            {isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400 text-sm">Loading trades...</td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400 text-sm">No trade records found.</td>
              </tr>
            )}
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
