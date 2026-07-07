// ---------- Domain types for the SetoTrading business dashboard ----------

export interface BusinessSettings {
  user_id: string;
  business_name: string;
  seed_money: number;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string; // yyyy-mm-dd
  firm: string;
  expense_type: string;
  outcome: string | null;
  amount: number;
  notes: string | null;
  receipt_path: string | null;
  receipt_name: string | null;
  winning_days: number | null; // 1-5 dot rating: winning days logged before this account passed/paid out
  created_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  date: string; // yyyy-mm-dd
  firm: string;
  amount: number;
  method: string | null;
  status: string;
  notes: string | null;
  receipt_path: string | null;
  receipt_name: string | null;
  created_at: string;
}

export type ExpenseInput = Omit<Expense, "id" | "user_id" | "created_at">;
export type PayoutInput = Omit<Payout, "id" | "user_id" | "created_at">;

// A receipt document attached to either an expense or a payout.
export interface ReceiptDoc {
  source: "expense" | "payout";
  rowId: string;
  date: string;
  firm: string;
  label: string; // expense type or "Payout"
  amount: number;
  path: string;
  name: string;
}

// ---------- Dropdown option sets ----------

export const FIRMS = [
  "Apex Trader Funding",
  "Topstep",
  "My Funded Futures",
  "Take Profit Trader",
  "Tradeify",
  "Bulenox",
  "FundedNext Futures",
  "TradeDay",
  "Legends Trading",
  "Other",
] as const;

export const EXPENSE_TYPES = [
  "Evaluation",
  "Activation Fee",
  "Reset",
  "Data Fees",
  "Software / Tools",
  "Education",
  "Commissions",
  "Other",
] as const;

export const OUTCOMES = [
  "In Progress",
  "Passed",
  "Failed",
  "Payout Received",
  "Refunded",
] as const;

export const PAYOUT_METHODS = [
  "Wire",
  "ACH",
  "PayPal",
  "Wise",
  "Crypto",
  "Check",
  "Other",
] as const;

export const PAYOUT_STATUSES = ["Received", "Pending"] as const;
