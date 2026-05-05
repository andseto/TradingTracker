"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format, parseISO, eachDayOfInterval,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth,
} from "date-fns";
import { useDashboard } from "@/context/DashboardContext";
import { ChevronLeft, ChevronRight, BookOpen, PenLine } from "lucide-react";
import { cn, fmtMoneyFull } from "@/lib/utils";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const GAIN_BG     = "rgba(34,197,94,0.2)";
const LOSS_BG     = "rgba(239,68,68,0.2)";
const GAIN_BORDER = "rgba(34,197,94,0.35)";
const LOSS_BORDER = "rgba(239,68,68,0.35)";

function fmtCell(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "-";
  const abs = Math.abs(pnl);
  if (abs >= 100000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function JournalContent() {
  const { allDaily, journalEntries, settings } = useDashboard();
  const router = useRouter();

  const gainText = settings.theme === "light" ? "#16a34a" : "#86efac";
  const lossText = settings.theme === "light" ? "#dc2626" : "#fca5a5";

  const pnlMap = useMemo(() => {
    const m: Record<string, { pnl: number; trades: number }> = {};
    for (const d of allDaily) m[d.date] = { pnl: d.pnl, trades: d.trades };
    return m;
  }, [allDaily]);

  const months = useMemo(() => {
    if (allDaily.length === 0) return [];
    const first = parseISO(allDaily[0].date);
    const last  = parseISO(allDaily[allDaily.length - 1].date);
    const result: Date[] = [];
    let cur = startOfMonth(first);
    while (cur <= endOfMonth(last)) {
      result.push(new Date(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return result.reverse();
  }, [allDaily]);

  const [monthIdx, setMonthIdx] = useState(0);
  const currentMonth = months[monthIdx] ?? new Date();

  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end   = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const { monthPnl, monthTradingDays, monthJournaledDays } = useMemo(() => {
    let pnl = 0;
    let trading = 0;
    let journaled = 0;
    for (const d of eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })) {
      const key = format(d, "yyyy-MM-dd");
      if (pnlMap[key]) {
        pnl += pnlMap[key].pnl;
        trading++;
        if (journalEntries[key]) journaled++;
      }
    }
    return { monthPnl: pnl, monthTradingDays: trading, monthJournaledDays: journaled };
  }, [currentMonth, pnlMap, journalEntries]);

  const entriesCount  = Object.keys(journalEntries).length;
  const ratedEntries  = Object.values(journalEntries).filter((e) => e.rating !== null);
  const avgRating     = ratedEntries.length > 0
    ? ratedEntries.reduce((s, e) => s + (e.rating ?? 0), 0) / ratedEntries.length
    : null;
  const coverage = allDaily.length > 0 ? Math.round((entriesCount / allDaily.length) * 100) : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
            Trade Journal
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Click any trading day to add or view your journal entry.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Trading Days",    value: allDaily.length.toString() },
          { label: "Journal Entries", value: entriesCount.toString() },
          { label: "Coverage",        value: `${coverage}%` },
          { label: "Avg Rating",      value: avgRating !== null ? `${avgRating.toFixed(1)} / 5` : "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--c-border)" }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>
              {label}
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--c-border)" }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonthIdx((i) => Math.min(i + 1, months.length - 1))}
              disabled={monthIdx >= months.length - 1}
              className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors hover:bg-black/10"
              style={{ color: "var(--text-2)" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold w-32 text-center" style={{ color: "var(--text-1)" }}>
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
              disabled={monthIdx <= 0}
              className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors hover:bg-black/10"
              style={{ color: "var(--text-2)" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-3)" }}>
            <span>
              <span className="font-semibold text-indigo-400">{monthJournaledDays}</span>
              <span>/{monthTradingDays} journaled</span>
            </span>
            <span className={cn("font-mono font-semibold", monthPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
              {monthPnl >= 0 ? "+" : ""}{fmtMoneyFull(monthPnl, settings.privacyMode)}
            </span>
          </div>
        </div>

        {/* DOW headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DOW.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium py-0.5"
              style={{ color: "var(--text-3)" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: Math.ceil(calDays.length / 7) }, (_, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5 mb-1.5">
            {calDays.slice(wi * 7, wi * 7 + 7).map((day) => {
              const key      = format(day, "yyyy-MM-dd");
              const data     = pnlMap[key];
              const inMonth  = isSameMonth(day, currentMonth);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const hasEntry = inMonth && !!journalEntries[key];
              const showGain = inMonth && data && data.pnl >= 0;

              const cellStyle: React.CSSProperties = {
                background: !inMonth || !data ? "var(--bg-surface)" : showGain ? GAIN_BG : LOSS_BG,
                border: !inMonth || !data
                  ? "1px solid var(--c-border)"
                  : hasEntry
                  ? showGain
                    ? "2px solid rgba(34,197,94,0.65)"
                    : "2px solid rgba(239,68,68,0.65)"
                  : showGain
                  ? `1px dashed ${GAIN_BORDER}`
                  : `1px dashed ${LOSS_BORDER}`,
              };

              const numColor = !inMonth
                ? "var(--c-border2)"
                : !data
                ? "var(--text-3)"
                : showGain
                ? gainText
                : lossText;

              return (
                <div
                  key={key}
                  onClick={() => inMonth && data && router.push(`/dashboard/journal/${key}`)}
                  className={cn(
                    "rounded-lg min-h-[62px] flex flex-col items-center justify-center gap-1 transition-all select-none",
                    !inMonth && "opacity-20",
                    isWeekend && inMonth && !data && "opacity-30",
                    inMonth && data
                      ? "cursor-pointer hover:ring-2 hover:ring-indigo-500/60 hover:scale-[1.03]"
                      : "cursor-default"
                  )}
                  style={cellStyle}
                >
                  <span className="text-[11px] font-semibold leading-none" style={{ color: numColor }}>
                    {format(day, "d")}
                  </span>
                  {inMonth && data && !settings.privacyMode && (
                    <span className="text-[10px] font-mono font-medium leading-none" style={{ color: numColor }}>
                      {fmtCell(data.pnl)}
                    </span>
                  )}
                  {inMonth && data && settings.privacyMode && (
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>••</span>
                  )}
                  {hasEntry && (
                    <PenLine className="w-2.5 h-2.5 opacity-60" style={{ color: numColor }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 flex-wrap text-[10px]" style={{ color: "var(--text-3)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: GAIN_BG, border: "2px solid rgba(34,197,94,0.65)" }} />
            <span>Journaled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: GAIN_BG, border: `1px dashed ${GAIN_BORDER}` }} />
            <span>Not journaled yet</span>
          </div>
          <span>· Click any trading day to write</span>
        </div>
      </div>
    </div>
  );
}
