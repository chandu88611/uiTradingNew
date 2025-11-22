import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ChevronDown,
  Activity,
  AlertTriangle,
  Clock,
  TrendingDown,
  BarChart2,
  Save,
  CheckCircle2,
} from "lucide-react";

const RiskManagementPage: React.FC = () => {
  const [open, setOpen] = useState<string | null>("portfolio");

  const toggle = (sec: string) => {
    setOpen(open === sec ? null : sec);
  };

  const sectionAnim = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: "auto", opacity: 1 },
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 p-6 text-slate-100 space-y-8">
      {/* ---------------- Header ---------------- */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Risk Management Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure risk rules, circuit breakers, and auto-protection systems
          for your trading.
        </p>
      </div>

      {/* ---------------- Sections ---------------- */}

      {/* 1) PORTFOLIO LEVEL RISK */}
      <RiskSection
        id="portfolio"
        title="Portfolio-Level Protection"
        icon={<Shield size={18} />}
        open={open}
        toggle={toggle}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <RiskInput label="Max Daily Loss (₹)">
            <input
              type="number"
              className="input"
              placeholder="Eg: 5000"
            />
          </RiskInput>

          <RiskInput label="Max Daily Profit (₹)">
            <input type="number" className="input" placeholder="Eg: 8000" />
          </RiskInput>

          <RiskInput label="Max Trades Per Day">
            <input type="number" className="input" placeholder="Eg: 20" />
          </RiskInput>

          <RiskInput label="Max Open Positions">
            <input type="number" className="input" placeholder="Eg: 5" />
          </RiskInput>
        </div>
      </RiskSection>

      {/* 2) STRATEGY LEVEL */}
      <RiskSection
        id="strategy"
        title="Strategy-Level Rules"
        icon={<Activity size={18} />}
        open={open}
        toggle={toggle}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <RiskInput label="Drawdown Limit (%)">
            <input type="number" className="input" placeholder="Eg: 10%" />
          </RiskInput>

          <RiskInput label="Max Loss Per Trade (₹)">
            <input type="number" className="input" placeholder="Eg: 1000" />
          </RiskInput>

          <RiskInput label="Max Profit Per Trade (₹)">
            <input type="number" className="input" placeholder="Eg: 2000" />
          </RiskInput>

          <RiskInput label="Cooldown After Loss (Minutes)">
            <input type="number" className="input" placeholder="Eg: 15" />
          </RiskInput>
        </div>
      </RiskSection>

      {/* 3) CIRCUIT BREAKERS */}
      <RiskSection
        id="circuit"
        title="Circuit Breakers"
        icon={<AlertTriangle size={18} />}
        open={open}
        toggle={toggle}
      >
        <div className="space-y-4">

          <RiskToggle
            title="Auto-Pause Trading on Consecutive Losses"
            desc="If hit, Algo will stop trading until manually restarted."
          />

          <RiskInput label="Allowed Consecutive Losses">
            <input type="number" className="input" placeholder="Eg: 3" />
          </RiskInput>

          <RiskToggle
            title="Auto-close All Positions on Sharp Drawdown"
            desc="System auto squares off all positions when threshold is breached."
          />

          <RiskInput label="Drawdown Trigger (%)">
            <input type="number" className="input" placeholder="Eg: 5%" />
          </RiskInput>
        </div>
      </RiskSection>

      {/* 4) TIME-BASED RULES */}
      <RiskSection
        id="time"
        title="Time-Based Restrictions"
        icon={<Clock size={18} />}
        open={open}
        toggle={toggle}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <RiskInput label="No Trading After Time">
            <input type="time" className="input" />
          </RiskInput>

          <RiskInput label="Restrict Trading Window">
            <div className="flex gap-2">
              <input type="time" className="input" />
              <input type="time" className="input" />
            </div>
          </RiskInput>

          <RiskToggle
            title="Allow Only First Trade of The Day"
            desc="Only the first signal will execute."
          />
        </div>
      </RiskSection>

      {/* 5) AUTO-RECOVERY */}
      <RiskSection
        id="recovery"
        title="Auto-Recovery System"
        icon={<TrendingDown size={18} />}
        open={open}
        toggle={toggle}
      >
        <div className="space-y-4">
          <RiskToggle
            title="Enable Auto-Recovery"
            desc="System attempts safe re-entry once drawdown stabilizes."
          />

          <RiskInput label="Recovery Cooldown (Minutes)">
            <input type="number" className="input" placeholder="Eg: 20" />
          </RiskInput>

          <RiskInput label="Recovery Scaling (%)">
            <input type="number" className="input" placeholder="Eg: 50%" />
          </RiskInput>
        </div>
      </RiskSection>

      {/* 6) ANALYTICS */}
      <RiskSection
        id="analytics"
        title="Risk Analytics"
        icon={<BarChart2 size={18} />}
        open={open}
        toggle={toggle}
      >
        <div className="grid md:grid-cols-3 gap-4">
          <RiskStat title="Today's Drawdown" value="-1.2%" color="text-rose-400" />
          <RiskStat title="Max Allowed DD" value="10%" />
          <RiskStat title="Remaining Loss Buffer" value="₹3,800" />
        </div>
      </RiskSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl px-5 py-2 font-semibold">
          <Save size={18} />
          Save All Settings
        </button>
      </div>
    </div>
  );
};

/* ---------------- Helper Components ---------------- */

const RiskSection = ({
  id,
  title,
  icon,
  open,
  toggle,
  children,
}: any) => {
  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800">
      {/* Section Header */}
      <button
        onClick={() => toggle(id)}
        className="flex justify-between items-center w-full px-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown
          className={`transition-transform ${
            open === id ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {open === id && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { height: 0, opacity: 0 },
              visible: { height: "auto", opacity: 1 },
            }}
            className="overflow-hidden px-4 pb-4"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RiskInput = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-sm text-slate-300">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

const RiskToggle = ({ title, desc }: any) => (
  <div className="flex items-start gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
    <input type="checkbox" className="mt-1 accent-emerald-500" />
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  </div>
);

const RiskStat = ({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color?: string;
}) => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
    <p className="text-sm text-slate-400">{title}</p>
    <p className={`text-xl font-bold mt-1 ${color || "text-emerald-400"}`}>
      {value}
    </p>
  </div>
);

export default RiskManagementPage;
