"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/expenses": "Expenses",
  "/dashboard/payouts": "Payouts",
  "/dashboard/receipts": "Receipts",
  "/dashboard/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const { userEmail, signOut } = useBusiness();

  return (
    <header
      className="flex items-center justify-between h-14 px-4 lg:px-6 border-b shrink-0"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      <h1 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
        {titles[pathname] ?? "SetoTrading"}
      </h1>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs" style={{ color: "var(--text-3)" }}>
          {userEmail}
        </span>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs font-medium text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f] rounded-lg px-2.5 py-1.5 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
