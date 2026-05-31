// src/components/Header.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Menu,
  X,
  ChevronDown,
  Search,
  User2,
  LogIn,
  Bell,
  RefreshCw,
  CheckCircle2,
  XCircle,
  LogOut,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  useMeQuery,
  useRevokeTokenMutation,
  userApi,
} from "../services/userApi";

import {
  useGetCopyTradingRequestsQuery,
  useAllowCopyTradingMutation,
  useGetTradeAlertsQuery,
  useMarkTradeAlertReadMutation,
  useMarkAllTradeAlertsReadMutation,
  type CopyTradingRequestItem,
  type TradeNotificationAlert,
} from "../services/copyTrading.api";

import RightSlideOver from "./RightSlideOver";

type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

type NotificationTab = "alerts" | "requests";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support", href: "/support" },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

function fmtTime(iso: any) {
  const s = String(iso ?? "").trim();
  if (!s) return "—";

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  return d.toLocaleString();
}

function statusPill(statusRaw: any) {
  const s = String(statusRaw ?? "pending").toUpperCase();

  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold";

  if (s === "PENDING") {
    return `${base} border-amber-400/30 bg-amber-500/10 text-amber-200`;
  }

  if (s === "APPROVED" || s === "ACTIVE") {
    return `${base} border-emerald-400/30 bg-emerald-500/10 text-emerald-200`;
  }

  if (s === "REJECTED" || s === "STOPPED") {
    return `${base} border-rose-400/30 bg-rose-500/10 text-rose-200`;
  }

  return `${base} border-slate-700 bg-slate-900/40 text-slate-200`;
}

function getAlertAction(alert: any) {
  const action = String(alert?.action ?? "").trim().toUpperCase();

  if (action === "BUY" || action === "SELL" || action === "HOLD") {
    return action;
  }

  return null;
}

function alertActionPill(actionRaw: any) {
  const action = String(actionRaw ?? "").toUpperCase();

  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold";

  if (action === "BUY") {
    return `${base} border-emerald-400/30 bg-emerald-500/10 text-emerald-200`;
  }

  if (action === "SELL") {
    return `${base} border-rose-400/30 bg-rose-500/10 text-rose-200`;
  }

  return `${base} border-amber-400/30 bg-amber-500/10 text-amber-200`;
}

function getAlertId(alert: any) {
  return alert?.id ?? alert?.tradeAlertId ?? alert?.alertId ?? alert?._id;
}

function isAlertUnread(alert: any) {
  if (typeof alert?.isRead === "boolean") return !alert.isRead;
  if (typeof alert?.read === "boolean") return !alert.read;
  if (typeof alert?.unread === "boolean") return alert.unread;

  return !alert?.readAt && !alert?.read_at;
}

