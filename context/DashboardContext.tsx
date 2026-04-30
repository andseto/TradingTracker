"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Trade, Settings, TimeRange, ClosedPosition, DailyPnL, MonthlyPnL, SymbolPnL, EquityPoint, Stats } from "@/types";
import { MOCK_TRADES } from "@/lib/mock-data";
import {
  matchTrades, calcDailyPnL, calcMonthlyPnL, calcSymbolPnL,
  calcEquityCurve, calcStats, filterByDays, calcDayOfWeekPnL,
} from "@/lib/calculations";

export const TIME_RANGES: TimeRange[] = [
  { label: "1W", value: "1w", days: 7 },
  { label: "1M", value: "1m", days: 30 },
  { label: "3M", value: "3m", days: 90 },
  { label: "6M", value: "6m", days: 180 },
  { label: "1Y", value: "1y", days: 365 },
  { label: "All", value: "all", days: null },
];

interface DashboardContextValue {
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  addTrades: (incoming: Trade[]) => void;

  timeRange: TimeRange;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>;

  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;

  // computed
  positions: ClosedPosition[];
  daily: DailyPnL[];
  monthly: MonthlyPnL[];
  symbols: SymbolPnL[];
  equity: EquityPoint[];
  stats: Stats;
  dowPnl: ReturnType<typeof calcDayOfWeekPnL>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES);
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[3]); // 6M default
  const [settings, setSettings] = useState<Settings>({ density: "comfortable", privacyMode: false });

  const addTrades = useCallback((incoming: Trade[]) => {
    setTrades((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const fresh = incoming.filter((t) => !existingIds.has(t.id));
      return [...prev, ...fresh].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const positions = useMemo(() => matchTrades(trades), [trades]);
  const allDaily = useMemo(() => calcDailyPnL(positions), [positions]);

  const daily = useMemo(
    () => filterByDays(allDaily, timeRange.days),
    [allDaily, timeRange.days]
  );

  const filteredPositions = useMemo(() => {
    if (!timeRange.days) return positions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange.days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return positions.filter((p) => p.closeDate >= cutoffStr);
  }, [positions, timeRange.days]);

  const monthly = useMemo(() => calcMonthlyPnL(daily), [daily]);
  const symbols = useMemo(() => calcSymbolPnL(filteredPositions), [filteredPositions]);
  const equity = useMemo(() => calcEquityCurve(daily), [daily]);
  const stats = useMemo(() => calcStats(filteredPositions, daily), [filteredPositions, daily]);
  const dowPnl = useMemo(() => calcDayOfWeekPnL(daily), [daily]);

  return (
    <DashboardContext.Provider value={{
      trades, setTrades, addTrades,
      timeRange, setTimeRange,
      settings, setSettings,
      positions: filteredPositions,
      daily, monthly, symbols, equity, stats, dowPnl,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
