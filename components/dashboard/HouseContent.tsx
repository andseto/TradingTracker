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

// ── 3D Tower ──────────────────────────────────────────────────────────────────

const BRICKS_PER_RING = 12;
const RADIUS = 88;
const BRICK_W = 42;
const BRICK_H = 22;
const RING_STEP = 28;

const STARS: [number, number, number][] = [
  [8, 10, 2], [16, 6, 1.5], [28, 15, 1], [38, 7, 2], [52, 4, 1],
  [64, 12, 2], [76, 7, 1.5], [85, 16, 1], [93, 8, 2], [95, 24, 1],
  [6, 28, 1.5], [20, 32, 1], [70, 25, 1.5], [88, 30, 1],
];

function Tower3D({ months, completedSet }: { months: string[]; completedSet: Set<string> }) {
  const numRings = Math.max(1, Math.ceil(months.length / BRICKS_PER_RING));
  const containerH = Math.max(390, numRings * RING_STEP + 220);

  return (
    <div
      className="relative select-none rounded-xl overflow-hidden"
      style={{
        height: containerH,
        background: "radial-gradient(ellipse at 50% 20%, #15122c 0%, #080810 100%)",
        perspective: "700px",
        perspectiveOrigin: "50% 36%",
      }}
    >
      {/* Stars */}
      {STARS.map(([x, y, s], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, background: "rgba(255,255,255,0.55)" }}
        />
      ))}

      {/* Crescent moon */}
      <div className="absolute" style={{ left: "13%", top: "7%", width: 30, height: 30 }}>
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 42% 42%, #ede0a0, #c4b060)", boxShadow: "0 0 12px rgba(220,200,100,0.22)" }} />
        <div className="absolute rounded-full" style={{ top: "-2px", left: "5px", width: 26, height: 26, background: "#08080f" }} />
      </div>

      {/* 3D scene origin */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "67%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          animation: "towerSpin 24s linear infinite",
          willChange: "transform",
        }}
      >
        {/* Ground disk */}
        <div
          style={{
            position: "absolute",
            width: (RADIUS + 28) * 2,
            height: (RADIUS + 28) * 2,
            left: -(RADIUS + 28),
            top: -(RADIUS + 28),
            borderRadius: "50%",
            transform: `rotateX(90deg) translateY(${BRICK_H / 2}px)`,
            background: "radial-gradient(ellipse at center, #1e2c1a 0%, #0c160a 60%, #060e04 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.95)",
          }}
        />

        {/* Tower bricks */}
        {months.map((month, i) => {
          const ring = Math.floor(i / BRICKS_PER_RING);
          const pos = i % BRICKS_PER_RING;
          const angle = (pos / BRICKS_PER_RING) * 360;
          const y = -(ring * RING_STEP);
          const isPlaced = completedSet.has(month);
          const isDoor = (ring === 0 || ring === 1) && pos === 0;

          return (
            <div
              key={month}
              title={`${getMonthLabel(month)}${isPlaced ? " ✓" : ""}`}
              style={{
                position: "absolute",
                width: BRICK_W,
                height: BRICK_H,
                left: -BRICK_W / 2,
                top: -BRICK_H / 2,
                transform: `rotateY(${angle}deg) translateZ(${RADIUS}px) translateY(${y}px)`,
                background: isDoor
                  ? "#04080c"
                  : isPlaced
                    ? "linear-gradient(180deg, #e86535 0%, #c44a1c 50%, #8a2c0c 100%)"
                    : "rgba(16, 16, 30, 0.92)",
                border: isDoor
                  ? "1px solid #0a1218"
                  : isPlaced
                    ? "1px solid #6a2010"
                    : "1px solid rgba(28, 28, 52, 0.8)",
                borderRadius: isDoor && ring === 0 ? "3px 3px 0 0" : "2px",
                boxShadow: isPlaced && !isDoor
                  ? "inset 0 2px 0 rgba(255,160,80,0.28), inset 0 -2px 0 rgba(0,0,0,0.55)"
                  : "none",
                transition: "background 0.9s ease, box-shadow 0.9s ease",
              }}
            />
          );
        })}

        {/* Battlements */}
        {Array.from({ length: BRICKS_PER_RING }, (_, i) => {
          const angle = (i / BRICKS_PER_RING) * 360;
          const y = -(numRings * RING_STEP);
          const isMerlon = i % 2 === 0;
          const bH = isMerlon ? BRICK_H * 1.65 : BRICK_H * 0.65;
          return (
            <div
              key={`bt${i}`}
              style={{
                position: "absolute",
                width: BRICK_W,
                height: bH,
                left: -BRICK_W / 2,
                top: -bH / 2,
                transform: `rotateY(${angle}deg) translateZ(${RADIUS}px) translateY(${y}px)`,
                background: isMerlon
                  ? "linear-gradient(180deg, #443878 0%, #2c2458 100%)"
                  : "rgba(8, 6, 18, 0.8)",
                border: isMerlon
                  ? "1px solid #3a3068"
                  : "1px solid rgba(18, 14, 38, 0.5)",
                borderRadius: "2px",
              }}
            />
          );
        })}

        {/* Flag pole */}
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 52,
            left: -2,
            top: -26,
            transform: `translateZ(0) translateY(${-(numRings * RING_STEP + BRICK_H * 2 + 26)}px)`,
            background: "linear-gradient(180deg, #8878b0, #3c3068)",
            borderRadius: "2px 2px 0 0",
          }}
        />
        {/* Flag */}
        <div
          style={{
            position: "absolute",
            width: 22,
            height: 15,
            left: 2,
            top: 0,
            transform: `translateZ(0) translateY(${-(numRings * RING_STEP + BRICK_H * 2 + 48)}px)`,
            background: "linear-gradient(135deg, #e83838 0%, #c01818 100%)",
            clipPath: "polygon(0 0, 100% 25%, 100% 75%, 0 100%)",
            borderRadius: "0 3px 3px 0",
          }}
        />
      </div>

      {/* Keyframes injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes towerSpin {
          from { transform: rotateX(-22deg) rotateY(0deg); }
          to   { transform: rotateX(-22deg) rotateY(360deg); }
        }
      ` }} />
    </div>
  );
}

// ── Month Row ─────────────────────────────────────────────────────────────────

function MonthRow({
  index, month, gm, isComplete, isAuto, onToggle,
}: {
  index: number; month: string; gm: GoalMonth | undefined;
  isComplete: boolean; isAuto: boolean; onToggle: () => void;
}) {
  const isFuture = !gm || gm.status === "future";
  const isCurrent = gm?.status === "current";

  let badge = ""; let badgeCls = "";
  if (isFuture)          { badge = "future"; badgeCls = "bg-[#1a1a2a] text-[#44445a]"; }
  else if (isAuto)       { badge = "auto";   badgeCls = "bg-emerald-900/40 text-emerald-400"; }
  else if (isCurrent)    { badge = "active"; badgeCls = "bg-indigo-900/30 text-indigo-400"; }
  else if (isComplete)   { badge = "manual"; badgeCls = "bg-orange-900/30 text-orange-400"; }
  else                   { badge = "missed"; badgeCls = "bg-red-900/20 text-red-400/70"; }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b transition-colors hover:bg-[#1a1a1f] cursor-pointer"
      style={{ borderColor: "var(--c-border)" }}
      onClick={onToggle}
    >
      <span className="text-xs w-6 text-right shrink-0 tabular-nums" style={{ color: "var(--text-3)" }}>
        {index + 1}
      </span>
      <div
        className="w-5 h-3.5 rounded-sm shrink-0 transition-all"
        style={{
          background: isComplete ? "linear-gradient(135deg, #c2410c, #9a3412)" : "#1a1a2a",
          border: isComplete ? "1px solid #b45309" : "1px solid #252535",
        }}
      />
      <span className="text-sm flex-1" style={{ color: isComplete ? "var(--text-1)" : "var(--text-3)" }}>
        {getMonthLabel(month)}
      </span>
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0", badgeCls)}>
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
    } catch { return new Set(); }
  });

  const targetBalance = useMemo(() => {
    const n = parseFloat(targetInput.replace(/,/g, ""));
    return isNaN(n) || n <= 0 ? null : n;
  }, [targetInput]);

  const totalMonths = useMemo(() => {
    if (!goal || !targetBalance || targetBalance <= goal.startBalance) return 0;
    return computeTotalMonths(goal.startBalance, targetBalance, goal.targetPct);
  }, [goal, targetBalance]);

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

  const completedSet = useMemo(() => {
    const s = new Set<string>();
    for (const gm of goalMonthData) if (gm.isAchieved === true) s.add(gm.month);
    for (const m of manualChecks) s.add(m);
    return s;
  }, [goalMonthData, manualChecks]);

  const completedCount = allMonthStrings.filter((m) => completedSet.has(m)).length;
  const progress = totalMonths > 0 ? completedCount / totalMonths : 0;

  function saveTarget(val: string) {
    setTargetInput(val);
    const n = parseFloat(val.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) localStorage.setItem("tradeforge-house-target", val);
  }

  function toggleMonth(month: string) {
    setManualChecks((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month); else next.add(month);
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
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Build a House</h1>
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

      {/* No goal */}
      {!goal ? (
        <div className="rounded-xl border p-10 text-center space-y-3" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
          <Target className="w-10 h-10 text-indigo-400/40 mx-auto" />
          <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>No monthly goal set up yet</p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Set up a monthly growth goal first to start building your tower.</p>
          <Link href="/dashboard/goals" className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            Set Up Goal
          </Link>
        </div>
      ) : (
        <>
          {/* Target Balance Input */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
                  Target Balance
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-3)" }}>$</span>
                  <input
                    type="number"
                    value={targetInput}
                    onChange={(e) => saveTarget(e.target.value)}
                    placeholder="1000000"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                    style={{ background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-1)" }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  The balance you want to reach. Each month you hit your +{goal.targetPct}% goal adds one brick, building your tower ring by ring.
                </p>
              </div>
              {targetBalance && totalMonths > 0 && (
                <div className="rounded-lg border p-4 space-y-2 sm:text-right shrink-0 sm:min-w-[160px]" style={{ borderColor: "var(--c-border)", background: "var(--bg-base)" }}>
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-orange-400">{totalMonths}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>total bricks</div>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-3)" }}>{yearsMonths} at +{goal.targetPct}%/mo</div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    to reach {privacy ? "••••••" : USD.format(targetBalance)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {totalMonths > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left: 3D Tower + Progress */}
              <div className="space-y-4">
                <Tower3D months={allMonthStrings} completedSet={completedSet} />

                {/* Progress bar */}
                <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Construction Progress</span>
                    <span className="text-sm font-bold text-orange-400">{(progress * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, #c2410c, #ea580c)" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-3)" }}>
                    <span>{completedCount} bricks placed</span>
                    <span>{totalMonths - completedCount} remaining</span>
                  </div>
                  {progress >= 1 && (
                    <div className="text-center text-sm font-semibold text-amber-400 pt-1 border-t" style={{ borderColor: "var(--c-border)" }}>
                      Tower complete — goal reached!
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Month checklist */}
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--c-border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Monthly Bricks</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-base)", color: "var(--text-3)" }}>
                    {completedCount}/{totalMonths}
                  </span>
                </div>
                <p className="px-4 py-2 text-[11px] border-b" style={{ color: "var(--text-3)", borderColor: "var(--c-border)" }}>
                  Click any month to manually toggle it. Past months auto-complete when the goal is hit.
                </p>
                <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
                  {allMonthStrings.map((month, i) => {
                    const gm = goalMonthMap.get(month);
                    return (
                      <MonthRow
                        key={month}
                        index={i}
                        month={month}
                        gm={gm}
                        isComplete={completedSet.has(month)}
                        isAuto={gm?.isAchieved === true}
                        onToggle={() => toggleMonth(month)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
              <Home className="w-10 h-10 text-orange-400/30 mx-auto mb-3" />
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Enter a target balance above to generate your tower.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
