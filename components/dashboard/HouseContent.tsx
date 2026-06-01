"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Home, Target, ChevronLeft } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { calcAllGoalMonths, GoalMonth } from "@/lib/calculations";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function computeTotalMonths(startBalance: number, targetBalance: number, monthlyPct: number): number {
  if (targetBalance <= startBalance || monthlyPct <= 0) return 0;
  return Math.ceil(Math.log(targetBalance / startBalance) / Math.log(1 + monthlyPct / 100));
}

// ── House Visual ──────────────────────────────────────────────────────────────

const BRICKS_PER_ROW = 8;
const BRICK_H = 22;
const GAP = 3;

function HouseBricks({ months, completedSet }: { months: string[]; completedSet: Set<string> }) {
  const numRows = Math.ceil(months.length / BRICKS_PER_ROW);
  const rows: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    rows.push(months.slice(r * BRICKS_PER_ROW, (r + 1) * BRICKS_PER_ROW));
  }

  return (
    <div className="flex flex-col-reverse" style={{ gap: GAP }}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex" style={{ gap: GAP }}>
          {row.map((m) => (
            <div
              key={m}
              className="flex-1 rounded-sm transition-all duration-500"
              style={{
                height: BRICK_H,
                background: completedSet.has(m)
                  ? "linear-gradient(135deg, #c2410c 0%, #9a3412 100%)"
                  : "#1a1a2a",
                border: completedSet.has(m) ? "1px solid #b45309" : "1px solid #252535",
                boxShadow: completedSet.has(m) ? "inset 0 1px 0 rgba(255,140,80,0.18)" : "none",
              }}
              title={getMonthLabel(m)}
            />
          ))}
          {/* Pad incomplete last row */}
          {ri === numRows - 1 &&
            Array.from({ length: BRICKS_PER_ROW - row.length }).map((_, i) => (
              <div key={`pad-${i}`} className="flex-1" style={{ height: BRICK_H }} />
            ))}
        </div>
      ))}
    </div>
  );
}

