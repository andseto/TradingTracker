import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";

export default function CalendarPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#e8e8f0]">Calendar</h1>
        <p className="text-sm text-[#9090a8] mt-1">Click any trading day to see the full breakdown.</p>
      </div>
      <CalendarHeatmap />
    </div>
  );
}
