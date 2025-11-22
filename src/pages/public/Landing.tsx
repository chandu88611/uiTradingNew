import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, BarChart3, ShieldCheck, CopyCheck, Activity } from "lucide-react";

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen px-6 pt-16  md:pt-28 bg-slate-950 text-slate-100">

      {/* HERO SECTION */}
      <section className="px-6 pt-24 pb-32 max-w-6xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-tight"
        >
          Automate Your Trades with  
          <span className="text-emerald-400"> Lightning Precision</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-slate-400 max-w-2xl mx-auto text-lg"
        >
          High-frequency automation, copy trading, and webhook execution integrated 
          with top Indian brokers like Zerodha, Dhan & Zebu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-center gap-4"
        >
          <a
            href="/sign-up"
            className="px-6 py-3 bg-emerald-500 text-slate-900 rounded-xl font-semibold hover:bg-emerald-400 flex items-center gap-2"
          >
            Get Started <ArrowRight size={18} />
          </a>
          <a
            href="/sign-in"
            className="px-6 py-3 border border-slate-700 bg-slate-900 rounded-xl font-semibold hover:bg-slate-800"
          >
            Sign In
          </a>
        </motion.div>
      </section>

      {/* FEATURE GRID */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-14">Why Choose Us?</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap size={32} className="text-emerald-400" />,
              title: "High-Frequency Execution",
              desc: "Ultra-fast automated execution connected with Indian brokers using secure APIs.",
            },
            {
              icon: <CopyCheck size={32} className="text-emerald-400" />,
              title: "Copy Trading System",
              desc: "Mirror master trades instantly across hundreds of client accounts.",
            },
            {
              icon: <BarChart3 size={32} className="text-emerald-400" />,
              title: "Smart Analytics",
              desc: "Real-time PnL, trade logs, slippage analysis, and execution insights.",
            },
            {
              icon: <Activity size={32} className="text-emerald-400" />,
              title: "TradingView Alerts",
              desc: "Trigger trades automatically using your PineScript strategies & webhooks.",
            },
            {
              icon: <ShieldCheck size={32} className="text-emerald-400" />,
              title: "Bank-Grade Security",
              desc: "256-bit protection, encrypted keys & isolated execution environment.",
            },
            {
              icon: <Zap size={32} className="text-emerald-400" />,
              title: "One-Click Deployment",
              desc: "Connect broker account and go live instantly with your strategies.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg hover:bg-slate-900 transition"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 px-6">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-900 rounded-3xl max-w-5xl mx-auto p-12 text-center shadow-xl">
          <h2 className="text-3xl font-bold">Start Automating Your Trading Today</h2>
          <p className="text-lg mt-2 mb-6 opacity-80">
            Join traders who trust our platform for reliable automated execution.
          </p>

          <a
            href="/sign-up"
            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto w-fit"
          >
            Create Account <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 border-t border-slate-800 text-slate-500 text-sm">
        © 2025 TradeBroX · Automated Trading Platform · All Rights Reserved
      </footer>
    </div>
  );
};

export default Landing;
