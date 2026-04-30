"use client";

import { StatsOverview } from "./StatsOverview";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { DailyPnLBar } from "@/components/charts/DailyPnLBar";
import { MonthlyPnLBar } from "@/components/charts/MonthlyPnLBar";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";
import { SymbolBreakdown } from "@/components/charts/SymbolBreakdown";
import { DayOfWeekChart } from "@/components/charts/DayOfWeekChart";
import { WinRateChart } from "@/components/charts/WinRateChart";
import { useDashboard } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";

export function DashboardContent() {
  const { settings } = useDashboard();
  const gap = settings.density === "compact" ? "gap-3" : settings.density === "spacious" ? "gap-6" : "gap-4";

  return (
    <div className={cn("flex flex-col", gap)}>
      {/* Stats row */}
      <StatsOverview />

      {/* Primary charts: equity + calendar */}
      <div className={cn("grid grid-cols-1 xl:grid-cols-2", gap)}>
        <EquityCurve />
        <CalendarHeatmap />
      </div>

      {/* Secondary charts */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-2", gap)}>
        <DailyPnLBar />
        <MonthlyPnLBar />
      </div>

      {/* Bottom row */}
      <div className={cn("grid grid-cols-1 md:grid-cols-3", gap)}>
        <SymbolBreakdown />
        <DayOfWeekChart />
        <WinRateChart />
      </div>
    </div>
  );
}
