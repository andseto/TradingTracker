"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Receipt, Banknote, FileText, Settings,
  ChevronLeft, ChevronRight, CandlestickChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/expenses", icon: Receipt, label: "Expenses" },
  { href: "/dashboard/payouts", icon: Banknote, label: "Payouts" },
  { href: "/dashboard/receipts", icon: FileText, label: "Receipts" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn("hidden md:flex flex-col border-r transition-all duration-200 shrink-0", collapsed ? "w-14" : "w-52")}
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 px-3 border-b shrink-0", collapsed ? "justify-center" : "gap-2.5 px-4")} style={{ borderColor: "var(--c-border)" }}>
        <div
          className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0"
          style={{ animation: "glowPulse 4s ease-in-out infinite" }}
        >
          <CandlestickChart className="w-4 h-4 text-amber-400" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm tracking-tight text-shimmer truncate">SetoTrading</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center w-full px-0 py-2.5" : "gap-2.5 px-3 py-2",
                active
                  ? "bg-amber-600/15 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]"
                  : "text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f] hover:translate-x-0.5"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t" style={{ borderColor: "var(--c-border)" }}>
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center rounded-lg text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f] text-xs transition-colors w-full",
            collapsed ? "justify-center py-2.5" : "gap-2 px-3 py-2"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
