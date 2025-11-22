import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Globe2,
  Search,
  Lock,
  HelpCircle,
  ArrowRight,
  Clock4,
} from "lucide-react";

type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  {
    label: "Markets",
    children: [
      { label: "Equity & F&O", href: "#" },
      { label: "Forex", href: "#" },
      { label: "Commodities", href: "#" },
      { label: "Crypto", href: "#" },
    ],
  },
  {
    label: "Strategies",
    children: [
      { label: "Intraday", href: "#" },
      { label: "Swing", href: "#" },
      { label: "Options", href: "#" },
    ],
  },
  {
    label: "Education",
    children: [
      { label: "Courses", href: "#" },
      { label: "Webinars", href: "#" },
      { label: "Docs & Guides", href: "#" },
    ],
  },
  { label: "Support", href: "#" },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [clientType, setClientType] = useState<"clients" | "partners">(
    "clients"
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  const closeAllMenus = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-shadow duration-200 ${
        isScrolled
          ? "bg-slate-950/90 backdrop-blur shadow-lg shadow-slate-900/70"
          : "bg-slate-950/80 backdrop-blur"
      }`}
    >
      {/* Top info bar (desktop only) */}
      <div className="hidden border-b border-slate-800/70 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Clock4 size={14} />
            </span>
            <div className="flex gap-6">
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-100">Stock:</span>
                9:30 am – 4:00 pm
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-100">Forex:</span> 24×5
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-100">Commodities:</span>
                8:00 am – 5:00 pm
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clients / Partners toggle */}
            <div className="hidden items-center rounded-full bg-slate-900/80 p-0.5 text-[11px] md:flex">
              <button
                onClick={() => setClientType("clients")}
                className={`rounded-full px-3 py-1 transition ${
                  clientType === "clients"
                    ? "bg-emerald-500 text-slate-950 shadow-soft-glow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setClientType("partners")}
                className={`rounded-full px-3 py-1 transition ${
                  clientType === "partners"
                    ? "bg-emerald-500 text-slate-950 shadow-soft-glow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Partners
              </button>
            </div>

            {/* My Portal + Help Center */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-white">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80">
                  <Lock size={13} />
                </span>
                <span className="flex flex-col text-left leading-tight">
                  <span className="font-semibold text-slate-100">
                    My Portal
                  </span>
                  <span>Login or Register</span>
                </span>
              </button>
              <button className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-white">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80">
                  <HelpCircle size={13} />
                </span>
                <span className="flex flex-col text-left leading-tight">
                  <span className="font-semibold text-slate-100">
                    Help Center
                  </span>
                  <span>FAQ, Chat, Tutorials</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav row */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Left: Logo + mobile stock chip */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-2 py-1 md:bg-transparent md:px-0 md:py-0"
          >
            <img
              src="assets/images/resources/logo-1.png"
              alt="Logo"
              className="h-7 w-auto md:h-8"
            />
            <span className="hidden text-sm font-semibold tracking-tight text-slate-100 md:inline">
              Tradebro
            </span>
          </a>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 md:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Master stream live
          </span>
        </div>

        {/* Center: Desktop navigation */}
        <nav className="hidden flex-1 items-center justify-center md:flex">
          <ul className="flex items-center gap-4 lg:gap-6">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="relative"
                // DESKTOP: open on hover
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => item.children && setOpenDropdown(null)}
              >
                {item.children ? (
                  <>
                    <button
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-900/80 hover:text-white"
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
                          className="absolute left-0 mt-3 w-52 rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl shadow-black/70"
                        >
                          <ul className="space-y-0.5 text-sm">
                            {item.children.map((child) => (
                              <li key={child.label}>
                                <a
                                  href={child.href}
                                  className="block rounded-xl px-3 py-2 text-slate-200 transition hover:bg-slate-800 hover:text-white"
                                  onClick={closeAllMenus}
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
                    className="rounded-full px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-900/80 hover:text-white"
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
          {/* Language selector */}
          <button className="hidden items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-slate-800 md:inline-flex">
            <Globe2 size={14} />
            <span>EN</span>
          </button>

          {/* Search icon */}
          <button className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white md:flex">
            <Search size={16} />
          </button>

          {/* Start Trading CTA */}
          <button className="hidden items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 shadow-soft-glow transition hover:bg-emerald-400 md:flex">
            <span>Start Trading</span>
            <ArrowRight size={14} />
          </button>

          {/* Mobile menu button */}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
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
            <div className="border-t border-slate-800 bg-slate-950/95 px-4 pb-4 pt-2 text-sm text-slate-100">
              {/* Clients / Partners toggle */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full bg-slate-900/80 p-0.5 text-[11px]">
                  <button
                    onClick={() => setClientType("clients")}
                    className={`rounded-full px-3 py-1 transition ${
                      clientType === "clients"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-300"
                    }`}
                  >
                    Clients
                  </button>
                  <button
                    onClick={() => setClientType("partners")}
                    className={`rounded-full px-3 py-1 transition ${
                      clientType === "partners"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-300"
                    }`}
                  >
                    Partners
                  </button>
                </div>

                <button className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-950">
                  <span>Start Trading</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Links */}
              <div className="space-y-2">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.children ? (
                      <>
                        {/* MOBILE: open on click */}
                        <button
                          onClick={() => toggleDropdown(item.label)}
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
                              className="overflow-hidden pl-3"
                            >
                              {item.children.map((child) => (
                                <li key={child.label}>
                                  <a
                                    href={child.href}
                                    onClick={closeAllMenus}
                                    className="block rounded-xl px-3 py-2 text-[13px] text-slate-200 hover:bg-slate-900/80"
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
                        className="block rounded-xl bg-slate-900/80 px-3 py-2.5 text-[13px] text-slate-100"
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Help + Portal quick links */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                <button className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2 text-left text-slate-200">
                  <Lock size={16} />
                  <span>My Portal</span>
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2 text-left text-slate-200">
                  <HelpCircle size={16} />
                  <span>Help Center</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
