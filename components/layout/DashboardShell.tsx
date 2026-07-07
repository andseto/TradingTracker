"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { BusinessProvider, useBusiness } from "@/context/BusinessContext";

function SetupBanner() {
  const { tablesMissing } = useBusiness();
  if (!tablesMissing) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-4 text-sm text-amber-300">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold">Database not set up yet.</span>{" "}
        Open your Supabase project → SQL Editor, paste the contents of{" "}
        <code className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded">supabase/setup.sql</code>{" "}
        from this repo, and run it once. Then refresh this page.
      </div>
    </div>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-3 pb-20 md:pb-6 lg:p-6">
          <SetupBanner />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <ShellInner>{children}</ShellInner>
    </BusinessProvider>
  );
}
