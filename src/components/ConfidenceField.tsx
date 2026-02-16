'use client';

import { AlertTriangle } from 'lucide-react';

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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-[var(--bg-elevated)] border rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full ${
          isLowConfidence
            ? 'border-[var(--status-warning)] bg-yellow-500/5 focus:border-[var(--status-warning)] focus:ring-1 focus:ring-[var(--status-warning)]'
            : 'border-[var(--border-subtle)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]'
        }`}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}
