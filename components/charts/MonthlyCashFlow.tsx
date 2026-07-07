"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { fmtMoney } from "@/lib/utils";
import type { MonthPoint } from "@/lib/metrics";

// Validated on the dark surface (#131316): payouts #16a34a / spending #ef4444
// pass lightness band, chroma, CVD separation (ΔE 13.6), and 3:1 contrast.
const PAYOUT_COLOR = "#16a34a";
const SPENDING_COLOR = "#ef4444";

export function MonthlyCashFlow({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--c-border)" strokeWidth={1} />
        <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--c-border2)" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => fmtMoney(v)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--text-2)" }}
        />
        <Bar dataKey="payouts" name="Payouts" fill={PAYOUT_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="spending" name="Spending" fill={SPENDING_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
