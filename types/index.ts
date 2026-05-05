export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  amount: number; // net cash flow (negative for buys)
  commission: number;
}

export interface ClosedPosition {
  id: string;
  symbol: string;
  openDate: string;
  closeDate: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  isWin: boolean;
}

export interface DailyPnL {
  date: string;
  pnl: number;
  trades: number;
  isWin: boolean;
  isBreakEven?: boolean;
}

export type DayTag = 'win' | 'loss' | 'breakeven' | 'void';

export interface MonthlyPnL {
  month: string; // YYYY-MM
  label: string; // "Jan 24"
  pnl: number;
  trades: number;
  winRate: number;
}

export interface SymbolPnL {
  symbol: string;
  pnl: number;
  trades: number;
  winRate: number;
  totalVolume: number;
}

export interface EquityPoint {
  date: string;
  cumPnl: number;
  dailyPnl: number;
}

export interface Stats {
  totalPnl: number;
  totalPnlPct: number;
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
}

export type Theme = "dark" | "light";

export interface Settings {
  theme: Theme;
  privacyMode: boolean;
  userName: string;
}

export interface Goal {
  targetPct: number;
  startMonth: string;   // YYYY-MM
  startBalance: number; // account balance at the start of startMonth
  monthBalances?: Record<string, number>; // YYYY-MM → actual starting balance override
}

export interface TimeRange {
  label: string;
  value: string;
  days: number | null;
}
