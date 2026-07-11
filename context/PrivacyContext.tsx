"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "focusMode";

interface PrivacyContextValue {
  focusMode: boolean;
  toggleFocusMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);

  // Read the saved preference after mount only — reading localStorage during
  // the initial render would desync from the server-rendered markup.
  useEffect(() => {
    setFocusMode(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <PrivacyContext.Provider value={{ focusMode, toggleFocusMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function useFocusMode(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("useFocusMode must be used within PrivacyProvider");
  return ctx;
}
