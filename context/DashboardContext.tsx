"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Trade, Settings, TimeRange, ClosedPosition, DailyPnL, MonthlyPnL, SymbolPnL, EquityPoint, Stats, Theme } from "@/types";
import { MOCK_TRADES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
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
  setTrades: (trades: Trade[]) => void;
  addTrades: (incoming: Trade[]) => void;
  timeRange: TimeRange;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  loading: boolean;
  userId: string | null;
  positions: ClosedPosition[];
  daily: DailyPnL[];
  monthly: MonthlyPnL[];
  symbols: SymbolPnL[];
  equity: EquityPoint[];
  stats: Stats;
  dowPnl: ReturnType<typeof calcDayOfWeekPnL>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function tradeToRow(t: Trade, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    date: t.date,
    symbol: t.symbol,
    action: t.action as string,
    quantity: t.quantity,
    price: t.price,
    amount: t.amount,
    commission: t.commission,
  };
}

function rowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    date: row.date as string,
    symbol: row.symbol as string,
    action: row.action as "BUY" | "SELL",
    quantity: Number(row.quantity),
    price: Number(row.price),
    amount: Number(row.amount),
    commission: Number(row.commission),
  };
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTradesState] = useState<Trade[]>(MOCK_TRADES);
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[3]);
  const [settings, setSettingsState] = useState<Settings>({ theme: "dark", privacyMode: false, userName: "" });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const userIdRef = useRef<string | null>(null);
  const settingsRef = useRef<Settings>(settings);
  settingsRef.current = settings;

  const loadUserData = useCallback(async (uid: string) => {
    setLoading(true);
    const supabase = createClient();

    const [tradesResult, profileResult] = await Promise.all([
      supabase.from("trades").select("*").eq("user_id", uid).order("date"),
      supabase.from("profiles").select("*").eq("id", uid).single(),
    ]);

    setTradesState(
      tradesResult.data && tradesResult.data.length > 0
        ? tradesResult.data.map(rowToTrade)
        : []
    );

    if (profileResult.data) {
      setSettingsState({
        theme: (profileResult.data.theme as Theme) || "dark",
        privacyMode: profileResult.data.privacy_mode || false,
        userName: profileResult.data.username || "",
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        userIdRef.current = session.user.id;
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        userIdRef.current = session.user.id;
        loadUserData(session.user.id);
      } else {
        setUserId(null);
        userIdRef.current = null;
        setTradesState(MOCK_TRADES);
        setSettingsState({ theme: "dark", privacyMode: false, userName: "" });
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Replace all trades and sync to Supabase
  const setTrades = useCallback((newTrades: Trade[]) => {
    setTradesState(newTrades);
    const uid = userIdRef.current;
    if (!uid) return;
    const supabase = createClient();
    supabase.from("trades").delete().eq("user_id", uid).then(() => {
      if (newTrades.length > 0) {
        supabase.from("trades").insert(newTrades.map((t) => tradeToRow(t, uid)));
      }
    });
  }, []);

  // Append new trades (dedup) and sync to Supabase
  const addTrades = useCallback((incoming: Trade[]) => {
    setTradesState((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const fresh = incoming.filter((t) => !existingIds.has(t.id));
      const uid = userIdRef.current;
      if (uid && fresh.length > 0) {
        const supabase = createClient();
        supabase.from("trades").upsert(fresh.map((t) => tradeToRow(t, uid)), { onConflict: "id" });
      }
      return [...prev, ...fresh].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  // Settings setter — also saves to profiles table
  const setSettings: React.Dispatch<React.SetStateAction<Settings>> = useCallback((value) => {
    const next = typeof value === "function" ? value(settingsRef.current) : value;
    setSettingsState(next);
    const uid = userIdRef.current;
    if (uid) {
      const supabase = createClient();
      supabase.from("profiles").upsert({
        id: uid,
        username: next.userName,
        theme: next.theme,
        privacy_mode: next.privacyMode,
      });
    }
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
      loading, userId,
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
