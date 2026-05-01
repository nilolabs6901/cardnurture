'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Download, List, Users, AlertCircle } from 'lucide-react';
import PersonalityBadge from '@/components/PersonalityBadge';
import StatTileRow from '@/components/StatTileRow';
import BulkActionToolbar from '@/components/BulkActionToolbar';

/* ─── Types ─── */

interface ContactRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  personalityType: string;
  personalitySummary: string | null;
  nurtureEnabled: boolean;
  nurtureInterval: number;
  nurtureTopic: string;
  salesStage: string;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    emailDrafts: number;
    prospects: number;
  };
}

type FilterTab = 'all' | 'needs-review' | 'active-nurture' | 'pipeline';

/* ─── Nurture Status Dot ─── */

function NurtureStatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        enabled ? 'bg-[var(--status-success)]' : 'bg-[var(--text-tertiary)]'
      }`}
    />
  );
}

/* ─── Nurture Info Pill ─── */

function NurtureInfoPill({ enabled, interval, topic }: { enabled: boolean; interval: number; topic: string }) {
  if (!enabled) {
    return (
      <span className="text-xs text-[var(--text-tertiary)]">Off</span>
    );
  }

  const topicShort = topic === 'Auto' ? 'Auto' : topic.split(' ')[0];

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
      <span className="text-[var(--text-secondary)]">
        {interval}d
      </span>
      <span className="text-[var(--text-tertiary)]">&middot;</span>
      <span className="text-[var(--text-tertiary)] truncate max-w-[80px]">
        {topicShort}
      </span>
    </span>
  );
}

/* ─── Sales Stage Pill ─── */

const STAGE_COLORS: Record<string, string> = {
  Lead: 'bg-blue-500/10 text-blue-500',
  Contacted: 'bg-cyan-500/10 text-cyan-500',
  'Demo Scheduled': 'bg-purple-500/10 text-purple-500',
  'Proposal Sent': 'bg-amber-500/10 text-amber-500',
  'Closed Won': 'bg-green-500/10 text-green-500',
  'Closed Lost': 'bg-red-500/10 text-red-400',
};

function SalesStagePill({ stage }: { stage: string }) {
  const colors = STAGE_COLORS[stage] || 'bg-gray-500/10 text-gray-500';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colors}`}>
      {stage}
    </span>
  );
}

/* ─── Days Since Indicator ─── */

function DaysSinceCreated({ dateStr }: { dateStr: string }) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 7) return null;

  const isStale = days > 30;

  return (
    <span
      className={`text-xs ${isStale ? 'text-[var(--status-warning)]' : 'text-[var(--text-tertiary)]'}`}
      title={`Added ${days} days ago`}
    >
      {days}d ago
    </span>
  );
}

/* ─── Empty State ─── */

function EmptyState() {
  const router = useRouter();

  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
        <Users size={28} className="text-[var(--text-tertiary)]" />
      </div>
      <h3 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)] mb-2">
        No contacts yet
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
        Scan a business card to add your first contact and start building your pipeline.
      </p>
      <button
        onClick={() => router.push('/upload')}
        className="bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-6 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98]"
      >
        Scan a Card
      </button>
    </div>
  );
}

/* ─── Error State ─── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--status-warning-muted,var(--bg-elevated))] flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-[var(--status-warning)]" />
      </div>
      <h3 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)] mb-2">
        Couldn&apos;t load contacts
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
        Something went wrong reaching the server. Your contacts are safe — please try again in a moment.
      </p>
      <button
        onClick={onRetry}
        className="bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-6 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98]"
      >
        Retry
      </button>
    </div>
  );
}

/* ─── Contacts Page ─── */

export default function ContactsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>}>
      <ContactsPage />
    </Suspense>
  );
}

