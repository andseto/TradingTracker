"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  // Portal target only exists in the browser; skip the first (SSR) render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Portal to <body>: ancestors with a retained CSS transform (e.g. the
  // page-entrance animation wrapper) would otherwise become the containing
  // block for position:fixed and push the modal off-screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl border p-5 shadow-2xl anim-scale-in"
        style={{ background: "var(--bg-surface)", borderColor: "var(--c-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-[#55556a] hover:text-[#e8e8f0] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
