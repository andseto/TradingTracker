import Papa from "papaparse";
import { Trade } from "@/types";

// Fidelity account history CSV columns:
// Run Date, Action, Symbol, Security Description, Security Type, Quantity, Price ($), Commission ($), Amount ($)

interface FidelityRow {
  "Run Date": string;
  Action: string;
  Symbol: string;
  "Security Description": string;
  "Security Type": string;
  Quantity: string;
  "Price ($)": string;
  "Commission ($)": string;
  "Amount ($)": string;
}

function parseDate(raw: string): string {
  // Fidelity uses MM/DD/YYYY
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw.trim();
}

function parseNum(raw: string): number {
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

function parseAction(action: string): "BUY" | "SELL" | null {
  const a = action.toUpperCase();
  if (a.includes("BOUGHT") || a.includes("BUY")) return "BUY";
  if (a.includes("SOLD") || a.includes("SELL")) return "SELL";
  return null;
}

export function parseFidelityCSV(csvText: string): Trade[] {
  // Fidelity CSVs sometimes have header lines before the actual CSV data
  const lines = csvText.split("\n");
  const startIdx = lines.findIndex((l) => l.includes("Run Date"));
  const cleanCSV = startIdx >= 0 ? lines.slice(startIdx).join("\n") : csvText;

  const result = Papa.parse<FidelityRow>(cleanCSV, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const trades: Trade[] = [];

  for (const row of result.data) {
    const action = parseAction(row.Action ?? "");
    if (!action) continue;

    const symbol = (row.Symbol ?? "").trim();
    if (!symbol || symbol === "--") continue;

    const qty = Math.abs(parseNum(row.Quantity));
    const price = Math.abs(parseNum(row["Price ($)"]));
    const amount = parseNum(row["Amount ($)"]);
    const commission = Math.abs(parseNum(row["Commission ($)"]));
    const date = parseDate(row["Run Date"] ?? "");

    if (!qty || !price) continue;

    trades.push({
      id: crypto.randomUUID(),
      date,
      symbol,
      action,
      quantity: qty,
      price,
      amount,
      commission,
    });
  }

  return trades.sort((a, b) => a.date.localeCompare(b.date));
}
