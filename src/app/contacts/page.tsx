'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Download, List, Users } from 'lucide-react';
import PersonalityBadge from '@/components/PersonalityBadge';
import StatTileRow from '@/components/StatTileRow';

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
  needsReview: boolean;
  createdAt: string;
  _count: {
    emailDrafts: number;
    prospects: number;
  };
}

type FilterTab = 'all' | 'needs-review' | 'active-nurture';

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

  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter === 'needs-review' ? 'needs-review' : 'all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch {
      // silent fail -- contacts will be empty
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
  }, [contacts, activeFilter, searchQuery]);

  // Tabs config
  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'needs-review', label: 'Needs Review', count: needsReviewCount },
    { key: 'active-nurture', label: 'Active Nurture' },
  ];

  function handleExport() {
    window.open('/api/contacts/export?format=csv', '_blank');
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

      {/* Empty state */}
      {!isLoading && contacts.length === 0 && <EmptyState />}

      {/* No search results */}
      {!isLoading && contacts.length > 0 && filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-secondary)]">No contacts match your search.</p>
        </div>
      )}

      {/* Mobile: Contact cards */}
      {!isLoading && filteredContacts.length > 0 && (
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
                </div>
                <PersonalityBadge type={contact.personalityType} size="sm" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Desktop: Table */}
      {!isLoading && filteredContacts.length > 0 && (
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
                  <td className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      onClick={(e) => e.stopPropagation()}
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
                    <PersonalityBadge type={contact.personalityType} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <NurtureStatusDot enabled={contact.nurtureEnabled} />
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
    </div>
  );
}
