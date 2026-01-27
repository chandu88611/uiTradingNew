import { DummySubscription, Market, MarketSummary, PlanInstance, PlanPrefs } from "./types";

export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function isExpired(endDate?: string | null) {
  if (!endDate) return false;
  const t = new Date(endDate).getTime();
  if (!Number.isFinite(t)) return false;
  return t < Date.now();
}

export function toMarketKey(categoryRaw: any): Market | null {
  const c = String(categoryRaw ?? "").trim().toUpperCase();
  if (!c) return null;

  if (["FOREX", "FX"].includes(c)) return "FOREX";
  if (["INDIA", "NSE", "BSE", "INDIAN"].includes(c)) return "INDIA";
  if (["CRYPTO", "COIN", "DELTA"].includes(c)) return "CRYPTO";
  if (["COPY", "COPYTRADING", "COPY_TRADING"].includes(c)) return "COPY";
  return null;
}

export function planMarkets(plan: any): Market[] {
  const direct = toMarketKey(plan?.category);
  if (direct) return [direct];

  const inc = plan?.included_markets ?? plan?.includedMarkets ?? plan?.metadata?.included_markets ?? null;
  if (Array.isArray(inc)) {
    const mk = inc.map(toMarketKey).filter(Boolean) as Market[];
    if (mk.length) return Array.from(new Set(mk));
  }

  const tier = String(plan?.metadata?.tier ?? "").toLowerCase();
  const includes = String(plan?.metadata?.includes ?? "").toLowerCase();
  if (tier === "bundle" || includes === "multi" || String(plan?.category ?? "").toUpperCase() === "BUNDLE") {
    return ["FOREX", "INDIA", "CRYPTO", "COPY"];
  }

  return [];
}

function maxNum(a?: number, b?: number) {
  const aa = Number(a ?? 0);
  const bb = Number(b ?? 0);
  if (!Number.isFinite(aa)) return bb;
  if (!Number.isFinite(bb)) return aa;
  return Math.max(aa, bb);
}

export function buildMarketSummary(subs: DummySubscription[]): MarketSummary {
  const base: MarketSummary = {
    FOREX: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
    INDIA: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
    CRYPTO: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
    COPY: { hasPlan: false, plansCount: 0, executionAllowed: false, earliestEndDate: null },
  };

  for (const s of subs || []) {
    if (isExpired(s?.endDate)) continue;
    const plan = s.plan;
    const markets = planMarkets(plan);
    if (!markets.length) continue;

    const exec = Boolean(s?.executionEnabled ?? plan?.executionEnabled);

    for (const market of markets) {
      base[market].hasPlan = true;
      base[market].plansCount += 1;
      base[market].executionAllowed = base[market].executionAllowed || exec;

      base[market].maxConnectedAccounts = maxNum(base[market].maxConnectedAccounts, plan?.limits?.maxConnectedAccounts);
      base[market].maxActiveStrategies = maxNum(base[market].maxActiveStrategies, plan?.limits?.maxActiveStrategies);
      base[market].maxDailyTrades = maxNum(base[market].maxDailyTrades, plan?.limits?.maxDailyTrades);
      base[market].maxLotPerTrade = maxNum(base[market].maxLotPerTrade, plan?.limits?.maxLotPerTrade);

      const endDate = s?.endDate ? String(s.endDate) : null;
      if (endDate) {
        if (!base[market].earliestEndDate) base[market].earliestEndDate = endDate;
        else {
          const a = new Date(base[market].earliestEndDate).getTime();
          const b = new Date(endDate).getTime();
          if (Number.isFinite(a) && Number.isFinite(b) && b < a) {
            base[market].earliestEndDate = endDate;
          }
        }
      }
    }
  }

  return base;
}

export function buildPlansByMarket(subs: DummySubscription[]): Record<Market, PlanInstance[]> {
  const out: Record<Market, PlanInstance[]> = { FOREX: [], INDIA: [], CRYPTO: [], COPY: [] };

  for (const s of subs || []) {
    if (isExpired(s?.endDate)) continue;
    const plan = s.plan;
    const markets = planMarkets(plan);
    if (!markets.length) continue;

    const planId = String(plan.id);
    const planName = String(plan.name ?? "Plan");
    const exec = Boolean(s?.executionEnabled ?? plan?.executionEnabled);

    const limits = {
      maxConnectedAccounts: plan?.limits?.maxConnectedAccounts,
      maxActiveStrategies: plan?.limits?.maxActiveStrategies,
      maxDailyTrades: plan?.limits?.maxDailyTrades,
      maxLotPerTrade: plan?.limits?.maxLotPerTrade,
    };

    for (const market of markets) {
      out[market].push({
        market,
        planId,
        planName,
        endDate: s?.endDate ? String(s.endDate) : null,
        executionAllowed: exec,
        limits,
      });
    }
  }

  (Object.keys(out) as Market[]).forEach((m) => {
    const seen = new Set<string>();
    out[m] = out[m].filter((p) => {
      if (seen.has(p.planId)) return false;
      seen.add(p.planId);
      return true;
    });
  });

  return out;
}

export function applyPlanPrefs(
  base: MarketSummary,
  plansByMarket: Record<Market, PlanInstance[]>,
  prefs: PlanPrefs
) {
  const out: MarketSummary = JSON.parse(JSON.stringify(base));

  (Object.keys(out) as Market[]).forEach((m) => {
    const plans = plansByMarket[m] || [];
    if (!plans.length) return;

    const pref = prefs[m];
    if (!pref || pref.mode !== "SPECIFIC" || !pref.planId) return;

    const chosen = plans.find((p) => p.planId === pref.planId);
    if (!chosen) return;

    out[m].executionAllowed = chosen.executionAllowed;
    out[m].maxConnectedAccounts = chosen.limits.maxConnectedAccounts;
    out[m].maxActiveStrategies = chosen.limits.maxActiveStrategies;
    out[m].maxDailyTrades = chosen.limits.maxDailyTrades;
    out[m].maxLotPerTrade = chosen.limits.maxLotPerTrade;
    out[m].earliestEndDate = chosen.endDate ?? out[m].earliestEndDate ?? null;
    out[m].plansCount = plans.length;
    out[m].hasPlan = true;
  });

  return out;
}
