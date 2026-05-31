export type MarketType = "FOREX" | "CRYPTO" | "INDIAN";
export type BrokerKind = "MT5" | "CTRADER" | "KITE" | "ZEBU" | "CRYPTO_EXCHANGE" | "UNKNOWN";

export type NormalizedFollow = {
  id: number;
  market: MarketType;
  status: "pending" | "active" | "paused" | "stopped" | "rejected";
  requestedAt?: string | null;
  approvedAt?: string | null;

  masterId?: number | null;
  followerTradingAccountId?: number | null;

  riskMode?: string | null;
  riskValue?: number | null;
  maxLot?: number | null;
  maxOpenPositions?: number | null;
  maxDailyLoss?: number | null;
  slippageTolerance?: number | null;

  symbolWhitelist?: string[];

  brokerKind: BrokerKind;
  brokerLabel: string; // MT5 / cTrader / Kite / Zebu / Binance
  accountLabel: string; // "MT5 • 1234"
  badges: string[]; // extra pills like server/env/exchange
  meta: Record<string, any>; // original meta for editors
  raw: any;
};

function asStr(x: any) {
  return String(x ?? "").trim();
}
function asNum(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function pickMeta(f: any) {
  const master =
    f?.master ??
    f?.masterAccount ??
    f?.masterTradingAccount ??
    f?.master_account ??
    f?.master_trading_account ??
    null;

  const meta =
    master?.accountMeta ??
    master?.account_meta ??
    master?.meta ??
    master?.metadata ??
    f?.masterMeta ??
    f?.master_meta ??
    null;

  return { master, meta: meta || {} };
}

export function detectBrokerKind(f: any): BrokerKind {
  const { master, meta } = pickMeta(f);
  const brokerStr = asStr(master?.brokerName ?? master?.broker ?? f?.brokerName ?? f?.broker).toLowerCase();

  const mt5Login = meta?.mt5LoginId ?? meta?.mt5_login_id ?? meta?.login ?? null;
  const ctraderId = meta?.ctraderAccountId ?? meta?.ctrader_account_id ?? null;

  const kiteId = meta?.kiteClientId ?? meta?.clientId ?? meta?.client_id ?? null;
  const zebuId = meta?.zebuClientId ?? meta?.zebu_client_id ?? meta?.userId ?? null;

  const exchange = meta?.exchange ?? meta?.exchangeName ?? null;

  if (ctraderId || brokerStr.includes("ctrader")) return "CTRADER";
  if (mt5Login || brokerStr.includes("mt5")) return "MT5";
  if (kiteId || brokerStr.includes("kite") || brokerStr.includes("zerodha")) return "KITE";
  if (zebuId || brokerStr.includes("zebu") || brokerStr.includes("mynt")) return "ZEBU";
  if (exchange || brokerStr.includes("binance") || brokerStr.includes("bybit")) return "CRYPTO_EXCHANGE";
  return "UNKNOWN";
}

export function detectMarket(f: any): MarketType {
  const m = asStr(f?.market ?? f?.marketType ?? f?.type ?? f?.master?.market ?? f?.master?.type);
  if (m === "FOREX" || m === "CRYPTO" || m === "INDIAN") return m as MarketType;

  const k = detectBrokerKind(f);
  if (k === "MT5" || k === "CTRADER") return "FOREX";
  if (k === "KITE" || k === "ZEBU") return "INDIAN";
  if (k === "CRYPTO_EXCHANGE") return "CRYPTO";

  return "FOREX";
}

export function normalizeFollow(f: any): NormalizedFollow {
  const { master, meta } = pickMeta(f);
  const brokerKind = detectBrokerKind(f);
  const market = detectMarket(f);

  const brokerLabel =
    brokerKind === "MT5"
      ? "MT5"
      : brokerKind === "CTRADER"
      ? "cTrader"
      : brokerKind === "KITE"
      ? "Kite"
      : brokerKind === "ZEBU"
      ? "Zebu"
      : brokerKind === "CRYPTO_EXCHANGE"
      ? asStr(meta?.exchange) || "Crypto"
      : "Broker";

  const idGuess =
    meta?.mt5LoginId ??
    meta?.mt5_login_id ??
    meta?.ctraderAccountId ??
    meta?.ctrader_account_id ??
    meta?.kiteClientId ??
    meta?.clientId ??
    meta?.client_id ??
    meta?.zebuClientId ??
    meta?.zebu_client_id ??
    meta?.userId ??
    master?.accountId ??
    "";

  const accountLabel =
    asStr(master?.accountLabel) ||
    (idGuess ? `${brokerLabel} • ${idGuess}` : `${brokerLabel} • —`);

  const badges: string[] = [];
  if (brokerKind === "MT5") {
    if (meta?.server) badges.push(`Server: ${meta.server}`);
    if (meta?.env) badges.push(`Env: ${meta.env}`);
    if (meta?.mt5LoginId ?? meta?.mt5_login_id) badges.push(`Login: ${meta?.mt5LoginId ?? meta?.mt5_login_id}`);
  }
  if (brokerKind === "CTRADER") {
    if (meta?.environment) badges.push(`Env: ${meta.environment}`);
    if (meta?.ctraderAccountId ?? meta?.ctrader_account_id)
      badges.push(`Account: ${meta?.ctraderAccountId ?? meta?.ctrader_account_id}`);
  }
  if (brokerKind === "KITE") {
    if (meta?.exchange) badges.push(`Exch: ${meta.exchange}`);
    if (meta?.kiteClientId ?? meta?.clientId ?? meta?.client_id)
      badges.push(`Client: ${meta?.kiteClientId ?? meta?.clientId ?? meta?.client_id}`);
  }
  if (brokerKind === "ZEBU") {
    if (meta?.product) badges.push(`Product: ${meta.product}`);
    if (meta?.zebuClientId ?? meta?.zebu_client_id ?? meta?.userId)
      badges.push(`User: ${meta?.zebuClientId ?? meta?.zebu_client_id ?? meta?.userId}`);
  }
  if (brokerKind === "CRYPTO_EXCHANGE") {
    if (meta?.exchange) badges.push(`Exchange: ${meta.exchange}`);
    if (meta?.subAccount) badges.push(`Sub: ${meta.subAccount}`);
  }

  return {
    id: asNum(f?.id) ?? 0,
    market,
    status: (asStr(f?.status).toLowerCase() as any) || "pending",
    requestedAt: f?.requestedAt ?? null,
    approvedAt: f?.approvedAt ?? null,
    masterId: asNum(f?.masterId),
    followerTradingAccountId: asNum(f?.followerTradingAccountId),

    riskMode: f?.riskMode ?? null,
    riskValue: asNum(f?.riskValue),
    maxLot: asNum(f?.maxLot),
    maxOpenPositions: asNum(f?.maxOpenPositions),
    maxDailyLoss: asNum(f?.maxDailyLoss),
    slippageTolerance: asNum(f?.slippageTolerance),

    symbolWhitelist: Array.isArray(f?.symbolWhitelist) ? f.symbolWhitelist : [],

    brokerKind,
    brokerLabel,
    accountLabel,
    badges,
    meta,
    raw: f,
  };
}
