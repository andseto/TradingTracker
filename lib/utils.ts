import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtMoney(value: number, privacy = false): string {
  if (privacy) return "••••";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return (value < 0 ? "-$" : "$") + (abs / 1000).toFixed(1) + "k";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

export function fmtPct(value: number, privacy = false): string {
  if (privacy) return "••%";
  return (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
}

export function fmtMoneyFull(value: number, privacy = false): string {
  if (privacy) return "$••,•••.••";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayISO(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}
