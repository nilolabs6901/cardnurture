'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Zap,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import StatTileRow from '@/components/StatTileRow';
import PersonalityBadge from '@/components/PersonalityBadge';
import DraftEditor from '@/components/DraftEditor';
import { NURTURE_TOPICS } from '@/types/index';

/* ─── Types ─── */

interface NurtureContact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  personalityType: string;
  nurtureEnabled: boolean;
  nurtureInterval: number;
  nurtureTopic: string;
  lastDraftDate: string | null;
  daysSinceLastDraft: number | null;
  dueInDays: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  draftCount: number;
  researchSnippets: string | null;
}

interface NurtureSummary {
  totalContacts: number;
  activeNurture: number;
  dueSoon: number;
  overdue: number;
  totalProspects: number;
}

interface NurtureData {
  contacts: NurtureContact[];
  summary: NurtureSummary;
}

type GroupTab = 'interval' | 'topic' | 'due-soon';

/* ─── Helpers ─── */

function formatDaysAgo(dateStr: string | null): string {
  if (!dateStr) return 'No drafts';
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function intervalLabel(interval: number): string {
  if (interval === 30) return '30d';
  if (interval === 60) return '60d';
  if (interval === 90) return '90d';
  return `${interval}d`;
}

function dueLabel(dueInDays: number, nurtureEnabled: boolean): string {
  if (!nurtureEnabled) return 'Paused';
  if (dueInDays < 0) return `${Math.abs(dueInDays)}d overdue`;
  if (dueInDays === 0) return 'Due today';
  return `${dueInDays}d`;
}

function dueColorClass(
  dueInDays: number,
  isOverdue: boolean,
  isDueSoon: boolean,
  nurtureEnabled: boolean
): string {
  if (!nurtureEnabled) return 'text-[var(--text-tertiary)]';
  if (isOverdue) return 'text-red-400';
  if (isDueSoon) return 'text-orange-400';
  return 'text-[var(--text-tertiary)]';
}

/* ─── Page ─── */

export default function NurturePage() {
  const router = useRouter();
  const [data, setData] = useState<NurtureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groupTab, setGroupTab] = useState<GroupTab>('interval');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<any>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [bulkIntervalOpen, setBulkIntervalOpen] = useState(false);
  const [bulkTopicOpen, setBulkTopicOpen] = useState(false);

  useEffect(() => {
    fetchNurtureData();
  }, []);

  async function fetchNurtureData() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts/nurture-status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }

  const contacts = data?.contacts ?? [];
  const summary = data?.summary ?? {
    totalContacts: 0,
    activeNurture: 0,
    dueSoon: 0,
    overdue: 0,
    totalProspects: 0,
  };

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeContactId) ?? null,
    [contacts, activeContactId]
  );

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [groupTab]);

  /* ─── Selection ─── */

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* ─── Bulk actions ─── */

  async function bulkPatch(body: Record<string, unknown>) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, ...body }),
      });
      if (res.ok) {
        await fetchNurtureData();
        setSelectedIds(new Set());
      }
    } catch {
      // silent fail
    }
  }

  async function handleToggleNurture(id: string, currentEnabled: boolean) {
    try {
      const res = await fetch('/api/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [id],
          nurtureEnabled: !currentEnabled,
        }),
      });
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            contacts: prev.contacts.map((c) =>
              c.id === id ? { ...c, nurtureEnabled: !currentEnabled } : c
            ),
            summary: {
              ...prev.summary,
              activeNurture: prev.summary.activeNurture + (currentEnabled ? -1 : 1),
            },
          };
        });
      }
    } catch {
      // silent fail
    }
  }

  /* ─── Draft pane ─── */

  async function openDraftPane(contact: NurtureContact, mode: 'generate' | 'edit') {
    setActiveContactId(contact.id);
    setActiveDraft(null);
    setIsDraftLoading(true);
    setShowResearch(false);

    try {
      if (mode === 'generate') {
        const res = await fetch(`/api/contacts/${contact.id}/generate-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateType: 'follow-up' }),
        });
        if (res.ok) {
          const result = await res.json();
          // Fetch the created draft
          const draftRes = await fetch(`/api/contacts/${contact.id}`);
          if (draftRes.ok) {
            const contactData = await draftRes.json();
            const latestDraft = contactData.emailDrafts?.[0];
            if (latestDraft) {
              setActiveDraft(latestDraft);
            }
          }
        }
      } else {
        // Edit mode - fetch latest draft
        const res = await fetch(`/api/contacts/${contact.id}`);
        if (res.ok) {
          const contactData = await res.json();
          const latestDraft = contactData.emailDrafts?.[0];
          if (latestDraft) {
            setActiveDraft(latestDraft);
          }
        }
      }
    } catch {
      // silent fail
    } finally {
      setIsDraftLoading(false);
    }
  }

  function closeDraftPane() {
    setActiveContactId(null);
    setActiveDraft(null);
    fetchNurtureData(); // Refresh data after editing
  }

  const handleDraftSave = useCallback(
    async (saveData: any) => {
      if (!activeDraft?.id) return;
      try {
        await fetch(`/api/contacts/${activeContactId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId: activeDraft.id,
            ...saveData,
          }),
        });
      } catch {
        // silent fail
      }
    },
    [activeDraft, activeContactId]
  );

  const handleDraftRegenerate = useCallback(async () => {
    if (!activeContact) return;
    openDraftPane(activeContact, 'generate');
  }, [activeContact]);

  /* ─── Grouping ─── */

  const groupedByInterval = useMemo(() => {
    const groups: Record<string, NurtureContact[]> = {};
    for (const c of contacts) {
      const key =
        c.nurtureInterval === 30
          ? '30'
          : c.nurtureInterval === 60
            ? '60'
            : c.nurtureInterval === 90
              ? '90'
              : 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return groups;
  }, [contacts]);

  const groupedByTopic = useMemo(() => {
    const groups: Record<string, NurtureContact[]> = {};
    for (const c of contacts) {
      const key = c.nurtureTopic || 'Auto';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return groups;
  }, [contacts]);

  const dueSoonSorted = useMemo(() => {
    return [...contacts]
      .filter((c) => c.nurtureEnabled)
      .sort((a, b) => a.dueInDays - b.dueInDays);
  }, [contacts]);

  /* ─── Tabs config ─── */

  const groupTabs: { key: GroupTab; label: string }[] = [
    { key: 'interval', label: 'By Interval' },
    { key: 'topic', label: 'By Topic' },
    { key: 'due-soon', label: 'Due Soon' },
  ];

  const intervalGroupOrder = ['30', '60', '90', 'other'];
  const intervalGroupLabels: Record<string, string> = {
    '30': '30-Day Interval',
    '60': '60-Day Interval',
    '90': '90-Day Interval',
    other: 'Custom Interval',
  };

  /* ─── Contact Row ─── */

  function ContactRow({ contact }: { contact: NurtureContact }) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selectedIds.has(contact.id)}
          onChange={() => toggleSelect(contact.id)}
          className="accent-[var(--accent-orange)] w-4 h-4 cursor-pointer shrink-0"
        />

        {/* Nurture toggle */}
        <button
          onClick={() => handleToggleNurture(contact.id, contact.nurtureEnabled)}
          className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title={contact.nurtureEnabled ? 'Pause nurture' : 'Resume nurture'}
        >
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full transition-colors ${
              contact.nurtureEnabled
                ? 'bg-[var(--status-success)]'
                : 'bg-[var(--text-tertiary)]'
            }`}
          />
        </button>

        {/* Name / company / email */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
            {contact.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {contact.company || ''}{' '}
            {contact.email ? `· ${contact.email}` : ''}
          </p>
        </div>

        {/* Interval badge */}
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          {intervalLabel(contact.nurtureInterval)}
        </span>

        {/* Topic */}
        <span className="hidden sm:inline shrink-0 text-xs text-[var(--text-tertiary)] max-w-[120px] truncate">
          {contact.nurtureTopic}
        </span>

        {/* Last draft */}
        <span className="hidden md:inline shrink-0 text-xs text-[var(--text-tertiary)] w-[80px] text-right">
          {formatDaysAgo(contact.lastDraftDate)}
        </span>

        {/* Due in */}
        <span
          className={`shrink-0 text-xs font-medium w-[70px] text-right ${dueColorClass(
            contact.dueInDays,
            contact.isOverdue,
            contact.isDueSoon,
            contact.nurtureEnabled
          )}`}
        >
          {dueLabel(contact.dueInDays, contact.nurtureEnabled)}
        </span>

        {/* Generate/Edit Draft button */}
        <button
          onClick={() =>
            openDraftPane(
              contact,
              contact.draftCount > 0 ? 'edit' : 'generate'
            )
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-orange)] hover:bg-[var(--accent-orange-muted)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
        >
          <FileText size={13} />
          <span className="hidden sm:inline">
            {contact.draftCount > 0 ? 'Edit' : 'Generate'}
          </span>
        </button>
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push('/contacts')}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <h1 className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)]">
          Nurture Management
        </h1>
      </div>

      {/* Stat tiles */}
      <StatTileRow
        totalContacts={summary.totalContacts}
        activeNurture={summary.activeNurture}
        pipelineProspects={summary.totalProspects}
        activeTile="nurture"
      />

      {/* Summary bar */}
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] px-4 py-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[var(--status-success)]" />
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
              Active
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {summary.activeNurture}/{summary.totalContacts} contacts
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] px-4 py-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-orange-400" />
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
              Due Soon
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {summary.dueSoon} due in 7 days
          </p>
        </div>

        <div
          className={`bg-[var(--bg-surface)] rounded-2xl border px-4 py-3 flex-1 min-w-0 ${
            summary.overdue > 0
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-[var(--border-subtle)]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle
              size={14}
              className={summary.overdue > 0 ? 'text-red-400' : 'text-[var(--text-tertiary)]'}
            />
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
              Overdue
            </span>
          </div>
          <p
            className={`text-sm font-semibold ${
              summary.overdue > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'
            }`}
          >
            {summary.overdue} overdue
          </p>
        </div>
      </div>

      {/* Grouping tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {groupTabs.map((tab) => {
          const isActive = groupTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setGroupTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] min-h-[36px] ${
                isActive
                  ? 'bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] border border-[var(--accent-orange)]'
                  : 'bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {tab.label}
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
      {!isLoading && contacts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 mx-auto">
            <Zap size={28} className="text-[var(--text-tertiary)]" />
          </div>
          <h3 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)] mb-2">
            No contacts yet
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
            Add contacts to start managing your nurture campaigns.
          </p>
        </div>
      )}

      {/* Grouped contact list */}
      {!isLoading && contacts.length > 0 && (
        <div className="space-y-4">
          {groupTab === 'interval' &&
            intervalGroupOrder
              .filter((key) => groupedByInterval[key]?.length > 0)
              .map((key) => (
                <div
                  key={key}
                  className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {intervalGroupLabels[key]} ({groupedByInterval[key].length}{' '}
                      contact{groupedByInterval[key].length !== 1 ? 's' : ''})
                    </h3>
                  </div>
                  {groupedByInterval[key].map((c) => (
                    <ContactRow key={c.id} contact={c} />
                  ))}
                </div>
              ))}

          {groupTab === 'topic' &&
            Object.keys(groupedByTopic)
              .sort()
              .map((topic) => (
                <div
                  key={topic}
                  className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {topic} ({groupedByTopic[topic].length} contact
                      {groupedByTopic[topic].length !== 1 ? 's' : ''})
                    </h3>
                  </div>
                  {groupedByTopic[topic].map((c) => (
                    <ContactRow key={c.id} contact={c} />
                  ))}
                </div>
              ))}

          {groupTab === 'due-soon' && (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Active Contacts by Due Date ({dueSoonSorted.length})
                </h3>
              </div>
              {dueSoonSorted.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
                  No active nurture contacts.
                </div>
              )}
              {dueSoonSorted.map((c) => (
                <ContactRow key={c.id} contact={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-2 animate-fade-in-up">
          <span className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap px-1">
            {selectedIds.size} selected
          </span>

          <div className="w-px h-5 bg-[var(--border-subtle)]" />

          {/* Bulk pause */}
          <button
            onClick={() => bulkPatch({ nurtureEnabled: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
            title="Pause nurture"
          >
            <Pause size={15} />
            <span className="hidden sm:inline">Pause</span>
          </button>

          {/* Bulk resume */}
          <button
            onClick={() => bulkPatch({ nurtureEnabled: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-orange)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
            title="Resume nurture"
          >
            <Play size={15} />
            <span className="hidden sm:inline">Resume</span>
          </button>

          <div className="w-px h-5 bg-[var(--border-subtle)]" />

          {/* Bulk interval dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setBulkIntervalOpen(!bulkIntervalOpen);
                setBulkTopicOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
            >
              <Clock size={15} />
              <span className="hidden sm:inline">Interval</span>
              <ChevronDown size={13} />
            </button>
            {bulkIntervalOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBulkIntervalOpen(false)}
                />
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden min-w-[120px] animate-fade-in-up">
                  {[30, 60, 90].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setBulkIntervalOpen(false);
                        bulkPatch({ nurtureInterval: val });
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left min-h-[44px]"
                    >
                      {val} days
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bulk topic dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setBulkTopicOpen(!bulkTopicOpen);
                setBulkIntervalOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px]"
            >
              <FileText size={15} />
              <span className="hidden sm:inline">Topic</span>
              <ChevronDown size={13} />
            </button>
            {bulkTopicOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBulkTopicOpen(false)}
                />
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden min-w-[220px] animate-fade-in-up max-h-[240px] overflow-y-auto">
                  {NURTURE_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setBulkTopicOpen(false);
                        bulkPatch({ nurtureTopic: topic });
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left min-h-[44px]"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-px h-5 bg-[var(--border-subtle)]" />

          <button
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center justify-center p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[36px] min-w-[36px]"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Email editor split pane */}
      {activeContactId && activeContact && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:pointer-events-none"
            onClick={closeDraftPane}
          />

          {/* Pane */}
          <div className="fixed inset-0 z-50 md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-[480px] bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] overflow-y-auto animate-fade-in-up">
            {/* Pane header */}
            <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-5 py-4 flex items-center gap-3">
              <button
                onClick={closeDraftPane}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all min-h-[44px] min-w-[44px]"
              >
                <X size={18} className="text-[var(--text-secondary)]" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                  {activeContact.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {activeContact.company || ''}
                </p>
              </div>
              <PersonalityBadge type={activeContact.personalityType} size="sm" />
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Research Context (collapsible) */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <button
                  onClick={() => setShowResearch(!showResearch)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px]"
                >
                  <span>Research Context</span>
                  {showResearch ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                {showResearch && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-subtle)]">
                    {activeContact.researchSnippets ? (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap pt-3">
                        {activeContact.researchSnippets}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-tertiary)] italic pt-3">
                        No research data available.
                      </p>
                    )}
                    <button className="flex items-center gap-1.5 text-xs text-[var(--accent-orange)] hover:underline">
                      <RefreshCw size={12} />
                      Refresh Research
                    </button>
                  </div>
                )}
              </div>

              {/* Draft Editor */}
              {isDraftLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!isDraftLoading && activeDraft && (
                <DraftEditor
                  draft={activeDraft}
                  contact={activeContact}
                  onSave={handleDraftSave}
                  onRegenerate={handleDraftRegenerate}
                />
              )}
              {!isDraftLoading && !activeDraft && (
                <div className="text-center py-8 text-sm text-[var(--text-secondary)]">
                  Failed to load draft. Please try again.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
