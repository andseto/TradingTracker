"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchExpenses, fetchPayouts, fetchSettings } from "@/lib/business";
import type { BusinessSettings, Expense, Payout } from "@/types";

interface BusinessContextValue {
  userId: string;
  userEmail: string;
  settings: BusinessSettings;
  expenses: Expense[];
  payouts: Payout[];
  loading: boolean;
  tablesMissing: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesMissing, setTablesMissing] = useState(false);

  const loadAll = useCallback(async (uid: string) => {
    try {
      const [s, e, p] = await Promise.all([
        fetchSettings(uid),
        fetchExpenses(),
        fetchPayouts(),
      ]);
      setSettings(s);
      setExpenses(e);
      setPayouts(p);
      setTablesMissing(false);
    } catch (err: unknown) {
      // 42P01 = table does not exist → setup.sql hasn't been run yet
      const code = (err as { code?: string })?.code;
      if (code === "42P01" || code === "PGRST205") {
        setTablesMissing(true);
        setSettings({
          user_id: uid,
          business_name: "SetoTrading",
          seed_money: 0,
          updated_at: new Date().toISOString(),
        });
      } else {
        throw err;
      }
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? "");
      await loadAll(user.id);
      setLoading(false);
    });
  }, [router, loadAll]);

  const refresh = useCallback(async () => {
    if (userId) await loadAll(userId);
  }, [userId, loadAll]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () =>
      settings
        ? {
            userId,
            userEmail,
            settings,
            expenses,
            payouts,
            loading,
            tablesMissing,
            refresh,
            signOut,
          }
        : null,
    [userId, userEmail, settings, expenses, payouts, loading, tablesMissing, refresh, signOut]
  );

  if (loading || !value) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4 anim-fade-in">
          <div
            className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center anim-float"
            style={{ animation: "floatY 2.5s ease-in-out infinite, glowPulse 2.5s ease-in-out infinite" }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 5v4" /><rect width="4" height="6" x="7" y="9" rx="1" /><path d="M9 15v2" />
              <path d="M17 3v2" /><rect width="4" height="8" x="15" y="5" rx="1" /><path d="M17 13v3" />
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            </svg>
          </div>
          <p className="text-sm text-shimmer font-medium">Loading SetoTrading…</p>
        </div>
      </div>
    );
  }

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
