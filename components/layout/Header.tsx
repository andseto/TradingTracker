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
    <header
      className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b shrink-0"
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {/* Time range tabs */}
      <div
        className="flex items-center gap-1 rounded-lg p-1 border"
        style={{ background: "var(--bg-base)", borderColor: "var(--c-border)" }}
      >
        {TIME_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setTimeRange(r)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
              timeRange.value === r.value
                ? "bg-indigo-600 text-white"
                : "hover:bg-[var(--bg-elevated)]"
            )}
            style={{ color: timeRange.value === r.value ? undefined : "var(--text-2)" }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Username greeting */}
      {settings.userName && (
        <span className="hidden md:block text-sm font-medium" style={{ color: "var(--text-2)" }}>
          Hey, <span style={{ color: "var(--text-1)" }}>{settings.userName}</span>
        </span>
      )}

      {/* Privacy toggle */}
      <button
        onClick={() => setSettings((s) => ({ ...s, privacyMode: !s.privacyMode }))}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
          settings.privacyMode
            ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/20"
            : "border"
        )}
        style={settings.privacyMode ? undefined : { color: "var(--text-2)", borderColor: "var(--c-border)", background: "var(--bg-base)" }}
        title="Toggle privacy mode"
      >
        {settings.privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">Privacy</span>
      </button>

      {/* Import */}
      <Link
        href="/dashboard/import"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
        style={{ color: "var(--text-2)", borderColor: "var(--c-border)", background: "var(--bg-base)" }}
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Import</span>
      </Link>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: "var(--text-2)" }}
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );
}
