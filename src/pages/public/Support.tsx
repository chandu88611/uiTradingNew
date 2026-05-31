import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { toast } from "react-toastify";
import {
  LifeBuoy,
  Sparkles,
  Send,
  ShieldCheck,
  MessageSquare,
  Clock3,
  CircleDot,
  Search,
  ChevronRight,
  UserRound,
  AlertCircle,
  BadgeCheck,
  Layers3,
  Lock,
  LogIn,
  RefreshCw,
} from "lucide-react";

import AuthModal from "../../pages/auth/AuthModel";
import { useMeQuery } from "../../services/userApi";
import {
  useAddSupportMessageMutation,
  useCreateSupportTicketMutation,
  useGetSupportMessagesQuery,
  useGetSupportTicketQuery,
  useGetSupportTicketsQuery,
  SupportCategory,
  SupportPriority,
  SupportTicketStatus,
} from "../../services/supportApi";

type ResumeState = {
  selectedTicketId: string;
  statusFilter: "all" | SupportTicketStatus;
  search: string;
  category: SupportCategory;
  priority: SupportPriority;
  subject: string;
  body: string;
  reply: string;
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: EASE_OUT },
  }),
};

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const is401 = (err: any) =>
  err?.status === 401 ||
  err?.originalStatus === 401 ||
  err?.data?.statusCode === 401;

const getApiMessage = (payload: any, fallback: string) =>
  payload?.data?.message ||
  payload?.message ||
  payload?.error ||
  fallback;

const extractList = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.tickets)) return response.tickets;
  if (Array.isArray(response?.messages)) return response.messages;
  return [];
};

const extractTicket = (response: any) => {
  if (!response) return null;
  if (response?.data && typeof response.data === "object") return response.data;
  if (response?.item && typeof response.item === "object") return response.item;
  return response;
};

const getTicketId = (ticket: any) => ticket?.id || ticket?._id || "";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const prettifyText = (value?: string) => {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const prettifyStatus = (status?: string) => {
  if (!status) return "Open";
  return prettifyText(status);
};

const statusBadgeClass = (status?: string) => {
  switch (status) {
    case "open":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-200";
    case "assigned":
      return "border-violet-500/20 bg-violet-500/10 text-violet-200";
    case "waiting_for_support":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "waiting_for_customer":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "closed":
      return "border-slate-700 bg-slate-800/80 text-slate-300";
    default:
      return "border-slate-700 bg-slate-800/80 text-slate-300";
  }
};

const priorityBadgeClass = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "border-red-500/20 bg-red-500/10 text-red-200";
    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "low":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-slate-700 bg-slate-800/80 text-slate-300";
  }
};

const extractPriorityFromSubject = (subject?: string) => {
  if (!subject) return "";
  const match = subject.match(/\[(Low|Medium|High)\]/i);
  return match?.[1] || "";
};

const extractCategoryFromSubject = (subject?: string) => {
  if (!subject) return "";
  const matches = subject.match(/\[([^\]]+)\]/g);
  if (!matches?.length) return "";
  return matches[0].replace(/[\[\]]/g, "");
};

const categoryOptions: { label: string; value: SupportCategory }[] = [
  { label: "Technical Issue", value: "technical_issue" },
  { label: "Billing / Subscription", value: "billing_subscription" },
  { label: "Account Access", value: "account_access" },
  { label: "Strategy / Alerts", value: "strategy_alerts" },
  { label: "Withdrawal / Payment", value: "withdrawal_payment" },
  { label: "Other", value: "other" },
];

