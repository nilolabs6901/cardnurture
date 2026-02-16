'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Target, Loader2 } from 'lucide-react';
import ProspectCard from './ProspectCard';

interface ProspectPipelineProps {
  prospects: any[];
  contactId: string;
  isResearching?: boolean;
  onResearch: () => void;
}

export default function ProspectPipeline({
  prospects: initialProspects,
  contactId,
  isResearching = false,
  onResearch,
}: ProspectPipelineProps) {
  const [prospects, setProspects] = useState(initialProspects);

  // Sync internal state when parent passes new prospects
  useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  const handleStatusChange = useCallback(
    async (prospectId: string, newStatus: string) => {
      // Optimistic update
      setProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId ? { ...p, status: newStatus } : p
        )
      );

      try {
        const res = await fetch(`/api/prospects/${prospectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          // Revert on failure
          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospectId
                ? { ...p, status: initialProspects.find((ip) => ip.id === prospectId)?.status || 'new' }
                : p
            )
          );
        }
      } catch {
        // Revert on error
        setProspects((prev) =>
          prev.map((p) =>
            p.id === prospectId
              ? { ...p, status: initialProspects.find((ip) => ip.id === prospectId)?.status || 'new' }
              : p
          )
        );
      }
    },
    [initialProspects]
  );

  const handleConvert = useCallback(
    async (prospectId: string) => {
      try {
        const res = await fetch(`/api/prospects/${prospectId}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          setProspects((prev) =>
            prev.map((p) =>
              p.id === prospectId
                ? { ...p, status: 'converted', convertedContactId: data.contactId }
                : p
            )
          );
        }
      } catch {
        // Silently fail, user can retry
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Supply Chain Prospects
          </h3>
          {prospects.length > 0 && (
            <span className="bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] text-xs font-medium px-2 py-0.5 rounded-full">
              {prospects.length}
            </span>
          )}
        </div>
        <button
          onClick={onResearch}
          disabled={isResearching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
        >
          {isResearching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
          Research
        </button>
      </div>

      {/* Researching State */}
      {isResearching && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] text-sm">
          <Loader2 size={16} className="animate-spin" />
          Researching supply chain...
        </div>
      )}

      {/* Empty State */}
      {!isResearching && prospects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
            <Target size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No prospects yet
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Research this contact&apos;s supply chain to find Combilift opportunities
            </p>
          </div>
          <button
            onClick={onResearch}
            disabled={isResearching}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px]"
          >
            <Search size={16} />
            Research Supply Chain
          </button>
        </div>
      )}

      {/* Prospect Cards Grid */}
      {prospects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prospects.map((prospect, index) => (
            <div
              key={prospect.id}
              className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
              style={{ animationFillMode: 'both' }}
            >
              <ProspectCard
                prospect={prospect}
                onStatusChange={handleStatusChange}
                onConvert={handleConvert}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
