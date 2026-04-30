"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { format, parseISO } from "date-fns";

// Rolling 20-trade win rate
function buildRollingWinRate(positions: { isWin: boolean; closeDate: string }[], window = 20) {
  return positions.map((_, i) => {
    if (i < window - 1) return null;
    const slice = positions.slice(i - window + 1, i + 1);
    const wins = slice.filter((p) => p.isWin).length;
    return {
      date: format(parseISO(positions[i].closeDate), "MMM d"),
      winRate: parseFloat(((wins / window) * 100).toFixed(1)),
    };
  }).filter(Boolean);
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#9090a8] mb-1">{payload[0].payload.date}</div>
      <div className="font-mono font-semibold text-indigo-400">{payload[0].value}% win</div>
    </div>
  );
}

export function WinRateChart({ height = 160 }: { height?: number }) {
  const { positions } = useDashboard();
  const data = buildRollingWinRate(positions);

  return (
    <ChartCard title="Win Rate" subtitle="20-trade rolling window">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#2a2a35" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
