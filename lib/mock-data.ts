import { Trade } from "@/types";

// Simulates ~6 months of Fidelity-style trades
const symbols = ["AAPL", "NVDA", "TSLA", "META", "MSFT", "AMZN", "GOOGL", "SPY", "QQQ", "AMD"];

function randBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date) {
  return date.toISOString().split("T")[0];
}

// Prices roughly based on late 2023/early 2024
const basePrices: Record<string, number> = {
  AAPL: 185, NVDA: 520, TSLA: 240, META: 490, MSFT: 390,
  AMZN: 178, GOOGL: 165, SPY: 480, QQQ: 420, AMD: 160,
};

export function generateMockTrades(): Trade[] {
  const trades: Trade[] = [];
  const start = new Date("2024-07-01");
  let id = 1;

  for (let dayOffset = 0; dayOffset < 200; dayOffset++) {
    const date = addDays(start, dayOffset);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    // ~40% chance of trading on any given day
    if (Math.random() > 0.40) continue;

    // 1-3 round trips per day
    const numTrades = Math.floor(randBetween(1, 4));

    for (let t = 0; t < numTrades; t++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const base = basePrices[symbol];
      const drift = (dayOffset / 200) * base * 0.15; // slight upward drift
      const price = base + drift + randBetween(-base * 0.03, base * 0.03);
      const qty = Math.floor(randBetween(5, 50));

      // BUY
      trades.push({
        id: `T${id++}`,
        date: fmt(date),
        symbol,
        action: "BUY",
        quantity: qty,
        price: parseFloat(price.toFixed(2)),
        amount: parseFloat((-price * qty).toFixed(2)),
        commission: 0,
      });

      // SELL same day (intraday) or next trading day
      const sellDayOffset = Math.random() > 0.7 ? 1 : 0;
      let sellDate = addDays(date, sellDayOffset);
      // skip to Monday if sell falls on weekend
      if (sellDate.getDay() === 6) sellDate = addDays(sellDate, 2);
      if (sellDate.getDay() === 0) sellDate = addDays(sellDate, 1);

      // Win ~55% of the time
      const isWin = Math.random() < 0.55;
      const moveRange = isWin
        ? randBetween(0.002, 0.025)
        : randBetween(-0.022, -0.001);
      const sellPrice = price * (1 + moveRange);

      trades.push({
        id: `T${id++}`,
        date: fmt(sellDate),
        symbol,
        action: "SELL",
        quantity: qty,
        price: parseFloat(sellPrice.toFixed(2)),
        amount: parseFloat((sellPrice * qty).toFixed(2)),
        commission: 0,
      });
    }
  }

  return trades.sort((a, b) => a.date.localeCompare(b.date));
}

export const MOCK_TRADES = generateMockTrades();
