"use client";

import { Settings, Upload, Eye, EyeOff } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { TIME_RANGES } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { timeRange, setTimeRange, settings, setSettings } = useDashboard();

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-[#2a2a35] bg-[#131316] shrink-0">
      {/* Time range tabs */}
      <div className="flex items-center gap-1 bg-[#0d0d0f] rounded-lg p-1 border border-[#2a2a35]">
        {TIME_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setTimeRange(r)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
              timeRange.value === r.value
                ? "bg-[#1a1a1f] text-white"
                : "text-[#9090a8] hover:text-[#e8e8f0]"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Privacy toggle */}
      <button
        onClick={() => setSettings((s) => ({ ...s, privacyMode: !s.privacyMode }))}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
          settings.privacyMode
            ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/20"
            : "text-[#9090a8] hover:text-[#e8e8f0] bg-[#0d0d0f] border-[#2a2a35]"
        )}
        title="Toggle privacy mode"
      >
        {settings.privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">Privacy</span>
      </button>

      {/* Import */}
      <Link
        href="/dashboard/import"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9090a8] hover:text-[#e8e8f0] bg-[#0d0d0f] border border-[#2a2a35] transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Import</span>
      </Link>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9090a8] hover:text-[#e8e8f0] hover:bg-[#1a1a1f] transition-colors"
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );
}