function HouseVisual({ months, completedSet }: { months: string[]; completedSet: Set<string> }) {
  const completedCount = months.filter((m) => completedSet.has(m)).length;
  const progress = months.length > 0 ? completedCount / months.length : 0;
  const isDone = progress >= 1;
  const leftWindowLit = progress >= 0.35;
  const rightWindowLit = progress >= 0.65;

  return (
    <div className="mx-auto w-full max-w-md select-none">
      {/* Roof */}
      <svg width="100%" viewBox="0 0 480 130" className="block" style={{ display: "block" }}>
        {/* Chimney */}
        <rect x="308" y="38" width="32" height="82" fill="#1c1c2c" stroke="#2a2a40" strokeWidth="1.5" />
        {/* Smoke when done */}
        {isDone && (
          <>
            <circle cx="324" cy="30" r="9" fill="#3a3a55" opacity={0.7} />
            <circle cx="316" cy="18" r="7" fill="#2e2e48" opacity={0.5} />
            <circle cx="332" cy="12" r="5" fill="#2e2e48" opacity={0.3} />
          </>
        )}
        {/* Roof polygon */}
        <polygon
          points="240,8 12,128 468,128"
          fill={isDone ? "#2a1f58" : "#1c1c30"}
          stroke="#2e2e48"
          strokeWidth="2"
        />
        {/* Roof ridge line */}
        <line x1="12" y1="128" x2="468" y2="128" stroke="#38385a" strokeWidth="3" />
        {/* Stars when done */}
        {isDone && (
          <>
            {[75,105,140,390,420,445].map((cx, i) => (
              <circle key={i} cx={cx} cy={[55,38,62,60,42,68][i]} r={[2,1.5,1,2,1,1.5][i]} fill="#fbbf24" />
            ))}
          </>
        )}
      </svg>

      {/* Wall */}
      <div className="relative border border-[#2a2a40]" style={{ background: "#12121c" }}>
        {/* Left window */}
        <div
          className="absolute top-3 left-4 pointer-events-none z-10 rounded-sm border border-[#2e2e48]"
          style={{ width: 50, height: 38, background: leftWindowLit ? "#162a44" : "#0d0d1a" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-[#2a2a40]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-px bg-[#2a2a40]" />
          </div>
        </div>

        {/* Right window */}
        <div
          className="absolute top-3 right-4 pointer-events-none z-10 rounded-sm border border-[#2e2e48]"
          style={{ width: 50, height: 38, background: rightWindowLit ? "#162a44" : "#0d0d1a" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-[#2a2a40]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-px bg-[#2a2a40]" />
          </div>
        </div>

        {/* Bricks */}
        <div className="p-3">
          <HouseBricks months={months} completedSet={completedSet} />
        </div>

        {/* Door */}
        <div className="flex justify-center pb-0">
          <div
            className="w-16 h-12 rounded-t-md border border-[#2a2a40] relative"
            style={{ background: "#0a0a14" }}
          >
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#3a3a55]" />
          </div>
        </div>
      </div>

      {/* Ground */}
      <div
        className="h-3 rounded-b-sm border-x border-b border-[#2a2a40]"
        style={{ background: "#0d1a0d" }}
      />
    </div>
  );
}

// ── Month Row ─────────────────────────────────────────────────────────────────

function MonthRow({
  index,
  month,
  gm,
  isComplete,
  isAuto,
  onToggle,
}: {
  index: number;
  month: string;
  gm: GoalMonth | undefined;
  isComplete: boolean;
  isAuto: boolean;
  onToggle: () => void;
}) {
  const isFuture = !gm || gm.status === "future";
  const isCurrent = gm?.status === "current";

  let badge = "";
  let badgeClass = "";
  if (isFuture) { badge = "future"; badgeClass = "bg-[#1a1a2a] text-[#44445a]"; }
  else if (isAuto) { badge = "auto"; badgeClass = "bg-emerald-900/40 text-emerald-400"; }
  else if (isCurrent) { badge = "active"; badgeClass = "bg-indigo-900/30 text-indigo-400"; }
  else if (isComplete) { badge = "manual"; badgeClass = "bg-orange-900/30 text-orange-400"; }
  else { badge = "missed"; badgeClass = "bg-red-900/20 text-red-400/70"; }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b transition-colors hover:bg-[#1a1a1f] cursor-pointer"
      style={{ borderColor: "var(--c-border)" }}
      onClick={onToggle}
    >
      <span className="text-xs w-6 text-right shrink-0 tabular-nums" style={{ color: "var(--text-3)" }}>
        {index + 1}
      </span>

      {/* Mini brick indicator */}
      <div
        className="w-5 h-3.5 rounded-sm shrink-0 transition-all"
        style={{
          background: isComplete
            ? "linear-gradient(135deg, #c2410c, #9a3412)"
            : "#1a1a2a",
          border: isComplete ? "1px solid #b45309" : "1px solid #252535",
        }}
      />

      {/* Month label */}
      <span
        className="text-sm flex-1"
        style={{ color: isComplete ? "var(--text-1)" : "var(--text-3)" }}
      >
        {getMonthLabel(month)}
      </span>

      {/* Badge */}
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0", badgeClass)}>
        {badge}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function HouseContent() {
  const { allDaily, goal, settings } = useDashboard();
  const privacy = settings.privacyMode;

  const [targetInput, setTargetInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("tradeforge-house-target") ?? "";
  });

  const [manualChecks, setManualChecks] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const s = localStorage.getItem("tradeforge-house-checks");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });

  const targetBalance = useMemo(() => {
    const n = parseFloat(targetInput.replace(/,/g, ""));
    return isNaN(n) || n <= 0 ? null : n;
  }, [targetInput]);

  const totalMonths = useMemo(() => {
    if (!goal || !targetBalance || targetBalance <= goal.startBalance) return 0;
    return computeTotalMonths(goal.startBalance, targetBalance, goal.targetPct);
  }, [goal, targetBalance]);

  // Get all goal month data (past real data + future projections)
  const goalMonthData = useMemo(() => {
    if (!goal || totalMonths <= 0) return [];
    return calcAllGoalMonths(allDaily, goal, totalMonths + 1, "compound").slice(0, totalMonths);
  }, [allDaily, goal, totalMonths]);

  const allMonthStrings = useMemo(() => goalMonthData.map((m) => m.month), [goalMonthData]);

  const goalMonthMap = useMemo(() => {
    const map = new Map<string, GoalMonth>();
    for (const gm of goalMonthData) map.set(gm.month, gm);
    return map;
  }, [goalMonthData]);

  // Completed = auto-achieved OR manually checked
  const completedSet = useMemo(() => {
    const s = new Set<string>();
    for (const gm of goalMonthData) {
      if (gm.isAchieved === true) s.add(gm.month);
    }
    for (const m of manualChecks) s.add(m);
    return s;
  }, [goalMonthData, manualChecks]);

  const completedCount = allMonthStrings.filter((m) => completedSet.has(m)).length;
  const progress = totalMonths > 0 ? completedCount / totalMonths : 0;

  function saveTarget(val: string) {
    setTargetInput(val);
    const n = parseFloat(val.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) {
      localStorage.setItem("tradeforge-house-target", val);
    }
  }

  function toggleMonth(month: string) {
    setManualChecks((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      localStorage.setItem("tradeforge-house-checks", JSON.stringify([...next]));
      return next;
    });
  }

  const yearsMonths = totalMonths > 0
    ? `${Math.floor(totalMonths / 12)}y ${totalMonths % 12}m`
    : "";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Home className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>
            Build a House
          </h1>
          {totalMonths > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-600/15 text-orange-400 border border-orange-500/20">
              {totalMonths} bricks
            </span>
          )}
        </div>
        <Link
          href="/dashboard/goals"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-[#1a1a1f]"
          style={{ borderColor: "var(--c-border)", color: "var(--text-2)" }}
        >
          <ChevronLeft className="w-3 h-3" />
          Back to Goals
        </Link>
      </div>

      {/* No goal state */}
      {!goal ? (
        <div
          className="rounded-xl border p-10 text-center space-y-3"
          style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
        >
          <Target className="w-10 h-10 text-indigo-400/40 mx-auto" />
          <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
            No monthly goal set up yet
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Set up a monthly growth goal first to start building your house.
          </p>
          <Link
            href="/dashboard/goals"
            className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Set Up Goal
          </Link>
        </div>
      ) : (
        <>
          {/* Target Balance Input */}
          <div
            className="rounded-xl border p-5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="flex-1 space-y-2">
                <label
                  className="block text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-2)" }}
                >
                  Target Balance
                </label>
                <div className="relative max-w-xs">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: "var(--text-3)" }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={targetInput}
                    onChange={(e) => saveTarget(e.target.value)}
                    placeholder="1000000"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                    style={{
                      background: "var(--bg-base)",
                      borderColor: "var(--c-border)",
                      color: "var(--text-1)",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  The balance you want to reach. Each month you hit your +{goal.targetPct}% goal
                  adds one brick to your house.
                </p>
              </div>

              {targetBalance && totalMonths > 0 && (
                <div
                  className="rounded-lg border p-4 space-y-2 sm:text-right shrink-0 sm:min-w-[160px]"
                  style={{ borderColor: "var(--c-border)", background: "var(--bg-base)" }}
                >
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-orange-400">
                      {totalMonths}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      total bricks
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-3)" }}>
                    {yearsMonths} at +{goal.targetPct}%/mo
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    to reach {privacy ? "••••••" : USD.format(targetBalance)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          {totalMonths > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left: House + Progress */}
              <div className="space-y-4">
                <HouseVisual months={allMonthStrings} completedSet={completedSet} />

                {/* Progress bar */}
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      Construction Progress
                    </span>
                    <span className="text-sm font-bold text-orange-400">
                      {(progress * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress * 100}%`,
                        background: "linear-gradient(90deg, #c2410c, #ea580c)",
                      }}
                    />
                  </div>
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    <span>{completedCount} bricks placed</span>
                    <span>{totalMonths - completedCount} remaining</span>
                  </div>
                  {progress >= 1 && (
                    <div className="text-center text-sm font-semibold text-amber-400 py-1 border-t"
                      style={{ borderColor: "var(--c-border)" }}>
                      House complete — goal reached!
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Month checklist */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--c-border)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                    Monthly Bricks
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-base)", color: "var(--text-3)" }}
                    >
                      {completedCount}/{totalMonths}
                    </span>
                  </div>
                </div>
                <p className="px-4 py-2 text-[11px] border-b" style={{ color: "var(--text-3)", borderColor: "var(--c-border)" }}>
                  Click any month to toggle it. Past months with real data auto-complete when the goal is hit.
                </p>
                <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
                  {allMonthStrings.map((month, i) => {
                    const gm = goalMonthMap.get(month);
                    const isAuto = gm?.isAchieved === true;
                    const isComplete = completedSet.has(month);
                    return (
                      <MonthRow
                        key={month}
                        index={i}
                        month={month}
                        gm={gm}
                        isComplete={isComplete}
                        isAuto={isAuto}
                        onToggle={() => toggleMonth(month)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
            >
              <Home className="w-10 h-10 text-orange-400/30 mx-auto mb-3" />
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Enter a target balance above to see how many bricks your house needs.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
