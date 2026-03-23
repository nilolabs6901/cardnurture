'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import StatTileRow from '@/components/StatTileRow';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

/* ─── Types ─── */

interface GrowthPoint {
  month: string;
  count: number;
  cumulative: number;
}

interface PersonalityEntry {
  type: string;
  count: number;
}

interface CompanyEntry {
  company: string;
  count: number;
}

interface RecentContact {
  id: string;
  name: string;
  company: string | null;
  createdAt: string;
}

interface AnalyticsData {
  totalContacts: number;
  activeNurture: number;
  totalProspects: number;
  cumulativeGrowth: GrowthPoint[];
  personalityDistribution: PersonalityEntry[];
  companyDistribution: CompanyEntry[];
  nurtureStatus: { enabled: number; disabled: number };
  recentContacts: RecentContact[];
}

type DateRange = '30d' | '90d' | '1y' | 'all';

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

/* ─── Skeleton Components ─── */

function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-pulse ${className}`}
    >
      <div className="h-4 w-32 bg-[var(--bg-elevated)] rounded mb-4" />
      <div className="h-40 bg-[var(--bg-elevated)] rounded" />
    </div>
  );
}

/* ─── Custom Tooltip ─── */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
      }}
      className="px-3 py-2 text-sm"
    >
      <p className="text-[var(--text-secondary)] mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-[var(--text-primary)] font-semibold">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/contacts/analytics');
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
    fetchAnalytics();
  }, []);

  // Filter growth data by date range
  const filteredGrowth = useMemo(() => {
    if (!data) return [];
    if (dateRange === 'all') return data.cumulativeGrowth;

    const now = new Date();
    let cutoff: Date;
    if (dateRange === '30d') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (dateRange === '90d') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else {
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const cutoffMonth = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;
    return data.cumulativeGrowth.filter((p) => p.month >= cutoffMonth);
  }, [data, dateRange]);

  const dateRangeOptions: { key: DateRange; label: string }[] = [
    { key: '30d', label: '30d' },
    { key: '90d', label: '90d' },
    { key: '1y', label: '1y' },
    { key: 'all', label: 'All' },
  ];

  // Nurture percentage
  const nurtureTotal = data ? data.nurtureStatus.enabled + data.nurtureStatus.disabled : 0;
  const nurtureEnabledPct = nurtureTotal > 0 ? Math.round((data!.nurtureStatus.enabled / nurtureTotal) * 100) : 0;
  const nurtureDisabledPct = nurtureTotal > 0 ? 100 - nurtureEnabledPct : 0;

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/contacts')}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98]"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)]">
            Contacts Analytics
          </h1>
        </div>
        <button
          onClick={() => window.open('/api/contacts/export?format=csv', '_blank')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export Report</span>
        </button>
      </div>

      {/* Stat tiles */}
      {data && (
        <StatTileRow
          totalContacts={data.totalContacts}
          activeNurture={data.activeNurture}
          pipelineProspects={data.totalProspects}
          activeTile="contacts"
        />
      )}
      {isLoading && (
        <div className="flex gap-3 mb-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 flex-1 animate-pulse"
            >
              <div className="h-3 w-12 bg-[var(--bg-elevated)] rounded mb-3" />
              <div className="h-7 w-16 bg-[var(--bg-elevated)] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <CardSkeleton className="h-72" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="space-y-4">
          {/* Contact Growth Chart */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[var(--font-space-grotesk)] text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Contact Growth
              </h2>
              <div className="flex gap-1">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setDateRange(opt.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                      dateRange === opt.key
                        ? 'bg-[var(--accent-orange-muted)] text-[var(--accent-orange)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {filteredGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={filteredGrowth}>
                  <defs>
                    <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Total Contacts"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#orangeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                No data for selected range
              </div>
            )}
          </div>

          {/* Two-column grid: Personality + Companies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personality Distribution */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-fade-in-up">
              <h2 className="font-[var(--font-space-grotesk)] text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Personality Distribution
              </h2>
              {data.personalityDistribution.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.personalityDistribution}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        cursor="pointer"
                        onClick={(entry: any) => {
                          router.push(`/contacts?personality=${encodeURIComponent(entry.type)}`);
                        }}
                      >
                        {data.personalityDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {data.personalityDistribution.map((entry, i) => (
                      <div key={entry.type} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        {entry.type} ({entry.count})
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                  No data yet
                </div>
              )}
            </div>

            {/* Top Companies */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-fade-in-up">
              <h2 className="font-[var(--font-space-grotesk)] text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Top Companies
              </h2>
              {data.companyDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, data.companyDistribution.length * 32)}>
                  <BarChart data={data.companyDistribution} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis
                      type="number"
                      tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="company"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Contacts" fill="#f97316" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                  No data yet
                </div>
              )}
            </div>
          </div>

          {/* Two-column grid: Nurture Status + Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nurture Status */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-fade-in-up">
              <h2 className="font-[var(--font-space-grotesk)] text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Nurture Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Enabled</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {data.nurtureStatus.enabled} ({nurtureEnabledPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Disabled</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {data.nurtureStatus.disabled} ({nurtureDisabledPct}%)
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--status-success)] transition-all duration-500"
                    style={{ width: `${nurtureEnabledPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                  <span>Enabled</span>
                  <span>Disabled</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-fade-in-up">
              <h2 className="font-[var(--font-space-grotesk)] text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Recent Activity
              </h2>
              {data.recentContacts.length > 0 ? (
                <ul className="space-y-2.5">
                  {data.recentContacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-center justify-between gap-2 cursor-pointer hover:bg-[var(--bg-surface-hover)] rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {contact.name}
                        </p>
                        {contact.company && (
                          <p className="text-xs text-[var(--text-tertiary)] truncate">
                            {contact.company}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                  No contacts yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
