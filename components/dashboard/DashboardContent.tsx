"use client";

import { StatsOverview } from "./StatsOverview";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { DailyPnLBar } from "@/components/charts/DailyPnLBar";
import { MonthlyPnLBar } from "@/components/charts/MonthlyPnLBar";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";
import { SymbolBreakdown } from "@/components/charts/SymbolBreakdown";
import { DayOfWeekChart } from "@/components/charts/DayOfWeekChart";
import { WinRateChart } from "@/components/charts/WinRateChart";

export function DashboardContent() {
  return (
    <div className="flex flex-col gap-4">
      <StatsOverview />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <EquityCurve />
        <CalendarHeatmap />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyPnLBar />
        <MonthlyPnLBar />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SymbolBreakdown />
        <DayOfWeekChart />
        <WinRateChart />
      </div>
    </div>
  );
}