const priorityOptions: { label: string; value: SupportPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const statusOptions: { label: string; value: "all" | SupportTicketStatus }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Assigned", value: "assigned" },
  { label: "Waiting", value: "waiting_for_support" },
  { label: "Customer", value: "waiting_for_customer" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const getPriorityText = (ticket: any) =>
  prettifyText(ticket?.priority) || extractPriorityFromSubject(ticket?.subject);

const getCategoryText = (ticket: any) =>
  categoryOptions.find((item) => item.value === ticket?.category)?.label ||
  extractCategoryFromSubject(ticket?.subject);

const ThemeBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 backdrop-blur">
    <Sparkles size={14} className="text-emerald-300" />
    {children}
  </div>
);

const ThemeCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cx(
      "rounded-3xl border border-slate-800 bg-slate-900/40 shadow-[0_0_0_1px_rgba(15,23,42,0.25)] backdrop-blur-sm",
      className
    )}
  >
    {children}
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
    <div className="flex items-center justify-between">
      <div className="text-slate-400">{icon}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
    <div className="mt-3 text-xs text-slate-400">{label}</div>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-2 block text-sm font-medium text-slate-200">
    {children}
  </label>
);

const SelectField = (
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) => (
  <select
    {...props}
    className={cx(
      "w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60",
      props.className
    )}
  />
);

const InputField = (
  props: React.InputHTMLAttributes<HTMLInputElement>
) => (
  <input
    {...props}
    className={cx(
      "w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60",
      props.className
    )}
  />
);

const TextAreaField = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) => (
  <textarea
    {...props}
    className={cx(
      "w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60",
      props.className
    )}
  />
);

