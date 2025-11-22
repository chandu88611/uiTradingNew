// src/pages/user/BrokerDashboardPage.tsx

import React, { useState } from "react";
import {
  Cable,
  CheckCircle,
  XCircle,
  RefreshCw,
  Link,
  Clock,
  Power,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

type BrokerStatus = "connected" | "expired" | "disconnected";

type Broker = {
  id: string;
  name: string;
  logo: string;
  status: BrokerStatus;
  lastUpdated: string;
  accountId?: string;
};

const initialBrokers: Broker[] = [
  {
    id: "zerodha",
    name: "Zerodha",
    logo: "/brokers/zerodha.png",
    status: "connected",
    lastUpdated: "10 min ago",
    accountId: "ZU10923",
  },
  {
    id: "zebu",
    name: "Zebu",
    logo: "/brokers/zebu.png",
    status: "expired",
    lastUpdated: "2 hours ago",
  },
  {
    id: "dhan",
    name: "Dhan",
    logo: "/brokers/dhan.png",
    status: "disconnected",
    lastUpdated: "-",
  },
];

const statusColors = {
  connected: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  expired: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  disconnected: "bg-red-500/20 text-red-400 border-red-500/40",
};

const BrokerDashboardPage: React.FC = () => {
  const [brokers, setBrokers] = useState(initialBrokers);

  const handleConnect = (id: string) => {
    window.location.href = `/user/brokers/connect/${id}`;
  };

  const handleReconnect = (id: string) => {
    window.location.href = `/user/brokers/connect/${id}?reconnect=true`;
  };

  const handleDisconnect = (id: string) => {
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "disconnected", accountId: undefined } : b
      )
    );
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
