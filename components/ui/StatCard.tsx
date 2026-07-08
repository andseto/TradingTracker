"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";

interface StatCardProps {
  label: string;
  value: string | number;
  format?: (n: number) => string; // required when value is a number (enables count-up)
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, format, subValue, trend, icon: Icon, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "#22c55e" :
    trend === "down" ? "#ef4444" :
    undefined;

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 md:p-4 flex flex-col gap-1.5 md:gap-2 border overflow-hidden card-hover anim-fade-up",
        className
      )}
      style={{ background: "var(--bg-card)", borderColor: "var(--c-border)" }}
    >
      {/* Amber accent line along the top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.55), rgba(245,158,11,0.05))" }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          {label}
        </span>
        {Icon && (
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            <Icon className="w-3.5 h-3.5 text-amber-400/80" />
          </div>
        )}
      </div>
      <div className="font-mono font-semibold text-base md:text-xl tracking-tight" style={{ color: trendColor ?? "var(--text-1)" }}>
        {typeof value === "number" && format ? <AnimatedNumber value={value} format={format} /> : value}
      </div>
      {subValue && (
        <div className="text-xs font-mono" style={{ color: "var(--text-3)" }}>{subValue}</div>
      )}
    </div>
  );
}
