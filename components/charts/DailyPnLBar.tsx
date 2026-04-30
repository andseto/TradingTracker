"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";
import { format, parseISO } from "date-fns";

function CustomTooltip({ active, payload, privacy }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#9090a8] mb-1">{d.fullDate}</div>
      <div className={`font-mono font-semibold ${d.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        {fmtMoney(d.pnl, privacy)}
      </div>
      <div className="text-[#55556a] mt-0.5">{d.trades} trade{d.trades !== 1 ? "s" : ""}</div>
    </div>
  );
}

export function DailyPnLBar() {
  const { daily, settings } = useDashboard();

  const data = daily.slice(-60).map((d) => ({
    ...d,
    date: format(parseISO(d.date), "MMM d"),
    fullDate: format(parseISO(d.date), "MMMM d, yyyy"),
  }));

  return (
    <ChartCard title="Daily P&L" subtitle="Last 60 trading days">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9090a8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#9090a8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtMoney(v, settings.privacyMode)}
            width={60}
          />
          <Tooltip content={<CustomTooltip privacy={settings.privacyMode} />} cursor={{ fill: "#1f1f26" }} />
          <ReferenceLine y={0} stroke="#2a2a35" />
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
