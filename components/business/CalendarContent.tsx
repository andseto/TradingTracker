"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { fmtMoneyFull, fmtDate, cn } from "@/lib/utils";
import type { Expense, Payout } from "@/types";

interface DayFlow {
  iso: string;
  payouts: Payout[];
  expenses: Expense[];
  moneyIn: number;
  moneyOut: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Wash intensity: how loud a day reads relative to the month's biggest day.
// Three steps so quiet days stay quiet and big days pop.
function washOpacity(flow: number, monthMax: number): number {
  if (flow <= 0 || monthMax <= 0) return 0;
  const r = flow / monthMax;
  if (r > 0.66) return 0.22;
  if (r > 0.33) return 0.14;
  return 0.08;
}

export function CalendarContent() {
  const { expenses, payouts } = useBusiness();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState<DayFlow | null>(null);

  const days = useMemo<Map<string, DayFlow>>(() => {
    const map = new Map<string, DayFlow>();
    const touch = (iso: string) => {
      if (!map.has(iso)) {
        map.set(iso, { iso, payouts: [], expenses: [], moneyIn: 0, moneyOut: 0 });
      }
      return map.get(iso)!;
    };
    for (const p of payouts) {
      const d = touch(p.date);
      d.payouts.push(p);
      if (p.status === "Received") d.moneyIn += Number(p.amount);
    }
    for (const e of expenses) {
      const d = touch(e.date);
      d.expenses.push(e);
      d.moneyOut += Number(e.amount);
    }
    return map;
  }, [expenses, payouts]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthStats = useMemo(() => {
    let moneyIn = 0, moneyOut = 0, maxFlow = 0;
    for (const [iso, d] of days) {
      if (!iso.startsWith(monthPrefix)) continue;
      moneyIn += d.moneyIn;
      moneyOut += d.moneyOut;
      maxFlow = Math.max(maxFlow, d.moneyIn + d.moneyOut);
    }
    return { moneyIn, moneyOut, net: moneyIn - moneyOut, maxFlow };
  }, [days, monthPrefix]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = isoOf(now.getFullYear(), now.getMonth(), now.getDate());

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Month nav + summary */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f] transition-colors" aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[150px] text-center" style={{ color: "var(--text-1)" }}>
            {monthLabel}
          </span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f] transition-colors" aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
          className="text-xs font-medium border border-[#2a2a35] text-[#9090a8] hover:text-[#e8e8f0] rounded-lg px-2.5 py-1.5 transition-colors"
        >
          Today
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs font-mono">
          <span className="text-green-400">In {fmtMoneyFull(monthStats.moneyIn)}</span>
          <span style={{ color: "var(--text-3)" }}>·</span>
          <span className="text-red-400">Out {fmtMoneyFull(monthStats.moneyOut)}</span>
          <span style={{ color: "var(--text-3)" }}>·</span>
          <span style={{ color: monthStats.net >= 0 ? "#22c55e" : "#ef4444" }}>
            Net {monthStats.net >= 0 ? "+" : "−"}{fmtMoneyFull(Math.abs(monthStats.net))}
          </span>
        </div>
      </div>

      {/* Grid */}
      <Card className="!p-2 md:!p-3">
        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] uppercase tracking-wide py-1" style={{ color: "var(--text-3)" }}>
              {w}
            </div>
          ))}

          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const iso = isoOf(year, month, dayNum);
            const flow = days.get(iso);
            const totalFlow = flow ? flow.moneyIn + flow.moneyOut : 0;
            const net = flow ? flow.moneyIn - flow.moneyOut : 0;
            const isToday = iso === todayISO;
            const wash = washOpacity(totalFlow, monthStats.maxFlow);
            const washColor =
              net > 0 ? `rgba(34,197,94,${wash})` : net < 0 ? `rgba(239,68,68,${wash})` : undefined;

            return (
              <button
                key={iso}
                onClick={() => flow && setSelected(flow)}
                disabled={!flow}
                className={cn(
                  "relative rounded-lg border p-1.5 md:p-2 min-h-[64px] md:min-h-[84px] flex flex-col items-start text-left transition-colors",
                  flow ? "cursor-pointer hover:border-indigo-500/40" : "cursor-default",
                  isToday ? "border-indigo-500/50" : ""
                )}
                style={{
                  background: washColor ?? "var(--bg-card)",
                  borderColor: isToday ? undefined : "var(--c-border)",
                }}
                title={
                  flow
                    ? `${flow.payouts.length} payout${flow.payouts.length === 1 ? "" : "s"}, ${flow.expenses.length} expense${flow.expenses.length === 1 ? "" : "s"} — click for details`
                    : undefined
                }
              >
                <span
                  className={cn("text-[11px] font-mono", isToday && "font-bold")}
                  style={{ color: isToday ? "#818cf8" : "var(--text-3)" }}
                >
                  {dayNum}
                </span>

                {flow && (
                  <>
                    {/* Activity markers — counts, not amounts */}
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {flow.payouts.slice(0, 3).map((p) => (
                        <ArrowUpRight key={p.id} className="w-3 h-3 text-green-400" />
                      ))}
                      {flow.payouts.length > 3 && (
                        <span className="text-[9px] text-green-400 font-mono">+{flow.payouts.length - 3}</span>
                      )}
                      {flow.expenses.slice(0, 3).map((e) => (
                        <ArrowDownRight key={e.id} className="w-3 h-3 text-red-400" />
                      ))}
                      {flow.expenses.length > 3 && (
                        <span className="text-[9px] text-red-400 font-mono">+{flow.expenses.length - 3}</span>
                      )}
                    </div>

                    {/* Flow bar: the day's dollars in vs out, no numbers */}
                    {totalFlow > 0 && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 h-[3px] rounded-full overflow-hidden flex gap-px" style={{ background: "var(--bg-elevated)" }}>
                        {flow.moneyIn > 0 && (
                          <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${(flow.moneyIn / totalFlow) * 100}%` }} />
                        )}
                        {flow.moneyOut > 0 && (
                          <div className="h-full bg-[#ef4444] rounded-full" style={{ width: `${(flow.moneyOut / totalFlow) * 100}%` }} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 px-1 text-[11px]" style={{ color: "var(--text-3)" }}>
          <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-green-400" /> payout</span>
          <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-red-400" /> expense</span>
          <span className="flex items-center gap-1">
            <span className="inline-flex w-6 h-[3px] rounded-full overflow-hidden gap-px">
              <span className="w-3 bg-[#16a34a]" /><span className="w-3 bg-[#ef4444]" />
            </span>
            in vs out share
          </span>
          <span>brighter day = bigger money day · click a day for the numbers</span>
        </div>
      </Card>

      {/* Day detail */}
      <Modal
        open={!!selected}
        title={selected ? fmtDate(selected.iso) : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-3">
            {selected.payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--c-border)", background: "var(--bg-card)" }}>
                <ArrowUpRight className="w-4 h-4 text-green-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm" style={{ color: "var(--text-1)" }}>{p.firm}</div>
                  <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
                    Payout{p.method ? ` · ${p.method}` : ""} <Badge value={p.status} />
                  </div>
                </div>
                <span className="font-mono text-sm text-green-400">+{fmtMoneyFull(Number(p.amount))}</span>
              </div>
            ))}
            {selected.expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--c-border)", background: "var(--bg-card)" }}>
                <ArrowDownRight className="w-4 h-4 text-red-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm" style={{ color: "var(--text-1)" }}>{e.firm}</div>
                  <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
                    {e.expense_type} {e.outcome && <Badge value={e.outcome} />}
                  </div>
                </div>
                <span className="font-mono text-sm text-red-400">−{fmtMoneyFull(Number(e.amount))}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 text-xs" style={{ color: "var(--text-2)" }}>
              <span>Day net</span>
              <span
                className="font-mono font-semibold"
                style={{ color: selected.moneyIn - selected.moneyOut >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {selected.moneyIn - selected.moneyOut >= 0 ? "+" : "−"}
                {fmtMoneyFull(Math.abs(selected.moneyIn - selected.moneyOut))}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
