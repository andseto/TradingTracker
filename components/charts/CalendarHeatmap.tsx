"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoneyFull } from "@/lib/utils";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Minus, Ban } from "lucide-react";
import { ClosedPosition, DayTag } from "@/types";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const GAIN_BG     = "rgba(34,197,94,0.2)";
const LOSS_BG     = "rgba(239,68,68,0.2)";
const GAIN_BORDER = "rgba(34,197,94,0.35)";
const LOSS_BORDER = "rgba(239,68,68,0.35)";
const BE_BG       = "rgba(234,179,8,0.2)";
const BE_BORDER   = "rgba(234,179,8,0.35)";
const VOID_BG     = "rgba(107,114,128,0.08)";
const VOID_BORDER = "rgba(107,114,128,0.25)";

function fmtCell(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "-";
  const abs = Math.abs(pnl);
  if (abs >= 100000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const TAG_LABELS: Record<DayTag, string> = {
  win: "Win",
  loss: "Loss",
  breakeven: "Break Even",
  void: "Void",
};

interface DayDetailProps {
  date: string;
  pnl: number;
  trades: ClosedPosition[];
  privacy: boolean;
  tag: DayTag | undefined;
  onTagChange: (tag: DayTag | null) => void;
  onClose: () => void;
}

function DayDetail({ date, pnl, trades, privacy, tag, onTagChange, onClose }: DayDetailProps) {
  const effectiveWin = tag === "win" || (!tag && pnl >= 0);
  const isBreakEven  = tag === "breakeven";
  const isVoid       = tag === "void";

  const dayLabel = isVoid ? "Void" : isBreakEven ? "Break Even" : effectiveWin ? "Green Day" : "Red Day";
  const dayColor = isVoid
    ? "text-gray-400 bg-gray-500/10 border-gray-500/20"
    : isBreakEven
    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : effectiveWin
    ? "text-[#22c55e] bg-green-500/10 border-green-500/20"
    : "text-[#ef4444] bg-red-500/10 border-red-500/20";

  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
      {/* Header */}
      <div
        className="px-3 py-2 border-b"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--c-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
              {format(parseISO(date), "MMMM d, yyyy")}
            </span>
            <span className={cn("text-sm font-mono font-semibold", isVoid ? "text-gray-400 line-through" : pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
              {pnl >= 0 ? "+" : ""}{fmtMoneyFull(pnl, privacy)}
            </span>
            <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", dayColor)}>
              {isVoid       ? <Ban className="w-3 h-3" />       :
               isBreakEven  ? <Minus className="w-3 h-3" />    :
               effectiveWin ? <TrendingUp className="w-3 h-3" /> :
                              <TrendingDown className="w-3 h-3" />}
              {dayLabel}
            </span>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: "var(--text-3)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tag override selector */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Override:</span>
          {(["win", "loss", "breakeven", "void"] as DayTag[]).map((t) => (
            <button
              key={t}
              onClick={() => onTagChange(tag === t ? null : t)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors",
                tag === t
                  ? t === "win"       ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : t === "loss"      ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : t === "breakeven" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                  :                     "bg-gray-500/20 border-gray-500/40 text-gray-400"
                  : "hover:bg-white/5"
              )}
              style={tag !== t ? { borderColor: "var(--c-border)", color: "var(--text-3)" } : undefined}
            >
              {TAG_LABELS[t]}
            </button>
          ))}
          {tag && (
            <button
              onClick={() => onTagChange(null)}
              className="px-2 py-0.5 text-[10px] font-medium rounded-full border hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--c-border)", color: "var(--text-3)" }}
            >
              Auto
            </button>
          )}
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="px-3 py-4 text-xs text-center" style={{ color: "var(--text-3)" }}>
          No closed positions found for this day.
        </div>
      ) : (() => {
        const grouped = Object.values(
          trades.reduce<Record<string, { symbol: string; quantity: number; entryPrice: number; exitPrice: number; pnl: number; pnlPct: number }>>((acc, t) => {
            const key = `${t.symbol}|${t.entryPrice.toFixed(2)}|${t.exitPrice.toFixed(2)}`;
            if (!acc[key]) {
              acc[key] = { symbol: t.symbol, quantity: 0, entryPrice: t.entryPrice, exitPrice: t.exitPrice, pnl: 0, pnlPct: t.pnlPct };
            }
            acc[key].quantity += t.quantity;
            acc[key].pnl += t.pnl;
            return acc;
          }, {})
        ).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

        const wins   = grouped.filter(r => r.pnl > 0).length;
        const losses = grouped.filter(r => r.pnl <= 0).length;

        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                  {["Symbol", "Qty", "Entry", "Exit", "P&L", "%"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--c-border)" }}>
                    <td className="px-3 py-2 font-mono font-semibold" style={{ color: "var(--text-1)" }}>{t.symbol}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: "var(--text-2)" }}>{t.quantity}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: "var(--text-2)" }}>
                      {privacy ? "••••" : `$${t.entryPrice.toFixed(2)}`}
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: "var(--text-2)" }}>
                      {privacy ? "••••" : `$${t.exitPrice.toFixed(2)}`}
                    </td>
                    <td className={cn("px-3 py-2 font-mono font-semibold", t.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                      {privacy ? "••••" : `${t.pnl >= 0 ? "+" : ""}$${Math.abs(t.pnl).toFixed(2)}`}
                    </td>
                    <td className={cn("px-3 py-2 font-mono", t.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                      {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--c-border)", background: "var(--bg-elevated)" }}>
                  <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: "var(--text-2)" }}>Total</td>
                  <td colSpan={3} className="px-3 py-2.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                    {grouped.length} position{grouped.length !== 1 ? "s" : ""} · {wins}W / {losses}L
                  </td>
                  <td colSpan={2} className={cn("px-3 py-2.5 font-mono font-bold text-right text-sm", pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                    {pnl >= 0 ? "+" : ""}{fmtMoneyFull(pnl, privacy)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })()}
    </div>
  );
}

