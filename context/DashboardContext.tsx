"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Trade, Settings, TimeRange, ClosedPosition, DailyPnL, MonthlyPnL, SymbolPnL, EquityPoint, Stats, Theme, DayTag, Goal } from "@/types";
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
  syncError: string | null;
  positions: ClosedPosition[];
  daily: DailyPnL[];
  allDaily: DailyPnL[];
  monthly: MonthlyPnL[];
  symbols: SymbolPnL[];
  equity: EquityPoint[];
  stats: Stats;
  dowPnl: ReturnType<typeof calcDayOfWeekPnL>;
  dayTags: Record<string, DayTag>;
  setDayTag: (date: string, tag: DayTag | null) => void;
  goal: Goal | null;
  setGoal: (g: Goal | null) => void;
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
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dayTags, setDayTagsState] = useState<Record<string, DayTag>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("tradeforge-day-tags") || "{}"); }
    catch { return {}; }
  });

  const [goal, setGoalState] = useState<Goal | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = JSON.parse(localStorage.getItem("tradeforge-goal") || "null");
      // Discard old format that is missing required fields
      if (!raw || typeof raw.targetPct !== "number" || !raw.startMonth || typeof raw.startBalance !== "number") {
        localStorage.removeItem("tradeforge-goal");
        return null;
      }
      return raw as Goal;
    } catch { return null; }
  });

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
    setSyncError(null);
    const uid = userIdRef.current;
    if (!uid) return;
    const supabase = createClient();
    supabase.from("trades").delete().eq("user_id", uid).then(({ error: delErr }) => {
      if (delErr) { setSyncError(`Delete failed: ${delErr.message} (code: ${delErr.code})`); return; }
      if (newTrades.length === 0) return;
      supabase.from("trades").insert(newTrades.map((t) => tradeToRow(t, uid))).then(({ error: insErr }) => {
        if (insErr) setSyncError(`Insert failed: ${insErr.message} (code: ${insErr.code})`);
      });
    });
  }, []);

  // Append new trades (dedup) and sync to Supabase
  const addTrades = useCallback((incoming: Trade[]) => {
    setSyncError(null);
    setTradesState((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const fresh = incoming.filter((t) => !existingIds.has(t.id));
      const uid = userIdRef.current;
      if (uid && fresh.length > 0) {
        const supabase = createClient();
        supabase.from("trades").upsert(fresh.map((t) => tradeToRow(t, uid)), { onConflict: "id" }).then(({ error: upsErr }) => {
          if (upsErr) setSyncError(`Upsert failed: ${upsErr.message} (code: ${upsErr.code})`);
        });
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
      }).then(({ error: profErr }) => {
        if (profErr) setSyncError(`Settings save failed: ${profErr.message} (code: ${profErr.code})`);
      });
    }
  }, []);

  const setDayTag = useCallback((date: string, tag: DayTag | null) => {
    setDayTagsState((prev) => {
      const next = { ...prev };
      if (tag === null) delete next[date];
      else next[date] = tag;
      localStorage.setItem("tradeforge-day-tags", JSON.stringify(next));
      return next;
    });
  }, []);

  const setGoal = useCallback((g: Goal | null) => {
    setGoalState(g);
    localStorage.setItem("tradeforge-goal", JSON.stringify(g));
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

  const effectiveDaily = useMemo(() =>
    daily
      .filter((d) => dayTags[d.date] !== "void")
      .map((d) => {
        const tag = dayTags[d.date];
        if (!tag) return d;
        return { ...d, isWin: tag === "win", isBreakEven: tag === "breakeven" };
      }),
    [daily, dayTags]
  );

  const effectivePositions = useMemo(() => {
    const voidDates = new Set(
      Object.entries(dayTags).filter(([, v]) => v === "void").map(([date]) => date)
    );
    return voidDates.size === 0 ? filteredPositions : filteredPositions.filter((p) => !voidDates.has(p.closeDate));
  }, [filteredPositions, dayTags]);

  const monthly = useMemo(() => calcMonthlyPnL(effectiveDaily), [effectiveDaily]);
  const symbols = useMemo(() => calcSymbolPnL(effectivePositions), [effectivePositions]);
  const equity = useMemo(() => calcEquityCurve(effectiveDaily), [effectiveDaily]);
  const stats = useMemo(() => calcStats(effectivePositions, effectiveDaily), [effectivePositions, effectiveDaily]);
  const dowPnl = useMemo(() => calcDayOfWeekPnL(effectiveDaily), [effectiveDaily]);

  return (
    <DashboardContext.Provider value={{
      trades, setTrades, addTrades,
      timeRange, setTimeRange,
      settings, setSettings,
      loading, userId, syncError,
      positions: filteredPositions,
      daily, allDaily, monthly, symbols, equity, stats, dowPnl,
      dayTags, setDayTag,
      goal, setGoal,
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
