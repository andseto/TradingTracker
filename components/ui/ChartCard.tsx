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
    <div className={cn("bg-[#131316] border border-[#2a2a35] rounded-xl overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a35]">
        <div>
          <h3 className="text-sm font-semibold text-[#e8e8f0]">{title}</h3>
          {subtitle && <p className="text-xs text-[#55556a] mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
