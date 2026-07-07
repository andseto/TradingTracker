import type { Expense } from "@/types";

// Builds a formatted .xlsx of the given expenses and triggers a download.
// exceljs is imported lazily so it stays out of the main bundle.
export async function exportExpensesToExcel(expenses: Expense[]): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;

  const wb = new ExcelJS.Workbook();
  wb.creator = "SetoTrading Dashboard";
  wb.created = new Date();

  const ws = wb.addWorksheet("Expenses", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Firm", key: "firm", width: 24 },
    { header: "Expense Type", key: "expense_type", width: 18 },
    { header: "Outcome", key: "outcome", width: 16 },
    { header: "Amount", key: "amount", width: 14 },
    { header: "Notes", key: "notes", width: 40 },
    { header: "Receipt File", key: "receipt_name", width: 28 },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  header.alignment = { vertical: "middle" };
  header.height = 20;

  // Oldest first reads better in a ledger
  const rows = [...expenses].sort(
    (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)
  );

  for (const e of rows) {
    const [y, m, d] = e.date.split("-").map(Number);
    ws.addRow({
      date: new Date(Date.UTC(y, m - 1, d)),
      firm: e.firm,
      expense_type: e.expense_type,
      outcome: e.outcome ?? "",
      amount: Number(e.amount),
      notes: e.notes ?? "",
      receipt_name: e.receipt_name ?? "",
    });
  }

  ws.getColumn("date").numFmt = "yyyy-mm-dd";
  ws.getColumn("amount").numFmt = '"$"#,##0.00';

  // Totals row
  const totalRow = ws.addRow({
    outcome: "Total",
    amount: rows.reduce((s, e) => s + Number(e.amount), 0),
  });
  totalRow.font = { bold: true };
  totalRow.getCell("amount").numFmt = '"$"#,##0.00';
  totalRow.border = { top: { style: "thin" } };

  ws.autoFilter = { from: "A1", to: "G1" };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SetoTrading-Expenses-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
