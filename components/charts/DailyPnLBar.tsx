"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "30D", days: 30 },
  { label: "60D", days: 60 },
  { label: "90D", days: 90 },
  { label: "All", days: null },
];

function CustomTooltip({ active, payload, privacy }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--bg-elevated)] border rounded-lg px-3 py-2 text-xs shadow-xl" style={{ borderColor: "var(--c-border)" }}>
      <div className="mb-1" style={{ color: "var(--text-2)" }}>{d.fullDate}</div>
      <div className={`font-mono font-semibold ${d.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        {fmtMoney(d.pnl, privacy)}
      </div>
      <div className="mt-0.5" style={{ color: "var(--text-3)" }}>{d.trades} trade{d.trades !== 1 ? "s" : ""}</div>
    </div>
  );
}

interface DailyPnLBarProps {
  height?: number;
}

export function DailyPnLBar({ height = 180 }: DailyPnLBarProps) {
  const { daily, settings } = useDashboard();
  const [rangeDays, setRangeDays] = useState<number | null>(60);

  const filtered = rangeDays ? daily.slice(-rangeDays) : daily;

  const data = filtered.map((d) => ({
    ...d,
    date: format(parseISO(d.date), "MMM d"),
    fullDate: format(parseISO(d.date), "MMMM d, yyyy"),
  }));

  const rangeSelector = (
    <div className="flex rounded-md p-0.5 border" style={{ background: "var(--bg-base)", borderColor: "var(--c-border)" }}>
      {RANGES.map((r) => (
        <button
          key={r.label}
          onClick={() => setRangeDays(r.days)}
          className={cn("px-2 py-0.5 text-[11px] font-medium rounded transition-colors", rangeDays === r.days ? "bg-indigo-600 text-white" : "")}
          style={rangeDays === r.days ? undefined : { color: "var(--text-2)" }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Daily P&L"
      subtitle={`${data.length} trading day${data.length !== 1 ? "s" : ""}`}
      headerRight={rangeSelector}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-2)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--text-2)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtMoney(v, settings.privacyMode)}
            width={60}
          />
          <Tooltip content={<CustomTooltip privacy={settings.privacyMode} />} cursor={{ fill: "var(--bg-elevated)" }} />
          <ReferenceLine y={0} stroke="var(--c-border)" />
          <Bar dataKey="pnl" radius={[2, 2, 0, 0]} maxBarSize={14}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
