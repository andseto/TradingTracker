export interface ShareData {
  username: string;
  month: string;       // "2026-04"
  label: string;       // "April 2026"
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  bestDay: number;
  worstDay: number;
  tradingDays: number;
  winDays: number;
  lossDays: number;
  dailyPnl: { date: string; pnl: number; cum: number }[];
  topSymbols: { symbol: string; pnl: number; trades: number; winRate: number }[];
}

export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  // Unicode-safe btoa
  const b64 = btoa(unescape(encodeURIComponent(json)));
  // Make URL-path-safe
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodeShareData(encoded: string): ShareData {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const json = decodeURIComponent(escape(atob(b64 + padding)));
  return JSON.parse(json) as ShareData;
}
