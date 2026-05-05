"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/context/DashboardContext";
import { ArrowLeft, Star, Save, Trash2 } from "lucide-react";
import { cn, fmtMoneyFull } from "@/lib/utils";
import { JournalEntry } from "@/types";

const PRESET_TAGS = [
  "Followed Plan",
  "Broke Rules",
  "Good Execution",
  "Poor Execution",
  "FOMO",
  "Revenge Trade",
  "Overtraded",
  "Patient",
  "Sized Up",
  "Early Exit",
  "Late Exit",
  "Impulsive",
];

const RATING_LABELS = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

interface Props {
  date: string;
}

export function JournalDayContent({ date }: Props) {
  const { allPositions, allDaily, journalEntries, setJournalEntry, settings } = useDashboard();

  const existing = journalEntries[date] ?? null;

  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [saved, setSaved] = useState(true);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const dayData = useMemo(() => allDaily.find((d) => d.date === date), [allDaily, date]);

  const grouped = useMemo(() => {
    const dayPositions = allPositions.filter((p) => p.closeDate === date);
    return Object.values(
      dayPositions.reduce<
        Record<
          string,
          { symbol: string; quantity: number; entryPrice: number; exitPrice: number; pnl: number; pnlPct: number }
        >
      >((acc, t) => {
        const key = `${t.symbol}|${t.entryPrice.toFixed(2)}|${t.exitPrice.toFixed(2)}`;
        if (!acc[key]) {
          acc[key] = {
            symbol: t.symbol,
            quantity: 0,
            entryPrice: t.entryPrice,
            exitPrice: t.exitPrice,
            pnl: 0,
            pnlPct: t.pnlPct,
          };
        }
        acc[key].quantity += t.quantity;
        acc[key].pnl += t.pnl;
        return acc;
      }, {})
    ).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
  }, [allPositions, date]);

  const pnl = dayData?.pnl ?? 0;

  const handleSave = () => {
    const entry: JournalEntry = { date, notes, rating, tags };
    setJournalEntry(date, entry);
    setSaved(true);
  };

  const handleClear = () => {
    setJournalEntry(date, null);
    setNotes("");
    setRating(null);
    setTags([]);
    setSaved(true);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setSaved(false);
  };

  let parsedDate: Date | null = null;
  try { parsedDate = parseISO(date); } catch { /* invalid date */ }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/journal"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors hover:text-indigo-400"
          style={{ color: "var(--text-3)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </Link>
        <div className="flex items-center flex-wrap gap-3">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
            {parsedDate ? format(parsedDate, "EEEE, MMMM d, yyyy") : date}
          </h1>
          {dayData ? (
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-mono font-semibold border",
                pnl >= 0
                  ? "text-[#22c55e] bg-green-500/10 border-green-500/20"
                  : "text-[#ef4444] bg-red-500/10 border-red-500/20"
              )}
            >
              {pnl >= 0 ? "+" : ""}
              {fmtMoneyFull(pnl, settings.privacyMode)}
            </span>
          ) : (
            <span className="text-sm" style={{ color: "var(--text-3)" }}>
              No trades on this day
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trades */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--c-border)" }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--c-border)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              Trades
            </h2>
          </div>

          {grouped.length === 0 ? (
            <div
              className="px-4 py-10 text-sm text-center"
              style={{ color: "var(--text-3)" }}
            >
              No closed positions on this day.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                  {["Symbol", "Qty", "Entry", "Exit", "P&L"].map((h) => (
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
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--c-border)" }}
                  >
                    <td
                      className="px-3 py-2.5 font-mono font-semibold"
                      style={{ color: "var(--text-1)" }}
                    >
                      {t.symbol}
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: "var(--text-2)" }}>
                      {t.quantity}
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: "var(--text-2)" }}>
                      {settings.privacyMode ? "••••" : `$${t.entryPrice.toFixed(2)}`}
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: "var(--text-2)" }}>
                      {settings.privacyMode ? "••••" : `$${t.exitPrice.toFixed(2)}`}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 font-mono font-semibold",
                        t.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                      )}
                    >
                      {settings.privacyMode
                        ? "••••"
                        : `${t.pnl >= 0 ? "+" : ""}$${Math.abs(t.pnl).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    borderTop: "2px solid var(--c-border)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  <td
                    colSpan={4}
                    className="px-3 py-2.5 text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    {grouped.length} position{grouped.length !== 1 ? "s" : ""}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 font-mono font-bold text-sm",
                      pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                    )}
                  >
                    {settings.privacyMode
                      ? "••••"
                      : `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Journal Entry */}
        <div className="rounded-xl" style={{ border: "1px solid var(--c-border)" }}>
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--c-border)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              Journal Entry
            </h2>
            {!saved && (
              <span className="text-[10px] font-medium text-yellow-400">● Unsaved changes</span>
            )}
          </div>

          <div className="p-4 space-y-5">
            {/* Rating */}
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wide block mb-2"
                style={{ color: "var(--text-3)" }}
              >
                Session Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = (hoverRating ?? rating ?? 0) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setRating((r) => (r === n ? null : n));
                        setSaved(false);
                      }}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 transition-colors",
                          filled
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600 hover:text-gray-400"
                        )}
                      />
                    </button>
                  );
                })}
                {rating && (
                  <span className="text-sm ml-1" style={{ color: "var(--text-2)" }}>
                    {RATING_LABELS[rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wide block mb-2"
                style={{ color: "var(--text-3)" }}
              >
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full border transition-colors",
                        active
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                          : "hover:bg-white/5"
                      )}
                      style={
                        !active
                          ? { borderColor: "var(--c-border)", color: "var(--text-3)" }
                          : undefined
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wide block mb-2"
                style={{ color: "var(--text-3)" }}
              >
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
                placeholder="What happened today? What did you learn? What would you do differently?"
                rows={6}
                className="w-full rounded-lg p-3 text-sm border resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{
                  borderColor: "var(--c-border)",
                  color: "var(--text-1)",
                  background: "var(--bg-surface)",
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saved}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  saved
                    ? "opacity-40 cursor-not-allowed bg-indigo-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                )}
              >
                <Save className="w-3.5 h-3.5" />
                {saved ? "Saved" : "Save Entry"}
              </button>
              {existing && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/10 text-red-400"
                  style={{ border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
