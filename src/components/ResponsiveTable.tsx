'use client';

import React from 'react';

interface Column {
  key: string;
  label: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  renderCard: (item: any) => React.ReactNode;
  onRowClick?: (item: any) => void;
}

export default function ResponsiveTable({
  columns,
  data,
  renderRow,
  renderCard,
  onRowClick,
}: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left py-3 px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider ${
                    col.hideOnMobile ? '' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-surface-hover)] transition-colors duration-100 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {renderRow(item)}
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[var(--text-tertiary)]">
              No data to display
            </p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            onClick={() => onRowClick?.(item)}
            className={`bg-[var(--bg-surface)] rounded-2xl p-4 border border-[var(--border-subtle)] animate-fade-in-up stagger-${Math.min(index + 1, 8)} ${
              onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
            }`}
            style={{ animationFillMode: 'both' }}
          >
            {renderCard(item)}
          </div>
        ))}

        {data.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[var(--text-tertiary)]">
              No data to display
            </p>
          </div>
        )}
      </div>
    </>
  );
}
