"use client";

import { TrendingUp, TrendingDown, Target, Activity, Zap, BarChart2, Calendar, Award } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { StatCard } from "@/components/ui/StatCard";
import { fmtMoney, fmtPct, fmtMoneyFull } from "@/lib/utils";

export function StatsOverview() {
  const { stats, settings } = useDashboard();
  const p = settings.privacyMode;

  const cards = [
    {
      label: "Total P&L",
      value: fmtMoneyFull(stats.totalPnl, p),
      subValue: fmtPct(stats.totalPnlPct, p),
      trend: stats.totalPnl >= 0 ? "up" as const : "down" as const,
      icon: stats.totalPnl >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: "Win Rate",
      value: `${stats.winRate}%`,
      subValue: `${stats.totalTrades} trades`,
      trend: stats.winRate >= 50 ? "up" as const : "down" as const,
      icon: Target,
    },
    {
      label: "Profit Factor",
      value: stats.profitFactor === 999 ? "∞" : stats.profitFactor.toFixed(2),
      subValue: stats.profitFactor >= 1 ? "Positive edge" : "Negative edge",
      trend: stats.profitFactor >= 1 ? "up" as const : "down" as const,
      icon: Zap,
    },
    {
      label: "Avg Win",
      value: fmtMoney(stats.avgWin, p),
      subValue: `Avg loss: ${fmtMoney(stats.avgLoss, p)}`,
      trend: "up" as const,
      icon: Award,
    },
    {
      label: "Best Day",
      value: fmtMoney(stats.bestDay, p),
      subValue: `Worst: ${fmtMoney(stats.worstDay, p)}`,
      trend: "up" as const,
      icon: Activity,
    },
    {
      label: "Win Days",
      value: `${stats.winDays} / ${stats.tradingDays}`,
      subValue: stats.tradingDays > 0 ? `${((stats.winDays / stats.tradingDays) * 100).toFixed(0)}% of days green` : "—",
      trend: stats.winDays >= stats.lossDays ? "up" as const : "down" as const,
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
