'use client';

import { Brain, RefreshCw } from 'lucide-react';
import PersonalityBadge from './PersonalityBadge';
import { PERSONALITY_TYPES } from '@/types';

interface PersonalityCardProps {
  personalityType: string;
  confidence: string;
  summary: string | null;
  isLoading?: boolean;
  onOverride?: (type: string) => void;
  onReresearch?: () => void;
  isReresearching?: boolean;
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-24 bg-[var(--bg-elevated)] rounded-full" />
      <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-4/5 bg-[var(--bg-elevated)] rounded" />
        <div className="h-3 w-3/5 bg-[var(--bg-elevated)] rounded" />
      </div>
    </div>
  );
}

export default function PersonalityCard({
  personalityType,
  confidence,
  summary,
  isLoading = false,
  onOverride,
  onReresearch,
  isReresearching = false,
}: PersonalityCardProps) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Personality Profile
          </h3>
        </div>
        {onReresearch && (
          <button
            onClick={onReresearch}
            disabled={isReresearching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isReresearching ? 'animate-spin' : ''}
            />
            Re-research
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-4">
          {/* Badge + Confidence */}
          <div className="flex items-center gap-3">
            <PersonalityBadge type={personalityType} size="lg" />
            <span className="text-xs text-[var(--text-tertiary)]">
              {confidence} confidence
            </span>
          </div>

          {/* Summary */}
          {summary && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {summary}
            </p>
          )}

          {/* Override Dropdown */}
          {onOverride && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <label className="block text-xs text-[var(--text-tertiary)] mb-1.5">
                Override personality type
              </label>
              <select
                value={personalityType}
                onChange={(e) => onOverride(e.target.value)}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 w-full appearance-none cursor-pointer"
              >
                {PERSONALITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
