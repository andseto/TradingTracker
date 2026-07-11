"use client";

import { useState } from "react";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { useFocusMode } from "@/context/PrivacyContext";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/fields";
import { saveSettings } from "@/lib/business";
import { cn, fmtMoneyFull, toErrorMessage } from "@/lib/utils";

export function SettingsContent() {
  const { userId, settings, refresh, tablesMissing } = useBusiness();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const [businessName, setBusinessName] = useState(settings.business_name);
  const [seedMoney, setSeedMoney] = useState(String(settings.seed_money));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const seed = parseFloat(seedMoney);
    if (isNaN(seed) || seed < 0) { setError("Enter a valid seed amount."); return; }

    setSaving(true);
    try {
      await saveSettings(userId, {
        business_name: businessName.trim() || "SetoTrading",
        seed_money: seed,
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save settings."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card title="Business" subtitle="These values drive the Overview numbers.">
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Business name">
            <TextInput value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="SetoTrading" />
          </Field>

          <Field label="Seed money (USD)">
            <TextInput
              type="number" step="0.01" min="0" placeholder="1000.00"
              value={seedMoney} onChange={(e) => setSeedMoney(e.target.value)}
            />
          </Field>
          <p className="text-xs -mt-2" style={{ color: "var(--text-3)" }}>
            The capital you started the company with. Current capital = seed money + payouts − spending.
            Currently {fmtMoneyFull(Number(settings.seed_money), focusMode)}.
          </p>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || tablesMissing}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-900 text-xs font-medium rounded-lg px-4 py-2 btn-glow"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      <Card title="Focus Mode" subtitle="Mask dollar amounts across the dashboard — see only whether you're up or down.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-2)" }}>
            {focusMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
            <span>
              {focusMode
                ? "Amounts are hidden. Green/red still shows wins and losses."
                : "Amounts are visible everywhere."}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={focusMode}
            onClick={toggleFocusMode}
            className={cn(
              "relative w-10 h-6 rounded-full transition-colors shrink-0",
              focusMode ? "bg-amber-500" : "bg-[#2a2a35]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                focusMode && "translate-x-4"
              )}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}
