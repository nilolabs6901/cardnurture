'use client';

interface StatusBadgeProps {
  status: string;
  type?: 'draft' | 'prospect';
}

const draftStatusStyles: Record<string, { dot: string; text: string; label: string }> = {
  draft: {
    dot: 'bg-gray-400',
    text: 'text-gray-400',
    label: 'Draft',
  },
  sent: {
    dot: 'bg-[var(--status-success)]',
    text: 'text-[var(--status-success)]',
    label: 'Sent',
  },
  archived: {
    dot: 'bg-[var(--text-tertiary)]',
    text: 'text-[var(--text-tertiary)]',
    label: 'Archived',
  },
};

const prospectStatusStyles: Record<string, { dot: string; text: string; label: string }> = {
  new: {
    dot: 'bg-[var(--status-info)]',
    text: 'text-[var(--status-info)]',
    label: 'New',
  },
  contacted: {
    dot: 'bg-[var(--accent-orange)]',
    text: 'text-[var(--accent-orange)]',
    label: 'Contacted',
  },
  converted: {
    dot: 'bg-[var(--status-success)]',
    text: 'text-[var(--status-success)]',
    label: 'Converted',
  },
  dismissed: {
    dot: 'bg-[var(--status-error)]',
    text: 'text-[var(--status-error)]',
    label: 'Dismissed',
  },
};

export default function StatusBadge({ status, type = 'draft' }: StatusBadgeProps) {
  const styles =
    type === 'prospect'
      ? prospectStatusStyles[status] || prospectStatusStyles.new
      : draftStatusStyles[status] || draftStatusStyles.draft;

  return (
    <span className={`flex items-center gap-1.5 text-xs ${styles.text}`}>
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
}
