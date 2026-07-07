import { createClient } from "@/lib/supabase/client";
import type {
  BusinessSettings,
  Expense,
  ExpenseInput,
  Payout,
  PayoutInput,
} from "@/types";

const BUCKET = "receipts";

// ---------- Settings ----------

export async function fetchSettings(userId: string): Promise<BusinessSettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from("business_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data as BusinessSettings;
  return {
    user_id: userId,
    business_name: "SetoTrading",
    seed_money: 0,
    updated_at: new Date().toISOString(),
  };
}

export async function saveSettings(
  userId: string,
  values: { business_name: string; seed_money: number }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("business_settings").upsert({
    user_id: userId,
    ...values,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------- Expenses ----------

export async function fetchExpenses(): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Expense[];
}

export async function insertExpense(userId: string, input: ExpenseInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").insert({ user_id: userId, ...input });
  if (error) throw error;
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(row: Expense): Promise<void> {
  const supabase = createClient();
  if (row.receipt_path) {
    await supabase.storage.from(BUCKET).remove([row.receipt_path]);
  }
  const { error } = await supabase.from("expenses").delete().eq("id", row.id);
  if (error) throw error;
}

// ---------- Payouts ----------

export async function fetchPayouts(): Promise<Payout[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payout[];
}

export async function insertPayout(userId: string, input: PayoutInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("payouts").insert({ user_id: userId, ...input });
  if (error) throw error;
}

export async function updatePayout(id: string, input: PayoutInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("payouts").update(input).eq("id", id);
  if (error) throw error;
}

export async function deletePayout(row: Payout): Promise<void> {
  const supabase = createClient();
  if (row.receipt_path) {
    await supabase.storage.from(BUCKET).remove([row.receipt_path]);
  }
  const { error } = await supabase.from("payouts").delete().eq("id", row.id);
  if (error) throw error;
}

// ---------- Receipt storage ----------

export async function uploadReceipt(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/pdf",
  });
  if (error) throw error;
  return path;
}

export async function getReceiptUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) throw error;
  return data.signedUrl;
}

export async function removeReceipt(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
