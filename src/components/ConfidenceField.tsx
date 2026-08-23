'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfidenceFieldProps {
  label: string;
  value: string;
  confidence: string;
  onChange: (val: string) => void;
}

export default function ConfidenceField({
  label,
  value,
  confidence,
  onChange,
}: ConfidenceFieldProps) {
  const isLowConfidence = confidence === 'low' || confidence === 'none';

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] font-medium">
        {label}
        {isLowConfidence && (
          <AlertTriangle
            size={14}
            className="text-[var(--status-warning)]"
          />
        )}
      </label>
      {/* The clear button exists because OCR sometimes reads a card's artwork as
          a long run of junk. Wiping that by hand on a phone -- tap into the field,
          select all, delete -- is the slowest thing you can be doing with a
          prospect standing in front of you. One tap instead. */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-[var(--bg-elevated)] border rounded-xl pl-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full ${
            value ? 'pr-12' : 'pr-4'
          } ${
            isLowConfidence
              ? 'border-[var(--status-warning)] bg-yellow-500/5 focus:border-[var(--status-warning)] focus:ring-1 focus:ring-[var(--status-warning)]'
              : 'border-[var(--border-subtle)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]'
          }`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:scale-90 transition-all duration-150"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
