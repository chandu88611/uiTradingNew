import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  Settings2,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const conditionTypes = [
  "Ticker",
  "Price",
  "Signal",
  "Indicator",
  "Time",
  "Risk",
];

const operators:any = {
  Price: [">", "<", ">=", "<=", "=="],
  Signal: ["==", "!="],
  Ticker: ["IN", "NOT IN"],
  Indicator: [">", "<", ">=", "<=", "=="],
  Time: ["BETWEEN"],
  Risk: [">", "<", "=="],
};

const StrategyConditionsPage = () => {
  const [conditionSets, setConditionSets] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const emptySet = {
    name: "",
    status: "active",
    logic: "AND",
    conditions: [],
  };

  const openNew = () => {
    setEditIndex(null);
    setConditionSets((prev) => [...prev]);
    setDrawerOpen(true);
  };

  const handleSave = (data: any) => {
    if (editIndex !== null) {
      const updated = [...conditionSets];
      updated[editIndex] = data;
      setConditionSets(updated);
    } else {
      setConditionSets((prev) => [...prev, data]);
    }
    setDrawerOpen(false);
  };

  const deleteSet = (i: number) => {
    setConditionSets((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100   ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="md:text-2xl font-bold">Strategy Conditions</h1>
          <p className="text-slate-400 text-[8px] md:text-sm">
            Create custom rules to allow or block trades based on multiple filters.
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 text-xs md:text-md bg-emerald-500 text-slate-900 px-4 py-2 rounded-xl font-semibold hover:bg-emerald-400"
        >
          <Plus size={18} /> Add
        </button>
      </div>

      {/* Condition Sets Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {conditionSets.map((set, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 p-5 border border-slate-800 rounded-xl space-y-4"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold">{set.name}</h2>
              <span
                className={`px-2 py-1 text-xs rounded-lg ${
                  set.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
              >
                {set.status}
              </span>
            </div>

            <div className="text-sm text-slate-300">
              <p className="font-medium">Logic: {set.logic}</p>
              <ul className="mt-2 list-disc list-inside text-slate-400">
                {set.conditions.map((c: any, idx: number) => (
                  <li key={idx}>
                    <span className="text-slate-300 font-medium">
                      {c.type}
                    </span>{" "}
                    {c.operator}{" "}
                    <span className="text-emerald-400">{c.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setEditIndex(i);
                  setDrawerOpen(true);
                }}
                className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm hover:bg-slate-700"
              >
                <Settings2 size={16} /> Edit
              </button>

              <button
                onClick={() => deleteSet(i)}
                className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <Drawer
            onClose={() => setDrawerOpen(false)}
            initialData={editIndex !== null ? conditionSets[editIndex] : emptySet}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Drawer = ({ initialData, onClose, onSave }: any) => {
  const [form, setForm] = useState(initialData);

  const addCondition = () => {
    setForm((prev: any) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { type: "Price", operator: ">", value: "" },
      ],
    }));
  };

  const updateCondition = (i: number, key: string, val: any) => {
    const updated = [...form.conditions];
    updated[i][key] = val;
    setForm({ ...form, conditions: updated });
  };

  const removeCondition = (i: number) => {
    setForm({
      ...form,
      conditions: form.conditions.filter((_: any, idx: number) => idx !== i),
    });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.25 }}
      className="fixed top-0 right-0 w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 p-6 z-50 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Configure Conditions</h2>
        <button onClick={onClose}>
          <X size={22} className="text-slate-400 hover:text-white" />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-slate-400">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">Logic</label>
          <select
            value={form.logic}
            onChange={(e) => setForm({ ...form, logic: e.target.value })}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option>AND</option>
            <option>OR</option>
          </select>
        </div>

        {/* Conditions */}
        <div className="space-y-4">
          {form.conditions.map((c: any, i: number) => (
            <div
              key={i}
              className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3"
            >
              <div className="flex justify-between">
                <p className="text-sm font-medium">Condition #{i + 1}</p>
                <button onClick={() => removeCondition(i)}>
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Type */}
                <select
                  value={c.type}
                  onChange={(e) => updateCondition(i, "type", e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                >
                  {conditionTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={c.operator}
                  onChange={(e) =>
                    updateCondition(i, "operator", e.target.value)
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                >
                  {operators[c.type].map((op:any) => (
                    <option key={op}>{op}</option>
                  ))}
                </select>

             
                <input
                  value={c.value}
                  onChange={(e) => updateCondition(i, "value", e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                  placeholder="Value"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCondition}
          className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700"
        >
          <Plus size={16} /> Add Condition
        </button>

        <button
          onClick={() => onSave(form)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-xl py-3 flex items-center justify-center gap-2"
        >
          <Save size={18} /> Save Condition Set
        </button>
      </div>
    </motion.div>
  );
};

export default StrategyConditionsPage;
