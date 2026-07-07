"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { Card } from "@/components/ui/Card";
import { evalWinStreak } from "@/lib/metrics";
import { fmtDate, cn } from "@/lib/utils";

export function WinStreak() {
  const { expenses } = useBusiness();
  const { dots, current, best } = useMemo(() => evalWinStreak(expenses), [expenses]);

  if (dots.length === 0) return null;

  return (
    <Card
      title="Eval Win Streak"
      subtitle="Each dot is a resolved eval, oldest to newest — a red dot (Failed) breaks the streak"
      actions={
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <Flame className={cn("w-3.5 h-3.5", current > 0 ? "text-amber-400" : "text-[#55556a]")} />
            <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-1)" }}>{current}</span>
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>current</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-1)" }}>{best}</span>
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>best</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {dots.map((d) => (
          <span
            key={d.id}
            title={`${d.firm} — ${d.outcome} — ${fmtDate(d.date)}`}
            className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              d.isWin ? "bg-green-500" : "bg-red-500/70"
            )}
          />
        ))}
      </div>
    </Card>
  );
}
