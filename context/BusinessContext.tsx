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
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--c-border)", borderTopColor: "#6366f1" }}
          />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Loading SetoTrading…</p>
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
