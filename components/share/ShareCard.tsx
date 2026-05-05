"use client";

import { useMemo } from "react";
import Link from "next/link";
import { decodeShareData, ShareData } from "@/lib/share";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AnvilIcon } from "@/components/ui/AnvilIcon";

function Sparkline({ data }: { data: { cum: number }[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.cum);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const W = 400;
  const H = 80;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.cum - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const isPos = values[values.length - 1] >= 0;
  const stroke = isPos ? "#22c55e" : "#ef4444";
  const fill = isPos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
  const zero = H - ((0 - min) / range) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <line x1="0" y1={zero.toFixed(1)} x2={W} y2={zero.toFixed(1)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <polygon points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill={fill} />
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#111118", border: "1px solid #1e1e2e" }}>
      <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "#6b6b8a" }}>
        {label}
      </p>
      <p className="text-lg font-bold font-mono" style={{ color: color ?? "#e8e8f0" }}>
        {value}
      </p>
    </div>
  );
}

interface Props {
  encoded: string;
}

export function ShareCard({ encoded }: Props) {
  const data = useMemo<ShareData | null>(() => {
    try {
      return decodeShareData(encoded);
    } catch {
      return null;
    }
  }, [encoded]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: "#6b6b8a" }}>
            Invalid or expired share link.
          </p>
          <Link
            href="/"
            className="inline-block text-indigo-400 text-sm hover:underline"
          >
            Go to TradeForge →
          </Link>
        </div>
      </div>
    );
  }

  const pos = data.totalPnl >= 0;
  const pfColor =
    data.profitFactor >= 1.5
      ? "#22c55e"
      : data.profitFactor >= 1
      ? "#fde68a"
      : "#ef4444";

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#e8e8f0" }}>
      <div className="max-w-lg mx-auto px-5 py-10">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <AnvilIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">TradeForge</span>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.3)", color: "#a5b4fc" }}
          >
            {data.label}
          </span>
        </div>

        {/* Hero header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white leading-tight">
            {data.username}&apos;s Performance
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b6b8a" }}>
            {data.label} · {data.tradingDays} trading days
          </p>
        </div>

        {/* P&L hero card */}
        <div
          className="rounded-2xl p-6 mb-4 text-center"
          style={{
            background: pos ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
            border: pos ? "1px solid rgba(34,197,94,0.22)" : "1px solid rgba(239,68,68,0.22)",
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6b6b8a" }}>
            Total P&L
          </p>
          <p
            className={cn("text-5xl font-bold font-mono mb-3", pos ? "text-[#22c55e]" : "text-[#ef4444]")}
          >
            {pos ? "+" : "-"}$
            {Math.abs(data.totalPnl).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "#6b6b8a" }}>
            {pos
              ? <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              : <TrendingDown className="w-4 h-4 text-[#ef4444]" />}
            <span>{data.winDays}W / {data.lossDays}L &middot; Best day +${data.bestDay.toFixed(2)}</span>
          </div>
        </div>

        {/* Equity curve */}
        {data.dailyPnl.length > 1 && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: "#111118", border: "1px solid #1e1e2e" }}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide mb-3" style={{ color: "#6b6b8a" }}>
              Equity Curve
            </p>
            <Sparkline data={data.dailyPnl} />
          </div>
        )}

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            label="Win Rate"
            value={`${data.winRate}%`}
            color={data.winRate >= 50 ? "#22c55e" : "#ef4444"}
          />
          <StatCard
            label="Profit Factor"
            value={data.profitFactor === 999 ? "∞" : data.profitFactor.toString()}
            color={pfColor}
          />
          <StatCard label="Total Trades" value={data.totalTrades.toString()} />
          <StatCard label="Trading Days" value={data.tradingDays.toString()} />
          <StatCard
            label="Avg Win"
            value={`+$${data.avgWin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="#22c55e"
          />
          <StatCard
            label="Avg Loss"
            value={`-$${Math.abs(data.avgLoss).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="#ef4444"
          />
        </div>

        {/* Top symbols */}
        {data.topSymbols.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden mb-8"
            style={{ background: "#111118", border: "1px solid #1e1e2e" }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: "#1e1e2e" }}>
              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#6b6b8a" }}>
                Top Symbols
              </p>
            </div>
            {data.topSymbols.map((s) => (
              <div
                key={s.symbol}
                className="flex items-center justify-between px-4 py-3 border-b last:border-0"
                style={{ borderColor: "#1e1e2e" }}
              >
                <div>
                  <span className="font-mono font-semibold text-sm text-white">{s.symbol}</span>
                  <span className="text-xs ml-2" style={{ color: "#6b6b8a" }}>
                    {s.trades} trades &middot; {s.winRate}% WR
                  </span>
                </div>
                <span
                  className={cn("font-mono font-semibold text-sm", s.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}
                >
                  {s.pnl >= 0 ? "+" : "-"}$
                  {Math.abs(s.pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "#111118", border: "1px solid #1e1e2e" }}
        >
          <p className="text-sm font-medium text-white mb-1">Track your trades with TradeForge</p>
          <p className="text-xs mb-4" style={{ color: "#6b6b8a" }}>
            Analytics, journaling, and goal tracking for serious traders.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium text-white"
          >
            Get Started Free →
          </Link>
        </div>

      </div>
    </div>
  );
}
