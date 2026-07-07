"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getReceiptUrl } from "@/lib/business";

// Opens the private receipt in a new tab via a short-lived signed URL.
export function ReceiptLink({ path, name }: { path: string; name?: string | null }) {
  const [loading, setLoading] = useState(false);

  async function open() {
    if (loading) return;
    setLoading(true);
    try {
      const url = await getReceiptUrl(path);
      window.open(url, "_blank", "noopener");
    } catch {
      alert("Could not open receipt. Check that the storage bucket is set up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={open}
      title={name ?? "View receipt"}
      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
      <span className="hidden lg:inline">View</span>
    </button>
  );
}
