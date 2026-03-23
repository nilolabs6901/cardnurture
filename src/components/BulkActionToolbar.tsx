'use client';

import { useState } from 'react';
import { Trash2, Zap, Download, X } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onToggleNurture: (enabled: boolean) => void;
  onExport: () => void;
  onClear: () => void;
}

export default function BulkActionToolbar({
  selectedCount,
  onDelete,
  onToggleNurture,
  onExport,
  onClear,
}: BulkActionToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in-up">
            <h3 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)] mb-2">
              Delete {selectedCount} contact{selectedCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This action cannot be undone. All associated email drafts and prospect data will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all duration-150 active:scale-[0.98] min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-2 animate-fade-in-up">
        <span className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap px-1">
          {selectedCount} selected
        </span>

        <div className="w-px h-5 bg-[var(--border-subtle)]" />

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150 active:scale-[0.98] min-h-[36px]"
          title="Delete selected"
        >
          <Trash2 size={15} />
          <span className="hidden sm:inline">Delete</span>
        </button>

        <button
          onClick={() => onToggleNurture(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-orange)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
          title="Enable nurture"
        >
          <Zap size={15} />
          <span className="hidden sm:inline">Nurture On</span>
        </button>

        <button
          onClick={() => onToggleNurture(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
          title="Disable nurture"
        >
          <Zap size={15} className="opacity-50" />
          <span className="hidden sm:inline">Nurture Off</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
          title="Export selected"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div className="w-px h-5 bg-[var(--border-subtle)]" />

        <button
          onClick={onClear}
          className="flex items-center justify-center p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px] min-w-[36px]"
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>
    </>
  );
}
