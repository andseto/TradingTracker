"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { useFocusMode } from "@/context/PrivacyContext";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { ReceiptLink } from "@/components/ui/ReceiptLink";
import { FilePicker } from "@/components/ui/FilePicker";
import { Field, TextInput, TextArea, SelectInput } from "@/components/ui/fields";
import {
  insertPayout, updatePayout, deletePayout, uploadReceipt, removeReceipt,
} from "@/lib/business";
import { FIRMS, PAYOUT_METHODS, PAYOUT_STATUSES, type Payout, type PayoutInput } from "@/types";
import { fmtMoneyFull, fmtDate, todayISO, toErrorMessage } from "@/lib/utils";

interface FormState {
  date: string;
  firm: string;
  customFirm: string;
  amount: string;
  method: string;
  status: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  date: todayISO(),
  firm: FIRMS[0],
  customFirm: "",
  amount: "",
  method: PAYOUT_METHODS[0],
  status: "Received",
  notes: "",
});

function formFromPayout(p: Payout): FormState {
  const known = (FIRMS as readonly string[]).includes(p.firm);
  return {
    date: p.date,
    firm: known ? p.firm : "Other",
    customFirm: known ? "" : p.firm,
    amount: String(p.amount),
    method: p.method ?? "",
    status: p.status,
    notes: p.notes ?? "",
  };
}

export function PayoutsContent() {
  const { userId, payouts, refresh, tablesMissing } = useBusiness();
  const { focusMode } = useFocusMode();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payout | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [dropExistingReceipt, setDropExistingReceipt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Payout | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filterFirm, setFilterFirm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const firms = useMemo(() => [...new Set(payouts.map((p) => p.firm))].sort(), [payouts]);

  const filtered = useMemo(
    () =>
      payouts.filter(
        (p) =>
          (!filterFirm || p.firm === filterFirm) &&
          (!filterStatus || p.status === filterStatus)
      ),
    [payouts, filterFirm, filterStatus]
  );

  const filteredTotal = filtered.reduce((s, p) => s + Number(p.amount), 0);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setFile(null);
    setDropExistingReceipt(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p: Payout) {
    setEditing(p);
    setForm(formFromPayout(p));
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

      const input: PayoutInput = {
        date: form.date,
        firm,
        amount,
        method: form.method || null,
        status: form.status,
        notes: form.notes.trim() || null,
        receipt_path,
        receipt_name,
      };

      if (editing) await updatePayout(editing.id, input);
      else await insertPayout(userId, input);

      await refresh();
      setModalOpen(false);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save payout."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deletePayout(confirmDelete);
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
          options={PAYOUT_STATUSES}
          placeholder="All statuses"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="!w-auto min-w-[130px]"
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: "var(--text-2)" }}>
            {filtered.length} · {fmtMoneyFull(filteredTotal, focusMode)}
          </span>
          <button
            onClick={openAdd}
            disabled={tablesMissing}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-900 text-xs font-medium rounded-lg px-3 py-2 btn-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Payout
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
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Proof</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs" style={{ color: "var(--text-3)" }}>
                    {payouts.length === 0
                      ? "No payouts yet. Log your first one — that's the fun part."
                      : "Nothing matches these filters."}
                  </td>
                </tr>
              )}
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-[#17171c] transition-colors anim-fade-up"
                  style={{ borderColor: "var(--c-border)", animationDelay: `${Math.min(i * 0.03, 0.35)}s` }}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: "var(--text-2)" }}>
                    {fmtDate(p.date)}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-1)" }}>{p.firm}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-2)" }}>{p.method ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge value={p.status} /></td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-400 whitespace-nowrap">
                    +{fmtMoneyFull(Number(p.amount), focusMode)}
                  </td>
                  <td className="px-4 py-2.5">
                    {p.receipt_path ? <ReceiptLink path={p.receipt_path} name={p.receipt_name} /> : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate text-xs" style={{ color: "var(--text-3)" }} title={p.notes ?? undefined}>
                    {p.notes ?? ""}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right">
                    <button onClick={() => openEdit(p)} className="text-[#55556a] hover:text-amber-400 p-1 transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(p)} className="text-[#55556a] hover:text-red-400 p-1 transition-colors" title="Delete">
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
      <Modal open={modalOpen} title={editing ? "Edit Payout" : "Log Payout"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <TextInput type="date" value={form.date} required onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Amount (USD)">
              <TextInput
                type="number" step="0.01" min="0" placeholder="2000.00" required
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
            <Field label="Method">
              <SelectInput options={PAYOUT_METHODS} placeholder="—" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
            </Field>
            <Field label="Status">
              <SelectInput options={PAYOUT_STATUSES} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </Field>
          </div>

          <Field label="Notes">
            <TextArea rows={2} placeholder="Account, split %, anything worth remembering…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <Field label="Proof / receipt">
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
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-900 text-xs font-medium rounded-lg px-4 py-2 btn-glow">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? "Save Changes" : "Log Payout"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} title="Delete payout?" onClose={() => setConfirmDelete(null)}>
        <p className="text-xs mb-4" style={{ color: "var(--text-2)" }}>
          This removes the payout{confirmDelete?.receipt_path ? " and its attached proof" : ""} permanently.
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
