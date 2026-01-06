import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  CandlestickChart,
  Grid3X3,
  Zap,
  Lock,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { FcPlanner } from "react-icons/fc";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const navItemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition border";
const navActive =
  "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
const navIdle =
  "bg-slate-900/20 text-slate-300 border-white/5 hover:bg-slate-900/40 hover:text-white";

function getTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/forex-trading")) return "Forex Trading";
  if (pathname.startsWith("/indian-trading")) return "Indian Trading";
  if (pathname.startsWith("/trading/dashboard")) return "Trading Workspace";
  if (pathname.startsWith("/copy-trading")) return "Copy Trading";
  if (pathname.startsWith("/plan")) return "Plans";
  return "Dashboard";
}

export default function UserDashboardLayout({
  onChangePassword,
}: {
  onChangePassword?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { to: "/profile", label: "Profile", icon: <User size={16} /> },
      { to: "/plan", label: "Plans", icon: <FcPlanner size={16} /> },

      // ✅ Separate trading pages
      { to: "/forex-trading", label: "Forex Trading", icon: <CandlestickChart size={16} /> },
      { to: "/indian-trading", label: "Indian Trading", icon: <Grid3X3 size={16} /> },

      { to: "/trading/dashboard", label: "Trading Workspace", icon: <Grid3X3 size={16} /> },
      { to: "/copy-trading", label: "Copy Trading", icon: <Zap size={16} /> },
    ],
    []
  );

  const title = getTitle(location.pathname);

  const handleLogout = () => {
    // ✅ adjust to your logout logic
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
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/dashboard"}
            className={({ isActive }) =>
              clsx(navItemBase, isActive ? navActive : navIdle)
            }
            onClick={() => setOpen(false)}
          >
            <span className="text-slate-300">{it.icon}</span>
            <span className="truncate">{it.label}</span>
          </NavLink>
        ))}

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
      {/* ✅ Top bar full width */}
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
            <div className="text-sm font-semibold text-white leading-none">
              {title}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Profile • Forex • India • Workspace • Copy Trading
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
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw]">
            {Sidebar}
          </div>
        </div>
      )}

      {/* ✅ Full width layout (no max-w container) */}
      <div className="flex w-full">
        <div className="hidden md:block">{Sidebar}</div>

        {/* ✅ remove extra top spacing; keep neat padding */}
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
