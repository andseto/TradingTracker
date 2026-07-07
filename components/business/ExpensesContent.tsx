"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, FileSpreadsheet } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { ReceiptLink } from "@/components/ui/ReceiptLink";
import { FilePicker } from "@/components/ui/FilePicker";
import { Field, TextInput, TextArea, SelectInput } from "@/components/ui/fields";
import {
  insertExpense, updateExpense, deleteExpense, uploadReceipt, removeReceipt,
} from "@/lib/business";
import { exportExpensesToExcel } from "@/lib/export";
import { DotSelector } from "@/components/ui/DotSelector";
import { FIRMS, EXPENSE_TYPES, OUTCOMES, type Expense, type ExpenseInput } from "@/types";
import { fmtMoneyFull, fmtDate, todayISO, toErrorMessage } from "@/lib/utils";

interface FormState {
  date: string;
  firm: string;       // selected dropdown value ("Other" allowed)
  customFirm: string; // used when firm === "Other"
  expense_type: string;
  outcome: string;
  amount: string;
  notes: string;
  winningDays: number;
}

const emptyForm = (): FormState => ({
  date: todayISO(),
  firm: FIRMS[0],
  customFirm: "",
  expense_type: EXPENSE_TYPES[0],
  outcome: "In Progress",
  amount: "",
  notes: "",
  winningDays: 0,
});

function formFromExpense(e: Expense): FormState {
  const known = (FIRMS as readonly string[]).includes(e.firm);
  return {
    date: e.date,
    firm: known ? e.firm : "Other",
    customFirm: known ? "" : e.firm,
    expense_type: e.expense_type,
    outcome: e.outcome ?? "",
    amount: String(e.amount),
    notes: e.notes ?? "",
    winningDays: e.winning_days ?? 0,
  };
}

const WINNING_DAYS_OUTCOMES = new Set(["Passed", "Payout Received"]);

