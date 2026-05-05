"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SettingsModal } from "@/components/ui/SettingsModal";
import { ShareModal } from "@/components/ui/ShareModal";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useDashboard();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (settings.theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [settings.theme]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-indigo-500 rounded-full animate-spin" style={{ borderColor: "var(--c-border)", borderTopColor: "#6366f1" }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Loading your data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onOpenSettings={() => setSettingsOpen(true)} onOpenShare={() => setShareOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <ShellInner>{children}</ShellInner>
    </DashboardProvider>
  );
}
