"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, subValue, trend, icon: Icon, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "#22c55e" :
    trend === "down" ? "#ef4444" :
    undefined;

  return (
    <div
      className={cn("rounded-xl p-4 flex flex-col gap-2 border transition-colors", className)}
      style={{ background: "var(--bg-card)", borderColor: "var(--c-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          {label}
        </span>
        {Icon && (
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
          </div>
        )}
      </div>
      <div className="font-mono font-semibold text-xl tracking-tight" style={{ color: trendColor ?? "var(--text-1)" }}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs font-mono" style={{ color: "var(--text-3)" }}>{subValue}</div>
      )}
    </div>
  );
}
