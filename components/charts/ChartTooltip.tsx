"use client";

import { useFocusMode } from "@/context/PrivacyContext";
import { fmtMoneyFull } from "@/lib/utils";

interface Entry {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Entry[];
}

export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  const { focusMode } = useFocusMode();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: "var(--bg-card)", borderColor: "var(--c-border2)" }}
    >
      <div className="font-medium mb-1" style={{ color: "var(--text-2)" }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: entry.color }} />
          <span style={{ color: "var(--text-2)" }}>{entry.name}</span>
          <span className="ml-auto font-mono font-medium" style={{ color: "var(--text-1)" }}>
            {fmtMoneyFull(Number(entry.value ?? 0), focusMode)}
          </span>
        </div>
      ))}
    </div>
  );
}
