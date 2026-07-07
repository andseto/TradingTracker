"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Wallet, PiggyBank, TrendingUp, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { MonthlyCashFlow } from "@/components/charts/MonthlyCashFlow";
import { CumulativeNet } from "@/components/charts/CumulativeNet";
import {
  computeTotals, monthlySeries, cumulativeNetSeries, breakdown, evalStats,
} from "@/lib/metrics";
import { fmtMoneyFull, fmtDate } from "@/lib/utils";

function MeterList({ rows }: { rows: { label: string; amount: number; share: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-xs py-4 text-center" style={{ color: "var(--text-3)" }}>No expenses logged yet.</p>;
  }
  return (
    <div className="space-y-2.5">
      {rows.slice(0, 6).map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between text-xs mb-1">
            <span style={{ color: "var(--text-2)" }}>{r.label}</span>
            <span className="font-mono" style={{ color: "var(--text-1)" }}>{fmtMoneyFull(r.amount)}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.max(r.share * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewContent() {
  const { settings, expenses, payouts } = useBusiness();

  const totals = useMemo(
    () => computeTotals(Number(settings.seed_money), expenses, payouts),
    [settings.seed_money, expenses, payouts]
  );
  const monthly = useMemo(() => monthlySeries(expenses, payouts), [expenses, payouts]);
  const cumulative = useMemo(() => cumulativeNetSeries(expenses, payouts), [expenses, payouts]);
  const byType = useMemo(() => breakdown(expenses, "expense_type"), [expenses]);
  const byFirm = useMemo(() => breakdown(expenses, "firm"), [expenses]);
  const evals = useMemo(() => evalStats(expenses), [expenses]);

  const recent = useMemo(() => {
    const rows = [
      ...payouts.map((p) => ({
        kind: "payout" as const,
        id: p.id,
        date: p.date,
        firm: p.firm,
        label: p.status === "Pending" ? "Payout (pending)" : "Payout",
        amount: Number(p.amount),
        created: p.created_at,
      })),
      ...expenses.map((e) => ({
        kind: "expense" as const,
        id: e.id,
        date: e.date,
        firm: e.firm,
        label: e.expense_type,
        amount: Number(e.amount),
        created: e.created_at,
      })),
    ];
    return rows
      .sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created))
      .slice(0, 8);
  }, [expenses, payouts]);

  const hasData = expenses.length > 0 || payouts.length > 0;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Current Capital"
          value={fmtMoneyFull(totals.currentCapital)}
          subValue="Seed + net profit"
          icon={Landmark}
          trend={totals.currentCapital >= Number(settings.seed_money) ? "up" : "down"}
        />
        <StatCard
          label="Seed Money"
          value={fmtMoneyFull(Number(settings.seed_money))}
          subValue="Starting capital"
          icon={PiggyBank}
        />
        <StatCard
          label="Gross Profit"
          value={fmtMoneyFull(totals.grossProfit)}
          subValue={totals.pendingPayouts > 0 ? `+${fmtMoneyFull(totals.pendingPayouts)} pending` : "Payouts received"}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Spending"
          value={fmtMoneyFull(totals.totalSpending)}
          subValue="Evals, fees & tools"
          icon={TrendingDown}
        />
        <StatCard
          label="Net Profit"
          value={fmtMoneyFull(totals.netProfit)}
          subValue="Gross − spending"
          icon={Wallet}
          trend={totals.netProfit > 0 ? "up" : totals.netProfit < 0 ? "down" : "neutral"}
        />
      </div>

      {!hasData && (
        <Card>
          <div className="text-center py-8">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-1)" }}>
              Welcome to SetoTrading
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
              Log your first eval purchase or payout to bring this dashboard to life.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/dashboard/expenses"
                className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 transition-colors"
              >
                Log an expense
              </Link>
              <Link
                href="/dashboard/payouts"
                className="text-xs font-medium border border-[#2a2a35] text-[#9090a8] hover:text-[#e8e8f0] rounded-lg px-3 py-2 transition-colors"
              >
                Log a payout
              </Link>
            </div>
          </div>
        </Card>
      )}

      {hasData && (
        <>
          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Monthly Cash Flow" subtitle="Payouts received vs. money spent">
              <MonthlyCashFlow data={monthly} />
            </Card>
            <Card title="Net Profit Over Time" subtitle="Cumulative payouts minus spending">
              <CumulativeNet data={cumulative} />
            </Card>
          </div>

          {/* Breakdowns */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card title="Spending by Type">
              <MeterList rows={byType} />
            </Card>
            <Card title="Spending by Firm">
              <MeterList rows={byFirm} />
            </Card>
            <Card title="Eval Scorecard" className="md:col-span-2 xl:col-span-1">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Evals bought</div>
                  <div className="font-mono text-lg font-semibold" style={{ color: "var(--text-1)" }}>{evals.bought}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-card)" }}>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Pass rate</div>
                  <div className="font-mono text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                    {evals.passRate === null ? "—" : `${Math.round(evals.passRate * 100)}%`}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-2)" }}>
                <span>Passed: <span className="font-mono text-green-400">{evals.passed}</span></span>
                <span>Failed: <span className="font-mono text-red-400">{evals.failed}</span></span>
                <span>In progress: <span className="font-mono text-indigo-400">{evals.inProgress}</span></span>
              </div>
            </Card>
          </div>

          {/* Recent activity */}
          <Card title="Recent Activity">
            <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
              {recent.map((r) => (
                <div key={`${r.kind}-${r.id}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    {r.kind === "payout" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate" style={{ color: "var(--text-1)" }}>
                      {r.firm} <span style={{ color: "var(--text-3)" }}>· {r.label}</span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-3)" }}>{fmtDate(r.date)}</div>
                  </div>
                  <div className={`font-mono text-sm ${r.kind === "payout" ? "text-green-400" : "text-red-400"}`}>
                    {r.kind === "payout" ? "+" : "−"}{fmtMoneyFull(r.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
