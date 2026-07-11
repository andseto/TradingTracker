"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { useFocusMode } from "@/context/PrivacyContext";
import { fmtMoney } from "@/lib/utils";
import type { CumulativePoint } from "@/lib/metrics";

export function CumulativeNet({ data }: { data: CumulativePoint[] }) {
  const { focusMode } = useFocusMode();
  // In Focus Mode the line itself is the only signal (no dollar amounts),
  // so color it by sign instead of the neutral amber used normally.
  const latest = data[data.length - 1]?.cumulative ?? 0;
  const lineColor = focusMode ? (latest >= 0 ? "#22c55e" : "#ef4444") : "#f59e0b";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--c-border)" strokeWidth={1} />
        <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--c-border2)" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => fmtMoney(v, focusMode)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--c-border2)", strokeDasharray: "3 3" }} />
        <ReferenceLine y={0} stroke="var(--c-border2)" />
        <Line
          type="monotone"
          dataKey="cumulative"
          name="Net profit to date"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: "var(--bg-surface)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
