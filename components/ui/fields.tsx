"use client";

import { cn } from "@/lib/utils";

const inputClass =
  "w-full bg-[#0d0d0f] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] placeholder:text-[#55556a] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition";

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[#9090a8] mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cn(inputClass, className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cn(inputClass, "resize-none", className)} />;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly string[];
  placeholder?: string;
}

export function SelectInput({ options, placeholder, className, ...rest }: SelectInputProps) {
  return (
    <select {...rest} className={cn(inputClass, "appearance-none cursor-pointer", className)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
