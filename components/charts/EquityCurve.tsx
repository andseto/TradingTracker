"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ui/ChartCard";
import { fmtMoney } from "@/lib/utils";
import { format, parseISO } from "date-fns";

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

export function EquityCurve() {
  const { equity, settings } = useDashboard();

  const data = equity.map((p) => ({
    ...p,
    date: format(parseISO(p.date), "MMM d"),
    fill: p.cumPnl >= 0 ? "#22c55e" : "#ef4444",
  }));

  const maxAbs = Math.max(...equity.map((p) => Math.abs(p.cumPnl)), 1);
  const isPositive = (equity[equity.length - 1]?.cumPnl ?? 0) >= 0;

  return (
    <ChartCard title="Equity Curve" subtitle="Cumulative P&L over time">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.2} />
              <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
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
            tickFormatter={(v) => fmtMoney(v, settings.privacyMode)}
            width={60}
            domain={[-maxAbs * 1.1, maxAbs * 1.1]}
          />
          <Tooltip content={<CustomTooltip privacy={settings.privacyMode} />} />
          <ReferenceLine y={0} stroke="#2a2a35" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="cumPnl"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill="url(#eqGradient)"
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? "#22c55e" : "#ef4444" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
