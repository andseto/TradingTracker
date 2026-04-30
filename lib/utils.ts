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
