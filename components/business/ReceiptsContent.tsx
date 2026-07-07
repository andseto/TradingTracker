"use client";

import { useMemo, useState } from "react";
import { FileText, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useBusiness } from "@/context/BusinessContext";
import { Card } from "@/components/ui/Card";
import { ReceiptLink } from "@/components/ui/ReceiptLink";
import { TextInput } from "@/components/ui/fields";
import { fmtMoneyFull, fmtDate } from "@/lib/utils";
import type { ReceiptDoc } from "@/types";

export function ReceiptsContent() {
  const { expenses, payouts } = useBusiness();
  const [query, setQuery] = useState("");

  const docs = useMemo<ReceiptDoc[]>(() => {
    const rows: ReceiptDoc[] = [];
    for (const e of expenses) {
      if (e.receipt_path) {
        rows.push({
          source: "expense",
          rowId: e.id,
          date: e.date,
          firm: e.firm,
          label: e.expense_type,
          amount: Number(e.amount),
          path: e.receipt_path,
          name: e.receipt_name ?? "receipt.pdf",
        });
      }
    }
    for (const p of payouts) {
      if (p.receipt_path) {
        rows.push({
          source: "payout",
          rowId: p.id,
          date: p.date,
          firm: p.firm,
          label: "Payout",
          amount: Number(p.amount),
          path: p.receipt_path,
          name: p.receipt_name ?? "receipt.pdf",
        });
      }
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, payouts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.firm.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q)
    );
  }, [docs, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#55556a]" />
          <TextInput
            placeholder="Search firm, type, filename…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-2)" }}>
          {filtered.length} document{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-1)" }}>
              {docs.length === 0 ? "No receipts uploaded yet" : "No matches"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              {docs.length === 0
                ? "Attach a PDF or image when logging an expense or payout and it'll show up here."
                : "Try a different search."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <Card key={`${d.source}-${d.rowId}`} className="!p-3.5">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  {d.source === "payout" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                    {d.firm}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                    {d.label} · {fmtDate(d.date)}
                  </div>
                  <div className="text-xs truncate font-mono mt-0.5" style={{ color: "var(--text-3)" }} title={d.name}>
                    {d.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--c-border)" }}>
                <span className={`font-mono text-sm ${d.source === "payout" ? "text-green-400" : "text-red-400"}`}>
                  {d.source === "payout" ? "+" : "−"}{fmtMoneyFull(d.amount)}
                </span>
                <ReceiptLink path={d.path} name={d.name} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
