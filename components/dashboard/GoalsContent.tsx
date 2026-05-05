"use client";

import { useState, useMemo } from "react";
import {
  Target, CheckCircle2, XCircle, Edit2, Save, X,
  Clock, ChevronRight, Pin,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { calcAllGoalMonths, GoalMonth } from "@/lib/calculations";
import { cn } from "@/lib/utils";

// ── Formatters ────────────────────────────────────────────────────────────────

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const USDc = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmt(n: number, privacy: boolean) {
  return privacy ? "••••••" : USD.format(n);
}
function fmtc(n: number, privacy: boolean) {
  return privacy ? "••••••" : USDc.format(n);
}
function fmtPnl(n: number, privacy: boolean) {
  if (privacy) return "••••••";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${USDc.format(n)}`;
}
function fmtPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

// ── Month / year options ──────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toYYYYMM(month: number, year: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseYYYYMM(s: string): { month: number; year: number } {
  return { year: Number(s.slice(0, 4)), month: Number(s.slice(5, 7)) };
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// ── Main component ────────────────────────────────────────────────────────────

export function GoalsContent() {
  const { allDaily, goal, setGoal, settings } = useDashboard();
  const privacy = settings.privacyMode;
  const isSetup = goal !== null;

  const defaultStart = goal ? parseYYYYMM(goal.startMonth) : { month: 4, year: CURRENT_YEAR };

  const [editing, setEditing] = useState(!isSetup);
  const [formMonth, setFormMonth] = useState(defaultStart.month);
  const [formYear, setFormYear] = useState(defaultStart.year);
  const [formBalance, setFormBalance] = useState(goal ? String(goal.startBalance) : "");
  const [formPct, setFormPct] = useState(goal ? String(goal.targetPct) : "5");

  // Per-month balance override editing
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editingBalanceInput, setEditingBalanceInput] = useState("");

  function startEditMonthBalance(month: string, currentStart: number) {
    setEditingMonth(month);
    setEditingBalanceInput(String(currentStart));
  }

  function saveMonthBalance() {
    if (!goal || !editingMonth) return;
    const val = parseFloat(editingBalanceInput.replace(/,/g, ""));
    if (isNaN(val) || val <= 0) return;
    setGoal({ ...goal, monthBalances: { ...goal.monthBalances, [editingMonth]: val } });
    setEditingMonth(null);
  }

  function clearMonthBalance(month: string) {
    if (!goal) return;
    const next = { ...goal.monthBalances };
    delete next[month];
    setGoal({ ...goal, monthBalances: next });
  }

  const allMonths = useMemo(() => {
    if (!isSetup) return [];
    return calcAllGoalMonths(allDaily, goal!, 6);
  }, [allDaily, goal, isSetup]);

  const current = allMonths.find((m) => m.status === "current") ?? null;
  const pastMonths = allMonths.filter((m) => m.status === "past").reverse();
  const futureMonths = allMonths.filter((m) => m.status === "future");

  // Quick summary stats
  const completedMonths = allMonths.filter((m) => m.status === "past");
  const hitCount = completedMonths.filter((m) => m.isAchieved).length;
  const totalPnl = allMonths
    .filter((m) => m.monthPnl !== null)
    .reduce((s, m) => s + (m.monthPnl ?? 0), 0);

  function handleSave() {
    const bal = parseFloat(formBalance.replace(/,/g, ""));
    const pctVal = parseFloat(formPct);
    if (isNaN(bal) || bal <= 0 || isNaN(pctVal) || pctVal <= 0) return;
    setGoal({ targetPct: pctVal, startMonth: toYYYYMM(formMonth, formYear), startBalance: bal });
    setEditing(false);
  }

  function handleEdit() {
    if (goal) {
      const { month, year } = parseYYYYMM(goal.startMonth);
      setFormMonth(month);
      setFormYear(year);
      setFormBalance(String(goal.startBalance));
      setFormPct(String(goal.targetPct));
    }
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition";
  const inputStyle = { background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-1)" };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>Monthly Goals</h1>
          {isSetup && !editing && goal && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
              +{goal.targetPct}% / month
            </span>
          )}
        </div>
        {isSetup && !editing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-[#1a1a1f]"
            style={{ borderColor: "var(--c-border)", color: "var(--text-2)" }}
          >
            <Edit2 className="w-3 h-3" />
            Edit Goal
          </button>
        )}
      </div>

      {/* ── Setup / Edit form ── */}
      {editing && (
        <div className="rounded-xl border p-5 space-y-5" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-1)" }}>
              {isSetup ? "Update your goal settings" : "Set up your monthly growth goal"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Enter the month you started tracking and your account balance at that time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Starting month */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--text-2)" }}>
                Starting Month
              </label>
              <div className="flex gap-2">
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className={cn(inputCls, "flex-1 pr-1")}
                  style={inputStyle}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i + 1}>{name.slice(0, 3)}</option>
                  ))}
                </select>
                <select
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className={cn(inputCls, "w-24")}
                  style={inputStyle}
                >
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>First month you want to track</p>
            </div>

            {/* Starting balance */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--text-2)" }}>
                Starting Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-3)" }}>$</span>
                <input
                  type="number"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  placeholder="33000"
                  className={cn(inputCls, "pl-6")}
                  style={inputStyle}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Account balance at the start of that month</p>
            </div>

            {/* Monthly % target */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--text-2)" }}>
                Monthly Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formPct}
                  onChange={(e) => setFormPct(e.target.value)}
                  placeholder="5"
                  className={cn(inputCls, "pr-8")}
                  style={inputStyle}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-3)" }}>%</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Compounds from each month's closing balance</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {isSetup ? "Save Changes" : "Start Tracking"}
            </button>
            {isSetup && (
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

      {/* ── Summary stats row ── */}
      {isSetup && !editing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Current Balance"
            value={current ? fmtc(current.endBalance, privacy) : "—"}
            sub={current && current.monthPnl !== null ? `${fmtPnl(current.monthPnl, privacy)} this month` : undefined}
            positive={current?.monthPnl !== undefined && (current.monthPnl ?? 0) >= 0}
          />
          <SummaryCard
            label="Starting Balance"
            value={goal ? fmtc(goal.startBalance, privacy) : "—"}
            sub={`since ${MONTH_NAMES[(parseYYYYMM(goal!.startMonth).month) - 1]} ${parseYYYYMM(goal!.startMonth).year}`}
          />
          <SummaryCard
            label="Total P&L"
            value={fmtPnl(totalPnl, privacy)}
            positive={totalPnl >= 0}
          />
          <SummaryCard
            label="Goal Hit Rate"
            value={completedMonths.length > 0 ? `${hitCount}/${completedMonths.length}` : "—"}
            sub={completedMonths.length > 0 ? `${Math.round((hitCount / completedMonths.length) * 100)}% success` : "No completed months yet"}
          />
        </div>
      )}

      {/* ── Current month card ── */}
      {isSetup && !editing && current && (
        <CurrentMonthCard
          data={current}
          privacy={privacy}
          targetPct={goal!.targetPct}
          editingMonth={editingMonth}
          editingBalanceInput={editingBalanceInput}
          setEditingBalanceInput={setEditingBalanceInput}
          onStartEdit={startEditMonthBalance}
          onSaveEdit={saveMonthBalance}
          onCancelEdit={() => setEditingMonth(null)}
          onClearEdit={clearMonthBalance}
        />
      )}

      {/* ── Past months table ── */}
      {isSetup && !editing && pastMonths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Past Months
            </h2>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>— click <Pin className="inline w-3 h-3 mx-0.5" /> to correct a month's starting balance</span>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)" }}>
            {/* Table header */}
            <div
              className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_90px] gap-4 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b"
              style={{ background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-3)" }}
            >
              <span>Month</span>
              <span>Start</span>
              <span>End</span>
              <span>P&amp;L</span>
              <span>Return</span>
              <span>Goal</span>
              <span className="text-right">Result</span>
            </div>
            {pastMonths.map((m) => (
              <PastMonthRow
                key={m.month}
                data={m}
                privacy={privacy}
                editingMonth={editingMonth}
                editingBalanceInput={editingBalanceInput}
                setEditingBalanceInput={setEditingBalanceInput}
                onStartEdit={startEditMonthBalance}
                onSaveEdit={saveMonthBalance}
                onCancelEdit={() => setEditingMonth(null)}
                onClearEdit={clearMonthBalance}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming projections ── */}
      {isSetup && !editing && futureMonths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Upcoming Projections
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--c-border)", color: "var(--text-3)" }}>
              assumes +{goal!.targetPct}% each month
            </span>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)" }}>
            <div
              className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b"
              style={{ background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-3)" }}
            >
              <span>Month</span>
              <span>Projected Start</span>
              <span>Target (+{goal!.targetPct}%)</span>
              <span>Gain Needed</span>
            </div>
            {futureMonths.map((m) => (
              <FutureMonthRow key={m.month} data={m} privacy={privacy} targetPct={goal!.targetPct} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

// ── Current month card ────────────────────────────────────────────────────────

interface EditProps {
  editingMonth: string | null;
  editingBalanceInput: string;
  setEditingBalanceInput: (v: string) => void;
  onStartEdit: (month: string, current: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onClearEdit: (month: string) => void;
}

function InlineBalanceEdit({ month, onSave, onCancel, value, onChange }: {
  month: string; onSave: () => void; onCancel: () => void; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-3)" }}>$</span>
        <input
          autoFocus
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          className="w-32 pl-5 pr-2 py-1 text-xs rounded-md border focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          style={{ background: "var(--bg-base)", borderColor: "var(--c-border)", color: "var(--text-1)" }}
        />
      </div>
      <button onClick={onSave} className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors">
        <Save className="w-3.5 h-3.5" />
      </button>
      <button onClick={onCancel} className="p-1 rounded hover:bg-[#1a1a1f] transition-colors" style={{ color: "var(--text-3)" }}>
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CurrentMonthCard({ data, privacy, targetPct, editingMonth, editingBalanceInput, setEditingBalanceInput, onStartEdit, onSaveEdit, onCancelEdit, onClearEdit }: { data: GoalMonth; privacy: boolean; targetPct: number } & EditProps) {
  const progressPct = Math.round(data.progress * 100);
  const pnl = data.monthPnl ?? 0;
  const needed = data.goalAmount - data.endBalance;
  const isEditingThis = editingMonth === data.month;

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-3)" }}>Current Month</p>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{data.label}</h2>
        </div>
        <StatusChip achieved={data.isAchieved ?? false} inProgress />
      </div>

      {/* 4-stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Month start — editable */}
        <div className="rounded-lg p-3" style={{ background: "var(--bg-base)" }}>
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Month Start</p>
            {data.isOverride && (
              <button onClick={() => onClearEdit(data.month)} title="Remove override" className="text-indigo-400/60 hover:text-indigo-400">
                <Pin className="w-2.5 h-2.5" />
              </button>
            )}
            {!isEditingThis && (
              <button onClick={() => onStartEdit(data.month, data.startBalance)} title="Correct this balance" className="hover:opacity-80" style={{ color: "var(--text-3)" }}>
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          {isEditingThis ? (
            <InlineBalanceEdit month={data.month} value={editingBalanceInput} onChange={setEditingBalanceInput} onSave={onSaveEdit} onCancel={onCancelEdit} />
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{fmtc(data.startBalance, privacy)}</p>
          )}
        </div>

        <Stat label="Current Balance" value={fmtc(data.endBalance, privacy)} highlight />
        <Stat label={`Goal (+${targetPct}%)`} value={fmtc(data.goalAmount, privacy)} accent="indigo" />
        <Stat label="This Month P&L" value={fmtPnl(pnl, privacy)} accent={pnl >= 0 ? "green" : "red"} />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs" style={{ color: "var(--text-3)" }}>
          <span>
            {progressPct}% to goal
            {data.gainPct !== null && (
              <span className={cn("ml-2 font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                ({fmtPct(data.gainPct)})
              </span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {data.daysRemaining} days left
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              data.isAchieved ? "bg-emerald-500" : progressPct > 66 ? "bg-indigo-400" : "bg-indigo-500"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: "var(--c-border)", color: "var(--text-3)" }}>
        <span>
          {data.isAchieved
            ? "Goal achieved — great month!"
            : needed > 0
            ? `Need ${fmtc(needed, privacy)} more to hit +${targetPct}%`
            : "On track"}
        </span>
        <span>{data.startBalance > 0 && <>Target: {fmtc(data.goalAmount, privacy)}</>}</span>
      </div>
    </div>
  );
}

// ── Past month table row ──────────────────────────────────────────────────────

function PastMonthRow({ data, privacy, editingMonth, editingBalanceInput, setEditingBalanceInput, onStartEdit, onSaveEdit, onCancelEdit, onClearEdit }: { data: GoalMonth; privacy: boolean } & EditProps) {
  const pnl = data.monthPnl ?? 0;
  const achieved = data.isAchieved ?? false;
  const isEditingThis = editingMonth === data.month;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_90px] gap-4 px-4 py-3 border-b last:border-b-0 items-start sm:items-center"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {/* Month */}
      <div className="flex items-center gap-2">
        {achieved
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          : <XCircle className="w-3.5 h-3.5 text-red-400/70 shrink-0" />}
        <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{data.label}</span>
      </div>

      {/* Start — with pin edit */}
      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Start</p>
        <div className="flex items-center gap-1">
          <span className="text-sm" style={{ color: "var(--text-2)" }}>{fmt(data.startBalance, privacy)}</span>
          {data.isOverride && (
            <button onClick={() => onClearEdit(data.month)} title="Remove override" className="text-indigo-400/60 hover:text-indigo-400 shrink-0">
              <Pin className="w-2.5 h-2.5" />
            </button>
          )}
          {!isEditingThis && (
            <button onClick={() => onStartEdit(data.month, data.startBalance)} title="Set actual starting balance" className="shrink-0 hover:opacity-80 transition-opacity" style={{ color: "var(--text-3)" }}>
              <Edit2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        {isEditingThis && (
          <InlineBalanceEdit month={data.month} value={editingBalanceInput} onChange={setEditingBalanceInput} onSave={onSaveEdit} onCancel={onCancelEdit} />
        )}
      </div>

      {/* End */}
      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>End</p>
        <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{fmt(data.endBalance, privacy)}</span>
      </div>

      {/* P&L $ */}
      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>P&L</p>
        <span className={cn("text-sm font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
          {fmtPnl(pnl, privacy)}
        </span>
      </div>

      {/* Return % */}
      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Return</p>
        <span className={cn("text-sm font-medium", (data.gainPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
          {data.gainPct !== null ? fmtPct(data.gainPct) : "—"}
        </span>
      </div>

      {/* Goal amount */}
      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Goal</p>
        <span className="text-sm text-indigo-400">{fmt(data.goalAmount, privacy)}</span>
      </div>

      {/* Result chip */}
      <div className="sm:text-right">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            achieved
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25"
              : "text-red-400 bg-red-500/10 border border-red-500/25"
          )}
        >
          {achieved ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {achieved ? "Hit" : "Missed"}
        </span>
      </div>
    </div>
  );
}

// ── Future month table row ────────────────────────────────────────────────────

function FutureMonthRow({ data, privacy, targetPct }: { data: GoalMonth; privacy: boolean; targetPct: number }) {
  const gainNeeded = data.goalAmount - data.startBalance;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b last:border-b-0 items-center"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)", opacity: 0.75 }}
    >
      <div className="flex items-center gap-2">
        <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
        <span className="text-sm" style={{ color: "var(--text-2)" }}>{data.label}</span>
      </div>

      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Projected Start</p>
        <span className="text-sm" style={{ color: "var(--text-2)" }}>{fmt(data.startBalance, privacy)}</span>
      </div>

      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Target</p>
        <span className="text-sm text-indigo-400">{fmt(data.goalAmount, privacy)}</span>
      </div>

      <div>
        <p className="sm:hidden text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Gain Needed</p>
        <span className="text-sm text-emerald-400/80">+{fmt(gainNeeded, privacy)} (+{targetPct}%)</span>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div
      className="rounded-xl border p-3.5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>{label}</p>
      <p
        className={cn("text-sm font-semibold",
          positive === true ? "text-emerald-400" :
          positive === false ? "text-red-400" : ""
        )}
        style={positive === undefined ? { color: "var(--text-1)" } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{sub}</p>}
    </div>
  );
}

function Stat({ label, value, accent, highlight }: { label: string; value: string; accent?: string; highlight?: boolean }) {
  const colorClass =
    accent === "green" ? "text-emerald-400" :
    accent === "red" ? "text-red-400" :
    accent === "indigo" ? "text-indigo-400" : "";

  return (
    <div
      className={cn("rounded-lg p-3", highlight ? "border border-indigo-500/20 bg-indigo-600/5" : "")}
      style={highlight ? undefined : { background: "var(--bg-base)" }}
    >
      <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className={cn("text-sm font-semibold", colorClass)} style={colorClass ? undefined : { color: "var(--text-1)" }}>
        {value}
      </p>
    </div>
  );
}

function StatusChip({ achieved, inProgress }: { achieved: boolean; inProgress?: boolean }) {
  if (inProgress && !achieved) {
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full border text-amber-400 border-amber-500/30 bg-amber-500/10">
        In Progress
      </span>
    );
  }
  return (
    <span
      className={cn(
        "text-xs font-medium px-2.5 py-1 rounded-full border",
        achieved
          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          : "text-red-400 border-red-500/25 bg-red-500/10"
      )}
    >
      {achieved ? "Achieved" : "Missed"}
    </span>
  );
}
