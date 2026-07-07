"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Card({ title, subtitle, actions, className, children }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border p-4", className)}
      style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between mb-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
