'use client';

import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react';

interface BatchItem {
  id: string;
  fileName: string;
  status: string;
  result?: any;
  error?: string;
}

interface BatchProcessingQueueProps {
  items: BatchItem[];
  totalCount: number;
  processedCount: number;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'queued':
      return <Clock size={16} className="text-[var(--text-tertiary)]" />;
    case 'processing':
      return <Loader2 size={16} className="text-[var(--accent-orange)] animate-spin" />;
    case 'extracted':
      return <CheckCircle2 size={16} className="text-[var(--status-success)]" />;
    case 'failed':
      return <XCircle size={16} className="text-[var(--status-error)]" />;
    default:
      return <Clock size={16} className="text-[var(--text-tertiary)]" />;
  }
}

export default function BatchProcessingQueue({
  items,
  totalCount,
  processedCount,
}: BatchProcessingQueueProps) {
  const progressPercent =
    totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full progress-shimmer rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Processing {processedCount} of {totalCount} card{totalCount !== 1 ? 's' : ''}...
        </p>
      </div>

      {/* Item List */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
            style={{ animationFillMode: 'both' }}
          >
            {/* Status Icon */}
            <StatusIcon status={item.status} />

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">
                {item.fileName}
              </p>

              {/* Extracted Preview */}
              {item.status === 'extracted' && item.result && (
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                  {item.result.fields?.name || 'Unknown'}{' '}
                  {item.result.fields?.company
                    ? `\u2022 ${item.result.fields.company}`
                    : ''}
                </p>
              )}

              {/* Error Message */}
              {item.status === 'failed' && item.error && (
                <p className="text-xs text-[var(--status-error)] mt-0.5">
                  {item.error}
                </p>
              )}
            </div>

            {/* Retry Button for failed items */}
            {item.status === 'failed' && (
              <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center">
                <RotateCcw size={12} />
                Retry
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
