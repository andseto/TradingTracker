"use client";

import { useState, useMemo } from "react";
import { X, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/context/DashboardContext";
import { calcStats, calcSymbolPnL } from "@/lib/calculations";
import { encodeShareData, ShareData } from "@/lib/share";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShareModal({ open, onClose }: Props) {
  const { allPositions, allDaily, settings } = useDashboard();
  const [copied, setCopied] = useState(false);

  const months = useMemo(() => {
    const unique = [...new Set(allDaily.map((d) => d.date.slice(0, 7)))].sort().reverse();
    return unique;
  }, [allDaily]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => months[0] ?? "");

  const monthPositions = useMemo(
    () => allPositions.filter((p) => p.closeDate.startsWith(selectedMonth)),
    [allPositions, selectedMonth]
  );
  const monthDaily = useMemo(
    () => allDaily.filter((d) => d.date.startsWith(selectedMonth)),
    [allDaily, selectedMonth]
  );
  const monthStats = useMemo(
    () => calcStats(monthPositions, monthDaily),
    [monthPositions, monthDaily]
  );
  const monthSymbols = useMemo(
    () => calcSymbolPnL(monthPositions).slice(0, 5),
    [monthPositions]
  );

  const generateUrl = (): string => {
    if (!selectedMonth || typeof window === "undefined") return "";
    let cum = 0;
    const dailyPnl = monthDaily.map((d) => {
      cum += d.pnl;
      return { date: d.date, pnl: d.pnl, cum: parseFloat(cum.toFixed(2)) };
    });
    const data: ShareData = {
      username: settings.userName || "Trader",
      month: selectedMonth,
      label: format(parseISO(`${selectedMonth}-01`), "MMMM yyyy"),
      ...monthStats,
      dailyPnl,
      topSymbols: monthSymbols.map((s) => ({
        symbol: s.symbol,
        pnl: s.pnl,
        trades: s.trades,
        winRate: s.winRate,
      })),
    };
    return `${window.location.origin}/share/${encodeShareData(data)}`;
  };

  const handleCopy = () => {
    const url = generateUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenPreview = () => {
    const url = generateUrl();
    if (url) window.open(url, "_blank");
  };

  if (!open) return null;

  const hasData = selectedMonth && monthStats.totalTrades > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--c-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--c-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              Share Your Stats
            </h2>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Month selector */}
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wide block mb-2"
              style={{ color: "var(--text-3)" }}
            >
              Select Month
            </label>
            {months.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                No trading data available.
              </p>
            ) : (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--c-border)",
                  color: "var(--text-1)",
                }}
              >
                {months.map((m) => (
                  <option key={m} value={m} style={{ background: "#1a1a2e" }}>
                    {format(parseISO(`${m}-01`), "MMMM yyyy")}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preview */}
          {hasData ? (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--c-border)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                  {settings.userName || "Trader"} &middot;{" "}
                  {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")}
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  Preview
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatMini
                  label="Total P&L"
                  value={`${monthStats.totalPnl >= 0 ? "+" : ""}$${Math.abs(monthStats.totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  color={monthStats.totalPnl >= 0 ? "#22c55e" : "#ef4444"}
                />
                <StatMini label="Win Rate" value={`${monthStats.winRate}%`} />
                <StatMini
                  label="Profit Factor"
                  value={monthStats.profitFactor === 999 ? "∞" : monthStats.profitFactor.toString()}
                />
                <StatMini label="Trades" value={monthStats.totalTrades.toString()} />
                <StatMini
                  label="Avg Win"
                  value={`+$${monthStats.avgWin.toFixed(2)}`}
                  color="#22c55e"
                />
                <StatMini
                  label="Avg Loss"
                  value={`-$${Math.abs(monthStats.avgLoss).toFixed(2)}`}
                  color="#ef4444"
                />
              </div>

              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                {monthStats.tradingDays} trading days &middot; {monthStats.winDays}W / {monthStats.lossDays}L
                &middot; Best day +${monthStats.bestDay.toFixed(2)}
              </p>
            </div>
          ) : selectedMonth ? (
            <p className="text-sm text-center py-2" style={{ color: "var(--text-3)" }}>
              No closed trades in this month.
            </p>
          ) : null}

          {/* Privacy note */}
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
            The link encodes your stats directly — no login needed to view. P&L numbers are always
            visible on the shared page regardless of privacy mode.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!hasData}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                copied
                  ? "bg-green-600/20 text-green-400 border border-green-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white",
                !hasData && "opacity-40 cursor-not-allowed"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleOpenPreview}
              disabled={!hasData}
              title="Open preview in new tab"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border disabled:opacity-40"
              style={{
                color: "var(--text-2)",
                borderColor: "var(--c-border)",
                background: "var(--bg-elevated)",
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="rounded-lg p-2.5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--c-border)" }}
    >
      <div className="text-[10px] font-medium mb-0.5" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
      <div
        className="text-sm font-bold font-mono"
        style={{ color: color ?? "var(--text-1)" }}
      >
        {value}
      </div>
    </div>
  );
}
