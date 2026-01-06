// src/components/user/TradingViewLikeSymbolSearch.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

type Market = "FOREX" | "INDIA";

type TabKey =
  | "all"
  | "stocks"
  | "funds"
  | "futures"
  | "forex"
  | "crypto"
  | "indices"
  | "bonds"
  | "economy"
  | "options";

type TvRaw = {
  symbol?: string;
  full_name?: string;
  description?: string;
  exchange?: string;
  type?: string;
};

export type TvSuggestion = {
  tvSymbol: string;
  symbol: string;
  description?: string;
  exchange?: string;
  type?: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

async function fetchTvSuggestions(
  q: string,
  signal?: AbortSignal
): Promise<TvSuggestion[]> {
  const url =
    `https://symbol-search.tradingview.com/symbol_search/?` +
    `text=${encodeURIComponent(q)}` +
    `&hl=1&lang=en&domain=production`;

  const res = await fetch(url, { signal });
  if (!res.ok) return [];

  const raw = (await res.json()) as TvRaw[];
  if (!Array.isArray(raw)) return [];

  const out = raw
    .map((x) => {
      const tvSymbol = String(x.full_name || x.symbol || "").trim();
      const symbol = String(x.symbol || "").trim();
      if (!tvSymbol || !symbol) return null;

      return {
        tvSymbol,
        symbol,
        description: x.description ? String(x.description) : undefined,
        exchange: x.exchange ? String(x.exchange) : undefined,
        type: x.type ? String(x.type) : undefined,
      } as TvSuggestion;
    })
    .filter(Boolean) as TvSuggestion[];

  const seen = new Set<string>();
  return out.filter((s) => {
    if (seen.has(s.tvSymbol)) return false;
    seen.add(s.tvSymbol);
    return true;
  });
}

function normalizeType(t?: string) {
  return String(t || "").toLowerCase();
}

function tabMatchesType(tab: TabKey, type?: string) {
  const t = normalizeType(type);
  if (tab === "all") return true;

  if (tab === "forex") return t.includes("forex") || t.includes("cfd") || t.includes("fx");
  if (tab === "crypto") return t.includes("crypto");
  if (tab === "stocks") return t.includes("stock") || t.includes("equity");
  if (tab === "funds") return t.includes("fund");
  if (tab === "futures") return t.includes("futures");
  if (tab === "indices") return t.includes("index");
  if (tab === "bonds") return t.includes("bond");
  if (tab === "economy") return t.includes("economic") || t.includes("economy");
  if (tab === "options") return t.includes("option");

  return true;
}

function defaultTabForMarket(market: Market): TabKey {
  return market === "INDIA" ? "stocks" : "forex";
}

function prettyTabLabel(tab: TabKey) {
  switch (tab) {
    case "all":
      return "All";
    case "stocks":
      return "Stocks";
    case "funds":
      return "Funds";
    case "futures":
      return "Futures";
    case "forex":
      return "Forex";
    case "crypto":
      return "Crypto";
    case "indices":
      return "Indices";
    case "bonds":
      return "Bonds";
    case "economy":
      return "Economy";
    case "options":
      return "Options";
  }
}

function iconBadge(s: TvSuggestion) {
  const ex = (s.exchange || "").toUpperCase();
  const t = normalizeType(s.type);

  const text =
    t.includes("forex") ? "FX" :
    t.includes("crypto") ? "CR" :
    t.includes("future") ? "FU" :
    t.includes("fund") ? "FD" :
    t.includes("index") ? "IX" :
    t.includes("bond") ? "BD" :
    t.includes("option") ? "OP" :
    "SY";

  const strong = ["NSE", "BSE", "NFO", "MCX"].includes(ex) ? ex : text;
  return strong;
}

export default function TradingViewLikeSymbolSearch(props: {
  market: Market;
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: TvSuggestion) => void;
  placeholder?: string;
  className?: string;
}) {
  const { market, value, onChange, onSelect, placeholder, className } = props;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>(defaultTabForMarket(market));
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TvSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [source, setSource] = useState<string>("All sources");

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setTab(defaultTabForMarket(market));
  }, [market]);

  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setItems([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setOpen(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      try {
        const res = await fetchTvSuggestions(q, ac.signal);
        setItems(res);
        setActiveIndex(res.length ? 0 : -1);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setItems([]);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(t);
  }, [value]);

  const filtered = useMemo(() => {
    let list = items.filter((x) => tabMatchesType(tab, x.type));

    if (market === "INDIA") {
      const allow = new Set(["NSE", "BSE", "NFO", "MCX"]);
      list = list.filter((x) =>
        x.exchange ? allow.has(String(x.exchange).toUpperCase()) : true
      );
    }
    return list.slice(0, 20);
  }, [items, tab, market]);

  function choose(i: number) {
    const s = filtered[i];
    if (!s) return;
    onSelect(s);
    onChange(s.tvSymbol);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (!open) return;

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => Math.min(p + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => Math.max(p - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) choose(activeIndex);
      return;
    }
  }

  const tabs: TabKey[] = [
    "all",
    "stocks",
    "funds",
    "futures",
    "forex",
    "crypto",
    "indices",
    "bonds",
    "economy",
    "options",
  ];

  return (
    <div ref={wrapRef} className={clsx("relative", className)}>
      {/* Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || "Symbol, ISIN, or CUSIP"}
          className={clsx(
            "w-full rounded-2xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm outline-none focus:border-slate-400",
            "dark:border-white/10 dark:bg-[#0b1020] dark:text-slate-50 dark:placeholder:text-slate-500"
          )}
        />
        {!!value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setItems([]);
              setActiveIndex(-1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-slate-200"
            title="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (value.trim().length > 0 || filtered.length > 0) && (
        <div
          className={clsx(
            "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
            "dark:border-white/10 dark:bg-[#0b1020]"
          )}
        >
          {/* Tabs Header */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex gap-2">
                {(["Symbols", "Ideas", "Scripts", "People"] as const).map(
                  (x, idx) => (
                    <button
                      key={x}
                      type="button"
                      className={clsx(
                        "pb-2 text-sm font-semibold",
                        idx === 0
                          ? "text-slate-900 border-b-2 border-slate-900 dark:text-slate-50 dark:border-slate-50"
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {x}
                    </button>
                  )
                )}
              </div>

              <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                {loading ? "Searching…" : ""}
              </div>
            </div>

            {/* Filter tabs row */}
            <div className="mt-3 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setActiveIndex(0);
                  }}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-medium border transition",
                    tab === t
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-50"
                      : "bg-transparent text-slate-700 border-slate-200 hover:bg-slate-100 dark:text-slate-200 dark:border-white/10 dark:hover:bg-white/10"
                  )}
                >
                  {prettyTabLabel(t)}
                </button>
              ))}
            </div>

            {/* All sources selector (UI only) */}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
                onClick={() => {
                  setSource((p) => (p === "All sources" ? "All sources" : "All sources"));
                }}
              >
                {source} <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="mt-3 max-h-[420px] overflow-auto border-t border-slate-100 dark:border-white/10">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                No matches
              </div>
            ) : (
              filtered.map((s, idx) => {
                const active = idx === activeIndex;
                return (
                  <button
                    key={s.tvSymbol}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => choose(idx)}
                    className={clsx(
                      "w-full px-4 py-3 text-left transition",
                      active
                        ? "bg-slate-50 dark:bg-white/10"
                        : "bg-transparent hover:bg-slate-50 dark:hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-700 grid place-items-center dark:border-white/10 dark:bg-[#0b1020] dark:text-slate-200">
                        {iconBadge(s)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-50">
                            {s.symbol}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {s.description || s.tvSymbol}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {s.tvSymbol}
                        </div>
                      </div>

                      <div className="ml-auto text-xs text-slate-600 dark:text-slate-300">
                        {s.exchange || ""}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-white/10 dark:text-slate-400">
            Suggestions powered by TradingView symbol search
          </div>
        </div>
      )}
    </div>
  );
}
