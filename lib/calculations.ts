import {
  Trade, ClosedPosition, DailyPnL, MonthlyPnL,
  SymbolPnL, EquityPoint, Stats,
} from "@/types";
import { format, parseISO } from "date-fns";

// FIFO matching: match sells against buys per symbol
export function matchTrades(trades: Trade[]): ClosedPosition[] {
  const positions: Record<string, { date: string; qty: number; price: number }[]> = {};
  const closed: ClosedPosition[] = [];
  let idCounter = 0;

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  for (const trade of sorted) {
    if (trade.action === "BUY") {
      if (!positions[trade.symbol]) positions[trade.symbol] = [];
      positions[trade.symbol].push({ date: trade.date, qty: trade.quantity, price: trade.price });
    } else {
      // SELL — consume from front (FIFO)
      let remaining = trade.quantity;
      const queue = positions[trade.symbol] ?? [];

      while (remaining > 1e-9 && queue.length > 0) {
        const lot = queue[0];
        const filled = Math.min(remaining, lot.qty);

        // Skip ghost lots from floating point residuals
        if (filled < 1e-9) { queue.shift(); break; }

        const pnl = (trade.price - lot.price) * filled;
        const pnlPct = ((trade.price - lot.price) / lot.price) * 100;

        closed.push({
          id: `P${idCounter++}`,
          symbol: trade.symbol,
          openDate: lot.date,
          closeDate: trade.date,
          quantity: parseFloat(filled.toFixed(6)),
          entryPrice: lot.price,
          exitPrice: trade.price,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
          isWin: pnl > 0,
        });

        lot.qty -= filled;
        remaining -= filled;
        if (lot.qty < 1e-9) queue.shift();
      }

      if (!positions[trade.symbol]) positions[trade.symbol] = [];
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
    lossDays: daily.filter((d) => !d.isWin).length,
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
