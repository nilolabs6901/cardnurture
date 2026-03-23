'use client';

import { useRouter } from 'next/navigation';
import { Users, Zap, Target } from 'lucide-react';

type ActiveTile = 'contacts' | 'nurture' | 'pipeline';

interface StatTileRowProps {
  totalContacts: number;
  activeNurture: number;
  pipelineProspects: number;
  activeTile?: ActiveTile;
}

interface TileConfig {
  key: ActiveTile;
  label: string;
  icon: React.ReactNode;
  href: string;
  delay: number;
}

export default function StatTileRow({
  totalContacts,
  activeNurture,
  pipelineProspects,
  activeTile,
}: StatTileRowProps) {
  const router = useRouter();

  const tiles: (TileConfig & { value: number })[] = [
    {
      key: 'contacts',
      label: 'Total Contacts',
      icon: <Users size={16} />,
      href: '/contacts/analytics',
      delay: 0,
      value: totalContacts,
    },
    {
      key: 'nurture',
      label: 'Active Nurture',
      icon: <Zap size={16} />,
      href: '/contacts/nurture',
      delay: 50,
      value: activeNurture,
    },
    {
      key: 'pipeline',
      label: 'Pipeline Prospects',
      icon: <Target size={16} />,
      href: '/contacts/pipeline',
      delay: 100,
      value: pipelineProspects,
    },
  ];

  return (
    <div className="flex gap-3 mb-5 overflow-x-auto">
      {tiles.map((tile) => {
        const isActive = activeTile === tile.key;
        return (
          <button
            key={tile.key}
            onClick={() => router.push(tile.href)}
            className={`bg-[var(--bg-surface)] rounded-2xl border p-4 flex-1 min-w-0 animate-fade-in-up text-left transition-all duration-150 hover:bg-[var(--bg-surface-hover)] active:scale-[0.98] min-h-[44px] ${
              isActive
                ? 'border-[var(--accent-orange)] ring-1 ring-[var(--accent-orange)]'
                : 'border-[var(--border-subtle)]'
            }`}
            style={{ animationDelay: `${tile.delay}ms`, animationFillMode: 'both' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--text-tertiary)]">{tile.icon}</span>
            </div>
            <p className="font-[var(--font-space-grotesk)] text-2xl font-bold text-[var(--text-primary)]">
              {tile.value}
            </p>
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mt-0.5">
              {tile.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
