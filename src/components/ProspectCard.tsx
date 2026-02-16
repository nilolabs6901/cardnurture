'use client';

import { useState } from 'react';
import { MapPin, UserPlus, ExternalLink } from 'lucide-react';
import CombiliftProductBadge from './CombiliftProductBadge';
import StatusBadge from './StatusBadge';

interface ProspectCardProps {
  prospect: any;
  onStatusChange: (id: string, status: string) => void;
  onConvert: (id: string) => void;
}

const relationshipColors: Record<string, { bg: string; text: string }> = {
  supplier: { bg: 'rgba(59, 130, 246, 0.12)', text: 'text-blue-400' },
  customer: { bg: 'rgba(16, 185, 129, 0.12)', text: 'text-emerald-400' },
  logistics_partner: { bg: 'rgba(168, 85, 247, 0.12)', text: 'text-purple-400' },
  distributor: { bg: 'rgba(245, 158, 11, 0.12)', text: 'text-amber-400' },
  sibling_facility: { bg: 'rgba(236, 72, 153, 0.12)', text: 'text-pink-400' },
  industry_peer: { bg: 'rgba(107, 114, 128, 0.12)', text: 'text-gray-400' },
};

function ConfidenceDots({ level }: { level: string }) {
  const filled =
    level === 'high' ? 3 : level === 'medium' ? 2 : 1;

  return (
    <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]">
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={`inline-block w-2 h-2 rounded-full ${
            dot <= filled
              ? 'bg-[var(--accent-orange)]'
              : 'bg-[var(--border-subtle)]'
          }`}
        />
      ))}
    </span>
  );
}

function RelationshipPill({ relationship }: { relationship: string }) {
  const colors = relationshipColors[relationship] || relationshipColors.industry_peer;
  const label = relationship.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colors.text}`}
      style={{ backgroundColor: colors.bg }}
    >
      {label}
    </span>
  );
}

export default function ProspectCard({
  prospect,
  onStatusChange,
  onConvert,
}: ProspectCardProps) {
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      await onConvert(prospect.id);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-subtle)] space-y-3 animate-fade-in-up">
      {/* Header: Company name + confidence */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-[var(--text-primary)] tracking-tight text-sm">
          {prospect.companyName}
        </h4>
        <ConfidenceDots level={prospect.confidence || 'medium'} />
      </div>

      {/* Relationship */}
      <div className="flex items-center gap-2 flex-wrap">
        <RelationshipPill relationship={prospect.relationship} />
        <StatusBadge status={prospect.status} type="prospect" />
      </div>

      {/* Location */}
      {prospect.location && (
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <MapPin size={14} className="text-[var(--text-tertiary)] shrink-0" />
          <span className="truncate">{prospect.location}</span>
        </div>
      )}

      {/* Why Combilift */}
      {prospect.combiliftProduct && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-tertiary)]">Combilift fit:</span>
          <CombiliftProductBadge product={prospect.combiliftProduct} />
        </div>
      )}

      {/* Combilift reasoning */}
      {prospect.combiliftFit && (
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-2">
          {prospect.combiliftFit}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
        {/* Status Dropdown */}
        <select
          value={prospect.status}
          onChange={(e) => onStatusChange(prospect.id, e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 appearance-none cursor-pointer flex-1 min-w-0"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="dismissed">Dismissed</option>
        </select>

        {/* Convert button or converted link */}
        {prospect.status === 'converted' && prospect.convertedContactId ? (
          <a
            href={`/contacts/${prospect.convertedContactId}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--accent-orange)] hover:bg-[var(--accent-orange-muted)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center"
          >
            <ExternalLink size={14} />
            View Contact
          </a>
        ) : prospect.status !== 'converted' ? (
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
          >
            <UserPlus size={14} />
            {isConverting ? 'Creating...' : 'Create Contact'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
