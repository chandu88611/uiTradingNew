// src/pages/connect/indiaBrokers.ts

export type IndiaBroker =
  | "ZERODHA"
  | "UPSTOX"
  | "FYERS"
  | "ANGELONE"
  | "DHAN"
  | "ZEBU"
  | "ALICEBLUE";

export const INDIA_BROKERS: Array<{ value: IndiaBroker; label: string }> = [
  { value: "ZERODHA", label: "Zerodha (Kite)" },
  { value: "UPSTOX", label: "Upstox" },
  { value: "FYERS", label: "Fyers" },
  { value: "ANGELONE", label: "Angel One" },
  { value: "DHAN", label: "Dhan" },
  { value: "ZEBU", label: "Zebu" },
  { value: "ALICEBLUE", label: "Alice Blue" },
];

// small helper
export function isIndiaBroker(x: string): x is IndiaBroker {
  return (INDIA_BROKERS as any).some((b: any) => b.value === x);
}
