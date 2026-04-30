"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SettingsModal } from "@/components/ui/SettingsModal";
import { DashboardProvider } from "@/context/DashboardContext";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-[#0d0d0f]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header onOpenSettings={() => setSettingsOpen(true)} />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </DashboardProvider>
  );
}
