import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Search, User2, LogIn } from "lucide-react";
import { useMeQuery } from "../services/userApi";

type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Markets",
    children: [
      { label: "Equity & F&O", href: "/markets/equity" },
      { label: "Forex", href: "/markets/forex" },
      { label: "Commodities", href: "/markets/commodities" },
      { label: "Crypto", href: "/markets/crypto" },
    ],
  },
  { label: "Strategies", href: "/strategies" },
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

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeAllMenus = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    const path = window.location.pathname;
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href + "/");
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

  // ✅ SAME auth logic as Subscription page
  const {
    data: meRes,
    isLoading: meLoading,
    isFetching: meFetching,
    isError: meError,
  } = useMeQuery(undefined, { refetchOnMountOrArgChange: true } as any);

  const me = (meRes as any)?.data ?? meRes;
  const isAuthenticated = Boolean(me?.id || me?.user?.id);
  const authReady = !(meLoading || meFetching);

  // optional: avoid showing dropdown open when mobile menu closed
  useEffect(() => {
    if (!mobileOpen) setOpenDropdown(null);
  }, [mobileOpen]);

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Left: Logo */}
        <a
          href="/"
          onClick={closeAllMenus}
          className="flex items-center gap-2 rounded-xl bg-slate-900/70 px-2 py-1 md:bg-transparent md:px-0 md:py-0"
        >
          <img src="/logo.png" alt="Logo" className="h-7 w-auto md:h-8" />
        </a>

        {/* Center: Desktop nav */}
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
                                <a
                                  href={child.href}
                                  onClick={closeAllMenus}
                                  className={`block rounded-xl px-3 py-2 transition ${
                                    isActive(child.href)
                                      ? "bg-emerald-500/15 text-emerald-200"
                                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                                  }`}
                                >
                                  {child.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <a
                    href={item.href}
                    onClick={closeAllMenus}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${desktopActiveClass(
                      item.href
                    )}`}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <a
            href="/search"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white md:flex"
            aria-label="Search"
          >
            <Search size={16} />
          </a>

          {/* ✅ Account vs Sign in / Sign up (using /me auth) */}
          {!authReady ? (
            // Optional: show small skeleton while /me resolves (prevents flicker)
            <div className="hidden h-9 w-28 rounded-full border border-slate-800 bg-slate-900/70 md:block animate-pulse" />
          ) : isAuthenticated ? (
            <a
              href="/profile"
              className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-slate-700 hover:bg-slate-800 md:inline-flex"
            >
              <User2 size={16} />
              <span>Account</span>
            </a>
          ) : (
            <a
              href="/sign-in"
              className="hidden items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400 md:inline-flex"
            >
              <LogIn size={16} />
              <span>Sign in / Sign up</span>
            </a>
          )}

          {/* Mobile menu button */}
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

      {/* Mobile menu */}
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
              {/* Quick actions */}
              <div className="mb-3 flex items-center gap-2">
                <a
                  href="/search"
                  onClick={closeAllMenus}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2 text-[13px] text-slate-100"
                >
                  <Search size={16} />
                  <span>Search</span>
                </a>

                {!authReady ? (
                  <div className="flex flex-1 rounded-xl bg-slate-900/80 px-3 py-2 animate-pulse">
                    <div className="h-4 w-24 bg-slate-800/80 rounded" />
                  </div>
                ) : isAuthenticated ? (
                  <a
                    href="/profile"
                    onClick={closeAllMenus}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2 text-[13px] text-slate-100"
                  >
                    <User2 size={16} />
                    <span>Account</span>
                  </a>
                ) : (
                  <a
                    href="/sig-in"
                    onClick={closeAllMenus}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-[13px] font-semibold text-slate-950"
                  >
                    <LogIn size={16} />
                    <span>Sign in</span>
                  </a>
                )}
              </div>

              {/* Links */}
              <div className="space-y-2">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown((p) => (p === item.label ? null : item.label))
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
                                  <a
                                    href={child.href}
                                    onClick={closeAllMenus}
                                    className={`block rounded-xl px-3 py-2 text-[13px] transition ${
                                      isActive(child.href)
                                        ? "bg-emerald-500/15 text-emerald-200"
                                        : "text-slate-200 hover:bg-slate-900/80"
                                    }`}
                                  >
                                    {child.label}
                                  </a>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <a
                        href={item.href}
                        onClick={closeAllMenus}
                        className={`block rounded-xl bg-slate-900/80 px-3 py-2.5 text-[13px] transition ${
                          isActive(item.href)
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "text-slate-100"
                        }`}
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile CTA */}
              <a
                href="/strategies"
                onClick={closeAllMenus}
                className="mt-4 flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-950"
              >
                Start Copy Trading
              </a>

              {/* optional debug hint */}
              {!meLoading && meError && (
                <p className="mt-3 text-[11px] text-yellow-400">
                  Auth check failed (/me). If you are logged in, ensure baseApi uses credentials: "include".
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