interface CalendarHeatmapProps {
  bare?: boolean;
}

export function CalendarHeatmap({ bare = false }: CalendarHeatmapProps) {
  const { daily, positions, settings, dayTags, setDayTag } = useDashboard();

  const gainText = settings.theme === "light" ? "#16a34a" : "#86efac";
  const lossText = settings.theme === "light" ? "#dc2626" : "#fca5a5";
  const beText   = settings.theme === "light" ? "#b45309" : "#fde68a";

  const pnlMap = useMemo(() => {
    const m: Record<string, { pnl: number; trades: number }> = {};
    for (const d of daily) m[d.date] = { pnl: d.pnl, trades: d.trades };
    return m;
  }, [daily]);

  const positionsByDate = useMemo(() => {
    const m: Record<string, ClosedPosition[]> = {};
    for (const p of positions) {
      if (!m[p.closeDate]) m[p.closeDate] = [];
      m[p.closeDate].push(p);
    }
    return m;
  }, [positions]);

  const months = useMemo(() => {
    if (daily.length === 0) return [];
    const first = parseISO(daily[0].date);
    const last  = parseISO(daily[daily.length - 1].date);
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

  const monthPnl = useMemo(() => {
    let total = 0;
    for (const d of eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })) {
      total += pnlMap[format(d, "yyyy-MM-dd")]?.pnl ?? 0;
    }
    return total;
  }, [currentMonth, pnlMap]);

  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end   = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayClick = (key: string, inMonth: boolean, hasData: boolean) => {
    if (!inMonth || !hasData) return;
    setSelectedDate((prev) => (prev === key ? null : key));
  };

  const grid = (
    <>
      {/* Nav header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMonthIdx((i) => Math.min(i + 1, months.length - 1)); setSelectedDate(null); }}
            disabled={monthIdx >= months.length - 1}
            className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors hover:bg-black/5"
            style={{ color: "var(--text-2)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold w-28 text-center" style={{ color: "var(--text-1)" }}>
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => { setMonthIdx((i) => Math.max(i - 1, 0)); setSelectedDate(null); }}
            disabled={monthIdx <= 0}
            className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors hover:bg-black/5"
            style={{ color: "var(--text-2)" }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className={cn("text-sm font-mono font-semibold", monthPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
          {monthPnl >= 0 ? "+" : ""}{fmtMoneyFull(monthPnl, settings.privacyMode)}
        </span>
      </div>

      {/* DOW headers */}
      <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr)) 60px" }}>
        {DOW.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium py-0.5" style={{ color: "var(--text-3)" }}>{d}</div>
        ))}
        <div className="text-center text-[10px] font-medium py-0.5" style={{ color: "var(--text-3)" }}>Wk</div>
      </div>

      {/* Calendar rows */}
      {Array.from({ length: Math.ceil(calDays.length / 7) }, (_, wi) => {
        const week = calDays.slice(wi * 7, wi * 7 + 7);

        const weekPnl = week.reduce((sum, day) => {
          const k = format(day, "yyyy-MM-dd");
          if (!isSameMonth(day, currentMonth)) return sum;
          const tag = dayTags[k];
          if (tag === "void") return sum;
          return sum + (pnlMap[k]?.pnl ?? 0);
        }, 0);
        const weekHasData = week.some((day) => isSameMonth(day, currentMonth) && pnlMap[format(day, "yyyy-MM-dd")]);

        return (
          <div key={wi} className="grid gap-1 mb-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr)) 60px" }}>
            {week.map((day) => {
              const key       = format(day, "yyyy-MM-dd");
              const data      = pnlMap[key];
              const inMonth   = isSameMonth(day, currentMonth);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isSelected = selectedDate === key;
              const tag       = inMonth && data ? dayTags[key] : undefined;

              const isVoid      = tag === "void";
              const isBreakEven = tag === "breakeven";
              const overrideWin = tag === "win";
              const overrideLoss = tag === "loss";
              const autoWin     = !tag && data && data.pnl >= 0;

              const showGain = inMonth && data && (overrideWin || (!overrideLoss && !isBreakEven && !isVoid && autoWin));
              const showLoss = inMonth && data && (overrideLoss || (!overrideWin && !isBreakEven && !isVoid && !autoWin));

              const cellStyle: React.CSSProperties = {
                background: !inMonth || !data
                  ? "var(--bg-elevated)"
                  : isVoid      ? VOID_BG
                  : isBreakEven ? BE_BG
                  : showGain    ? GAIN_BG
                  : LOSS_BG,
                border: !inMonth || !data
                  ? "1px solid var(--c-border)"
                  : isVoid      ? `1px dashed ${VOID_BORDER}`
                  : isBreakEven ? `1px solid ${BE_BORDER}`
                  : showGain    ? `1px solid ${GAIN_BORDER}`
                  : `1px solid ${LOSS_BORDER}`,
                opacity: isVoid ? 0.5 : undefined,
              };

              const numColor = !inMonth ? "var(--c-border2)"
                : !data          ? "var(--text-3)"
                : isVoid         ? "var(--text-3)"
                : isBreakEven    ? beText
                : showGain       ? gainText
                : lossText;

              return (
                <div
                  key={key}
                  onClick={() => handleDayClick(key, inMonth, !!data)}
                  className={cn(
                    "rounded-md min-h-[54px] flex flex-col items-center justify-center gap-1.5 transition-all select-none px-0.5",
                    !inMonth ? "opacity-20" : "",
                    isWeekend && inMonth && !data ? "opacity-30" : "",
                    inMonth && data ? "cursor-pointer hover:ring-1 hover:ring-[#6366f1]/50" : "cursor-default",
                    isSelected ? "ring-2 ring-[#6366f1]/70" : ""
                  )}
                  style={cellStyle}
                >
                  <span className="text-[11px] font-semibold leading-none" style={{ color: numColor }}>
                    {format(day, "d")}
                  </span>
                  {inMonth && data && !settings.privacyMode && !isVoid && (
                    <span className="text-[10px] font-mono font-medium leading-none" style={{ color: numColor }}>
                      {fmtCell(data.pnl)}
                    </span>
                  )}
                  {inMonth && data && settings.privacyMode && !isVoid && (
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>••</span>
                  )}
                  {inMonth && data && isVoid && (
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>void</span>
                  )}
                </div>
              );
            })}

            {/* Weekly total */}
            <div
              className="rounded-md min-h-[54px] flex flex-col items-center justify-center gap-0.5 px-1"
              style={!weekHasData
                ? { border: "1px solid var(--c-border)", background: "var(--bg-surface)" }
                : weekPnl >= 0
                  ? { border: `1px solid ${GAIN_BORDER}`, background: GAIN_BG }
                  : { border: `1px solid ${LOSS_BORDER}`, background: LOSS_BG }
              }
            >
              {weekHasData && (
                <>
                  <span className="text-[9px] font-medium uppercase tracking-wide leading-none" style={{ color: "var(--text-3)" }}>wk</span>
                  <span
                    className="text-[10px] font-mono font-semibold leading-none text-center"
                    style={{ color: weekPnl >= 0 ? gainText : lossText }}
                  >
                    {settings.privacyMode ? "••" : fmtCell(weekPnl)}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Day detail panel */}
      {selectedDate && pnlMap[selectedDate] && (
        <DayDetail
          date={selectedDate}
          pnl={pnlMap[selectedDate].pnl}
          trades={positionsByDate[selectedDate] ?? []}
          privacy={settings.privacyMode}
          tag={dayTags[selectedDate]}
          onTagChange={(t) => setDayTag(selectedDate, t)}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 flex-wrap text-[10px]" style={{ color: "var(--text-3)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: GAIN_BG, border: `1px solid ${GAIN_BORDER}` }} />
          <span>Gain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: LOSS_BG, border: `1px solid ${LOSS_BORDER}` }} />
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: BE_BG, border: `1px solid ${BE_BORDER}` }} />
          <span>Break Even</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: VOID_BG, border: `1px dashed ${VOID_BORDER}` }} />
          <span>Void</span>
        </div>
        <span>· Click a day to tag or view details</span>
      </div>
    </>
  );

  if (bare) return <div>{grid}</div>;

  return (
    <ChartCard title="Calendar" subtitle="Click a day to tag or view breakdown">
      {grid}
    </ChartCard>
  );
}
