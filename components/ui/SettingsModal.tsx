"use client";

import { useState } from "react";
import { X, Sun, Moon, Trash2, User, AlertTriangle, AlertCircle } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, setSettings, setTrades, syncError } = useDashboard();
  const [nameInput, setNameInput] = useState(settings.userName);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!open) return null;

  function handleSaveName() {
    setSettings((s) => ({ ...s, userName: nameInput.trim() }));
  }

  function handleClearData() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setTrades([]);
    setConfirmClear(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmClear(false); onClose(); }} />
      <div
        className="relative rounded-2xl w-full max-w-sm shadow-2xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--c-border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-1)" }}>Settings</h2>
          <button onClick={() => { setConfirmClear(false); onClose(); }} style={{ color: "var(--text-2)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Sync error */}
          {syncError && syncError.includes("Settings") && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/5 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-mono break-all">{syncError}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-2)" }}>
              Your Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="Enter your name"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                  style={{
                    background: "var(--bg-base)",
                    borderColor: "var(--c-border)",
                    color: "var(--text-1)",
                  }}
                />
              </div>
              <button
                onClick={handleSaveName}
                disabled={nameInput.trim() === settings.userName}
                className="px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-2)" }}>
              Appearance
            </label>
            <div className="flex rounded-lg p-1 border" style={{ background: "var(--bg-base)", borderColor: "var(--c-border)" }}>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: "dark" }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                  settings.theme === "dark" ? "bg-indigo-600 text-white" : ""
                )}
                style={settings.theme === "dark" ? undefined : { color: "var(--text-2)" }}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: "light" }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                  settings.theme === "light" ? "bg-indigo-600 text-white" : ""
                )}
                style={settings.theme === "light" ? undefined : { color: "var(--text-2)" }}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Privacy Mode</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Hide dollar amounts</div>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, privacyMode: !s.privacyMode }))}
              className={cn("relative w-10 h-5 rounded-full transition-colors", settings.privacyMode ? "bg-indigo-600" : "bg-[var(--c-border)]")}
              style={settings.privacyMode ? undefined : { background: "var(--c-border)" }}
            >
              <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", settings.privacyMode ? "translate-x-5" : "translate-x-0.5")} />
            </button>
          </div>

          {/* Clear data */}
          <div className="pt-2 border-t" style={{ borderColor: "var(--c-border)" }}>
            {!confirmClear ? (
              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">This will wipe all trade data. Are you sure?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2 text-sm rounded-lg border transition-colors"
                    style={{ borderColor: "var(--c-border)", color: "var(--text-2)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearData}
                    className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                  >
                    Yes, clear it
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
