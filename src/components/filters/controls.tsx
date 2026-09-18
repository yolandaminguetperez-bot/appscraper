"use client";

import { cn } from "@/lib/cn";

export function CheckboxList({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div className="scroll-thin max-h-64 space-y-0.5 overflow-y-auto">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-muted"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="size-4 accent-[var(--accent)]"
          />
          <span className="truncate">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export function RadioList({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <div className="space-y-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-muted",
            value === opt.value && "bg-accent-soft text-accent-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function NumberField({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onCommit: (next: string | null) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-ink-muted">{label}</span>
      <input
        type="number"
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => onCommit(e.target.value.trim() || null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
      />
    </label>
  );
}
