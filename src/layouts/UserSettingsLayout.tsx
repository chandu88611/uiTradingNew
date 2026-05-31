import React, { useMemo, useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  User,
  CandlestickChart,
  Grid3X3,
  Menu,
  X,
  LogOut,
  Settings,
  Bitcoin,
  Copy,
  IndianRupee,
  Lock,
  ChevronDown,
  ChevronRight,
  Gift,
} from "lucide-react";
import { FcPlanner } from "react-icons/fc";
import { useGetMyCurrentSubscriptionQuery } from "../services/profileSubscription.api";
import { useRevokeTokenMutation, userApi } from "../services/userApi";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export enum MarketType {
  FOREX = "FOREX",
  CRYPTO = "CRYPTO",
  INDIAN = "INDIAN",
}

const navItemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition border";
const navActive =
  "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
const navIdle =
  "bg-slate-900/20 text-slate-300 border-white/5 hover:bg-slate-900/40 hover:text-white";

const groupHeader =
  "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition border border-white/5 bg-slate-900/15 text-slate-200 hover:bg-slate-900/30";

function getTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/plan")) return "Plans";
  if (pathname.startsWith("/referral-dashboard")) return "Referral Dashboard";

  if (pathname.startsWith("/forex-trading")) return "Forex Trading";
  if (pathname.startsWith("/indian-trading")) return "Indian Trading";
  if (pathname.startsWith("/crypto-trading")) return "Crypto Trading";

  if (pathname.startsWith("/trading/dashboard")) return "Trading Workspace";

  if (pathname.startsWith("/copy-trading/following"))
    return "Copy Trading • Following";
  if (pathname.startsWith("/copy-trading/requests"))
    return "Copy Trading • Requests";
  if (pathname.startsWith("/copy-trading/forex/trader"))
    return "Copy Trading • Forex Trader";
  if (pathname.startsWith("/copy-trading/forex/follower"))
    return "Copy Trading • Forex Follower";
  if (pathname.startsWith("/copy-trading/india/trader"))
    return "Copy Trading • India Trader";
  if (pathname.startsWith("/copy-trading/india/follower"))
    return "Copy Trading • India Follower";
  if (pathname.startsWith("/copy-trading")) return "Copy Trading";

  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

type NavItem =
  | {
      type: "link";
      to: string;
      label: string;
      icon: React.ReactNode;
      end?: boolean;
    }
  | {
      type: "group";
      id: string;
      label: string;
      icon: React.ReactNode;
      items: Array<{
        to: string;
        label: string;
        icon: React.ReactNode;
        end?: boolean;
      }>;
    };

function isExpired(endDate?: string | null) {
  if (!endDate) return false;
  const t = new Date(endDate).getTime();
  return Number.isFinite(t) ? t < Date.now() : false;
}

function normMarketCode(code: any): MarketType | null {
  const s = String(code ?? "").trim().toUpperCase();
  if (s === MarketType.FOREX) return MarketType.FOREX;
  if (s === MarketType.CRYPTO) return MarketType.CRYPTO;
  if (s === MarketType.INDIAN) return MarketType.INDIAN;
  return null;
}

