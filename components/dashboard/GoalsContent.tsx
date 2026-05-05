"use client";

import { useState, useMemo } from "react";
import { Target, CheckCircle2, XCircle, Edit2, Save, X, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { calcMonthGoalProgress, getMonthsFromDaily } from "@/lib/calculations";
import { cn } from "@/lib/utils";

function fmt(n: number, privacy: boolean): string {
  if (privacy) return "••••••";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function pct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function GoalsContent() {
  const { allDaily, initialBalance, setInitialBalance, goal, setGoal, settings } = useDashboard();
  const privacy = settings.privacyMode;

  const [editing, setEditing] = useState(false);
  const [balanceInput, setBalanceInput] = useState(String(initialBalance || ""));
  const [pctInput, setPctInput] = useState(String(goal?.targetPct ?? "5"));

  const isSetup = initialBalance > 0 && goal !== null;

  const months = useMemo(() => getMonthsFromDaily(allDaily), [allDaily]);

  const progressList = useMemo(() => {
    if (!isSetup) return [];
    return months.map((m) => calcMonthGoalProgress(allDaily, initialBalance, goal!, m));
  }, [allDaily, initialBalance, goal, months, isSetup]);

  const current = progressList.find((p) => p.isCurrent) ?? null;
  const past = progressList.filter((p) => !p.isCurrent).reverse();

  function handleSave() {
    const bal = parseFloat(balanceInput.replace(/,/g, ""));
    const pctVal = parseFloat(pctInput);
    if (isNaN(bal) || bal <= 0 || isNaN(pctVal) || pctVal <= 0) return;
    setInitialBalance(bal);
    setGoal({ targetPct: pctVal });
    setEditing(false);
  }

  function handleCancel() {
    setBalanceInput(String(initialBalance || ""));
    setPctInput(String(goal?.targetPct ?? "5"));
    setEditing(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Monthly Goals</h1>
        </div>
        {isSetup && !editing && (
          <button
            onClick={() => { setBalanceInput(String(initialBalance)); setPctInput(String(goal!.targetPct)); setEditing(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-[#1a1a1f]"
            style={{ borderColor: "var(--c-border)", color: "var(--text-2)" }}
          >
            <Edit2 className="w-3 h-3" />
            Edit Goal
          </button>
        )}
      </div>

      {/* Setup / Edit form */}
      {(!isSetup || editing) && (
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            {isSetup ? "Update your goal settings below." : "Set your starting account balance and a monthly growth target to begin tracking your progress."}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--text-2)" }}>
                Starting Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-3)" }}>$</span>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="33000"
                  className="w-full pl-6 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                  style={{ background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-1)" }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Balance before your first imported trade</p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--text-2)" }}>
                Monthly Growth Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={pctInput}
                  onChange={(e) => setPctInput(e.target.value)}
                  placeholder="5"
                  className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                  style={{ background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-1)" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-3)" }}>%</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Compounds from each month's ending balance</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {isSetup ? "Save Changes" : "Set Goal"}
            </button>
            {isSetup && editing && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[#1a1a1f]"
                style={{ borderColor: "var(--c-border)", color: "var(--text-2)" }}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current month card */}
      {isSetup && current && (
        <CurrentMonthCard data={current} privacy={privacy} targetPct={goal!.targetPct} />
      )}

      {/* Past months */}
      {isSetup && past.length > 0 && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: "var(--text-3)" }}>
            Past Months
          </h2>
          <div
            className="rounded-xl border divide-y overflow-hidden"
            style={{ borderColor: "var(--c-border)" }}
          >
            {past.map((p) => (
              <PastMonthRow key={p.month} data={p} privacy={privacy} targetPct={goal!.targetPct} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isSetup && progressList.length === 0 && (
        <div
          className="rounded-xl border p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
        >
          <Target className="w-8 h-8 text-indigo-400/50" />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No trade data yet. Import trades to see goal progress.</p>
        </div>
      )}
    </div>
  );
}

// ── Current month card ────────────────────────────────────────────────────────

interface CardProps {
  data: ReturnType<typeof calcMonthGoalProgress>;
  privacy: boolean;
  targetPct: number;
}

function CurrentMonthCard({ data, privacy, targetPct }: CardProps) {
  const clampedProgress = Math.min(1, Math.max(0, data.progress));
  const progressPct = Math.round(clampedProgress * 100);
  const gained = data.monthPnl;
  const needed = data.goalAmount - data.endBalance;
  const gainedPct = data.monthStartBalance > 0 ? (gained / data.monthStartBalance) * 100 : 0;
  const isAhead = data.isAchieved;
  const isBehind = !data.isAchieved;

  return (
    <div
      className="rounded-xl border p-5 space-y-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-3)" }}>Current Month</p>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{data.label}</h2>
        </div>
        <StatusChip achieved={isAhead} />
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Month Start" value={fmt(data.monthStartBalance, privacy)} />
        <Stat
          label={`Goal (+${targetPct}%)`}
          value={fmt(data.goalAmount, privacy)}
          accent="indigo"
        />
        <Stat label="Current Balance" value={fmt(data.endBalance, privacy)} />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs" style={{ color: "var(--text-3)" }}>
          <span>{progressPct}% of goal reached</span>
          <span>{data.daysRemaining} days left</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
          <div
            className={cn("h-full rounded-full transition-all duration-500", isAhead ? "bg-emerald-500" : "bg-indigo-500")}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* This month P&L + remaining */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--c-border)" }}>
        <div className="flex items-center gap-1.5">
          {gained >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={cn("text-sm font-medium", gained >= 0 ? "text-emerald-400" : "text-red-400")}>
            {privacy ? "••••••" : `${gained >= 0 ? "+" : ""}${gained.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
          </span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            ({pct(gainedPct)}) this month
          </span>
        </div>
        {isBehind && needed > 0 && (
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-3)" }}>
            <Clock className="w-3 h-3" />
            <span>Need {fmt(needed, privacy)} more</span>
          </div>
        )}
        {isAhead && (
          <span className="text-xs text-emerald-400 font-medium">Goal achieved!</span>
        )}
      </div>
    </div>
  );
}

// ── Past month row ────────────────────────────────────────────────────────────

function PastMonthRow({ data, privacy, targetPct }: CardProps) {
  const clampedProgress = Math.min(1, Math.max(0, data.progress));
  const progressPct = Math.round(clampedProgress * 100);
  const gainedPct = data.monthStartBalance > 0 ? (data.monthPnl / data.monthStartBalance) * 100 : 0;

  return (
    <div
      className="px-4 py-3 flex items-center gap-4"
      style={{ background: "var(--bg-surface)" }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {data.isAchieved ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400/60" />
        )}
      </div>

      {/* Month label */}
      <div className="w-24 shrink-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{data.label}</p>
      </div>

      {/* Progress bar (mini) */}
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
          <div
            className={cn("h-full rounded-full", data.isAchieved ? "bg-emerald-500" : "bg-indigo-500/60")}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Pct */}
      <div className="w-16 text-right shrink-0">
        <span className={cn("text-sm font-medium", data.monthPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
          {pct(gainedPct)}
        </span>
      </div>

      {/* Start → End */}
      <div className="hidden sm:flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--text-3)" }}>
        <span>{fmt(data.monthStartBalance, privacy)}</span>
        <span>→</span>
        <span style={{ color: "var(--text-2)" }}>{fmt(data.endBalance, privacy)}</span>
        <span className="ml-1 text-xs" style={{ color: "var(--text-3)" }}>/ goal {fmt(data.goalAmount, privacy)}</span>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
      <p
        className={cn("text-sm font-semibold", accent === "indigo" ? "text-indigo-400" : "")}
        style={accent ? undefined : { color: "var(--text-1)" }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusChip({ achieved }: { achieved: boolean }) {
  return (
    <span
      className={cn(
        "text-xs font-medium px-2.5 py-1 rounded-full border",
        achieved
          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
      )}
    >
      {achieved ? "Achieved" : "In Progress"}
    </span>
  );
}
