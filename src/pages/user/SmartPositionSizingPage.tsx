import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sliders,
  TrendingUp,
  Activity,
  Gauge,
  Calculator,
  Info,
} from "lucide-react";

const SmartPositionSizingPage = () => {
  const [settings, setSettings] = useState({
    mode: "fixed-percent",
    riskPercent: 1,
    maxLots: 20,
    atrMultiplier: 1.2,
    atrBaseline: 25,
    capitalAllocation: 20,
    volatilityMode: "adaptive",
    confidenceEnabled: true,
    confidenceWeight: 70,
  });

  const update = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Smart Position Sizing</h1>
        <p className="text-slate-400 text-sm mt-1">
          Institutional-grade dynamic lot sizing engine to maximize profits and reduce risk.
        </p>
      </div>

      {/* Main container */}
      <div className="space-y-6">

        {/* --- SECTION 1: Sizing Mode Selection --- */}
        <Section title="Position Sizing Model" icon={<Sliders size={18} />}>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { id: "fixed-percent", label: "Fixed % Risk" },
              { id: "atr-based", label: "ATR Based" },
              { id: "capital-allocation", label: "Capital Allocation %" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => update("mode", m.id)}
                className={`p-4 rounded-xl border text-left transition ${
                  settings.mode === m.id
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <h3 className="font-semibold">{m.label}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {m.id === "fixed-percent"
                    ? "Risk a fixed % of capital per trade"
                    : m.id === "atr-based"
                    ? "Adjust size based on volatility (ATR)"
                    : "Allocate a % of total capital"}
                </p>
              </button>
            ))}
          </div>
        </Section>

        {/* --- SECTION 2: Fixed % Risk Settings --- */}
        {settings.mode === "fixed-percent" && (
          <Section title="Fixed % Risk Settings" icon={<Calculator size={18} />}>
            <NumberInput
              label="Risk per trade (%)"
              value={settings.riskPercent}
              onChange={(v:any) => update("riskPercent", v)}
            />

            <NumberInput
              label="Maximum Lots"
              value={settings.maxLots}
              onChange={(v:any) => update("maxLots", v)}
            />
          </Section>
        )}

        {/* --- SECTION 3: ATR Based Settings --- */}
        {settings.mode === "atr-based" && (
          <Section title="ATR-Based Sizing" icon={<Activity size={18} />}>
            <NumberInput
              label="ATR Multiplier"
              value={settings.atrMultiplier}
              onChange={(v:any) => update("atrMultiplier", v)}
            />
            <NumberInput
              label="ATR Baseline"
              value={settings.atrBaseline}
              onChange={(v:any) => update("atrBaseline", v)}
            />
          </Section>
        )}

        {/* --- SECTION 4: Capital Allocation % --- */}
        {settings.mode === "capital-allocation" && (
          <Section title="Capital Allocation Strategy" icon={<Gauge size={18} />}>
            <NumberInput
              label="Capital Allocation (%)"
              value={settings.capitalAllocation}
              onChange={(v:any) => update("capitalAllocation", v)}
            />
          </Section>
        )}

        {/* --- SECTION 5: Volatility Mode --- */}
        <Section title="Volatility Mode" icon={<TrendingUp size={18} />}>
          <select
            className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 mt-2"
            value={settings.volatilityMode}
            onChange={(e) => update("volatilityMode", e.target.value)}
          >
            <option value="adaptive">Adaptive Mode (Recommended)</option>
            <option value="fixed">Fixed Lot (No scaling)</option>
          </select>
        </Section>

        {/* --- SECTION 6: Confidence Based --- */}
        <Section title="AI Confidence-Based Scaling" icon={<Info size={18} />}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.confidenceEnabled}
              onChange={(e) => update("confidenceEnabled", e.target.checked)}
            />
            <span className="text-sm">Enable Confidence-Based Position Scaling</span>
          </div>

          {settings.confidenceEnabled && (
            <NumberInput
              label="Confidence Weight (%)"
              value={settings.confidenceWeight}
              onChange={(v:any) => update("confidenceWeight", v)}
            />
          )}
        </Section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-emerald-500 text-slate-900 font-semibold rounded-xl hover:bg-emerald-400">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4"
  >
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-semibold text-lg">{title}</h2>
    </div>
    <div className="pt-2">{children}</div>
  </motion.div>
);

const NumberInput = ({ label, value, onChange }: any) => (
  <div className="mt-3">
    <label className="text-sm text-slate-300">{label}</label>
    <input
      type="number"
      className="mt-1 w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

export default SmartPositionSizingPage;
