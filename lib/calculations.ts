import {
  Trade, ClosedPosition, DailyPnL, MonthlyPnL,
  SymbolPnL, EquityPoint, Stats, Goal,
} from "@/types";
import { format, parseISO } from "date-fns";

// FIFO matching with short support.
// Fidelity CSVs are newest-first, so intraday round-trips often appear as
// SELL then BUY. Without short support those sells were silently dropped,
// causing the next batch of buys to match against wrong (lower-price) sells
// and producing wildly inflated losses.
export function matchTrades(trades: Trade[]): ClosedPosition[] {
  const longs:  Record<string, { date: string; qty: number; price: number }[]> = {};
  const shorts: Record<string, { date: string; qty: number; price: number }[]> = {};
  const closed: ClosedPosition[] = [];
  let idCounter = 0;

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  for (const trade of sorted) {
    if (!longs[trade.symbol])  longs[trade.symbol]  = [];
    if (!shorts[trade.symbol]) shorts[trade.symbol] = [];

    const longQ  = longs[trade.symbol];
    const shortQ = shorts[trade.symbol];

    if (trade.action === "BUY") {
      // 1. Cover any open shorts first (FIFO)
      let remaining = trade.quantity;
      while (remaining > 1e-9 && shortQ.length > 0) {
        const lot    = shortQ[0];
        const filled = Math.min(remaining, lot.qty);
        if (filled < 1e-9) { shortQ.shift(); break; }

        const pnl    = (lot.price - trade.price) * filled;
        const pnlPct = ((lot.price - trade.price) / lot.price) * 100;
        closed.push({
          id: `P${idCounter++}`, symbol: trade.symbol,
          openDate: lot.date, closeDate: trade.date,
          quantity: parseFloat(filled.toFixed(6)),
          entryPrice: lot.price, exitPrice: trade.price,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
          isWin: pnl > 0,
        });
        lot.qty   -= filled;
        remaining -= filled;
        if (lot.qty < 1e-9) shortQ.shift();
      }
      // 2. Remainder opens a new long lot
      if (remaining > 1e-9)
        longQ.push({ date: trade.date, qty: remaining, price: trade.price });

    } else {
      // SELL
      // 1. Close open longs first (FIFO)
      let remaining = trade.quantity;
      while (remaining > 1e-9 && longQ.length > 0) {
        const lot    = longQ[0];
        const filled = Math.min(remaining, lot.qty);
        if (filled < 1e-9) { longQ.shift(); break; }

        const pnl    = (trade.price - lot.price) * filled;
        const pnlPct = ((trade.price - lot.price) / lot.price) * 100;
        closed.push({
          id: `P${idCounter++}`, symbol: trade.symbol,
          openDate: lot.date, closeDate: trade.date,
          quantity: parseFloat(filled.toFixed(6)),
          entryPrice: lot.price, exitPrice: trade.price,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
          isWin: pnl > 0,
        });
        lot.qty   -= filled;
        remaining -= filled;
        if (lot.qty < 1e-9) longQ.shift();
      }
      // 2. Remainder opens a new short lot
      if (remaining > 1e-9)
        shortQ.push({ date: trade.date, qty: remaining, price: trade.price });
    }
  }

  return closed;
}

