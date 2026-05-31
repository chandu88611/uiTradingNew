// src/pages/user/BrokerDashboardPage.tsx

import React, { useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Link,
  Clock,
  Power,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { useListMyTradingAccountsQuery } from "../../services/tradingAccounts.api";

type BrokerStatus = "connected" | "expired" | "disconnected";

type Broker = {
  id: string;
  name: string;
  logo: string;
  status: BrokerStatus;
  lastUpdated: string;
  accountId?: string;
};

/** Static catalogue of supported brokers (names/logos are config, not mock data). */
const BROKER_CATALOG: Array<{ id: string; name: string; logo: string; codes: string[] }> = [
  { id: "zerodha", name: "Zerodha", logo: "/brokers/zerodha.png", codes: ["KITE", "ZERODHA"] },
  { id: "zebu",    name: "Zebu",    logo: "/brokers/zebu.png",    codes: ["ZEBU", "SHOONYA"] },
  { id: "dhan",    name: "Dhan",    logo: "/brokers/dhan.png",    codes: ["DHAN"] },
];

const statusColors = {
  connected: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  expired: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  disconnected: "bg-red-500/20 text-red-400 border-red-500/40",
};

function timeAgo(iso?: string | null): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "-";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const BrokerDashboardPage: React.FC = () => {
  const { data: accounts = [], isLoading } = useListMyTradingAccountsQuery();

  // Derive each catalogue broker's real connection status from the user's accounts.
  const brokers: Broker[] = useMemo(() => {
    return BROKER_CATALOG.map((cat) => {
      const acc = (accounts as any[]).find((a: any) =>
        cat.codes.includes(String(a.broker ?? a.brokerCode ?? "").toUpperCase())
      );
      const status: BrokerStatus = acc
        ? acc.status === "verified"
          ? "connected"
          : "expired"
        : "disconnected";
      return {
        id: cat.id,
        name: cat.name,
        logo: cat.logo,
        status,
        lastUpdated: timeAgo(acc?.updatedAt ?? acc?.lastVerifiedAt),
        accountId: acc?.externalAccountId ?? acc?.accountId ?? undefined,
      };
    });
  }, [accounts]);

  const handleConnect = (id: string) => {
    window.location.href = `/user/brokers/connect/${id}`;
  };

  const handleReconnect = (id: string) => {
    window.location.href = `/user/brokers/connect/${id}?reconnect=true`;
  };

  const handleDisconnect = (id: string) => {
    // Disconnect is managed on the broker's manage page (real account mutation).
    window.location.href = `/user/brokers/manage/${id}`;
  };

  const handleManage = (id: string) => {
    window.location.href = `/user/brokers/manage/${id}`;
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 p-6 bg-slate-950 text-slate-100 space-y-8">
      
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-semibold">Broker Connections</h1>
        <p className="text-slate-400 text-sm mt-1">
          Connect your trading broker accounts to enable automated & copy trading.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-400">Loading broker connections…</p>
      )}

      {/* Broker Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {brokers.map((broker) => (
          <motion.div
            key={broker.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative"
          >
            {/* Status Badge */}
            <div
              className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs border ${statusColors[broker.status]}`}
            >
              {broker.status}
            </div>

            {/* Logo + Title */}
            <div className="flex items-center gap-4">
              <img
                src={broker.logo}
                alt={broker.name}
                className="h-12 w-12 rounded-lg object-contain bg-slate-800 p-2"
              />
              <div>
                <h3 className="text-lg font-semibold">{broker.name}</h3>
                <p className="text-slate-400 text-xs">
                  Last updated: {broker.lastUpdated}
                </p>
              </div>
            </div>

            {/* Account Info */}
            {broker.accountId && (
              <div className="mt-4 text-sm">
                <p className="text-slate-400">Connected Account</p>
                <p className="text-emerald-400 font-semibold">
                  {broker.accountId}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-between">

              {/* Status Icon */}
              {broker.status === "connected" && (
                <CheckCircle className="text-emerald-400" size={20} />
              )}
              {broker.status === "expired" && (
                <Clock className="text-yellow-400" size={20} />
              )}
              {broker.status === "disconnected" && (
                <XCircle className="text-red-400" size={20} />
              )}

              <div className="flex gap-2">

                {/* MANAGE — only when connected OR expired */}
                {(broker.status === "connected" ||
                  broker.status === "expired") && (
                  <button
                    onClick={() => handleManage(broker.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Settings size={14} /> Manage
                  </button>
                )}

                {/* CONNECT */}
                {broker.status === "disconnected" && (
                  <button
                    onClick={() => handleConnect(broker.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Link size={14} /> Connect
                  </button>
                )}

                {/* RECONNECT */}
                {broker.status === "expired" && (
                  <button
                    onClick={() => handleReconnect(broker.id)}
                    className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-xs flex items-center gap-1"
                  >
                    <RefreshCw size={14} /> Reconnect
                  </button>
                )}

                {/* DISCONNECT */}
                {broker.status === "connected" && (
                  <button
                    onClick={() => handleDisconnect(broker.id)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-1"
                  >
                    <Power size={14} /> Disconnect
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BrokerDashboardPage;
