import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-0 border-t border-slate-800 bg-slate-950/95 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-auto"
              />
           
            </div>
            <p className="text-sm text-slate-400">
              Monitor your trading accounts, execute strategies, and track your
              risk in one modern dashboard.
            </p>
            <div className="flex gap-3 text-xs text-slate-400">
              <span>© {new Date().getFullYear()} Tradebro.</span>
              <span>All rights reserved.</span>
            </div>
          </div>

          {/* Trading */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Trading</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Copy Trading
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Strategies
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Brokers &amp; Integrations
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-emerald-400">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Team
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Partners
                </a>
              </li>
            </ul>
          </div>

          {/* Support / Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Support</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400">
                  Status
                </a>
              </li>
            </ul>

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <a href="#" className="hover:text-emerald-400">
                Privacy Policy
              </a>
              <span className="mx-1">•</span>
              <a href="#" className="hover:text-emerald-400">
                Terms of Use
              </a>
              <span className="mx-1">•</span>
              <a href="#" className="hover:text-emerald-400">
                Risk Disclosure
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row">
          <p>
            Trading in financial markets involves risk. Past performance does
            not guarantee future returns.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-emerald-400">
              Twitter
            </a>
            <a href="#" className="hover:text-emerald-400">
              Telegram
            </a>
            <a href="#" className="hover:text-emerald-400">
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
