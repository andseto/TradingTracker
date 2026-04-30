"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { parseFidelityCSV } from "@/lib/csv-parser";
import { Trade } from "@/types";
import { cn } from "@/lib/utils";

interface ParseResult {
  trades: Trade[];
  filename: string;
  status: "success" | "error";
  message: string;
}

export default function ImportPage() {
  const { addTrades } = useDashboard();
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<ParseResult[]>([]);
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    const text = await file.text();
    try {
      const trades = parseFidelityCSV(text);
      if (trades.length === 0) {
        return { trades: [], filename: file.name, status: "error" as const, message: "No valid trades found. Make sure this is a Fidelity account history CSV." };
      }
      return { trades, filename: file.name, status: "success" as const, message: `Parsed ${trades.length} transactions` };
    } catch (e) {
      return { trades: [], filename: file.name, status: "error" as const, message: "Failed to parse file" };
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setProcessing(true);
    const arr = Array.from(files).filter((f) => f.name.endsWith(".csv"));
    const parsed = await Promise.all(arr.map(processFile));
    setResults((prev) => [...parsed, ...prev]);

    for (const r of parsed) {
      if (r.status === "success") addTrades(r.trades);
    }
    setProcessing(false);
  }, [processFile, addTrades]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#e8e8f0]">Import CSV</h1>
        <p className="text-sm text-[#9090a8] mt-1">
          Upload Fidelity account history CSV files. Go to{" "}
          <span className="text-indigo-400">Accounts &amp; Trade → Account History</span>{" "}
          on Fidelity and download as CSV.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 transition-colors cursor-pointer",
          dragging
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-[#2a2a35] hover:border-[#3a3a48] hover:bg-[#131316]"
        )}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#1a1a1f] border border-[#2a2a35] flex items-center justify-center">
          <Upload className={cn("w-6 h-6", dragging ? "text-indigo-400" : "text-[#55556a]")} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[#e8e8f0]">
            {processing ? "Processing..." : "Drop CSV files here"}
          </p>
          <p className="text-xs text-[#55556a] mt-1">or click to browse — Fidelity Account History format</p>
        </div>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Expected format */}
      <div className="mt-4 bg-[#131316] border border-[#2a2a35] rounded-xl p-4">
        <p className="text-xs font-medium text-[#9090a8] uppercase tracking-wide mb-2">Expected CSV columns</p>
        <code className="text-xs text-[#55556a] font-mono">
          Run Date, Action, Symbol, Security Description, Security Type, Quantity, Price ($), Commission ($), Amount ($)
        </code>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-medium text-[#9090a8] uppercase tracking-wide">Import Log</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                r.status === "success"
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}
            >
              {r.status === "success"
                ? <CheckCircle className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#55556a]" />
                  <span className="text-xs font-medium text-[#e8e8f0] truncate">{r.filename}</span>
                </div>
                <p className={cn("text-xs mt-0.5", r.status === "success" ? "text-[#9090a8]" : "text-[#ef4444]")}>
                  {r.message}
                </p>
              </div>
              <button
                onClick={() => setResults((prev) => prev.filter((_, j) => j !== i))}
                className="text-[#55556a] hover:text-[#9090a8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