function extractRequests(res: any): CopyTradingRequestItem[] {
  if (Array.isArray(res)) return res;

  const root = res ?? null;
  if (!root) return [];

  const candidates = [
    root?.requests,
    root?.data?.requests,
    root?.data?.data?.requests,
    root?.items,
    root?.data?.items,
    root?.data?.data?.items,
    root?.rows,
    root?.data?.rows,
    root?.data,
    root?.data?.data,
    root,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  return [];
}

function extractAlerts(res: any): TradeNotificationAlert[] {
  if (Array.isArray(res)) return res;

  const root = res ?? null;
  if (!root) return [];

  const candidates = [
    root?.alerts,
    root?.data?.alerts,
    root?.data?.data?.alerts,
    root?.items,
    root?.data?.items,
    root?.data?.data?.items,
    root?.rows,
    root?.data?.rows,
    root?.data,
    root?.data?.data,
    root,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  return [];
}

function getAlertTime(alert: any) {
  return alert?.alertTime || alert?.createdAt || alert?.barTime;
}

function formatNumber(value: any, decimals = 2) {
  if (value === null || value === undefined || value === "") return "—";

  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);

  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function clearAuthStorage() {
  const keys = [
    "token",
    "authToken",
    "accessToken",
    "refreshToken",
    "user",
    "me",
    "profile",
  ];

  keys.forEach((key) => {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {}
  });
}

function clearAuthCookies() {
  const cookieNames = [
    "token",
    "authToken",
    "access_token",
    "refresh_token",
    "accessToken",
    "refreshToken",
    "connect.sid",
    "session",
    "sessionId",
  ];

  const hostname = window.location.hostname;
  const hostParts = hostname.split(".");
  const domains = new Set<string>([hostname, `.${hostname}`]);

  if (hostParts.length >= 2) {
    const rootDomain = `${hostParts[hostParts.length - 2]}.${
      hostParts[hostParts.length - 1]
    }`;

    domains.add(rootDomain);
    domains.add(`.${rootDomain}`);
  }

  cookieNames.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    document.cookie = `${name}=; Max-Age=0; path=/;`;

    domains.forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain};`;
    });
  });
}

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const pathname = location.pathname;

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<NotificationTab>("alerts");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [didLogout, setDidLogout] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const [revokeToken, { isLoading: logoutBusy }] = useRevokeTokenMutation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);

    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const closeAllMenus = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setAccountMenuOpen(false);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";

    return pathname === href || pathname.startsWith(href + "/");
  };

  const desktopActiveClass = (href?: string) =>
    isActive(href)
      ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25"
      : "text-slate-200 hover:bg-slate-900/70 hover:text-white";

  const headerClass = useMemo(() => {
    return `fixed inset-x-0 top-0 z-40 transition-all duration-200 ${
      isScrolled
        ? "bg-slate-950/85 backdrop-blur border-b border-slate-800/70 shadow-lg shadow-black/40"
        : "bg-slate-950/70 backdrop-blur border-b border-slate-900/50"
    }`;
  }, [isScrolled]);

  const {
    data: meRes,
    isLoading: meLoading,
    isFetching: meFetching,
  } = useMeQuery(undefined, {
    skip: didLogout,
    refetchOnMountOrArgChange: true,
  } as any);

  const me = (meRes as any)?.data ?? meRes;
  const serverAuthenticated = Boolean(me?.id || me?.user?.id);
  const isAuthenticated = !didLogout && serverAuthenticated;
  const authReady = didLogout ? true : !(meLoading || meFetching);

  const displayName =
    me?.name ||
    me?.fullName ||
    me?.user?.name ||
    me?.user?.fullName ||
    "Account";

  const {
    data: reqRes,
    isLoading: reqLoading,
    isFetching: reqFetching,
    isError: reqError,
    refetch: refetchRequests,
  } = useGetCopyTradingRequestsQuery(
    isAuthenticated
      ? ({ start: 0, count: 10, searchParams: null } as any)
      : (undefined as any),
    {
      skip: !isAuthenticated,
      refetchOnMountOrArgChange: true,
    } as any
  );

  const {
    data: alertsRes,
    isLoading: alertsLoading,
    isFetching: alertsFetching,
    isError: alertsError,
    refetch: refetchAlerts,
  } = useGetTradeAlertsQuery(
    isAuthenticated
      ? ({ start: 0, count: 20, unreadOnly: false } as any)
      : (undefined as any),
    {
      skip: !isAuthenticated,
      refetchOnMountOrArgChange: true,
    } as any
  );

  const [allowCopyTrading, { isLoading: allowBusy }] =
    useAllowCopyTradingMutation();

  const [markTradeAlertRead, { isLoading: markAlertBusy }] =
    useMarkTradeAlertReadMutation();

  const [markAllTradeAlertsRead, { isLoading: markAllAlertsBusy }] =
    useMarkAllTradeAlertsReadMutation();

  const requests: CopyTradingRequestItem[] = useMemo(() => {
    return extractRequests(reqRes);
  }, [reqRes]);

  const alerts: TradeNotificationAlert[] = useMemo(() => {
    return extractAlerts(alertsRes);
  }, [alertsRes]);

  const pendingCount = useMemo(() => {
    return (requests ?? []).filter(
      (r: any) => String(r?.status ?? "pending").toLowerCase() === "pending"
    ).length;
  }, [requests]);

  const unreadAlertCount = useMemo(() => {
    return (alerts ?? []).filter((a: any) => isAlertUnread(a)).length;
  }, [alerts]);

  const notificationCount = pendingCount + unreadAlertCount;

  const openNotifications = (tab: NotificationTab = "alerts") => {
    setNotifTab(tab);
    setNotifOpen(true);
    refetchRequests();
    refetchAlerts();
  };

  const onDecide = async (item: any, allow: boolean) => {
    const requestId = Number(item?.id);

    if (!Number.isFinite(requestId)) {
      toast.error("Invalid request payload");
      return;
    }

    try {
      await allowCopyTrading({
        approve: allow,
        urequestId: requestId,
      }).unwrap();

      toast.success(allow ? "Request approved" : "Request rejected");
      refetchRequests();
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to update request");
    }
  };

  const onMarkAlertRead = async (alert: TradeNotificationAlert) => {
    const alertId = getAlertId(alert);

    if (!alertId) {
      toast.error("Invalid alert payload");
      return;
    }

    try {
      await markTradeAlertRead(alertId).unwrap();
      toast.success("Alert marked as read");
      refetchAlerts();
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to mark alert read");
    }
  };

  const onMarkAllAlertsRead = async () => {
    try {
      await markAllTradeAlertsRead().unwrap();
      toast.success("All alerts marked as read");
      refetchAlerts();
    } catch (e: any) {
      toast.error(
        e?.data?.message || e?.message || "Failed to mark all alerts read"
      );
    }
  };

  const handleLogout = async () => {
    try {
      await revokeToken().unwrap();
    } catch (error) {
      console.error("Logout revoke failed:", error);
    } finally {
      setDidLogout(true);

      clearAuthStorage();
      clearAuthCookies();
      dispatch(userApi.util.resetApiState());

      setNotifOpen(false);
      closeAllMenus();

      toast.success("Logged out successfully");
      navigate("/sign-in", { replace: true });
    }
  };

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link
          to="/"
          onClick={closeAllMenus}
          className="flex items-center gap-2 rounded-xl bg-slate-900/70 px-2 py-1 md:bg-transparent md:px-0 md:py-0"
        >
          <img src="/logo.png" alt="Logo" className="h-7 w-auto md:h-8" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center md:flex">
          <ul className="flex items-center gap-2 lg:gap-3">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => item.children && setOpenDropdown(null)}
              >
                {item.children ? (
                  <>
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition ${desktopActiveClass(
                        item.href
                      )}`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={dropdownVariants}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 mt-3 w-56 rounded-2xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-2xl shadow-black/70"
                        >
                          <ul className="space-y-0.5 text-sm">
                            {item.children.map((child) => (
                              <li key={child.label}>
                                <Link
                                  to={child.href}
                                  onClick={closeAllMenus}
                                  className={`block rounded-xl px-3 py-2 transition ${
                                    isActive(child.href)
                                      ? "bg-emerald-500/15 text-emerald-200"
                                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={item.href || "/"}
                    onClick={closeAllMenus}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${desktopActiveClass(
                      item.href
                    )}`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white md:flex"
            aria-label="Search"
          >
            <Search size={16} />
          </Link>

          {authReady && isAuthenticated ? (
            <button
              type="button"
              onClick={() => openNotifications("alerts")}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={16} />

              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : null}
            </button>
          ) : null}

          {!authReady ? (
            <div className="hidden h-9 w-28 animate-pulse rounded-full border border-slate-800 bg-slate-900/70 md:block" />
          ) : isAuthenticated ? (
            <div className="relative hidden md:block" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-700 hover:bg-slate-800"
              >
                <User2 size={16} />
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    accountMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={dropdownVariants}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-2xl shadow-black/70"
                  >
                    <div className="mb-2 border-b border-slate-800 px-3 pb-2">
                      <div className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </div>

                      <div className="truncate text-xs text-slate-400">
                        {me?.email || me?.user?.email || "Signed in"}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={closeAllMenus}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800/80 hover:text-white"
                    >
                      <User2 size={15} />
                      Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        openNotifications("alerts");
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800/80 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Bell size={15} />
                        Notifications
                      </span>

                      {notificationCount > 0 ? (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </span>
                      ) : null}
                    </button>

                    <Link
                      to="/support"
                      onClick={closeAllMenus}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800/80 hover:text-white"
                    >
                      <Bell size={15} />
                      Support
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={logoutBusy}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-60"
                    >
                      <LogOut size={15} />
                      {logoutBusy ? "Logging out..." : "Log out"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400"
              >
                <LogIn size={16} />
                <span>Sign in</span>
              </Link>

              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-slate-700 hover:bg-slate-800"
              >
                <span>Sign up</span>
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileMenuVariants}
            transition={{ duration: 0.15 }}
            className="md:hidden"
          >
            <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 pb-4 pt-3 text-sm text-slate-100">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown((p) =>
                              p === item.label ? null : item.label
                            )
                          }
                          className="flex w-full items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 text-left text-[13px] text-slate-100"
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              openDropdown === item.label ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {openDropdown === item.label && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden pl-2"
                            >
                              {item.children.map((child) => (
                                <li key={child.label}>
                                  <Link
                                    to={child.href}
                                    onClick={closeAllMenus}
                                    className={`block rounded-xl px-3 py-2 text-[13px] transition ${
                                      isActive(child.href)
                                        ? "bg-emerald-500/15 text-emerald-200"
                                        : "text-slate-200 hover:bg-slate-900/80"
                                    }`}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        to={item.href || "/"}
                        onClick={closeAllMenus}
                        className={`block rounded-xl bg-slate-900/80 px-3 py-2.5 text-[13px] transition ${
                          isActive(item.href)
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "text-slate-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}

                <div className="mt-3 border-t border-slate-800 pt-3">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          openNotifications("alerts");
                        }}
                        className="flex w-full items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 text-left text-[13px] text-slate-100"
                      >
                        <span>Notifications</span>

                        {notificationCount > 0 ? (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        ) : null}
                      </button>

                      <Link
                        to="/profile"
                        onClick={closeAllMenus}
                        className="block rounded-xl bg-slate-900/80 px-3 py-2.5 text-[13px] text-slate-100"
                      >
                        Profile
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutBusy}
                        className="block w-full rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-left text-[13px] text-rose-200 disabled:opacity-60"
                      >
                        {logoutBusy ? "Logging out..." : "Log out"}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/sign-in"
                        onClick={closeAllMenus}
                        className="block rounded-xl bg-emerald-500 px-3 py-2.5 text-center text-[13px] font-semibold text-slate-950"
                      >
                        Sign in
                      </Link>

                      <Link
                        to="/sign-up"
                        onClick={closeAllMenus}
                        className="block rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-center text-[13px] font-semibold text-slate-100"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RightSlideOver
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        subtitle="Trade alerts and copy trading requests"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setNotifTab("alerts")}
              className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                notifTab === "alerts"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Alerts
              {unreadAlertCount > 0 ? (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    notifTab === "alerts"
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-emerald-500 text-slate-950"
                  }`}
                >
                  {unreadAlertCount > 99 ? "99+" : unreadAlertCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setNotifTab("requests")}
              className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                notifTab === "requests"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Requests
              {pendingCount > 0 ? (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    notifTab === "requests"
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-emerald-500 text-slate-950"
                  }`}
                >
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {notifTab === "alerts" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Trade Alerts
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Latest alerts from your trading account.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onMarkAllAlertsRead}
                  disabled={
                    unreadAlertCount === 0 ||
                    markAllAlertsBusy ||
                    alertsLoading ||
                    alertsFetching
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  Read all
                </button>

                <button
                  type="button"
                  onClick={() => refetchAlerts()}
                  disabled={alertsLoading || alertsFetching}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                >
                  <RefreshCw
                    size={14}
                    className={
                      alertsLoading || alertsFetching ? "animate-spin" : ""
                    }
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {alertsError ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Failed to load alerts.
                </div>
              ) : alertsLoading || alertsFetching ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  Loading alerts…
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <div className="text-sm font-semibold text-slate-100">
                    No alerts found
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Trade alerts will appear here.
                  </div>
                </div>
              ) : (
                alerts.map((alert: TradeNotificationAlert) => {
                  const alertId = getAlertId(alert);
                  const unread = isAlertUnread(alert);
                  const action = getAlertAction(alert);

                  return (
                    <div
                      key={String(alertId ?? alert.id)}
                      className={`rounded-2xl border p-4 transition hover:border-white/20 ${
                        unread
                          ? "border-emerald-400/25 bg-emerald-500/10"
                          : "border-white/10 bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {unread ? (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
                            ) : null}

                            <div className="truncate text-sm font-semibold text-slate-100">
                              {alert.ticker || alert.title || "Trade Alert"}
                            </div>

                            {action ? (
                              <span className={alertActionPill(action)}>
                                {action}
                              </span>
                            ) : null}

                            {alert.exchange ? (
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                {String(alert.exchange)}
                              </span>
                            ) : null}

                            {alert.interval ? (
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                {String(alert.interval)}m
                              </span>
                            ) : null}
                          </div>

                          {(alert.message || alert.description) && (
                            <p className="mt-2 text-sm leading-5 text-slate-300">
                              {String(alert.message || alert.description)}
                            </p>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                            <div className="text-slate-400">
                              Open:{" "}
                              <span className="text-slate-200">
                                {formatNumber(alert.open)}
                              </span>
                            </div>

                            <div className="text-slate-400">
                              Close:{" "}
                              <span className="text-slate-200">
                                {formatNumber(alert.close)}
                              </span>
                            </div>

                            <div className="text-slate-400">
                              High:{" "}
                              <span className="text-slate-200">
                                {formatNumber(alert.high)}
                              </span>
                            </div>

                            <div className="text-slate-400">
                              Low:{" "}
                              <span className="text-slate-200">
                                {formatNumber(alert.low)}
                              </span>
                            </div>

                            <div className="text-slate-400">
                              Volume:{" "}
                              <span className="text-slate-200">
                                {formatNumber(alert.volume, 4)}
                              </span>
                            </div>

                            <div className="text-slate-400">
                              Strength:{" "}
                              <span className="text-slate-200">
                                {formatNumber(alert.tradingStrength, 2)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                            <span>
                              Alert ID:{" "}
                              <span className="text-slate-200">
                                {String(alertId ?? alert.id)}
                              </span>
                            </span>

                            <span>
                              Alert Time:{" "}
                              <span className="text-slate-200">
                                {fmtTime(getAlertTime(alert))}
                              </span>
                            </span>

                            {alert.strategyId ? (
                              <span>
                                Strategy:{" "}
                                <span className="text-slate-200">
                                  {String(alert.strategyId)}
                                </span>
                              </span>
                            ) : null}

                            {alert.planId ? (
                              <span>
                                Plan:{" "}
                                <span className="text-slate-200">
                                  {String(alert.planId)}
                                </span>
                              </span>
                            ) : null}

                            {alert.adminStrategyTradeId ? (
                              <span>
                                Trade:{" "}
                                <span className="text-slate-200">
                                  {String(alert.adminStrategyTradeId)}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {unread ? (
                          <button
                            type="button"
                            onClick={() => onMarkAlertRead(alert)}
                            disabled={markAlertBusy}
                            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark read
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Copy Trading Requests
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Approve or reject follower requests.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refetchRequests()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                disabled={reqLoading || reqFetching}
              >
                <RefreshCw
                  size={14}
                  className={reqLoading || reqFetching ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {reqError ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Failed to load requests.
                </div>
              ) : reqLoading || reqFetching ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  Loading requests…
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <div className="text-sm font-semibold text-slate-100">
                    No requests
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    New copy trading requests will appear here.
                  </div>
                </div>
              ) : (
                requests.map((r: any) => {
                  const master = r?.master ?? null;

                  const masterLabel =
                    master?.accountLabel ??
                    master?.account_label ??
                    (master?.accountMeta?.mt5LoginId
                      ? `MT5 • ${master.accountMeta.mt5LoginId}`
                      : null) ??
                    (master?.accountId ? String(master.accountId) : "—");

                  const masterUser = master?.user ?? null;

                  const masterOwner =
                    masterUser?.name || masterUser?.email
                      ? `${masterUser?.name ?? ""}${
                          masterUser?.email ? ` • ${masterUser.email}` : ""
                        }`
                      : "—";

                  const status = String(r?.status ?? "pending").toLowerCase();
                  const isPending = status === "pending";

                  return (
                    <div
                      key={String(r.id)}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-100">
                              Request #{String(r.id)}
                            </div>

                            <span className={statusPill(r?.status)}>
                              {String(r?.status ?? "pending").toUpperCase()}
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-slate-400">
                            Requested:{" "}
                            <span className="text-slate-200">
                              {fmtTime(r?.requestedAt)}
                            </span>
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                              Master
                            </div>

                            <div className="mt-2 grid gap-1 text-xs">
                              <div className="text-slate-400">
                                Master ID:{" "}
                                <span className="text-slate-200">
                                  {String(
                                    r?.masterId ?? r?.masterAccountId ?? "—"
                                  )}
                                </span>
                              </div>

                              <div className="text-slate-400">
                                Account:{" "}
                                <span className="text-slate-200">
                                  {String(masterLabel)}
                                </span>
                              </div>

                              <div className="text-slate-400">
                                Owner:{" "}
                                <span className="text-slate-200">
                                  {String(masterOwner)}
                                </span>
                              </div>

                              {r?.type ? (
                                <div className="text-slate-400">
                                  Market:{" "}
                                  <span className="text-slate-200">
                                    {String(r.type)}
                                  </span>
                                </div>
                              ) : null}

                              {r?.userTradingAccountId ? (
                                <div className="text-slate-400">
                                  User trading account:{" "}
                                  <span className="text-slate-200">
                                    {String(r.userTradingAccountId)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => onDecide(r, true)}
                            disabled={allowBusy || !isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => onDecide(r, false)}
                            disabled={allowBusy || !isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </RightSlideOver>
    </header>
  );
};

export default Header;