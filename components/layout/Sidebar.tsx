"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp, LayoutDashboard, Upload, ChevronLeft,
  ChevronRight, BarChart2, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/charts", icon: BarChart2, label: "Charts" },
  { href: "/dashboard/import", icon: Upload, label: "Import CSV" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#131316] border-r border-[#2a2a35] transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 px-3 border-b border-[#2a2a35] shrink-0", collapsed ? "justify-center" : "gap-2.5 px-4")}>
        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm tracking-tight text-white truncate">TradeTrack</span>
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
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center w-full px-0 py-2.5" : "gap-2.5 px-3 py-2",
                active
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                  : "text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f]"
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
      <div className="p-2 border-t border-[#2a2a35]">
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
