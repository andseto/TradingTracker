import { EquityCurve } from "@/components/charts/EquityCurve";
import { DailyPnLBar } from "@/components/charts/DailyPnLBar";
import { MonthlyPnLBar } from "@/components/charts/MonthlyPnLBar";
import { SymbolBreakdown } from "@/components/charts/SymbolBreakdown";
import { DayOfWeekChart } from "@/components/charts/DayOfWeekChart";
import { WinRateChart } from "@/components/charts/WinRateChart";

export default function ChartsPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>Charts</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>Full analytics for the selected time range.</p>
      </div>
      <div className="flex flex-col gap-5">
        <EquityCurve height={320} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DailyPnLBar height={280} />
          <MonthlyPnLBar height={280} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SymbolBreakdown height={280} />
          <DayOfWeekChart height={280} />
          <WinRateChart height={280} />
        </div>
      </div>
    </div>
  );
}
