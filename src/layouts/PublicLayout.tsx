import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageCircle,
  Phone,
  Sparkles,
  User,
  Mail,
  Send,
  X,
} from "lucide-react";
import { useRegisterLeadMutation } from "../services/leadApi"; // <-- update path if needed

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

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

type LeadFormState = {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
};

const initialForm: LeadFormState = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  message: "",
};

const LeadModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [form, setForm] = useState<LeadFormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [registerLead, { isLoading }] = useRegisterLeadMutation();

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSubmitted(false);
      setErrorMessage("");
    }
  }, [open]);

  if (!open) return null;

  const updateField = (key: keyof LeadFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(initialForm);
    setSubmitted(false);
    setErrorMessage("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await registerLead({
        organization: "69ab0cf48d138f4295bccac2",
        apiSecret: "my_secret",
        data: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          interest: form.interest,
          message: form.message,
        },
      }).unwrap();

      setSubmitted(true);
      setForm(initialForm);
    } catch (error: any) {
      console.error("Lead submit failed", error);
      setErrorMessage(
        error?.data?.message ||
          error?.error ||
          "Something went wrong while submitting your request. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
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
                  Share your details and we’ll contact you for demo, setup,
                  pricing, or strategy onboarding.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                type="button"
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
                    onClick={handleClose}
                    type="button"
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

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                  Prefer instant support? Use WhatsApp directly for faster
                  conversation.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? "Submitting..." : "Submit lead"}
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
        <div className="text-sm font-semibold text-white">
          Need help choosing a plan?
        </div>
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
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
          <MessageCircle size={28} className="relative z-10" />
        </a>
      </div>
    </div>
  );
};

function PublicLayout() {
  const [leadOpen, setLeadOpen] = useState(false);

  return (
    <div className="relative">
      <Header />
      <Outlet />
      <Footer />

      <LeadModal open={leadOpen} onClose={() => setLeadOpen(false)} />
      <FloatingContactWidget onLeadClick={() => setLeadOpen(true)} />
    </div>
  );
}

export default PublicLayout;