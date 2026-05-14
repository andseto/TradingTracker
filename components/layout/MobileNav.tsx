"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, BarChart2, Target, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/charts", icon: BarChart2, label: "Charts" },
  { href: "/dashboard/goals", icon: Target, label: "Goals" },
  { href: "/dashboard/journal", icon: BookOpen, label: "Journal" },
  { href: "/dashboard/import", icon: Upload, label: "Import" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-indigo-400" : "text-[#55556a]"
            )}
          >
            <Icon className={cn("w-5 h-5", active ? "text-indigo-400" : "text-[#55556a]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
