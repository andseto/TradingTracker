"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format, parseISO, subDays } from "date-fns";

const RANGES = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "3Y", days: 1095 },
  { label: "All", days: null },
];

function CustomTooltip({ active, payload, label, privacy }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#9090a8] mb-1">{label}</div>
      <div className={`font-mono font-semibold ${v >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        {fmtMoney(v, privacy)}
      </div>
    </div>
  );
}

function fmtAxis(v: number, privacy: boolean): string {
  if (privacy) return "••";
  if (v === 0) return "$0";
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

export function EquityCurve({ height = 220 }: { height?: number }) {
  const { equity, settings } = useDashboard();
  const [rangeDays, setRangeDays] = useState<number | null>(null);

  const filtered = rangeDays
    ? equity.filter((p) => parseISO(p.date) >= subDays(new Date(), rangeDays))
    : equity;

  const data = filtered.map((p) => ({
    ...p,
    date: format(parseISO(p.date), "MMM d"),
  }));

  const isAll = rangeDays === null;
  const maxVal = Math.max(...filtered.map((p) => p.cumPnl), 0);
  const step = maxVal > 5000 ? 1000 : maxVal > 1000 ? 500 : 100;
  const domainTop = Math.ceil((maxVal * 1.1) / step) * step || step;
  const yDomain: [number | string, number | string] = isAll ? [0, domainTop] : ["auto", "auto"];

  const rangeSelector = (
    <div className="flex items-center gap-0.5 rounded-lg p-0.5 border border-[#2a2a35]" style={{ background: "var(--bg-base)" }}>
      {RANGES.map((r) => (
        <button
          key={r.label}
          onClick={() => setRangeDays(r.days)}
          className={cn(
            "px-2 py-1 rounded text-[10px] font-medium transition-colors",
            rangeDays === r.days
              ? "bg-[#22c55e]/20 text-[#22c55e]"
              : "text-[#55556a] hover:text-[#9090a8]"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard title="Equity Curve" subtitle="Cumulative P&L" headerRight={rangeSelector}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9090a8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#9090a8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtAxis(v, settings.privacyMode)}
            width={52}
            domain={yDomain}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip privacy={settings.privacyMode} />} />
          <Area
            type="monotone"
            dataKey="cumPnl"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#eqGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#22c55e" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