const LoginHintCard = ({ onLogin }: { onLogin: () => void }) => (
  <ThemeCard className="overflow-hidden">
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
          <Lock size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold text-white">Login required</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Login is required only for private ticket history and replying to your tickets.
          </p>

          <button
            type="button"
            onClick={onLogin}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Login to continue
            <LogIn size={16} />
          </button>
        </div>
      </div>
    </div>
  </ThemeCard>
);

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicketStatus>("all");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState<SupportCategory>("technical_issue");
  const [priority, setPriority] = useState<SupportPriority>("medium");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  const [createError, setCreateError] = useState("");
  const [replyError, setReplyError] = useState("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "signup">("login");

  const resumeRef = useRef<ResumeState | null>(null);

  const {
    data: meRes,
    isLoading: meLoading,
    isFetching: meFetching,
    refetch: refetchMe,
  } = useMeQuery(undefined, { refetchOnMountOrArgChange: true } as any);

  const me = (meRes as any)?.data ?? meRes;
  const isAuthenticated = Boolean(me?.id || me?.user?.id);
  const authReady = !(meLoading || meFetching);
  const canLoadPrivateTickets = authReady && isAuthenticated;

  useEffect(() => {
    if (authReady && isAuthenticated && authOpen) {
      setAuthOpen(false);
    }
  }, [authReady, isAuthenticated, authOpen]);

  const snapshot = (): ResumeState => ({
    selectedTicketId,
    statusFilter,
    search,
    category,
    priority,
    subject,
    body,
    reply,
  });

  const openAuthAndRemember = () => {
    if (authReady && isAuthenticated) return;
    resumeRef.current = snapshot();
    setAuthDefaultTab("login");
    setAuthOpen(true);
  };

  const restoreResume = () => {
    const saved = resumeRef.current;
    resumeRef.current = null;
    if (!saved) return;

    setSelectedTicketId(saved.selectedTicketId);
    setStatusFilter(saved.statusFilter);
    setSearch(saved.search);
    setCategory(saved.category);
    setPriority(saved.priority);
    setSubject(saved.subject);
    setBody(saved.body);
    setReply(saved.reply);
  };

  const [createSupportTicket, { isLoading: isCreating }] =
    useCreateSupportTicketMutation();

  const [addSupportMessage, { isLoading: isSendingReply }] =
    useAddSupportMessageMutation();

  const {
    data: ticketsResponse,
    isLoading: isTicketsLoading,
    isFetching: isTicketsFetching,
    error: ticketsError,
    refetch: refetchTickets,
  } = useGetSupportTicketsQuery(
    {
      page: 1,
      limit: 20,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    } as any,
    {
      skip: !canLoadPrivateTickets,
      refetchOnMountOrArgChange: true,
    } as any
  );

  const tickets = useMemo(() => extractList(ticketsResponse), [ticketsResponse]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;

    return tickets.filter((ticket: any) => {
      const subjectText = String(ticket?.subject || "").toLowerCase();
      const bodyText = String(ticket?.body || "").toLowerCase();
      const statusText = String(ticket?.status || "").toLowerCase();

      return (
        subjectText.includes(query) ||
        bodyText.includes(query) ||
        statusText.includes(query)
      );
    });
  }, [tickets, search]);

  useEffect(() => {
    if (!canLoadPrivateTickets) {
      setSelectedTicketId("");
      return;
    }

    if (!selectedTicketId && filteredTickets.length > 0) {
      setSelectedTicketId(getTicketId(filteredTickets[0]));
      return;
    }

    const exists = filteredTickets.some(
      (ticket: any) => getTicketId(ticket) === selectedTicketId
    );

    if (!exists && filteredTickets.length > 0) {
      setSelectedTicketId(getTicketId(filteredTickets[0]));
    }

    if (filteredTickets.length === 0) {
      setSelectedTicketId("");
    }
  }, [filteredTickets, selectedTicketId, canLoadPrivateTickets]);

  const {
    data: ticketResponse,
    isFetching: isTicketLoading,
    error: ticketError,
    refetch: refetchTicket,
  } = useGetSupportTicketQuery(
    { ticketId: selectedTicketId } as any,
    {
      skip: !canLoadPrivateTickets || !selectedTicketId,
      refetchOnMountOrArgChange: true,
    } as any
  );

  const {
    data: messagesResponse,
    isFetching: isMessagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetSupportMessagesQuery(
    { ticketId: selectedTicketId } as any,
    {
      skip: !canLoadPrivateTickets || !selectedTicketId,
      refetchOnMountOrArgChange: true,
    } as any
  );

  const selectedTicket = extractTicket(ticketResponse);
  const messages = useMemo(() => extractList(messagesResponse), [messagesResponse]);

  const totalTickets = tickets.length;
  const activeCount = tickets.filter((ticket: any) =>
    ["open", "assigned", "waiting_for_support", "waiting_for_customer"].includes(
      ticket?.status
    )
  ).length;
  const resolvedCount = tickets.filter((ticket: any) =>
    ["resolved", "closed"].includes(ticket?.status)
  ).length;

  const passiveLoadError =
    (canLoadPrivateTickets && ticketsError && !is401(ticketsError) && "Unable to load tickets.") ||
    (canLoadPrivateTickets && ticketError && !is401(ticketError) && "Unable to load ticket details.") ||
    (canLoadPrivateTickets && messagesError && !is401(messagesError) && "Unable to load conversation.") ||
    "";

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!subject.trim() || !body.trim()) {
      const msg = "Please fill subject and complaint details.";
      setCreateError(msg);
      toast.error(msg);
      return;
    }

    if (!authReady) {
      toast.info("Checking login status. Please try once.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please login to continue.");
      openAuthAndRemember();
      return;
    }

    try {
      const res = await createSupportTicket({
        data: {
          category,
          priority,
          subject,
          body,
        },
      } as any).unwrap();

      const createdTicket = extractTicket(res);
      const createdTicketId = getTicketId(createdTicket);
      const successMessage = getApiMessage(
        res,
        "Support ticket created successfully."
      );

      toast.success(successMessage);

      setSubject("");
      setBody("");
      setCategory("technical_issue");
      setPriority("medium");

      await refetchTickets();

      if (createdTicketId) {
        setSelectedTicketId(createdTicketId);
      }
    } catch (error: any) {
      const errorMessage = getApiMessage(
        error,
        "Unable to submit complaint. Please try again."
      );

      if (is401(error)) {
        toast.error(errorMessage);
        await refetchMe?.();
        if (!(authReady && isAuthenticated)) {
          openAuthAndRemember();
        }
        return;
      }

      console.error("Failed to create support ticket", error);
      setCreateError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError("");

    if (!selectedTicketId) {
      const msg = "Please select a ticket first.";
      setReplyError(msg);
      toast.error(msg);
      return;
    }

    if (!reply.trim()) {
      const msg = "Please enter a message.";
      setReplyError(msg);
      toast.error(msg);
      return;
    }

    if (!authReady) {
      toast.info("Checking login status. Please try once.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please login to continue.");
      openAuthAndRemember();
      return;
    }

    try {
      const res = await addSupportMessage({
        ticketId: selectedTicketId,
        body: reply,
      } as any).unwrap();

      const successMessage = getApiMessage(res, "Message sent successfully.");

      toast.success(successMessage);
      setReply("");

      await Promise.all([refetchMessages(), refetchTicket(), refetchTickets()]);
    } catch (error: any) {
      const errorMessage = getApiMessage(
        error,
        "Unable to send message. Please try again."
      );

      if (is401(error)) {
        toast.error(errorMessage);
        await refetchMe?.();
        if (!(authReady && isAuthenticated)) {
          openAuthAndRemember();
        }
        return;
      }

      console.error("Failed to send support reply", error);
      setReplyError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AuthModal
        open={authReady && !isAuthenticated && authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authDefaultTab}
        onAuthed={async () => {
          setAuthOpen(false);
          await refetchMe?.();
          await Promise.allSettled([
            refetchTickets?.(),
            refetchTicket?.(),
            refetchMessages?.(),
          ]);
          restoreResume();
        }}
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl sm:h-[520px] sm:w-[520px]" />
        <div className="absolute right-[-140px] top-32 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl sm:h-[520px] sm:w-[520px]" />
        <div className="absolute bottom-[-160px] left-[-140px] h-[360px] w-[360px] rounded-full bg-indigo-500/10 blur-3xl sm:h-[520px] sm:w-[520px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <ThemeBadge>
            Fast help for account, billing, strategy, and technical issues
          </ThemeBadge>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.05}
          className="mt-5"
        >
          <ThemeCard className="overflow-hidden">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                    <LifeBuoy size={22} />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                      Support Center
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                      Raise a proper complaint, track every update, and continue the conversation without leaving the platform.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-300" />
                    Secure support workflow
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                    <MessageSquare size={14} className="text-cyan-300" />
                    Ticket + chat in one view
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                    <Clock3 size={14} className="text-amber-300" />
                    Mobile friendly
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-5">
                <StatCard icon={<Layers3 size={18} />} label="Total Tickets" value={totalTickets} />
                <StatCard icon={<CircleDot size={18} />} label="Active" value={activeCount} />
                <StatCard icon={<BadgeCheck size={18} />} label="Resolved" value={resolvedCount} />
              </div>
            </div>
          </ThemeCard>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.1}
            className="lg:col-span-5 xl:col-span-4"
          >
            <ThemeCard className="overflow-hidden lg:sticky lg:top-6">
              <div className="border-b border-slate-800 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">Raise a Complaint</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Describe the issue clearly so the team can act faster.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <FieldLabel>Complaint Category</FieldLabel>
                    <SelectField
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SupportCategory)}
                    >
                      {categoryOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="bg-slate-950 text-white"
                        >
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    <SelectField
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SupportPriority)}
                    >
                      {priorityOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="bg-slate-950 text-white"
                        >
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </div>

                <div>
                  <FieldLabel>Subject</FieldLabel>
                  <InputField
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Example: Subscription active but not visible"
                  />
                </div>

                <div>
                  <FieldLabel>Complaint Details</FieldLabel>
                  <TextAreaField
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Explain what happened, when it happened, and what you already tried."
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs leading-relaxed text-slate-400">
                  Tip: mention order ID, payment date, plan name, alert name, error text, or account details for quicker resolution.
                </div>

                {createError ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{createError}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isCreating || !subject.trim() || !body.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Submitting..." : "Submit Complaint"}
                  <Send size={16} />
                </button>
              </form>
            </ThemeCard>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.15}
            className="lg:col-span-7 xl:col-span-8"
          >
            <ThemeCard className="overflow-hidden">
              <div className="border-b border-slate-800 p-5 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Your Support Tickets</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Track status, open the conversation, and send follow-ups.
                      </p>
                    </div>

                    <div className="relative w-full xl:max-w-xs">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <InputField
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search ticket"
                        className="pl-10"
                        disabled={!canLoadPrivateTickets}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatusFilter(option.value)}
                        disabled={!canLoadPrivateTickets}
                        className={cx(
                          "whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition",
                          statusFilter === option.value
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-900",
                          !canLoadPrivateTickets && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}

                    {canLoadPrivateTickets ? (
                      <button
                        type="button"
                        onClick={() => refetchTickets?.()}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-900"
                      >
                        <RefreshCw size={14} className={isTicketsFetching ? "animate-spin" : ""} />
                        Refresh
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {!authReady ? (
                <div className="p-5 sm:p-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                    Checking your account...
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="p-5 sm:p-6">
                  <LoginHintCard onLogin={openAuthAndRemember} />
                </div>
              ) : passiveLoadError ? (
                <div className="p-5 sm:p-6">
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    {passiveLoadError}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12">
                  <div className="border-b border-slate-800 xl:col-span-4 xl:border-b-0 xl:border-r">
                    <div className="max-h-none xl:max-h-[720px] xl:overflow-y-auto">
                      {isTicketsLoading ? (
                        <div className="p-5 text-sm text-slate-400">Loading tickets...</div>
                      ) : filteredTickets.length === 0 ? (
                        <div className="p-5 text-sm text-slate-400">No tickets found.</div>
                      ) : (
                        <div className="grid gap-3 p-3 sm:p-4 xl:block xl:p-0">
                          {filteredTickets.map((ticket: any) => {
                            const ticketId = getTicketId(ticket);
                            const isActive = selectedTicketId === ticketId;
                            const priorityText = getPriorityText(ticket);
                            const categoryText = getCategoryText(ticket);

                            return (
                              <button
                                key={ticketId}
                                type="button"
                                onClick={() => setSelectedTicketId(ticketId)}
                                className={cx(
                                  "w-full rounded-2xl border border-slate-800 p-4 text-left transition xl:rounded-none xl:border-0 xl:border-b",
                                  isActive
                                    ? "bg-slate-900/70"
                                    : "bg-slate-950/30 hover:bg-slate-900/40"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                                      {ticket?.subject || "Untitled Ticket"}
                                    </h3>
                                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                                      {ticket?.body || "No description"}
                                    </p>
                                  </div>
                                  <ChevronRight
                                    size={16}
                                    className={cx(
                                      "mt-1 shrink-0 text-slate-500 transition",
                                      isActive && "translate-x-0.5 text-emerald-300"
                                    )}
                                  />
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span
                                    className={cx(
                                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                      statusBadgeClass(ticket?.status)
                                    )}
                                  >
                                    {prettifyStatus(ticket?.status)}
                                  </span>

                                  {priorityText ? (
                                    <span
                                      className={cx(
                                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                        priorityBadgeClass(priorityText)
                                      )}
                                    >
                                      {priorityText}
                                    </span>
                                  ) : null}

                                  {categoryText ? (
                                    <span className="inline-flex rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                      {categoryText}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-3 text-[11px] text-slate-500">
                                  {formatDate(ticket?.createdAt)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="xl:col-span-8">
                    {!selectedTicketId ? (
                      <div className="flex min-h-[260px] items-center justify-center p-6 text-center text-sm text-slate-400 sm:p-8 xl:min-h-[720px]">
                        Select a ticket to view the full conversation.
                      </div>
                    ) : (
                      <div className="flex min-h-[320px] flex-col xl:min-h-[720px]">
                        <div className="border-b border-slate-800 p-5 sm:p-6">
                          {isTicketLoading ? (
                            <div className="text-sm text-slate-400">Loading ticket details...</div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0">
                                  <h3 className="break-words text-lg font-semibold text-white sm:text-xl">
                                    {selectedTicket?.subject || "Support Ticket"}
                                  </h3>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                      className={cx(
                                        "inline-flex rounded-full border px-3 py-1.5 text-xs font-medium",
                                        statusBadgeClass(selectedTicket?.status)
                                      )}
                                    >
                                      {prettifyStatus(selectedTicket?.status)}
                                    </span>

                                    {getPriorityText(selectedTicket) ? (
                                      <span
                                        className={cx(
                                          "inline-flex rounded-full border px-3 py-1.5 text-xs font-medium",
                                          priorityBadgeClass(getPriorityText(selectedTicket))
                                        )}
                                      >
                                        {getPriorityText(selectedTicket)}
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="mt-3 text-sm text-slate-400">
                                    Created on {formatDate(selectedTicket?.createdAt)}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 xl:min-w-[220px]">
                                  <div className="text-xs uppercase tracking-wide text-slate-500">
                                    Ticket Summary
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <UserRound size={14} className="text-emerald-300" />
                                    <span>{messages.length} messages</span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Clock3 size={14} className="text-cyan-300" />
                                    <span>
                                      Last updated {formatDate(selectedTicket?.updatedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {selectedTicket?.body ? (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                                  {selectedTicket.body}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-4 bg-slate-950/40 p-4 sm:p-5 xl:max-h-[360px] xl:overflow-y-auto">
                          {isMessagesLoading ? (
                            <div className="text-sm text-slate-400">Loading conversation...</div>
                          ) : messages.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
                              No replies yet. Send a follow-up below.
                            </div>
                          ) : (
                            messages.map((message: any) => {
                              const id =
                                message?.id ||
                                message?._id ||
                                `${message?.createdAt}-${message?.senderType || "msg"}`;
                              const text = message?.body || message?.message || "";
                              const senderType = String(
                                message?.senderType || "support"
                              ).toLowerCase();
                              const isCustomer =
                                senderType === "customer" ||
                                senderType === "user" ||
                                senderType === "client";

                              return (
                                <div
                                  key={id}
                                  className={cx(
                                    "flex",
                                    isCustomer ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <div
                                    className={cx(
                                      "max-w-[94%] rounded-2xl border px-4 py-3 text-sm shadow-sm sm:max-w-[86%]",
                                      isCustomer
                                        ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-50"
                                        : "border-slate-800 bg-slate-900/70 text-slate-200"
                                    )}
                                  >
                                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                                      <span
                                        className={cx(
                                          "rounded-full px-2 py-0.5 font-medium",
                                          isCustomer
                                            ? "bg-emerald-500/15 text-emerald-200"
                                            : "bg-slate-800 text-slate-300"
                                        )}
                                      >
                                        {isCustomer ? "You" : "Support"}
                                      </span>
                                      <span className="text-slate-500">
                                        {formatDate(message?.createdAt)}
                                      </span>
                                    </div>

                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                      {text}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <form
                          onSubmit={handleSendReply}
                          className="border-t border-slate-800 bg-slate-900/40 p-4 sm:p-5"
                        >
                          <FieldLabel>Add Follow-up Message</FieldLabel>

                          <TextAreaField
                            rows={4}
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Add more details, ask for an update, or share the latest issue..."
                          />

                          {replyError ? (
                            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                              <AlertCircle size={16} className="mt-0.5 shrink-0" />
                              <span>{replyError}</span>
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-slate-500">
                              Your follow-up will be added to this ticket thread.
                            </div>

                            <button
                              type="submit"
                              disabled={isSendingReply || !reply.trim()}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSendingReply ? "Sending..." : "Send Message"}
                              <Send size={16} />
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ThemeCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}