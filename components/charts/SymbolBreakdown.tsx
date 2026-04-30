"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";

function CustomTooltip({ active, payload, privacy }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-[#e8e8f0] mb-1">{d.symbol}</div>
      <div className={`font-mono font-semibold ${d.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
        {fmtMoney(d.pnl, privacy)}
      </div>
      <div className="text-[#55556a] mt-1">{d.trades} trades · {d.winRate}% win</div>
    </div>
  );
}

export function SymbolBreakdown({ height = 200 }: { height?: number }) {
  const { symbols, settings } = useDashboard();
  const top = symbols.slice(0, 8);

  return (
    <ChartCard title="P&L by Symbol" subtitle="Top performers">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#9090a8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtMoney(v, settings.privacyMode)}
          />
          <YAxis
            type="category"
            dataKey="symbol"
            tick={{ fill: "#9090a8", fontSize: 11, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip privacy={settings.privacyMode} />} cursor={{ fill: "#1f1f26" }} />
          <Bar dataKey="pnl" radius={[0, 3, 3, 0]} maxBarSize={16}>
            {top.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
