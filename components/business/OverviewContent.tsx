"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Wallet, PiggyBank, TrendingUp, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { useFocusMode } from "@/context/PrivacyContext";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { MonthlyCashFlow } from "@/components/charts/MonthlyCashFlow";
import { CumulativeNet } from "@/components/charts/CumulativeNet";
import {
  computeTotals, monthlySeries, cumulativeNetSeries, breakdown, evalStats,
} from "@/lib/metrics";
import { fmtMoneyFull, fmtDate } from "@/lib/utils";

function MeterList({ rows }: { rows: { label: string; amount: number; share: number }[] }) {
  const { focusMode } = useFocusMode();
  if (rows.length === 0) {
    return <p className="text-xs py-4 text-center" style={{ color: "var(--text-3)" }}>No expenses logged yet.</p>;
  }
  return (
    <div className="space-y-2.5">
      {rows.slice(0, 6).map((r, i) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between text-xs mb-1">
            <span style={{ color: "var(--text-2)" }}>{r.label}</span>
            <span className="font-mono" style={{ color: "var(--text-1)" }}>{fmtMoneyFull(r.amount, focusMode)}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 meter-grow"
              style={{ width: `${Math.max(r.share * 100, 2)}%`, animationDelay: `${i * 0.06}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewContent() {
  const { settings, expenses, payouts } = useBusiness();
  const { focusMode } = useFocusMode();

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
          value={totals.currentCapital}
          format={(n) => fmtMoneyFull(n, focusMode)}
          subValue="Seed + net profit"
          icon={Landmark}
          trend={totals.currentCapital >= Number(settings.seed_money) ? "up" : "down"}
          className="stagger-1"
        />
        <StatCard
          label="Seed Money"
          value={Number(settings.seed_money)}
          format={(n) => fmtMoneyFull(n, focusMode)}
          subValue="Starting capital"
          icon={PiggyBank}
          className="stagger-2"
        />
        <StatCard
          label="Gross Profit"
          value={totals.grossProfit}
          format={(n) => fmtMoneyFull(n, focusMode)}
          subValue={totals.pendingPayouts > 0 ? `+${fmtMoneyFull(totals.pendingPayouts, focusMode)} pending` : "Payouts received"}
          icon={TrendingUp}
          trend={totals.grossProfit > 0 ? "up" : "neutral"}
          className="stagger-3"
        />
        <StatCard
          label="Total Spending"
          value={totals.totalSpending}
          format={(n) => fmtMoneyFull(n, focusMode)}
          subValue="Evals, fees & tools"
          icon={TrendingDown}
          className="stagger-4"
        />
        <StatCard
          label="Net Profit"
          value={totals.netProfit}
          format={(n) => fmtMoneyFull(n, focusMode)}
          subValue="Gross − spending"
          icon={Wallet}
          trend={totals.netProfit > 0 ? "up" : totals.netProfit < 0 ? "down" : "neutral"}
          className="stagger-5"
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
                className="text-xs font-medium bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-lg px-3 py-2 transition-colors"
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
            <Card title="Monthly Cash Flow" subtitle="Payouts received vs. money spent" className="stagger-3">
              <MonthlyCashFlow data={monthly} />
            </Card>
            <Card title="Net Profit Over Time" subtitle="Cumulative payouts minus spending" className="stagger-4">
              <CumulativeNet data={cumulative} />
            </Card>
          </div>

          {/* Breakdowns */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card title="Spending by Type" className="stagger-5">
              <MeterList rows={byType} />
            </Card>
            <Card title="Spending by Firm" className="stagger-6">
              <MeterList rows={byFirm} />
            </Card>
            <Card title="Eval Scorecard" className="md:col-span-2 xl:col-span-1 stagger-7">
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
                <span>In progress: <span className="font-mono text-sky-400">{evals.inProgress}</span></span>
              </div>
            </Card>
          </div>

          {/* Recent activity */}
          <Card title="Recent Activity">
            <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
              {recent.map((r, i) => (
                <div
                  key={`${r.kind}-${r.id}`}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 anim-fade-up hover:bg-white/[0.02] rounded-lg px-1 -mx-1 transition-colors"
                  style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
                >
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
                    {r.kind === "payout" ? "+" : "−"}{fmtMoneyFull(r.amount, focusMode)}
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
