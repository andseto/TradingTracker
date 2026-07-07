"use client";

import { cn } from "@/lib/utils";

// Outcome/status → badge tone. Icon-free color + text pairing; text always carries the meaning.
const tones: Record<string, string> = {
  "Passed": "bg-green-500/10 text-green-400 border-green-500/25",
  "Payout Received": "bg-green-500/10 text-green-400 border-green-500/25",
  "Received": "bg-green-500/10 text-green-400 border-green-500/25",
  "Failed": "bg-red-500/10 text-red-400 border-red-500/25",
  "In Progress": "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  "Pending": "bg-amber-500/10 text-amber-400 border-amber-500/25",
  "Refunded": "bg-slate-500/10 text-slate-400 border-slate-500/25",
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[value] ?? "bg-slate-500/10 text-slate-400 border-slate-500/25"
      )}
    >
      {value}
    </span>
  );
}
