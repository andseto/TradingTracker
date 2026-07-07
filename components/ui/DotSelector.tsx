"use client";

import { cn } from "@/lib/utils";

interface DotSelectorProps {
  value: number; // 0..max, 0 = not set
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

// Click a dot to set the count; click the already-selected dot again to clear it.
export function DotSelector({ value, max = 5, onChange, readOnly }: DotSelectorProps) {
  const dots = Array.from({ length: max }, (_, i) => i + 1);

  if (readOnly) {
    return (
      <div className="flex items-center gap-1">
        {dots.map((n) => (
          <span
            key={n}
            className={cn("w-2 h-2 rounded-full", n <= value ? "bg-indigo-500" : "bg-[#2a2a35]")}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {dots.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(value === n ? 0 : n)}
          title={`${n} winning day${n === 1 ? "" : "s"}`}
          className={cn(
            "w-4 h-4 rounded-full border transition-colors",
            n <= value
              ? "bg-indigo-500 border-indigo-500"
              : "border-[#3a3a48] hover:border-indigo-400"
          )}
        />
      ))}
    </div>
  );
}
