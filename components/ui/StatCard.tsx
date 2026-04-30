"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}

export function StatCard({ label, value, subValue, trend, icon: Icon, className }: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-[#22c55e]" :
    trend === "down" ? "text-[#ef4444]" :
    "text-[#9090a8]";

  return (
    <div className={cn(
      "bg-[#131316] border border-[#2a2a35] rounded-xl p-4 flex flex-col gap-2 hover:border-[#3a3a48] transition-colors",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#9090a8] uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="w-6 h-6 rounded-md bg-[#1a1a1f] flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#55556a]" />
          </div>
        )}
      </div>
      <div className={cn("font-mono font-semibold text-xl tracking-tight", trendColor)}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-[#55556a] font-mono">{subValue}</div>
      )}
    </div>
  );
}
