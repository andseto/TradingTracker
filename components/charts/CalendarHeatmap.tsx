"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoneyFull } from "@/lib/utils";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function intensityColor(pnl: number, max: number, type: "gain" | "loss"): string {
  const ratio = Math.min(Math.abs(pnl) / (max * 0.7 || 1), 1);
  if (type === "gain") {
    const alpha = 0.15 + ratio * 0.7;
    return `rgba(34,197,94,${alpha.toFixed(2)})`;
  } else {
    const alpha = 0.15 + ratio * 0.7;
    return `rgba(239,68,68,${alpha.toFixed(2)})`;
  }
}

export function CalendarHeatmap() {
  const { daily, settings } = useDashboard();

  // Find available months
  const pnlMap = useMemo(() => {
    const m: Record<string, { pnl: number; trades: number }> = {};
    for (const d of daily) {
      m[d.date] = { pnl: d.pnl, trades: d.trades };
    }
    return m;
  }, [daily]);

  const months = useMemo(() => {
    if (daily.length === 0) return [];
    const first = parseISO(daily[0].date);
    const last = parseISO(daily[daily.length - 1].date);
    const result: Date[] = [];
    let cur = startOfMonth(first);
    while (cur <= endOfMonth(last)) {
      result.push(new Date(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return result.reverse();
  }, [daily]);

  const [monthIdx, setMonthIdx] = useState(0);
  const currentMonth = months[monthIdx] ?? new Date();

  const maxAbs = useMemo(
    () => Math.max(...daily.map((d) => Math.abs(d.pnl)), 1),
    [daily]
  );

  const monthPnl = useMemo(() => {
    let total = 0;
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    for (const d of days) {
      const key = format(d, "yyyy-MM-dd");
      total += pnlMap[key]?.pnl ?? 0;
    }
    return total;
  }, [currentMonth, pnlMap]);

  // Build calendar grid
  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const [tooltip, setTooltip] = useState<{ date: string; pnl: number; trades: number } | null>(null);

  return (
    <ChartCard
      title={`Calendar — ${format(currentMonth, "MMMM yyyy")}`}
      subtitle="Daily P&L heatmap"
      headerRight={
        <div className="flex items-center gap-1">
          <span className={cn(
            "text-sm font-mono font-semibold mr-2",
            monthPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
          )}>
            {monthPnl >= 0 ? "+" : ""}{fmtMoneyFull(monthPnl, settings.privacyMode)}
          </span>
          <button
            onClick={() => setMonthIdx((i) => Math.min(i + 1, months.length - 1))}
            disabled={monthIdx >= months.length - 1}
            className="w-6 h-6 flex items-center justify-center rounded text-[#9090a8] hover:text-[#e8e8f0] disabled:opacity-30 hover:bg-[#1f1f26]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
            disabled={monthIdx <= 0}
            className="w-6 h-6 flex items-center justify-center rounded text-[#9090a8] hover:text-[#e8e8f0] disabled:opacity-30 hover:bg-[#1f1f26]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[10px] text-[#55556a] font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const data = pnlMap[key];
          const inMonth = isSameMonth(day, currentMonth);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          let bg = "bg-[#1a1a1f]";
          let style: React.CSSProperties = {};

          if (inMonth && data) {
            style.backgroundColor = intensityColor(data.pnl, maxAbs, data.pnl >= 0 ? "gain" : "loss");
            bg = "";
          }

          return (
            <div
              key={key}
              className={cn(
                "relative rounded-md aspect-square flex flex-col items-center justify-center transition-all",
                bg,
                inMonth ? "cursor-default" : "opacity-20",
                isWeekend && inMonth && !data ? "opacity-30" : "",
                inMonth && data ? "hover:ring-1 hover:ring-white/20" : ""
              )}
              style={style}
              onMouseEnter={() => data && inMonth && setTooltip({ date: key, pnl: data.pnl, trades: data.trades })}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className={cn(
                "text-[10px] font-medium",
                !inMonth ? "text-[#2a2a35]" :
                data ? (data.pnl >= 0 ? "text-[#86efac]" : "text-[#fca5a5]") :
                "text-[#55556a]"
              )}>
                {format(day, "d")}
              </span>
              {inMonth && data && !settings.privacyMode && (
                <span className={cn(
                  "text-[8px] font-mono leading-tight",
                  data.pnl >= 0 ? "text-[#86efac]" : "text-[#fca5a5]"
                )}>
                  {data.pnl >= 0 ? "+" : ""}{(data.pnl / 1000).toFixed(1)}k
                </span>
              )}
              {inMonth && data && settings.privacyMode && (
                <span className="text-[8px] font-mono text-[#55556a]">••</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-[#1a1a1f] rounded-lg border border-[#2a2a35] text-xs">
          <span className="text-[#9090a8]">{format(parseISO(tooltip.date), "MMMM d, yyyy")}</span>
          <span className={cn("font-mono font-semibold", tooltip.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
            {tooltip.pnl >= 0 ? "+" : ""}{fmtMoneyFull(tooltip.pnl, settings.privacyMode)}
          </span>
          <span className="text-[#55556a]">{tooltip.trades} trade{tooltip.trades !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-[#55556a]">
        <span>Intensity:</span>
        <div className="flex items-center gap-1">
          {[0.15, 0.3, 0.5, 0.7, 0.85].map((a) => (
            <div key={a} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: `rgba(34,197,94,${a})` }} />
          ))}
          <span>Gain</span>
        </div>
        <div className="flex items-center gap-1">
          {[0.15, 0.3, 0.5, 0.7, 0.85].map((a) => (
            <div key={a} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: `rgba(239,68,68,${a})` }} />
          ))}
          <span>Loss</span>
        </div>
      </div>
    </ChartCard>
  );
}
