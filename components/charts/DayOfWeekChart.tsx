"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";

function CustomTooltip({ active, payload, privacy }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-[#e8e8f0] mb-1">{d.day}</div>
      <div className={`font-mono ${d.avg >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        Avg: {fmtMoney(d.avg, privacy)}
      </div>
      <div className={`font-mono ${d.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        Total: {fmtMoney(d.pnl, privacy)}
      </div>
      <div className="text-[#55556a] mt-0.5">{d.count} day{d.count !== 1 ? "s" : ""}</div>
    </div>
  );
}

export function DayOfWeekChart() {
  const { dowPnl, settings } = useDashboard();

  return (
    <ChartCard title="P&L by Day of Week" subtitle="Average daily P&L">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={dowPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#9090a8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
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
          <Bar dataKey="avg" radius={[3, 3, 0, 0]} maxBarSize={40}>
            {dowPnl.map((entry, i) => (
              <Cell key={i} fill={entry.avg >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
