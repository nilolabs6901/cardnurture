'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Plus,
  GripVertical,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import StatTileRow from '@/components/StatTileRow';

/* ─── Types ─── */

interface Prospect {
  id: string;
  contactId: string;
  companyName: string;
  relationship: string;
  relationshipDesc: string | null;
  location: string | null;
  industry: string | null;
  website: string | null;
  confidence: string;
  status: string;
  createdAt: string;
  sourceContact: {
    name: string;
    company: string | null;
  };
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
}

/* ─── Constants ─── */

const PIPELINE_STAGES = [
  { id: 'new', label: 'Lead' },
  { id: 'contacted', label: 'Qualified' },
  { id: 'converted', label: 'Won' },
  { id: 'dismissed', label: 'Lost' },
];

const RELATIONSHIP_OPTIONS = [
  'supplier',
  'customer',
  'logistics_partner',
  'distributor',
  'sibling_facility',
  'industry_peer',
];

/* ─── Draggable Card ─── */

function DraggableCard({
  prospect,
  isDragOverlay,
}: {
  prospect: Prospect;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: prospect.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] p-3 mb-2 transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 text-[var(--text-tertiary)] cursor-grab active:cursor-grabbing shrink-0"
          {...(isDragOverlay ? {} : listeners)}
          {...(isDragOverlay ? {} : attributes)}
        >
          <GripVertical size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
            {prospect.companyName}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate">
            {prospect.sourceContact.name}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {new Date(prospect.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Droppable Column ─── */

function DroppableColumn({
  stage,
  prospects,
}: {
  stage: { id: string; label: string };
  prospects: Prospect[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-[var(--bg-surface)] rounded-2xl border min-w-[250px] flex-1 flex flex-col transition-colors ${
        isOver
          ? 'border-[var(--accent-orange)] bg-[var(--bg-surface-hover)]'
          : 'border-[var(--border-subtle)]'
      }`}
    >
      <div className="p-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <h3 className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            {stage.label}
          </h3>
          <span className="bg-[var(--bg-elevated)] text-[var(--text-tertiary)] text-xs px-2 py-0.5 rounded-full">
            {prospects.length}
          </span>
        </div>
      </div>
      <div className="p-2 flex-1 overflow-y-auto max-h-[60vh]">
        {prospects.map((p) => (
          <DraggableCard key={p.id} prospect={p} />
        ))}
        {prospects.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-6">
            No prospects
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Add Prospect Modal ─── */

function AddProspectModal({
  contacts,
  onClose,
  onCreated,
}: {
  contacts: Contact[];
  onClose: () => void;
  onCreated: (p: Prospect) => void;
}) {
  const [contactId, setContactId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          companyName,
          relationship,
          location,
          industry,
          website,
          confidence,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create prospect');
      }

      const prospect = await res.json();
      onCreated(prospect);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prospect');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)]">
            Add Prospect
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Contact selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Contact *
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            >
              <option value="">Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` - ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Company name */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            />
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Relationship *
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            />
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Confidence
            </label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as 'high' | 'medium' | 'low')}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--accent-orange)] text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
          >
            {saving ? 'Creating...' : 'Create Prospect'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

type SortKey = 'companyName' | 'contactName' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function PipelinePage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Filters
  const [filterContact, setFilterContact] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  // Table sort
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Table selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeNurture: 0,
    pipelineProspects: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prospectsRes, contactsRes] = await Promise.all([
          fetch('/api/prospects'),
          fetch('/api/contacts'),
        ]);

        if (prospectsRes.ok) {
          const data = await prospectsRes.json();
          setProspects(data);
          setStats((s) => ({ ...s, pipelineProspects: data.length }));
        }

        if (contactsRes.ok) {
          const data = await contactsRes.json();
          const contactList = Array.isArray(data) ? data : data.contacts || [];
          setContacts(
            contactList.map((c: any) => ({
              id: c.id,
              name: c.name,
              company: c.company,
            }))
          );
          setStats((s) => ({
            ...s,
            totalContacts: contactList.length,
            activeNurture: contactList.filter((c: any) => c.nurtureEnabled).length,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch pipeline data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered prospects
  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (filterContact && p.contactId !== filterContact) return false;
      if (
        filterCompany &&
        !p.companyName.toLowerCase().includes(filterCompany.toLowerCase())
      )
        return false;
      return true;
    });
  }, [prospects, filterContact, filterCompany]);

  // Sorted for table
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'companyName':
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case 'contactName':
          cmp = a.sourceContact.name.localeCompare(b.sourceContact.name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Group by stage for kanban
  const grouped = useMemo(() => {
    const map: Record<string, Prospect[]> = {};
    for (const stage of PIPELINE_STAGES) {
      map[stage.id] = [];
    }
    for (const p of filtered) {
      if (map[p.status]) {
        map[p.status].push(p);
      }
    }
    return map;
  }, [filtered]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const prospectId = active.id as string;
      const newStatus = over.id as string;

      const prospect = prospects.find((p) => p.id === prospectId);
      if (!prospect || prospect.status === newStatus) return;

      // Check if drop target is a valid stage
      if (!PIPELINE_STAGES.some((s) => s.id === newStatus)) return;

      // Optimistic update
      const oldStatus = prospect.status;
      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, status: newStatus } : p))
      );

      try {
        const res = await fetch(`/api/prospects/${prospectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error('Failed to update');
      } catch {
        // Revert on failure
        setProspects((prev) =>
          prev.map((p) =>
            p.id === prospectId ? { ...p, status: oldStatus } : p
          )
        );
      }
    },
    [prospects]
  );

  // Table sort toggle
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ChevronDown size={12} className="text-[var(--text-tertiary)]" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} />
    ) : (
      <ChevronDown size={12} />
    );
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((p) => p.id)));
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);

    if (bulkAction === 'delete') {
      try {
        const res = await fetch('/api/prospects/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) {
          setProspects((prev) => prev.filter((p) => !selected.has(p.id)));
          setSelected(new Set());
        }
      } catch (err) {
        console.error('Bulk delete failed:', err);
      }
    } else if (['new', 'contacted', 'converted', 'dismissed'].includes(bulkAction)) {
      try {
        const res = await fetch('/api/prospects/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, status: bulkAction }),
        });
        if (res.ok) {
          setProspects((prev) =>
            prev.map((p) =>
              selected.has(p.id) ? { ...p, status: bulkAction } : p
            )
          );
          setSelected(new Set());
        }
      } catch (err) {
        console.error('Bulk update failed:', err);
      }
    }
    setBulkAction('');
  };

  // Export
  const handleExport = () => {
    window.location.href = '/api/prospects/export';
  };

  const activeProspect = activeId
    ? prospects.find((p) => p.id === activeId)
    : null;

  const stageLabel = (status: string) =>
    PIPELINE_STAGES.find((s) => s.id === status)?.label || status;

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--bg-surface)] rounded-xl" />
          <div className="h-20 bg-[var(--bg-surface)] rounded-2xl" />
          <div className="h-64 bg-[var(--bg-surface)] rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/contacts')}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold text-[var(--text-primary)]">
            Prospects Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px]"
          >
            <Download size={16} />
            Export Pipeline
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-sm font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <Plus size={16} />
            Add Prospect
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <StatTileRow
        totalContacts={stats.totalContacts}
        activeNurture={stats.activeNurture}
        pipelineProspects={stats.pipelineProspects}
        activeTile="pipeline"
      />

      {/* Filter bar + view toggle */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={filterContact}
          onChange={(e) => setFilterContact(e.target.value)}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px]"
        >
          <option value="">All Contacts</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.company ? ` - ${c.company}` : ''}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search company..."
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px] w-48"
        />

        <div className="ml-auto flex items-center rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1 px-3 py-2 text-sm min-h-[44px] transition-colors ${
              view === 'kanban'
                ? 'bg-[var(--accent-orange)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <LayoutGrid size={14} />
            Kanban
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1 px-3 py-2 text-sm min-h-[44px] transition-colors ${
              view === 'table'
                ? 'bg-[var(--accent-orange)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <List size={14} />
            Table
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                prospects={grouped[stage.id] || []}
              />
            ))}
          </div>
          <DragOverlay>
            {activeProspect ? (
              <DraggableCard prospect={activeProspect} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table View */}
      {view === 'table' && (
        <>
          {/* Bulk toolbar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
              <span className="text-sm text-[var(--text-secondary)]">
                {selected.size} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)] min-h-[36px]"
              >
                <option value="">Action...</option>
                <option value="new">Move to Lead</option>
                <option value="contacted">Move to Qualified</option>
                <option value="converted">Move to Won</option>
                <option value="dismissed">Move to Lost</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-3 py-1 rounded-lg bg-[var(--accent-orange)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 min-h-[36px]"
              >
                Apply
              </button>
            </div>
          )}

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={sorted.length > 0 && selected.size === sorted.length}
                        onChange={toggleSelectAll}
                        className="accent-[var(--accent-orange)]"
                      />
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('companyName')}
                    >
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-[var(--font-space-grotesk)]">
                        Company <SortIcon col="companyName" />
                      </span>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('contactName')}
                    >
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-[var(--font-space-grotesk)]">
                        Parent Contact <SortIcon col="contactName" />
                      </span>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('status')}
                    >
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-[var(--font-space-grotesk)]">
                        Stage <SortIcon col="status" />
                      </span>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer select-none"
                      onClick={() => toggleSort('createdAt')}
                    >
                      <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-[var(--font-space-grotesk)]">
                        Date Added <SortIcon col="createdAt" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-surface-hover)] transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-[var(--accent-orange)]"
                        />
                      </td>
                      <td className="p-3 text-[var(--text-primary)] font-medium">
                        {p.companyName}
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        {p.sourceContact.name}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                          {stageLabel(p.status)}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--text-tertiary)]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-[var(--text-tertiary)]"
                      >
                        No prospects found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Prospect Modal */}
      {showAddModal && (
        <AddProspectModal
          contacts={contacts}
          onClose={() => setShowAddModal(false)}
          onCreated={(p) => {
            setProspects((prev) => [p, ...prev]);
            setStats((s) => ({
              ...s,
              pipelineProspects: s.pipelineProspects + 1,
            }));
          }}
        />
      )}
    </main>
  );
}
