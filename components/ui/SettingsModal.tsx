"use client";

import { X } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { Density } from "@/types";
import { cn } from "@/lib/utils";

const densities: { value: Density; label: string; desc: string }[] = [
  { value: "compact", label: "Compact", desc: "Tighter spacing, more on screen" },
  { value: "comfortable", label: "Comfortable", desc: "Balanced spacing" },
  { value: "spacious", label: "Spacious", desc: "Relaxed, easier to read" },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, setSettings } = useDashboard();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#131316] border border-[#2a2a35] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a35]">
          <h2 className="font-semibold text-[#e8e8f0]">Settings</h2>
          <button onClick={onClose} className="text-[#9090a8] hover:text-[#e8e8f0]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Density */}
          <div>
            <label className="block text-xs font-medium text-[#9090a8] uppercase tracking-wide mb-2">
              Display Density
            </label>
            <div className="space-y-2">
              {densities.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setSettings((s) => ({ ...s, density: value }))}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                    settings.density === value
                      ? "border-indigo-500/40 bg-indigo-600/10 text-[#e8e8f0]"
                      : "border-[#2a2a35] hover:border-[#3a3a48] text-[#9090a8]"
                  )}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-[#55556a] mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#e8e8f0]">Privacy Mode</div>
              <div className="text-xs text-[#55556a]">Hide dollar amounts</div>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, privacyMode: !s.privacyMode }))}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                settings.privacyMode ? "bg-indigo-600" : "bg-[#2a2a35]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  settings.privacyMode ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
