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

// Interactive Brokers Flex Query CSV columns:
// Symbol, Description, AssetClass, TradeDate, Buy/Sell, Quantity, Price, Commission, NetCash
interface IBKRRow {
  Symbol: string;
  Description: string;
  AssetClass: string;
  TradeDate: string;
  "Buy/Sell": string;
  Quantity: string;
  Price: string;
  Commission: string;
  NetCash: string;
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

function parseFidelityDate(raw: string): string {
  // Fidelity uses MM/DD/YYYY
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw.trim();
}

function parseIBKRDate(raw: string): string {
  // IBKR Flex uses yyyyMMdd
  const s = raw.trim();
  if (s.length === 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return s;
}

export function parseIBKRCSV(csvText: string): Trade[] {
  const result = Papa.parse<IBKRRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const trades: Trade[] = [];

  for (const row of result.data) {
    const action = parseAction(row["Buy/Sell"] ?? "");
    if (!action) continue;

    const symbol = (row.Symbol ?? "").trim();
    if (!symbol) continue;

    const qty = Math.abs(parseNum(row.Quantity));
    const price = Math.abs(parseNum(row.Price));
    const amount = parseNum(row.NetCash);
    const commission = Math.abs(parseNum(row.Commission));
    const date = parseIBKRDate(row.TradeDate ?? "");

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
    const date = parseFidelityDate(row["Run Date"] ?? "");

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