export function calcDailyPnL(positions: ClosedPosition[]): DailyPnL[] {
  const map: Record<string, { pnl: number; trades: number }> = {};

  for (const pos of positions) {
    if (!map[pos.closeDate]) map[pos.closeDate] = { pnl: 0, trades: 0 };
    map[pos.closeDate].pnl += pos.pnl;
    map[pos.closeDate].trades += 1;
  }

  return Object.entries(map)
    .map(([date, { pnl, trades }]) => ({
      date,
      pnl: parseFloat(pnl.toFixed(2)),
      trades,
      isWin: pnl > 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calcMonthlyPnL(daily: DailyPnL[]): MonthlyPnL[] {
  const map: Record<string, { pnl: number; trades: number; wins: number }> = {};

  for (const d of daily) {
    const month = d.date.slice(0, 7);
    if (!map[month]) map[month] = { pnl: 0, trades: 0, wins: 0 };
    map[month].pnl += d.pnl;
    map[month].trades += d.trades;
    if (d.isWin) map[month].wins += 1;
  }

  return Object.entries(map)
    .map(([month, { pnl, trades, wins }]) => ({
      month,
      label: format(parseISO(`${month}-01`), "MMM yy"),
      pnl: parseFloat(pnl.toFixed(2)),
      trades,
      winRate: trades > 0 ? parseFloat(((wins / Object.keys(map).length) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function calcSymbolPnL(positions: ClosedPosition[]): SymbolPnL[] {
  const map: Record<string, { pnl: number; trades: number; wins: number; vol: number }> = {};

  for (const pos of positions) {
    if (!map[pos.symbol]) map[pos.symbol] = { pnl: 0, trades: 0, wins: 0, vol: 0 };
    map[pos.symbol].pnl += pos.pnl;
    map[pos.symbol].trades += 1;
    if (pos.isWin) map[pos.symbol].wins += 1;
    map[pos.symbol].vol += pos.exitPrice * pos.quantity;
  }

  return Object.entries(map)
    .map(([symbol, { pnl, trades, wins, vol }]) => ({
      symbol,
      pnl: parseFloat(pnl.toFixed(2)),
      trades,
      winRate: parseFloat(((wins / trades) * 100).toFixed(1)),
      totalVolume: parseFloat(vol.toFixed(2)),
    }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
}

export function calcEquityCurve(daily: DailyPnL[]): EquityPoint[] {
  if (daily.length === 0) return [];
  let cum = 0;
  const points: EquityPoint[] = [{ date: daily[0].date, cumPnl: 0, dailyPnl: 0 }];
  for (const d of daily) {
    cum += d.pnl;
    points.push({ date: d.date, cumPnl: parseFloat(cum.toFixed(2)), dailyPnl: d.pnl });
  }
  return points;
}

export function calcStats(positions: ClosedPosition[], daily: DailyPnL[]): Stats {
  if (positions.length === 0) {
    return {
      totalPnl: 0, totalPnlPct: 0, winRate: 0, profitFactor: 0,
      totalTrades: 0, avgWin: 0, avgLoss: 0, bestDay: 0, worstDay: 0,
      tradingDays: 0, winDays: 0, lossDays: 0,
    };
  }

  const wins = positions.filter((p) => p.isWin);
  const losses = positions.filter((p) => !p.isWin);
  const grossProfit = wins.reduce((s, p) => s + p.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p.pnl, 0));

  const dailyPnls = daily.map((d) => d.pnl);
  const initialCapital = 25000; // assumed starting capital for % calc

  return {
    totalPnl: parseFloat(positions.reduce((s, p) => s + p.pnl, 0).toFixed(2)),
    totalPnlPct: parseFloat(((positions.reduce((s, p) => s + p.pnl, 0) / initialCapital) * 100).toFixed(2)),
    winRate: parseFloat(((wins.length / positions.length) * 100).toFixed(1)),
    profitFactor: grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 999 : 0,
    totalTrades: positions.length,
    avgWin: wins.length > 0 ? parseFloat((grossProfit / wins.length).toFixed(2)) : 0,
    avgLoss: losses.length > 0 ? parseFloat((-grossLoss / losses.length).toFixed(2)) : 0,
    bestDay: dailyPnls.length > 0 ? Math.max(...dailyPnls) : 0,
    worstDay: dailyPnls.length > 0 ? Math.min(...dailyPnls) : 0,
    tradingDays: daily.length,
    winDays: daily.filter((d) => d.isWin).length,
    lossDays: daily.filter((d) => !d.isWin && !d.isBreakEven).length,
  };
}

export function calcDayOfWeekPnL(daily: DailyPnL[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const map: Record<number, { pnl: number; count: number }> = {};

  for (const d of daily) {
    const dow = new Date(d.date + "T12:00:00").getDay();
    if (!map[dow]) map[dow] = { pnl: 0, count: 0 };
    map[dow].pnl += d.pnl;
    map[dow].count += 1;
  }

  return [1, 2, 3, 4, 5].map((dow) => ({
    day: days[dow],
    pnl: parseFloat((map[dow]?.pnl ?? 0).toFixed(2)),
    avg: map[dow]?.count ? parseFloat((map[dow].pnl / map[dow].count).toFixed(2)) : 0,
    count: map[dow]?.count ?? 0,
  }));
}

export function filterByDays<T extends { date: string }>(items: T[], days: number | null): T[] {
  if (!days) return items;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return items.filter((i) => i.date >= cutoffStr);
}

export type GoalMonthStatus = "past" | "current" | "future";

export interface GoalMonth {
  month: string;
  label: string;
  status: GoalMonthStatus;
  startBalance: number;
  endBalance: number;
  goalAmount: number;
  monthPnl: number | null;
  gainPct: number | null;
  progress: number;
  isAchieved: boolean | null;
  daysRemaining: number;
  isOverride: boolean; // true when startBalance was manually pinned
}

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = m - 1 + by;
  const newYear = y + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12 + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = shiftMonth(cur, 1);
  }
  return out;
}

export function calcAllGoalMonths(allDaily: DailyPnL[], goal: Goal, futureCount = 6): GoalMonth[] {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const endMonth = shiftMonth(currentMonth, futureCount);
  const months = monthRange(goal.startMonth, endMonth);

  let runningBalance = goal.startBalance;

  return months.map((month) => {
    const monthStart = `${month}-01`;
    const nextMonthStr = shiftMonth(month, 1);
    const nextMonthStart = `${nextMonthStr}-01`;

    const status: GoalMonthStatus =
      month < currentMonth ? "past" : month === currentMonth ? "current" : "future";

    // Per-month override lets the user pin their actual account balance for any month,
    // correcting drift caused by open positions, dividends, deposits, etc.
    const override = goal.monthBalances?.[month];
    const startBalance = parseFloat((override !== undefined ? override : runningBalance).toFixed(2));
    const goalAmount = parseFloat((startBalance * (1 + goal.targetPct / 100)).toFixed(2));

    let monthPnl: number | null = null;
    let endBalance: number;
    let isAchieved: boolean | null = null;
    let daysRemaining = 0;

    if (status === "future") {
      endBalance = goalAmount; // optimistic projection
    } else {
      monthPnl = parseFloat(
        allDaily
          .filter((d) => d.date >= monthStart && d.date < nextMonthStart)
          .reduce((s, d) => s + d.pnl, 0)
          .toFixed(2)
      );
      endBalance = parseFloat((startBalance + monthPnl).toFixed(2));
      isAchieved = endBalance >= goalAmount;

      if (status === "current") {
        const lastDayOfMonth = new Date(
          Number(month.slice(0, 4)),
          Number(month.slice(5, 7)),
          0
        ).getDate();
        daysRemaining = lastDayOfMonth - Number(today.slice(8, 10));
      }
    }

    const gainPct =
      monthPnl !== null && startBalance > 0
        ? parseFloat(((monthPnl / startBalance) * 100).toFixed(2))
        : null;

    const needed = goalAmount - startBalance;
    const rawProgress =
      status !== "future" && monthPnl !== null && needed > 0
        ? monthPnl / needed
        : status === "future"
        ? 1
        : 0;
    const progress = Math.min(1, Math.max(0, rawProgress));

    // next month starts from: actual end (past), actual end (current), projected goal (future)
    runningBalance = status === "future" ? goalAmount : endBalance;

    return {
      month,
      label: format(parseISO(monthStart), "MMMM yyyy"),
      status,
      startBalance,
      endBalance,
      goalAmount,
      monthPnl,
      gainPct,
      progress: parseFloat(progress.toFixed(4)),
      isAchieved,
      daysRemaining,
      isOverride: override !== undefined,
    };
  });
}
