import type { Expense, Payout } from "@/types";

export interface Totals {
  grossProfit: number;      // received payouts
  pendingPayouts: number;
  totalSpending: number;
  netProfit: number;
  currentCapital: number;   // seed + net
}

export function computeTotals(
  seedMoney: number,
  expenses: Expense[],
  payouts: Payout[]
): Totals {
  const grossProfit = payouts
    .filter((p) => p.status === "Received")
    .reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayouts = payouts
    .filter((p) => p.status === "Pending")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalSpending = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = grossProfit - totalSpending;
  return {
    grossProfit,
    pendingPayouts,
    totalSpending,
    netProfit,
    currentCapital: seedMoney + netProfit,
  };
}

export interface MonthPoint {
  month: string;   // "Mar '26"
  key: string;     // "2026-03"
  payouts: number;
  spending: number;
  net: number;
}

// Continuous month range from the earliest record through the current month.
export function monthlySeries(expenses: Expense[], payouts: Payout[]): MonthPoint[] {
  const byMonth = new Map<string, { payouts: number; spending: number }>();
  const touch = (key: string) => {
    if (!byMonth.has(key)) byMonth.set(key, { payouts: 0, spending: 0 });
    return byMonth.get(key)!;
  };
  for (const e of expenses) touch(e.date.slice(0, 7)).spending += Number(e.amount);
  for (const p of payouts) {
    if (p.status === "Received") touch(p.date.slice(0, 7)).payouts += Number(p.amount);
  }
  if (byMonth.size === 0) return [];

  const keys = [...byMonth.keys()].sort();
  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const first = keys[0];
  const last = nowKey > keys[keys.length - 1] ? nowKey : keys[keys.length - 1];

  const points: MonthPoint[] = [];
  let [y, m] = first.split("-").map(Number);
  while (true) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const v = byMonth.get(key) ?? { payouts: 0, spending: 0 };
    const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
    points.push({
      month: `${label} '${String(y).slice(2)}`,
      key,
      payouts: v.payouts,
      spending: v.spending,
      net: v.payouts - v.spending,
    });
    if (key === last) break;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return points;
}

export interface CumulativePoint {
  month: string;
  cumulative: number;
}

export function cumulativeNetSeries(expenses: Expense[], payouts: Payout[]): CumulativePoint[] {
  let running = 0;
  return monthlySeries(expenses, payouts).map((p) => {
    running += p.net;
    return { month: p.month, cumulative: running };
  });
}

export interface BreakdownRow {
  label: string;
  amount: number;
  share: number; // 0..1 of total
}

export function breakdown(expenses: Expense[], by: "expense_type" | "firm"): BreakdownRow[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const k = e[by];
    map.set(k, (map.get(k) ?? 0) + Number(e.amount));
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
  return [...map.entries()]
    .map(([label, amount]) => ({ label, amount, share: amount / total }))
    .sort((a, b) => b.amount - a.amount);
}

export interface EvalStats {
  bought: number;
  passed: number;
  failed: number;
  inProgress: number;
  passRate: number | null; // of resolved evals
}

export function evalStats(expenses: Expense[]): EvalStats {
  const evals = expenses.filter((e) => e.expense_type === "Evaluation");
  const passed = evals.filter((e) => e.outcome === "Passed" || e.outcome === "Payout Received").length;
  const failed = evals.filter((e) => e.outcome === "Failed").length;
  const inProgress = evals.filter((e) => !e.outcome || e.outcome === "In Progress").length;
  const resolved = passed + failed;
  return {
    bought: evals.length,
    passed,
    failed,
    inProgress,
    passRate: resolved > 0 ? passed / resolved : null,
  };
}

export interface StreakDot {
  id: string;
  date: string;
  firm: string;
  outcome: string; // "Passed" | "Failed" | "Payout Received"
  isWin: boolean;
}

export interface WinStreak {
  dots: StreakDot[];
  current: number; // consecutive wins counting back from the most recent resolved eval
  best: number;     // longest win run on record
}

// Chronological win/loss record of resolved evals — Passed or Payout Received
// count as a win, Failed breaks the streak. Only resolved outcomes are plotted.
export function evalWinStreak(expenses: Expense[]): WinStreak {
  const resolved = expenses
    .filter(
      (e) =>
        e.expense_type === "Evaluation" &&
        (e.outcome === "Passed" || e.outcome === "Failed" || e.outcome === "Payout Received")
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));

  const dots: StreakDot[] = resolved.map((e) => ({
    id: e.id,
    date: e.date,
    firm: e.firm,
    outcome: e.outcome!,
    isWin: e.outcome !== "Failed",
  }));

  let current = 0;
  for (let i = dots.length - 1; i >= 0; i--) {
    if (dots[i].isWin) current++;
    else break;
  }

  let best = 0;
  let run = 0;
  for (const d of dots) {
    if (d.isWin) { run++; best = Math.max(best, run); }
    else run = 0;
  }

  return { dots, current, best };
}
