"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";

function CustomTooltip({ active, payload, privacy }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#9090a8] mb-1">{d.label}</div>
      <div className={`font-mono font-semibold ${d.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        {fmtMoney(d.pnl, privacy)}
      </div>
      <div className="text-[#55556a] mt-0.5">{d.trades} trades</div>
    </div>
  );
}

export function MonthlyPnLBar({ height = 200 }: { height?: number }) {
  const { monthly, settings } = useDashboard();

  return (
    <ChartCard title="Monthly P&L" subtitle="P&L per calendar month">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={monthly} margin={{ top: 16, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
          <XAxis
            dataKey="label"
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
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={32}>
            {monthly.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
            ))}
            <LabelList
              dataKey="pnl"
              position="top"
              formatter={(v: number) => settings.privacyMode ? "••" : (v >= 0 ? "+" : "") + (v / 1000).toFixed(1) + "k"}
              style={{ fill: "#9090a8", fontSize: 10, fontFamily: "JetBrains Mono" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
