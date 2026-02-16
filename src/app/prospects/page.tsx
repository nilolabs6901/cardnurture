'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import ProspectCard from '@/components/ProspectCard';
import StatusBadge from '@/components/StatusBadge';
import CombiliftProductBadge from '@/components/CombiliftProductBadge';

type FilterStatus = 'all' | 'new' | 'contacted' | 'converted' | 'dismissed';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)] leading-none">
          {value}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`bg-[var(--bg-elevated)] rounded-xl animate-pulse ${className}`}
    />
  );
}

export default function ProspectsPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  useEffect(() => {
    async function fetchProspects() {
      try {
        const res = await fetch('/api/prospects');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load prospects');
        }
        const data = await res.json();
        setProspects(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load prospects');
      } finally {
        setLoading(false);
      }
    }
    fetchProspects();
  }, []);

  const filtered =
    filter === 'all'
      ? prospects
      : prospects.filter((p) => p.status === filter);

  const stats = {
    total: prospects.length,
    new: prospects.filter((p) => p.status === 'new').length,
    contacted: prospects.filter((p) => p.status === 'contacted').length,
    converted: prospects.filter((p) => p.status === 'converted').length,
  };

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
          throw new Error('Failed to update status');
        }
        showToast('Status updated');
      } catch {
        // Revert
        setProspects((prev) =>
          prev.map((p) =>
            p.id === prospectId
              ? {
                  ...p,
                  status:
                    prospects.find((op) => op.id === prospectId)?.status ||
                    'new',
                }
              : p
          )
        );
        showToast('Failed to update status', 'error');
      }
    },
    [prospects, showToast]
  );

  const handleConvert = useCallback(
    async (prospectId: string) => {
      try {
        const res = await fetch(`/api/prospects/${prospectId}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to convert');
        }

        const data = await res.json();

        setProspects((prev) =>
          prev.map((p) =>
            p.id === prospectId
              ? {
                  ...p,
                  status: 'converted',
                  convertedToContactId: data.contactId,
                }
              : p
          )
        );

        showToast('Prospect converted to contact');
        router.push(`/contacts/${data.contactId}`);
      } catch (err: any) {
        showToast(err.message || 'Failed to convert prospect', 'error');
      }
    },
    [router, showToast]
  );

  const handleInlineStatusChange = useCallback(
    (prospectId: string, newStatus: string) => {
      handleStatusChange(prospectId, newStatus);
    },
    [handleStatusChange]
  );

  const filterPills: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Converted', value: 'converted' },
    { label: 'Dismissed', value: 'dismissed' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in-up">
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-down px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-[var(--status-success)] text-white'
                : 'bg-[var(--status-error)] text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <h1 className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)] tracking-tight mb-6">
        Prospect Pipeline
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Target size={20} className="text-[var(--text-secondary)]" />}
        />
        <StatCard
          label="New"
          value={stats.new}
          icon={<Users size={20} className="text-[var(--status-info)]" />}
        />
        <StatCard
          label="Contacted"
          value={stats.contacted}
          icon={<Phone size={20} className="text-[var(--accent-orange)]" />}
        />
        <StatCard
          label="Converted"
          value={stats.converted}
          icon={
            <CheckCircle size={20} className="text-[var(--status-success)]" />
          }
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {filterPills.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setFilter(pill.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] min-h-[44px] ${
              filter === pill.value
                ? 'bg-[var(--accent-orange)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {pill.label}
            {pill.value !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {pill.value === 'new'
                  ? stats.new
                  : pill.value === 'contacted'
                  ? stats.contacted
                  : pill.value === 'converted'
                  ? stats.converted
                  : prospects.filter((p) => p.status === 'dismissed').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center">
          <p className="text-[var(--status-error)] text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-[var(--text-tertiary)]" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {filter === 'all'
              ? 'No prospects yet'
              : `No ${filter} prospects`}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {filter === 'all'
              ? 'Research a contact\'s supply chain to discover Combilift opportunities'
              : 'Change the filter to see other prospects'}
          </p>
        </div>
      )}

      {/* Mobile: ProspectCard stack */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {filtered.map((prospect, index) => (
              <div
                key={prospect.id}
                className={`animate-fade-in-up stagger-${Math.min(
                  index + 1,
                  8
                )}`}
                style={{ animationFillMode: 'both' }}
              >
                <ProspectCard
                  prospect={prospect}
                  onStatusChange={handleStatusChange}
                  onConvert={handleConvert}
                />
                {prospect.sourceContact && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 ml-1">
                    via {prospect.sourceContact.name}
                    {prospect.sourceContact.company
                      ? ` at ${prospect.sourceContact.company}`
                      : ''}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Company
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Source Contact
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Relationship
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Combilift Fit
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Confidence
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--text-tertiary)] text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prospect) => {
                  const confidenceFilled =
                    prospect.confidence === 'high'
                      ? 3
                      : prospect.confidence === 'medium'
                      ? 2
                      : 1;

                  return (
                    <tr
                      key={prospect.id}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors duration-100"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-[var(--text-primary)]">
                          {prospect.companyName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {prospect.sourceContact?.name || '\u2014'}
                        {prospect.sourceContact?.company && (
                          <span className="text-[var(--text-tertiary)] text-xs block">
                            {prospect.sourceContact.company}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[var(--text-secondary)] text-xs capitalize">
                          {(prospect.relationship || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {prospect.location ? (
                          <span className="flex items-center gap-1 text-[var(--text-secondary)] text-xs">
                            <MapPin
                              size={12}
                              className="text-[var(--text-tertiary)] shrink-0"
                            />
                            {prospect.location}
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">
                            {'\u2014'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[180px]">
                        {prospect.combiliftFit ? (
                          <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">
                            {prospect.combiliftFit}
                          </p>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">
                            {'\u2014'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3].map((dot) => (
                            <span
                              key={dot}
                              className={`inline-block w-2 h-2 rounded-full ${
                                dot <= confidenceFilled
                                  ? 'bg-[var(--accent-orange)]'
                                  : 'bg-[var(--border-subtle)]'
                              }`}
                            />
                          ))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={prospect.status}
                          onChange={(e) =>
                            handleInlineStatusChange(
                              prospect.id,
                              e.target.value
                            )
                          }
                          className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {prospect.status === 'converted' &&
                        prospect.convertedToContactId ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/contacts/${prospect.convertedToContactId}`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--accent-orange)] hover:bg-[var(--accent-orange-muted)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
                          >
                            <ExternalLink size={12} />
                            View
                          </button>
                        ) : prospect.status !== 'converted' ? (
                          <button
                            onClick={() => handleConvert(prospect.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
                          >
                            <UserPlus size={12} />
                            Convert
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
