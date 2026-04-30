import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, headerRight }: ChartCardProps) {
  return (
    <div
      className={cn("rounded-xl overflow-hidden border", className)}
      style={{ background: "var(--bg-card)", borderColor: "var(--c-border)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--c-border)" }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
