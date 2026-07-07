"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";

interface FilePickerProps {
  file: File | null;
  existingName?: string | null;
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
}

// Receipt attachment control: pick a PDF or image, show the chosen/existing file.
export function FilePicker({ file, existingName, onChange, onRemoveExisting }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center gap-2 bg-[#0d0d0f] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm text-[#e8e8f0]">
          <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate flex-1 text-xs">{file.name}</span>
          <button type="button" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }} className="text-[#55556a] hover:text-[#e8e8f0]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : existingName ? (
        <div className="flex items-center gap-2 bg-[#0d0d0f] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm">
          <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate flex-1 text-xs text-[#9090a8]">{existingName}</span>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0">
            Replace
          </button>
          {onRemoveExisting && (
            <button type="button" onClick={onRemoveExisting} className="text-[#55556a] hover:text-red-400 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-[#0d0d0f] border border-dashed border-[#2a2a35] hover:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-[#9090a8] hover:text-[#e8e8f0] transition-colors"
        >
          <Paperclip className="w-3.5 h-3.5" />
          Attach receipt (PDF or image)
        </button>
      )}
    </div>
  );
}