function pickSubscriptionPayload(input: any): { data: any[]; followers: any[] } {
  const root = input ?? {};

  const sub = root?.subscription ?? root?.data?.subscription ?? null;

  const data =
    (Array.isArray(sub?.data) && sub.data) ||
    (Array.isArray(root?.data) && root.data) ||
    (Array.isArray(root?.subscription?.data) && root.subscription.data) ||
    [];

  const followers =
    (Array.isArray(sub?.followers) && sub.followers) ||
    (Array.isArray(root?.followers) && root.followers) ||
    (Array.isArray(root?.subscription?.followers) &&
      root.subscription.followers) ||
    [];

  return { data, followers };
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

export default function UserDashboardLayout({
  onChangePassword,
}: {
  onChangePassword?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [revokeToken, { isLoading: logoutBusy }] = useRevokeTokenMutation();

  const {
    data: subRes,
    isLoading: subLoading,
    isFetching: subFetching,
  } = useGetMyCurrentSubscriptionQuery(undefined as any);

  const { data: subs, followers } = useMemo(
    () => pickSubscriptionPayload(subRes),
    [subRes]
  );

  const subscriptionReady = !subLoading && !subFetching;

  const allowedMarkets = useMemo(() => {
    const set = new Set<MarketType>();
    (subs || []).forEach((s: any) => {
      const statusV2 = String(s?.statusV2 ?? "").trim().toLowerCase();
      if (statusV2 !== "active") return;
      if (isExpired(s?.endDate)) return;

      const m = normMarketCode(s?.plan?.market?.code);
      if (m) set.add(m);
    });
    return set;
  }, [subs]);

  const hasForex = allowedMarkets.has(MarketType.FOREX);
  const hasCrypto = allowedMarkets.has(MarketType.CRYPTO);
  const hasIndian = allowedMarkets.has(MarketType.INDIAN);

  const showTradingGroup = hasForex || hasCrypto || hasIndian;
  const showCopyGroup = (followers?.length ?? 0) > 0 || hasForex || hasIndian;
  const showCopyFollowing = (followers?.length ?? 0) > 1;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    trading: true,
    copy: true,
  });

  const items: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      {
        type: "link",
        to: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={16} />,
        end: true,
      },
      {
        type: "link",
        to: "/profile",
        label: "Profile",
        icon: <User size={16} />,
      },
      {
        type: "link",
        to: "/plan",
        label: "Plans",
        icon: <FcPlanner size={16} />,
      },
      {
        type: "link",
        to: "/referral-dashboard",
        label: "Referral Dashboard",
        icon: <Gift size={16} />,
      },
    ];

    if (showTradingGroup) {
      base.push({
        type: "group",
        id: "trading",
        label: "Trading",
        icon: <Grid3X3 size={16} />,
        items: [
          ...(hasForex
            ? [
                {
                  to: "/forex-trading",
                  label: "Forex Trading",
                  icon: <CandlestickChart size={16} />,
                },
              ]
            : []),
          ...(hasIndian
            ? [
                {
                  to: "/indian-trading",
                  label: "Indian Trading",
                  icon: <IndianRupee size={16} />,
                },
              ]
            : []),
          ...(hasCrypto
            ? [
                {
                  to: "/crypto-trading",
                  label: "Crypto Trading",
                  icon: <Bitcoin size={16} />,
                },
              ]
            : []),
          {
            to: "/trading/dashboard",
            label: "Trading Workspace",
            icon: <Grid3X3 size={16} />,
          },
        ],
      });
    }

    if (showCopyGroup) {
      base.push({
        type: "group",
        id: "copy",
        label: "Copy Trading",
        icon: <Copy size={16} />,
        items: [
          { to: "/copy-trading", label: "Overview", icon: <Copy size={16} /> },
        ],
      });
    }

    base.push({
      type: "link",
      to: "/settings",
      label: "Settings",
      icon: <Settings size={16} />,
    });

    return base;
  }, [showTradingGroup, showCopyGroup, hasForex, hasIndian, hasCrypto]);

  useEffect(() => {
    if (!subscriptionReady) return;

    const p = location.pathname;

    const inForex =
      p.startsWith("/forex-trading") || p.startsWith("/copy-trading/forex");
    const inIndian =
      p.startsWith("/indian-trading") || p.startsWith("/copy-trading/india");
    const inCrypto = p.startsWith("/crypto-trading");
    const inWorkspace = p.startsWith("/trading/dashboard");
    const inCopyFollowing = p.startsWith("/copy-trading/following");

    if (inForex && !hasForex) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (inIndian && !hasIndian) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (inCrypto && !hasCrypto) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (inWorkspace && !showTradingGroup) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (inCopyFollowing && !showCopyFollowing) {
      navigate("/copy-trading", { replace: true });
    }
  }, [
    subscriptionReady,
    location.pathname,
    hasForex,
    hasIndian,
    hasCrypto,
    showTradingGroup,
    showCopyFollowing,
    navigate,
  ]);

  const title = getTitle(location.pathname);

  const handleLogout = async () => {
    try {
      await revokeToken().unwrap();
    } catch (error) {
      console.error("Logout revoke failed:", error);
    } finally {
      clearAuthStorage();
      clearAuthCookies();
      dispatch(userApi.util.resetApiState());

      toast.success("Logged out successfully");
      navigate("/sign-in", { replace: true });
    }
  };

  const Sidebar = (
    <aside
      className={clsx(
        "h-screen shrink-0 border-r border-white/5 bg-[#070b16] sticky top-0 transition-[width] duration-200",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex items-center justify-end px-4 h-14 border-b border-white/5 md:hidden">
        <button
          className="rounded-lg p-2 hover:bg-white/5"
          onClick={() => setOpen(false)}
          aria-label="Close"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <nav className={clsx("p-3 space-y-2", collapsed && "px-2")}>
        {items.map((it) => {
          if (it.type === "link") {
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  clsx(
                    navItemBase,
                    isActive ? navActive : navIdle,
                    collapsed && "justify-center"
                  )
                }
                onClick={() => setOpen(false)}
                title={collapsed ? it.label : undefined}
              >
                <span className="text-slate-300">{it.icon}</span>
                {!collapsed && <span className="truncate">{it.label}</span>}
              </NavLink>
            );
          }

          const isOpen = !!openGroups[it.id];

          if (!it.items || it.items.length === 0) return null;

          return (
            <div key={it.id} className="space-y-2">
              <button
                type="button"
                className={clsx(groupHeader, collapsed && "justify-center")}
                onClick={() =>
                  setOpenGroups((p) => ({ ...p, [it.id]: !p[it.id] }))
                }
                title={collapsed ? it.label : undefined}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-300">{it.icon}</span>
                  {!collapsed && <span>{it.label}</span>}
                </span>

                {!collapsed && (
                  <span className="text-slate-400">
                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                )}
              </button>

              {!collapsed && isOpen ? (
                <div className="pl-2 space-y-2">
                  {it.items.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      end={sub.end}
                      className={({ isActive }) =>
                        clsx(
                          navItemBase,
                          "px-3 py-2 text-[13px]",
                          isActive ? navActive : navIdle
                        )
                      }
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-slate-300">{sub.icon}</span>
                      <span className="truncate">{sub.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onChangePassword?.();
            }}
            className={clsx(
              navItemBase,
              navIdle,
              "w-full justify-start",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Change Password" : undefined}
            disabled={logoutBusy}
          >
            <Lock size={16} />
            {!collapsed && "Change Password"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutBusy}
            className={clsx(
              navItemBase,
              "w-full justify-start bg-rose-500/10 text-rose-200 border-rose-500/20 hover:bg-rose-500/15 disabled:opacity-60",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={16} />
            {!collapsed && (logoutBusy ? "Logging out..." : "Logout")}
          </button>
        </div>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050810]/90 backdrop-blur">
        <div className="w-full px-4 md:px-6 h-14 flex items-center gap-3">
          <button
            className="md:hidden rounded-lg p-2 hover:bg-white/5"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            type="button"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <a href="/">
              <div className="text-sm font-semibold text-white leading-none">
                <img src="/logo.png" width={100} alt="" />
              </div>
            </a>

            <button
              type="button"
              className="hidden md:inline-flex rounded-lg p-2 hover:bg-white/5"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronDown size={18} className="-rotate-90" />
              )}
            </button>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
            <Grid3X3 size={16} />
            <span>{title}</span>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw]">
            {Sidebar}
          </div>
        </div>
      )}

      <div className="flex w-full">
        <div className="hidden md:block">{Sidebar}</div>

        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}