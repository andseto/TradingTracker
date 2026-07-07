"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Banknote, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/expenses", icon: Receipt, label: "Expenses" },
  { href: "/dashboard/payouts", icon: Banknote, label: "Payouts" },
  { href: "/dashboard/receipts", icon: FileText, label: "Receipts" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 border-t flex items-stretch z-40"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-indigo-400" : "text-[#55556a] hover:text-[#9090a8]"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