function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') as FilterTab | null;
  const personalityFilter = searchParams.get('personality');

  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter === 'needs-review' ? 'needs-review' : 'all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = await res.json();
      setContacts(data);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Clear selection when filter or search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeFilter, searchQuery]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    const allFilteredIds = filteredContacts.map((c) => c.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  }

  // Stats
  const totalContacts = contacts.length;
  const activeNurtureCount = contacts.filter((c) => c.nurtureEnabled).length;
  const totalProspects = contacts.reduce((sum, c) => sum + c._count.prospects, 0);
  const needsReviewCount = contacts.filter((c) => c.needsReview).length;

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Filter by tab
    if (activeFilter === 'needs-review') {
      result = result.filter((c) => c.needsReview);
    } else if (activeFilter === 'active-nurture') {
      result = result.filter((c) => c.nurtureEnabled);
    } else if (activeFilter === 'pipeline') {
      result = result.filter(
        (c) => c.salesStage && c.salesStage !== 'Lead' && c.salesStage !== 'Closed Won' && c.salesStage !== 'Closed Lost'
      );
    }

    // Filter by personality query param
    if (personalityFilter) {
      result = result.filter((c) => c.personalityType === personalityFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [contacts, activeFilter, searchQuery, personalityFilter]);

  const pipelineCount = contacts.filter((c) =>
    c.salesStage && c.salesStage !== 'Lead' && c.salesStage !== 'Closed Won' && c.salesStage !== 'Closed Lost'
  ).length;

  // Tabs config
  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pipeline', label: 'In Pipeline', count: pipelineCount },
    { key: 'needs-review', label: 'Needs Review', count: needsReviewCount },
    { key: 'active-nurture', label: 'Active Nurture' },
  ];

  function handleExport() {
    window.open('/api/contacts/export?format=csv', '_blank');
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch('/api/contacts/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
      }
    } catch {
      // silent fail
    }
  }

  async function handleBulkToggleNurture(enabled: boolean) {
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch('/api/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, nurtureEnabled: enabled }),
      });
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            selectedIds.has(c.id) ? { ...c, nurtureEnabled: enabled } : c
          )
        );
        setSelectedIds(new Set());
      }
    } catch {
      // silent fail
    }
  }

  function handleBulkExport() {
    const ids = Array.from(selectedIds).join(',');
    window.open(`/api/contacts/export?format=csv&ids=${ids}`, '_blank');
  }

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)]">
          Contacts
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center"
            title="Export CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => router.push('/contacts/reference')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] justify-center"
            title="Reference Sheet"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <StatTileRow
        totalContacts={totalContacts}
        activeNurture={activeNurtureCount}
        pipelineProspects={totalProspects}
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
        />
      </div>

      {/* Personality filter banner */}
      {personalityFilter && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[var(--accent-orange-muted)] rounded-xl text-sm">
          <span className="text-[var(--text-primary)]">Filtered by: {personalityFilter}</span>
          <button
            onClick={() => router.replace('/contacts')}
            className="text-[var(--accent-orange)] hover:underline text-xs"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] min-h-[36px] ${
                isActive
                  ? 'bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] border border-[var(--accent-orange)]'
                  : 'bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-semibold px-1 ${
                    isActive
                      ? 'bg-[var(--accent-orange)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded" />
                  <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && loadError && <ErrorState onRetry={fetchContacts} />}

      {/* Empty state */}
      {!isLoading && !loadError && contacts.length === 0 && <EmptyState />}

      {/* No search results */}
      {!isLoading && !loadError && contacts.length > 0 && filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-secondary)]">No contacts match your search.</p>
        </div>
      )}

      {/* Mobile: Contact cards */}
      {!isLoading && !loadError && filteredContacts.length > 0 && (
        <div className="md:hidden space-y-2">
          {filteredContacts.map((contact, index) => (
            <button
              key={contact.id}
              onClick={() => router.push(`/contacts/${contact.id}`)}
              className={`relative w-full text-left bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 transition-all duration-150 active:scale-[0.98] hover:bg-[var(--bg-surface-hover)] animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
              style={{ animationFillMode: 'both' }}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(contact.id)}
                onChange={() => toggleSelect(contact.id)}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 right-3 accent-[var(--accent-orange)] w-4 h-4 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-3 pr-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[var(--text-primary)] truncate">
                      {contact.name}
                    </p>
                    <NurtureStatusDot enabled={contact.nurtureEnabled} />
                  </div>
                  {contact.company && (
                    <p className="text-[var(--text-secondary)] text-sm truncate">
                      {contact.company}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <SalesStagePill stage={contact.salesStage || 'Lead'} />
                    <NurtureInfoPill enabled={contact.nurtureEnabled} interval={contact.nurtureInterval} topic={contact.nurtureTopic} />
                    <DaysSinceCreated dateStr={contact.createdAt} />
                  </div>
                </div>
                <PersonalityBadge type={contact.personalityType} size="sm" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Desktop: Table */}
      {!isLoading && !loadError && filteredContacts.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id))}
                    onChange={toggleSelectAll}
                    className="accent-[var(--accent-orange)] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Name
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Company
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Email
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Stage
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Personality
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Nurture
                </th>
                <th className="text-left text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Last Draft
                </th>
                <th className="text-right text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium py-3 px-3">
                  Prospects
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                  className="border-b border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <td className="py-3 px-3 w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="accent-[var(--accent-orange)] w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">
                      {contact.name}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {contact.company || '--'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {contact.email || '--'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <SalesStagePill stage={contact.salesStage || 'Lead'} />
                  </td>
                  <td className="py-3 px-3">
                    <PersonalityBadge type={contact.personalityType} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <NurtureInfoPill enabled={contact.nurtureEnabled} interval={contact.nurtureInterval} topic={contact.nurtureTopic} />
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-[var(--text-tertiary)]">
                      {contact._count.emailDrafts > 0
                        ? `${contact._count.emailDrafts} draft${contact._count.emailDrafts !== 1 ? 's' : ''}`
                        : '--'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {contact._count.prospects}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk action toolbar */}
      <BulkActionToolbar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onToggleNurture={handleBulkToggleNurture}
        onExport={handleBulkExport}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