export function ExpensesContent() {
  const { userId, expenses, refresh, tablesMissing } = useBusiness();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [dropExistingReceipt, setDropExistingReceipt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterFirm, setFilterFirm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");

  const firms = useMemo(() => {
    const set = new Set(expenses.map((e) => e.firm));
    return [...set].sort();
  }, [expenses]);

  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!filterFirm || e.firm === filterFirm) &&
          (!filterType || e.expense_type === filterType) &&
          (!filterOutcome || e.outcome === filterOutcome)
      ),
    [expenses, filterFirm, filterType, filterOutcome]
  );

  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setFile(null);
    setDropExistingReceipt(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm(formFromExpense(e));
    setFile(null);
    setDropExistingReceipt(false);
    setError("");
    setModalOpen(true);
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) { setError("Enter a valid amount."); return; }
    const firm = form.firm === "Other" ? form.customFirm.trim() || "Other" : form.firm;

    setSaving(true);
    try {
      let receipt_path = editing?.receipt_path ?? null;
      let receipt_name = editing?.receipt_name ?? null;

      if (file) {
        if (editing?.receipt_path) await removeReceipt(editing.receipt_path);
        receipt_path = await uploadReceipt(userId, file);
        receipt_name = file.name;
      } else if (dropExistingReceipt && editing?.receipt_path) {
        await removeReceipt(editing.receipt_path);
        receipt_path = null;
        receipt_name = null;
      }

      const input: ExpenseInput = {
        date: form.date,
        firm,
        expense_type: form.expense_type,
        outcome: form.outcome || null,
        amount,
        notes: form.notes.trim() || null,
        receipt_path,
        receipt_name,
        winning_days: WINNING_DAYS_OUTCOMES.has(form.outcome) && form.winningDays > 0 ? form.winningDays : null,
      };

      if (editing) await updateExpense(editing.id, input);
      else await insertExpense(userId, input);

      await refresh();
      setModalOpen(false);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save expense."));
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (exporting || filtered.length === 0) return;
    setExporting(true);
    try {
      await exportExpensesToExcel(filtered);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteExpense(confirmDelete);
      await refresh();
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SelectInput
          options={firms}
          placeholder="All firms"
          value={filterFirm}
          onChange={(e) => setFilterFirm(e.target.value)}
          className="!w-auto min-w-[140px]"
        />
        <SelectInput
          options={EXPENSE_TYPES}
          placeholder="All types"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="!w-auto min-w-[130px]"
        />
        <SelectInput
          options={OUTCOMES}
          placeholder="All outcomes"
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value)}
          className="!w-auto min-w-[140px]"
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: "var(--text-2)" }}>
            {filtered.length} · {fmtMoneyFull(filteredTotal)}
          </span>
          <button
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            title="Download the rows below (respects filters) as an Excel file"
            className="flex items-center gap-1.5 border border-[#2a2a35] text-[#9090a8] hover:text-[#e8e8f0] hover:border-[#3a3a48] disabled:opacity-50 text-xs font-medium rounded-lg px-3 py-2 transition-colors"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Export Excel
          </button>
          <button
            onClick={openAdd}
            disabled={tablesMissing}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-900 text-xs font-medium rounded-lg px-3 py-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Firm</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Winning Days</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-xs" style={{ color: "var(--text-3)" }}>
                    {expenses.length === 0
                      ? "No expenses yet. Log your first eval purchase."
                      : "Nothing matches these filters."}
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="border-t hover:bg-[#17171c] transition-colors" style={{ borderColor: "var(--c-border)" }}>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: "var(--text-2)" }}>
                    {fmtDate(e.date)}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-1)" }}>{e.firm}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-2)" }}>{e.expense_type}</td>
                  <td className="px-4 py-2.5">{e.outcome ? <Badge value={e.outcome} /> : <span style={{ color: "var(--text-3)" }}>—</span>}</td>
                  <td className="px-4 py-2.5">
                    {e.winning_days ? <DotSelector value={e.winning_days} readOnly /> : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-400 whitespace-nowrap">
                    −{fmtMoneyFull(Number(e.amount))}
                  </td>
                  <td className="px-4 py-2.5">
                    {e.receipt_path ? <ReceiptLink path={e.receipt_path} name={e.receipt_name} /> : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate text-xs" style={{ color: "var(--text-3)" }} title={e.notes ?? undefined}>
                    {e.notes ?? ""}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right">
                    <button onClick={() => openEdit(e)} className="text-[#55556a] hover:text-amber-400 p-1 transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(e)} className="text-[#55556a] hover:text-red-400 p-1 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} title={editing ? "Edit Expense" : "Log Expense"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <TextInput type="date" value={form.date} required onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Amount (USD)">
              <TextInput
                type="number" step="0.01" min="0" placeholder="149.00" required
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Firm">
            <SelectInput options={FIRMS} value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} />
          </Field>
          {form.firm === "Other" && (
            <Field label="Firm name">
              <TextInput placeholder="Firm name" value={form.customFirm} onChange={(e) => setForm({ ...form, customFirm: e.target.value })} />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Expense type">
              <SelectInput options={EXPENSE_TYPES} value={form.expense_type} onChange={(e) => setForm({ ...form, expense_type: e.target.value })} />
            </Field>
            <Field label="Outcome">
              <SelectInput options={OUTCOMES} placeholder="—" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
            </Field>
          </div>

          {WINNING_DAYS_OUTCOMES.has(form.outcome) && (
            <Field label="Winning days before payout">
              <div className="flex items-center gap-3">
                <DotSelector value={form.winningDays} onChange={(v) => setForm({ ...form, winningDays: v })} />
                <span className="text-xs font-mono" style={{ color: "var(--text-3)" }}>
                  {form.winningDays > 0 ? `${form.winningDays}/5` : "not set"}
                </span>
              </div>
            </Field>
          )}

          <Field label="Notes">
            <TextArea rows={2} placeholder="Account size, promo code, anything worth remembering…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <Field label="Receipt">
            <FilePicker
              file={file}
              existingName={dropExistingReceipt ? null : editing?.receipt_name}
              onChange={setFile}
              onRemoveExisting={() => setDropExistingReceipt(true)}
            />
          </Field>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="text-xs font-medium border border-[#2a2a35] text-[#9090a8] hover:text-[#e8e8f0] rounded-lg px-3 py-2 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-900 text-xs font-medium rounded-lg px-4 py-2 transition-colors">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? "Save Changes" : "Log Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} title="Delete expense?" onClose={() => setConfirmDelete(null)}>
        <p className="text-xs mb-4" style={{ color: "var(--text-2)" }}>
          This removes the expense{confirmDelete?.receipt_path ? " and its attached receipt" : ""} permanently.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(null)} className="text-xs font-medium border border-[#2a2a35] text-[#9090a8] hover:text-[#e8e8f0] rounded-lg px-3 py-2 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors">
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
