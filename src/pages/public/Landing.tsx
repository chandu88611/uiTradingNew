import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  CopyCheck,
  Activity,
  Lock,
  Gauge,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  MessageCircle,
  X,
  Phone,
  Mail,
  User,
  Send,
} from "lucide-react";

import type { Variants } from "framer-motion";
import SubscriptionPlansMarketplaceV3 from "../subscriptions/SubscriptionWizardPage";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: d, ease: EASE_OUT },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (d: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay: d, ease: EASE_OUT },
  }),
};

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
    <Sparkles size={14} className="text-emerald-300" />
    {children}
  </span>
);

const Pill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
    <span className="text-emerald-300">{icon}</span>
    <span>{text}</span>
  </div>
);

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
    <div className="text-2xl font-semibold text-white md:text-3xl">{value}</div>
    <div className="mt-1 text-sm text-slate-400">{label}</div>
  </div>
);

const Card: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  bullets?: string[];
}> = ({ icon, title, desc, bullets }) => (
  <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.3)] transition hover:bg-slate-900/60">
    <div className="flex items-center gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-emerald-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-slate-400">{desc}</p>
    {!!bullets?.length && (
      <ul className="mt-4 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
            <span className="text-slate-300">{b}</span>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent opacity-0 transition group-hover:opacity-100" />
  </div>
);

const FeatureRow: React.FC<{
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
  right?: boolean;
}> = ({ eyebrow, title, desc, points, right }) => (
  <div className={cx("grid items-center gap-10 md:grid-cols-2", right && "md:[&>*:first-child]:order-2")}>
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {title}
      </h3>
      <p className="mt-3 leading-relaxed text-slate-400">{desc}</p>
      <ul className="mt-6 space-y-3">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-300">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/15">
              <CheckCircle2 size={14} className="text-emerald-300" />
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap gap-3">
        <a
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Start free <ArrowRight size={16} />
        </a>
        <a
          href="/sign-in"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          View dashboard
        </a>
      </div>
    </div>

    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-900/0 to-cyan-500/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <div className="text-xs text-slate-500">Execution Console</div>
          <div className="text-xs text-slate-600">Live</div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Signal Intake</div>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                  Webhook
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Latency (p95)</span>
                  <span className="text-slate-200">&lt; 250ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Retries</span>
                  <span className="text-slate-200">Smart backoff</span>
                </div>
                <div className="flex justify-between">
                  <span>Dedup</span>
                  <span className="text-slate-200">Idempotent</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Order Router</div>
                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">
                  Multi-broker
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Broker</span>
                  <span className="text-slate-200">Zerodha / Dhan / Zebu</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Guards</span>
                  <span className="text-slate-200">Max loss, SL/TP</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Trail</span>
                  <span className="text-slate-200">Full logs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/35 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Recent Activity</div>
              <div className="text-xs text-slate-500">Last 60s</div>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { left: "BUY", sym: "NIFTY", tag: "Executed", right: "0.18s" },
                { left: "SELL", sym: "BANKNIFTY", tag: "Executed", right: "0.24s" },
                { left: "BUY", sym: "RELIANCE", tag: "Queued", right: "0.06s" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                      {r.left}
                    </span>
                    <span className="text-xs text-slate-200">{r.sym}</span>
                    <span
                      className={cx(
                        "rounded-full border px-2 py-1 text-[11px]",
                        r.tag === "Executed"
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                          : "border-yellow-500/25 bg-yellow-500/10 text-yellow-200"
                      )}
                    >
                      {r.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{r.right}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen((s) => !s)}
      className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-left transition hover:bg-slate-900/60"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-white md:text-base">{q}</div>
        <ChevronDown
          size={18}
          className={cx("text-slate-400 transition", open && "rotate-180")}
        />
      </div>
      {open && <div className="mt-3 text-sm leading-relaxed text-slate-400">{a}</div>}
    </button>
  );
};

const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
> = ({ icon, className, ...props }) => (
  <div
    className={cx(
      "flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 transition focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10",
      className
    )}
  >
    {icon && <span className="text-slate-500">{icon}</span>}
    <input
      {...props}
      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
    />
  </div>
);

const TextArea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { icon?: React.ReactNode }
> = ({ icon, className, ...props }) => (
  <div
    className={cx(
      "flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 transition focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10",
      className
    )}
  >
    {icon && <span className="mt-1 text-slate-500">{icon}</span>}
    <textarea
      {...props}
      className="min-h-[110px] w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
    />
  </div>
);

const LeadModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interest: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Replace with your real lead API
      // await fetch("/api/leads", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });

      await new Promise((resolve) => setTimeout(resolve, 900));
      setSubmitted(true);
    } catch (err) {
      console.error("Lead submit failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
          </div>

          <div className="relative border-b border-slate-800 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                  <Sparkles size={13} />
                  Fast response from our team
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Let’s help you get started
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Share your details and we’ll contact you for demo, setup, pricing,
                  or strategy onboarding.
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative px-6 py-6">
            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/15 p-2 text-emerald-300">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      Lead submitted successfully
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      Our team will reach out to you shortly.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/919999999999?text=Hi%20TradeBroX%2C%20I%20just%20submitted%20my%20details%20and%20want%20to%20know%20more."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Chat on WhatsApp <MessageCircle size={16} />
                  </a>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    icon={<User size={16} />}
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                  <Input
                    icon={<Phone size={16} />}
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    icon={<Mail size={16} />}
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  <Input
                    icon={<BarChart3 size={16} />}
                    placeholder="Interested in (Algo / Copy Trading / Demo)"
                    value={form.interest}
                    onChange={(e) => updateField("interest", e.target.value)}
                  />
                </div>

                <TextArea
                  icon={<Send size={16} />}
                  placeholder="Tell us what you need..."
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                />

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                  Prefer instant support? Use WhatsApp directly for faster conversation.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-70"
                  >
                    {loading ? "Submitting..." : "Submit lead"}
                    <ArrowRight size={16} />
                  </button>

                  <a
                    href="https://wa.me/919999999999?text=Hi%20TradeBroX%2C%20I%20want%20a%20demo%20for%20the%20platform."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    WhatsApp us <MessageCircle size={16} />
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FloatingContactWidget: React.FC<{
  onLeadClick: () => void;
}> = ({ onLeadClick }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      <div className="hidden rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 shadow-2xl backdrop-blur sm:block">
        <div className="text-sm font-semibold text-white">Need help choosing a plan?</div>
        <div className="mt-1 text-xs text-slate-400">
          Chat instantly or request a callback.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onLeadClick}
          className="group inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur transition hover:bg-slate-800"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <Phone size={18} />
          </span>
          <span className="hidden sm:inline">Get a callback</span>
        </button>

        <a
          href="https://wa.me/919999999999?text=Hi%20TradeBroX%2C%20I%20came%20through%20your%20website%20and%20want%20to%20know%20more."
          target="_blank"
          rel="noreferrer"
          className="group relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_20px_50px_rgba(16,185,129,0.35)] transition hover:scale-105 hover:bg-emerald-400"
          aria-label="Chat on WhatsApp"
        >
          <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
          <MessageCircle size={28} className="relative z-10" />
        </a>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [leadOpen, setLeadOpen] = useState(false);

  const brokerChips = useMemo(
    () => ["Zerodha", "Dhan", "Zebu", "TradingView", "MT5", "cTrader"],
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-10 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-14 md:pb-14 md:pt-20">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0}>
            <Badge>Built for fast execution, reliable automation & copy trading</Badge>
          </motion.div>

          <div className="mt-6 grid gap-10 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.05}
                className="text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl"
              >
                Automate trades with{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  speed, control & confidence
                </span>
                .
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.18}
                className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg"
              >
                Execute TradingView webhooks, run high-frequency strategies, and enable copy trading
                across multiple accounts — with audit logs, risk guards, and broker-grade security.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.28}
                className="mt-7 flex flex-wrap gap-3"
              >
                <Pill icon={<Gauge size={14} />} text="Low-latency execution" />
                <Pill icon={<ShieldCheck size={14} />} text="Risk & security guards" />
                <Pill icon={<BarChart3 size={14} />} text="Analytics & logs" />
                <Pill icon={<CopyCheck size={14} />} text="Copy trading flows" />
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.4}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <button
                  onClick={() => setLeadOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Get free demo <ArrowRight size={16} />
                </button>

                <a
                  href="https://wa.me/919999999999?text=Hi%20TradeBroX%2C%20I%20want%20a%20demo%20for%20the%20platform."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Chat on WhatsApp <MessageCircle size={16} />
                </a>

                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  See pricing
                </a>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                custom={0.55}
                className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                <Stat value="&lt;250ms" label="p95 signal → order" />
                <Stat value="99.9%" label="uptime target" />
                <Stat value="Full" label="audit trail" />
                <Stat value="Secure" label="encrypted keys" />
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.62}
                className="mt-8 max-w-2xl rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Want a setup call before you start?
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Perfect for marketing traffic, first-time users, and serious traders who want quick onboarding.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setLeadOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Request callback <Phone size={16} />
                    </button>

                    <a
                      href="https://wa.me/919999999999?text=Hi%20TradeBroX%2C%20I%20want%20to%20know%20about%20your%20plans%20and%20demo."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      WhatsApp now <MessageCircle size={16} />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="md:col-span-5"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.22}
            >
              <div className="rounded-3xl border border-slate-800 bg-slate-900/35 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Live Readiness</div>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                    Production
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: "Broker connection", value: "Verified", icon: <ShieldCheck size={16} /> },
                    { label: "Webhook handler", value: "Active", icon: <Activity size={16} /> },
                    { label: "Risk limits", value: "Enabled", icon: <Lock size={16} /> },
                    { label: "Copy engine", value: "Ready", icon: <CopyCheck size={16} /> },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2 text-emerald-300">
                          {r.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{r.label}</div>
                          <div className="text-xs text-slate-500">Health checks & fallback</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-200">{r.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-4">
                  <div className="text-sm font-semibold text-white">Start in minutes</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Connect broker → add webhook → enable risk limits → go live.
                  </div>
                  <a
                    href="#how"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                  >
                    See how it works <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            custom={0.12}
            className="mt-10 md:mt-12"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="mr-2 font-semibold text-slate-400">Integrations:</span>
              {brokerChips.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-slate-300"
                >
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0.05}
          className="max-w-2xl"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            Why traders choose TradeBroX
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Everything you need to run automation like a pro.
          </h2>
          <p className="mt-3 leading-relaxed text-slate-400">
            Not just “send orders”. You get reliability, safety, observability, and workflows that scale.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <Zap size={20} />,
              title: "Low-latency execution",
              desc: "Fast webhook processing, smart retries, and stable order routing for consistent fills.",
              bullets: ["p95 latency targets", "Idempotent order handling", "Retry + fallback logic"],
            },
            {
              icon: <CopyCheck size={20} />,
              title: "Copy trading at scale",
              desc: "Master → client following with clean approvals, allocation rules, and live sync.",
              bullets: ["Follow/approve flows", "Per-client risk limits", "Position sync & close handling"],
            },
            {
              icon: <BarChart3 size={20} />,
              title: "Analytics & audit logs",
              desc: "See what happened and why — with trade logs, slippage, and execution timelines.",
              bullets: ["PnL + trade history", "Slippage tracking", "Full audit trail"],
            },
            {
              icon: <Activity size={20} />,
              title: "TradingView-ready",
              desc: "Trigger trades using PineScript alerts & webhooks, with verification and dedup built in.",
              bullets: ["Webhook templates", "Signature verification", "Duplicate prevention"],
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "Bank-grade security posture",
              desc: "Encrypted secrets, scoped access, and safe-by-default broker integrations.",
              bullets: ["Encrypted tokens", "Isolated execution", "Least-privilege access"],
            },
            {
              icon: <Lock size={20} />,
              title: "Risk guards & controls",
              desc: "Hard limits and kill switches so automation stays predictable even in volatile markets.",
              bullets: ["Max loss / max trades", "Session windows", "Emergency pause"],
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0.05 + i * 0.06}
            >
              <Card {...f} />
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0.05}
          className="max-w-2xl"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            How it works
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            From strategy to execution in 4 steps.
          </h2>
          <p className="mt-3 leading-relaxed text-slate-400">
            Designed for real-world operations: verification, safety controls, and monitoring come standard.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            {
              n: "01",
              t: "Connect broker",
              d: "Securely link your broker account and verify access.",
              icon: <ShieldCheck size={18} />,
            },
            {
              n: "02",
              t: "Configure risk",
              d: "Set max loss, position sizing, and trading windows.",
              icon: <Lock size={18} />,
            },
            {
              n: "03",
              t: "Add webhook",
              d: "Paste TradingView webhook URL + template, enable signature checks.",
              icon: <Activity size={18} />,
            },
            {
              n: "04",
              t: "Go live",
              d: "Monitor live execution, logs, and alerts in one place.",
              icon: <BarChart3 size={18} />,
            },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0.05 + i * 0.06}
              className="rounded-2xl border border-slate-800 bg-slate-900/35 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500">{s.n}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-emerald-300">
                  {s.icon}
                </div>
              </div>
              <div className="mt-4 text-lg font-semibold text-white">{s.t}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-400">{s.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0.05}
          className="mb-10 max-w-2xl"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            Built for reliability
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Safer automation with real controls.
          </h2>
          <p className="mt-3 leading-relaxed text-slate-400">
            Automation should never feel scary. Your platform needs guardrails, observability, and clean workflows.
          </p>
        </motion.div>

        <div className="space-y-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            custom={0.05}
          >
            <FeatureRow
              eyebrow="Execution you can trust"
              title="Idempotent, verified, and observable order flow."
              desc="We handle the real issues: duplicate alerts, retries, broker outages, and auditability — so your automation stays stable."
              points={[
                "Dedup + idempotency to prevent double orders",
                "Smart retries with backoff & safe failure modes",
                "Execution timelines + logs for every event",
              ]}
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            custom={0.05}
          >
            <FeatureRow
              right
              eyebrow="Copy trading done right"
              title="Master-client flows designed for real operations."
              desc="Approve follows, enforce allocation rules, sync positions, and handle closes correctly — across multiple accounts."
              points={[
                "Follow requests + approvals + access control",
                "Per-client sizing & risk limits",
                "Sync & close handling to avoid drift",
              ]}
            />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0.05}
          className="max-w-2xl"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            Social proof
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built for serious traders & teams.
          </h2>
          <p className="mt-3 leading-relaxed text-slate-400">
            A clean workflow and stable execution makes the difference between “testing” and “trusting”.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Options Trader",
              role: "Bengaluru",
              quote:
                "Finally a platform where webhook execution + logs are clean. The audit trail is the biggest confidence boost.",
            },
            {
              name: "Copy Trading Desk",
              role: "Multi-account",
              quote:
                "Follow approval + per-client sizing is exactly what we needed. Much easier to operate than scripts everywhere.",
            },
            {
              name: "Algo Builder",
              role: "TradingView",
              quote:
                "The setup is simple, but it still has the safeguards. Dedup and retries saved us multiple times.",
            },
          ].map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0.05 + i * 0.06}
              className="rounded-2xl border border-slate-800 bg-slate-900/35 p-6"
            >
              <div className="text-sm leading-relaxed text-slate-300">“{t.quote}”</div>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
                <div className="text-emerald-300">
                  <ShieldCheck size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <SubscriptionPlansMarketplaceV3 />
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={0.05}
          className="max-w-2xl"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            FAQ
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Common questions.
          </h2>
          <p className="mt-3 leading-relaxed text-slate-400">
            Clear answers that reduce friction and build trust.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <FAQItem
            q="Is this fully automated trading?"
            a="You control automation: connect accounts, configure risk limits, and decide which strategies can execute. You can pause anytime."
          />
          <FAQItem
            q="How do you prevent duplicate trades from TradingView?"
            a="We use dedup + idempotency patterns so repeated alerts don’t create repeated orders, and retries are handled safely."
          />
          <FAQItem
            q="Do you store broker credentials?"
            a="Sensitive tokens are stored encrypted. We recommend least-privilege access where broker APIs allow it."
          />
          <FAQItem
            q="Can I do copy trading across many clients?"
            a="Yes. Master-client follow flows, approvals, and per-client allocation/risk rules are first-class features in the platform design."
          />
        </div>
      </section>

      <section className="px-6 pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/15 via-slate-900/40 to-cyan-500/15 p-10 md:p-14">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
              <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
            </div>

            <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
                  <ShieldCheck size={14} className="text-emerald-300" />
                  Safer automation • Better visibility • More control
                </div>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Ready to go from alerts to execution?
                </h3>
                <p className="mt-3 leading-relaxed text-slate-300/80">
                  Create your account and start with a clean, production-grade setup — built to convince and retain real users.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setLeadOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Get demo <ArrowRight size={16} />
                </button>
                <a
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Sign in
                </a>
              </div>
            </div>

            <div className="relative mt-8 grid gap-3 md:grid-cols-3">
              {[
                { icon: <Lock size={16} />, t: "Encrypted keys", d: "Secrets stored securely." },
                { icon: <Gauge size={16} />, t: "Fast execution", d: "Designed for low latency." },
                { icon: <ShieldCheck size={16} />, t: "Risk guards", d: "Limits + kill switches." },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="text-emerald-300">{x.icon}</span>
                    {x.t}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{x.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 bg-slate-950/70">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15">
                <Zap className="text-emerald-300" size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">TradeBroX</div>
                <div className="text-xs text-slate-500">Automation & Copy Trading Platform</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#how" className="transition hover:text-white">How it works</a>
              <a href="#pricing" className="transition hover:text-white">Pricing</a>
              <a href="#faq" className="transition hover:text-white">FAQ</a>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 text-xs leading-relaxed text-slate-500">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="mt-0.5 text-emerald-300" />
              <p>
                <span className="font-semibold text-slate-300">Disclaimer:</span>{" "}
                Trading involves risk. Past performance is not indicative of future results. This platform
                provides automation tools and execution infrastructure; it does not guarantee profits.
                Use risk limits and trade responsibly.
              </p>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-600">
            © {new Date().getFullYear()} TradeBroX. All rights reserved.
          </div>
        </div>
      </footer>
{/* 
      <LeadModal open={leadOpen} onClose={() => setLeadOpen(false)} />
      <FloatingContactWidget onLeadClick={() => setLeadOpen(true)} /> */}
    </div>
  );
};

export default Home;