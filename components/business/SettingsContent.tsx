"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/fields";
import { saveSettings } from "@/lib/business";
import { fmtMoneyFull } from "@/lib/utils";

export function SettingsContent() {
  const { userId, settings, refresh, tablesMissing } = useBusiness();
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
      setError(err instanceof Error ? err.message : "Failed to save settings.");
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
            Currently {fmtMoneyFull(Number(settings.seed_money))}.
          </p>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || tablesMissing}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors"
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
    </div>
  );
}
