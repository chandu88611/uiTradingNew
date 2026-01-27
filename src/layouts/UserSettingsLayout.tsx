import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { FcPlanner } from "react-icons/fc";
import { FaTrademark } from "react-icons/fa";
import { GiShadowFollower } from "react-icons/gi";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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

  if (pathname.startsWith("/forex-trading")) return "Forex Trading";
  if (pathname.startsWith("/indian-trading")) return "Indian Trading";
  if (pathname.startsWith("/crypto-trading")) return "Crypto Trading";

  if (pathname.startsWith("/trading/dashboard")) return "Trading Workspace";

  // Copy Trading (more specific first)
  if (pathname.startsWith("/copy-trading/forex/trader")) return "Copy Trading • Forex Trader";
  if (pathname.startsWith("/copy-trading/forex/follower")) return "Copy Trading • Forex Follower";
  if (pathname.startsWith("/copy-trading/india/trader")) return "Copy Trading • India Trader";
  if (pathname.startsWith("/copy-trading/india/follower")) return "Copy Trading • India Follower";
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

export default function UserDashboardLayout({
  onChangePassword,
}: {
  onChangePassword?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Collapsible groups (keeps sidebar clean + no "nonsense")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    trading: true,
    copy: true,
  });

  const items: NavItem[] = useMemo(
    () => [
      { type: "link", to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} />, end: true },
      { type: "link", to: "/profile", label: "Profile", icon: <User size={16} /> },
      { type: "link", to: "/plan", label: "Plans", icon: <FcPlanner size={16} /> },

      // ✅ Trading group (split pages)
      {
        type: "group",
        id: "trading",
        label: "Trading",
        icon: <Grid3X3 size={16} />,
        items: [
          { to: "/forex-trading", label: "Forex Trading", icon: <CandlestickChart size={16} /> },
          { to: "/indian-trading", label: "Indian Trading", icon: <IndianRupee size={16} /> },
          { to: "/crypto-trading", label: "Crypto Trading", icon: <Bitcoin size={16} /> },
          { to: "/trading/dashboard", label: "Trading Workspace", icon: <Grid3X3 size={16} /> },
        ],
      },

      // ✅ Copy trading group (keeps it tidy)
      {
        type: "group",
        id: "copy",
        label: "Copy Trading",
        icon: <Copy size={16} />,
        items: [
          { to: "/copy-trading", label: "Overview", icon: <Copy size={16} /> },
          { to: "/copy-trading/forex/trader", label: "Forex • Trader", icon: <FaTrademark size={16} /> },
          { to: "/copy-trading/forex/follower", label: "Forex • Follower", icon: <GiShadowFollower size={16} /> },
          { to: "/copy-trading/india/trader", label: "India • Trader", icon: <FaTrademark size={16} /> },
          { to: "/copy-trading/india/follower", label: "India • Follower", icon: <GiShadowFollower size={16} /> },
        ],
      },

      { type: "link", to: "/settings", label: "Settings", icon: <Settings size={16} /> },
    ],
    []
  );

  const title = getTitle(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/", { replace: true });
  };

  const Sidebar = (
    <aside className="h-screen w-72 shrink-0 border-r border-white/5 bg-[#070b16] sticky top-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="text-white">
          <div className="text-sm font-semibold leading-none">Algo Web</div>
          <div className="text-[11px] text-slate-400 mt-1">User Dashboard</div>
        </div>

        <button
          className="md:hidden rounded-lg p-2 hover:bg-white/5"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="p-4 space-y-2">
        {items.map((it) => {
          if (it.type === "link") {
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) => clsx(navItemBase, isActive ? navActive : navIdle)}
                onClick={() => setOpen(false)}
              >
                <span className="text-slate-300">{it.icon}</span>
                <span className="truncate">{it.label}</span>
              </NavLink>
            );
          }

          const isOpen = !!openGroups[it.id];

          return (
            <div key={it.id} className="space-y-2">
              <button
                type="button"
                className={groupHeader}
                onClick={() => setOpenGroups((p) => ({ ...p, [it.id]: !p[it.id] }))}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-300">{it.icon}</span>
                  <span>{it.label}</span>
                </span>

                <span className="text-slate-400">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>

              {isOpen ? (
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
            className={clsx(navItemBase, navIdle, "w-full justify-start")}
          >
            <Lock size={16} />
            Change Password
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={clsx(
              navItemBase,
              "w-full justify-start bg-rose-500/10 text-rose-200 border-rose-500/20 hover:bg-rose-500/15"
            )}
          >
            <LogOut size={16} />
            Logout
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
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-white leading-none">{title}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Profile • Plans • Trading • Copy Trading
            </div>
          </div>

          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
            <Grid3X3 size={16} />
            <span>Workspace Ready</span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw]">{Sidebar}</div>
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
