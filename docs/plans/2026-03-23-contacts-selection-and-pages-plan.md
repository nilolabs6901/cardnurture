# Contacts Selection & New Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-select with bulk actions to the Contacts page, make stat tiles clickable, and build three new pages: Analytics Dashboard, Nurture Management, and Prospects Pipeline (kanban + table).

**Architecture:** Incremental Next.js app router pages under `/contacts/`. Shared components extracted for stat tiles and selection toolbar. New API endpoints for bulk operations, analytics aggregation, nurture status computation, and prospect management.

**Tech Stack:** Next.js 14 (app router), React 18, Tailwind CSS 4, Prisma 5, recharts (new), @dnd-kit/core + @dnd-kit/sortable (new), date-fns (existing), lucide-react (existing), zod (existing).

---

## Task 1: Install New Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install recharts and dnd-kit**

```bash
cd cardnurture && npm install recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Verify installation**

```bash
cd cardnurture && node -e "require('recharts'); require('@dnd-kit/core'); console.log('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts and dnd-kit dependencies"
```

---

## Task 2: Extract Shared StatTileRow Component

**Files:**
- Create: `src/components/StatTileRow.tsx`
- Modify: `src/app/contacts/page.tsx`

**Step 1: Create the StatTileRow component**

Create `src/components/StatTileRow.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Users, Zap, Target } from 'lucide-react';

interface StatTileRowProps {
  totalContacts: number;
  activeNurture: number;
  pipelineProspects: number;
  activeTile?: 'contacts' | 'nurture' | 'pipeline';
}

export default function StatTileRow({
  totalContacts,
  activeNurture,
  pipelineProspects,
  activeTile,
}: StatTileRowProps) {
  const router = useRouter();

  const tiles = [
    {
      key: 'contacts' as const,
      label: 'Total Contacts',
      value: totalContacts,
      icon: <Users size={16} />,
      href: '/contacts/analytics',
      delay: 0,
    },
    {
      key: 'nurture' as const,
      label: 'Active Nurture',
      value: activeNurture,
      icon: <Zap size={16} />,
      href: '/contacts/nurture',
      delay: 50,
    },
    {
      key: 'pipeline' as const,
      label: 'Pipeline Prospects',
      value: pipelineProspects,
      icon: <Target size={16} />,
      href: '/contacts/pipeline',
      delay: 100,
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
            className={`bg-[var(--bg-surface)] rounded-2xl border p-4 flex-1 min-w-0 animate-fade-in-up text-left transition-all duration-150 cursor-pointer hover:bg-[var(--bg-surface-hover)] active:scale-[0.98] ${
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
```

**Step 2: Replace StatCard usage in contacts/page.tsx**

In `src/app/contacts/page.tsx`:
- Remove the `StatCard` component and `StatCardProps` interface (lines 30-56)
- Add import: `import StatTileRow from '@/components/StatTileRow';`
- Replace the stat cards section (lines 203-207) with:

```tsx
<StatTileRow
  totalContacts={totalContacts}
  activeNurture={activeNurtureCount}
  pipelineProspects={totalProspects}
/>
```

**Step 3: Verify the app compiles**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/StatTileRow.tsx src/app/contacts/page.tsx
git commit -m "refactor: extract StatTileRow as shared clickable component"
```

---

## Task 3: Add Checkbox Selection to Contacts Page

**Files:**
- Modify: `src/app/contacts/page.tsx`

**Step 1: Add selection state**

In the `ContactsPage` component, after the existing state declarations (line 114), add:

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

**Step 2: Clear selection when filter/search changes**

After the `setActiveFilter` calls and `setSearchQuery`, clear selection. Add a useEffect:

```tsx
useEffect(() => {
  setSelectedIds(new Set());
}, [activeFilter, searchQuery]);
```

**Step 3: Add selection helper functions**

```tsx
function toggleSelect(id: string) {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function toggleSelectAll() {
  if (selectedIds.size === filteredContacts.length) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
  }
}
```

**Step 4: Add checkbox column to desktop table header**

Before the "Name" `<th>`, add:

```tsx
<th className="py-3 px-3 w-10">
  <input
    type="checkbox"
    checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
    onChange={toggleSelectAll}
    className="w-4 h-4 rounded border-[var(--border-subtle)] accent-[var(--accent-orange)] cursor-pointer"
  />
</th>
```

**Step 5: Add checkbox column to each desktop table row**

Before the Name `<td>` in each row, add (and add `e.stopPropagation()` on click so it doesn't navigate):

```tsx
<td className="py-3 px-3 w-10" onClick={(e) => e.stopPropagation()}>
  <input
    type="checkbox"
    checked={selectedIds.has(contact.id)}
    onChange={() => toggleSelect(contact.id)}
    className="w-4 h-4 rounded border-[var(--border-subtle)] accent-[var(--accent-orange)] cursor-pointer"
  />
</td>
```

**Step 6: Add checkbox to mobile cards**

Inside the mobile card button, add a checkbox in the top-right corner. Wrap the existing content and add:

```tsx
<div className="absolute top-3 right-3" onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}>
  <input
    type="checkbox"
    checked={selectedIds.has(contact.id)}
    onChange={() => {}}
    className="w-4 h-4 rounded border-[var(--border-subtle)] accent-[var(--accent-orange)] cursor-pointer"
  />
</div>
```

Make the mobile card button `relative` by adding `relative` to its className.

**Step 7: Verify the app compiles**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 8: Commit**

```bash
git add src/app/contacts/page.tsx
git commit -m "feat: add checkbox selection to contacts table and mobile cards"
```

---

## Task 4: Build Bulk Action API Endpoints

**Files:**
- Create: `src/app/api/contacts/bulk/route.ts`
- Modify: `src/app/api/contacts/export/route.ts` (add `ids` filter param)
- Modify: `src/lib/validators.ts` (add bulk schemas)

**Step 1: Add bulk validation schemas to validators.ts**

Append to `src/lib/validators.ts`:

```ts
export const contactBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one contact ID required'),
});

export const contactBulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one contact ID required'),
  nurtureEnabled: z.boolean().optional(),
  nurtureInterval: z.number().int().min(1).max(365).optional(),
  nurtureTopic: z.string().optional(),
});

export type ContactBulkDeleteInput = z.infer<typeof contactBulkDeleteSchema>;
export type ContactBulkUpdateInput = z.infer<typeof contactBulkUpdateSchema>;
```

**Step 2: Create the bulk API route**

Create `src/app/api/contacts/bulk/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { contactBulkDeleteSchema, contactBulkUpdateSchema } from '@/lib/validators';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = contactBulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Only delete contacts owned by this user
    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: parsed.data.ids },
        userId,
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to delete contacts.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = contactBulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { ids, ...updateData } = parsed.data;

    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(cleanData).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const result = await prisma.contact.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: cleanData,
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Bulk update error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to update contacts.' }, { status: 500 });
  }
}
```

**Step 3: Add `ids` filter to export route**

In `src/app/api/contacts/export/route.ts`, after `const userId = ...` (line 25), add:

```ts
const { searchParams } = new URL(request.url);
const idsParam = searchParams.get('ids');
const idFilter = idsParam ? idsParam.split(',').filter(Boolean) : null;
```

Then modify the `prisma.contact.findMany` `where` clause (line 27) to:

```ts
where: {
  userId,
  ...(idFilter ? { id: { in: idFilter } } : {}),
},
```

**Step 4: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 5: Commit**

```bash
git add src/lib/validators.ts src/app/api/contacts/bulk/route.ts src/app/api/contacts/export/route.ts
git commit -m "feat: add bulk delete/update API and filtered export endpoint"
```

---

## Task 5: Build Floating Bulk Action Toolbar

**Files:**
- Create: `src/components/BulkActionToolbar.tsx`
- Modify: `src/app/contacts/page.tsx`

**Step 1: Create the BulkActionToolbar component**

Create `src/components/BulkActionToolbar.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Trash2, Zap, Download, Megaphone, X } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onToggleNurture: (enabled: boolean) => void;
  onExport: () => void;
  onClear: () => void;
}

export default function BulkActionToolbar({
  selectedCount,
  onDelete,
  onToggleNurture,
  onExport,
  onClear,
}: BulkActionToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm mx-4 animate-fade-in-up">
            <h3 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)] mb-2">
              Delete {selectedCount} contact{selectedCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This will permanently delete the selected contacts, their email drafts, and prospects. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl">
          <span className="text-sm font-medium text-[var(--text-primary)] mr-2 whitespace-nowrap">
            {selectedCount} selected
          </span>

          <div className="w-px h-6 bg-[var(--border-subtle)]" />

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all min-h-[40px]"
            title="Delete selected"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={() => onToggleNurture(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all min-h-[40px]"
            title="Enable nurture"
          >
            <Zap size={16} />
            <span className="hidden sm:inline">Nurture On</span>
          </button>

          <button
            onClick={() => onToggleNurture(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all min-h-[40px]"
            title="Disable nurture"
          >
            <Zap size={16} className="opacity-40" />
            <span className="hidden sm:inline">Nurture Off</span>
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all min-h-[40px]"
            title="Export selected"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="w-px h-6 bg-[var(--border-subtle)]" />

          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)] transition-all min-h-[40px]"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Integrate BulkActionToolbar into contacts/page.tsx**

Add import:
```tsx
import BulkActionToolbar from '@/components/BulkActionToolbar';
```

Add bulk action handlers in the `ContactsPage` component:

```tsx
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
        prev.map((c) => (selectedIds.has(c.id) ? { ...c, nurtureEnabled: enabled } : c))
      );
      setSelectedIds(new Set());
    }
  } catch {
    // silent fail
  }
}

function handleBulkExport() {
  const ids = Array.from(selectedIds).join(',');
  window.open(`/api/contacts/export?ids=${ids}`, '_blank');
}
```

Add the toolbar at the bottom of the return JSX (before the closing `</div>`):

```tsx
<BulkActionToolbar
  selectedCount={selectedIds.size}
  onDelete={handleBulkDelete}
  onToggleNurture={handleBulkToggleNurture}
  onExport={handleBulkExport}
  onClear={() => setSelectedIds(new Set())}
/>
```

**Step 3: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add src/components/BulkActionToolbar.tsx src/app/contacts/page.tsx
git commit -m "feat: add floating bulk action toolbar with delete, nurture toggle, and export"
```

---

## Task 6: Build Analytics API Endpoint

**Files:**
- Create: `src/app/api/contacts/analytics/route.ts`

**Step 1: Create the analytics endpoint**

Create `src/app/api/contacts/analytics/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const contacts = await prisma.contact.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        company: true,
        personalityType: true,
        nurtureEnabled: true,
        createdAt: true,
        _count: { select: { emailDrafts: true, prospects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Growth over time — group by month
    const growthMap = new Map<string, number>();
    for (const c of contacts) {
      const month = c.createdAt.toISOString().slice(0, 7); // YYYY-MM
      growthMap.set(month, (growthMap.get(month) || 0) + 1);
    }
    const growth = Array.from(growthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Cumulative growth
    let cumulative = 0;
    const cumulativeGrowth = growth.map((g) => {
      cumulative += g.count;
      return { ...g, cumulative };
    });

    // Personality distribution
    const personalityMap = new Map<string, number>();
    for (const c of contacts) {
      personalityMap.set(c.personalityType, (personalityMap.get(c.personalityType) || 0) + 1);
    }
    const personalityDistribution = Array.from(personalityMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // Company distribution — top 10
    const companyMap = new Map<string, number>();
    for (const c of contacts) {
      const company = c.company || 'Unknown';
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    }
    const companyDistribution = Array.from(companyMap.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Nurture status
    const nurtureEnabled = contacts.filter((c) => c.nurtureEnabled).length;
    const nurtureDisabled = contacts.length - nurtureEnabled;

    // Recent activity (last 10 contacts added)
    const recentContacts = contacts.slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      createdAt: c.createdAt,
    }));

    // Totals
    const totalContacts = contacts.length;
    const totalProspects = contacts.reduce((sum, c) => sum + c._count.prospects, 0);

    return NextResponse.json({
      totalContacts,
      activeNurture: nurtureEnabled,
      totalProspects,
      cumulativeGrowth,
      personalityDistribution,
      companyDistribution,
      nurtureStatus: { enabled: nurtureEnabled, disabled: nurtureDisabled },
      recentContacts,
    });
  } catch (error) {
    console.error('Analytics error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to fetch analytics.' }, { status: 500 });
  }
}
```

**Step 2: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/app/api/contacts/analytics/route.ts
git commit -m "feat: add contacts analytics API endpoint"
```

---

## Task 7: Build Analytics Dashboard Page

**Files:**
- Create: `src/app/contacts/analytics/page.tsx`

**Step 1: Create the analytics page**

Create `src/app/contacts/analytics/page.tsx`. This page displays:
- StatTileRow with `activeTile="contacts"`
- Contact growth area chart (recharts AreaChart)
- Personality type pie chart (recharts PieChart)
- Top companies horizontal bar chart (recharts BarChart)
- Nurture enabled/disabled breakdown
- Recent activity list

Key implementation notes:
- Use `'use client'` directive
- Fetch from `/api/contacts/analytics` on mount
- Import `StatTileRow` from `@/components/StatTileRow`
- Import `AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar` from `recharts`
- Use the app's existing dark theme CSS variables for chart colors
- Chart color palette: `['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']` for personality types
- Back arrow uses `ArrowLeft` from lucide-react, navigates to `/contacts`
- "Export Report" button opens `/api/contacts/export` in new tab
- Clicking a personality segment navigates to `/contacts?personality={type}`
- Date range filter: buttons for 30d/90d/1y/All that filter `cumulativeGrowth` client-side by date
- Loading state: skeleton placeholders matching the chart areas
- Page layout: max-w-4xl mx-auto, matching the contacts page

Full component is ~250 lines. The implementing agent should write the complete page following the patterns in `contacts/page.tsx` for styling consistency (same CSS variable usage, rounded-2xl cards, animate-fade-in-up, etc.).

**Step 2: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/app/contacts/analytics/page.tsx
git commit -m "feat: add contacts analytics dashboard page with charts"
```

---

## Task 8: Build Nurture Status API Endpoint

**Files:**
- Create: `src/app/api/contacts/nurture-status/route.ts`

**Step 1: Create the nurture status endpoint**

Create `src/app/api/contacts/nurture-status/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const now = new Date();

    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        emailDrafts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, status: true },
        },
        _count: { select: { emailDrafts: true, prospects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = contacts.map((contact) => {
      const lastDraft = contact.emailDrafts[0] || null;
      const lastDraftDate = lastDraft ? lastDraft.createdAt : null;

      const daysSinceLastDraft = lastDraftDate
        ? differenceInDays(now, lastDraftDate)
        : null;

      const dueInDays = lastDraftDate
        ? contact.nurtureInterval - differenceInDays(now, lastDraftDate)
        : 0; // No draft yet = due now

      const isOverdue = contact.nurtureEnabled && dueInDays < 0;
      const isDueSoon = contact.nurtureEnabled && dueInDays >= 0 && dueInDays <= 7;

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        personalityType: contact.personalityType,
        nurtureEnabled: contact.nurtureEnabled,
        nurtureInterval: contact.nurtureInterval,
        nurtureTopic: contact.nurtureTopic,
        lastDraftDate,
        daysSinceLastDraft,
        dueInDays,
        isOverdue,
        isDueSoon,
        draftCount: contact._count.emailDrafts,
        researchSnippets: contact.researchSnippets,
      };
    });

    // Summary stats
    const totalActive = enriched.filter((c) => c.nurtureEnabled).length;
    const dueSoon = enriched.filter((c) => c.isDueSoon).length;
    const overdue = enriched.filter((c) => c.isOverdue).length;

    return NextResponse.json({
      contacts: enriched,
      summary: {
        totalContacts: contacts.length,
        activeNurture: totalActive,
        dueSoon,
        overdue,
        totalProspects: contacts.reduce((sum, c) => sum + c._count.prospects, 0),
      },
    });
  } catch (error) {
    console.error('Nurture status error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to fetch nurture status.' }, { status: 500 });
  }
}
```

**Step 2: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/app/api/contacts/nurture-status/route.ts
git commit -m "feat: add nurture status API with due-date computation"
```

---

## Task 9: Build Nurture Management Page

**Files:**
- Create: `src/app/contacts/nurture/page.tsx`

**Step 1: Create the nurture management page**

Create `src/app/contacts/nurture/page.tsx`. This page displays:
- StatTileRow with `activeTile="nurture"`
- Summary bar: 3 mini-stat cards (Active/Total, Due in 7 days, Overdue)
- Grouping tabs: "By Interval" | "By Topic" | "Due Soon"
- Contact rows in each group showing: name, company, email, nurture toggle, interval badge, topic, last draft date, days since, "Generate Draft Now" / "Edit Draft" button
- Checkbox selection with BulkActionToolbar (reused) — but with nurture-specific actions: bulk pause/resume, bulk change interval (dropdown), bulk change topic (dropdown)
- Clicking "Generate Draft Now" or "Edit Draft" opens a right split-pane (or full-screen on mobile) with the existing `DraftEditor` component plus a "Research Context" collapsible panel above it showing `researchSnippets`
- "Refresh Research" button that calls `POST /api/contacts/[id]/research` (this endpoint may not exist yet — create a stub that returns existing researchSnippets for now)

Key implementation notes:
- Fetch from `/api/contacts/nurture-status` on mount
- Use `'use client'` directive
- Group contacts client-side based on selected tab
- "By Interval" groups: contacts grouped into 30d, 60d, 90d sections
- "By Topic" groups: grouped by nurtureTopic value
- "Due Soon" view: flat sorted list, most overdue first (lowest dueInDays first)
- Nurture toggle: inline `PATCH /api/contacts/bulk` with single ID for quick toggle
- Generate draft: `POST /api/contacts/[id]/generate-draft` — if this endpoint doesn't exist, the agent should check existing nurture draft generation logic in `src/lib/nurture.ts` and create the endpoint
- The split-pane editor panel state is managed by `useState<string | null>(activeContactId)` — when set, show the editor; when null, hide it

Full page is ~350-400 lines. The implementing agent should follow existing page patterns for consistency.

**Step 2: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/app/contacts/nurture/page.tsx
git commit -m "feat: add nurture management page with grouping, editor, and research context"
```

---

## Task 10: Build Prospects Pipeline API Enhancements

**Files:**
- Modify: `src/app/api/prospects/route.ts` (add filters for stage, company)
- Create: `src/app/api/prospects/bulk/route.ts`
- Create: `src/app/api/prospects/export/route.ts`
- Modify: `src/lib/validators.ts` (add prospect bulk/create schemas)

**Step 1: Add prospect schemas to validators.ts**

Append to `src/lib/validators.ts`:

```ts
export const prospectCreateSchema = z.object({
  contactId: z.string().min(1, 'Contact ID required'),
  companyName: z.string().min(1, 'Company name required'),
  relationship: z.string().min(1, 'Relationship required'),
  relationshipDesc: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
});

export const prospectBulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['new', 'contacted', 'converted', 'dismissed']).optional(),
});

export const prospectBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type ProspectCreateInput = z.infer<typeof prospectCreateSchema>;
export type ProspectBulkUpdateInput = z.infer<typeof prospectBulkUpdateSchema>;
```

**Step 2: Enhance GET /api/prospects with filters**

In `src/app/api/prospects/route.ts`, modify the "all prospects" query (lines 43-56) to support `stage` and `company` filters from searchParams:

```ts
const stage = searchParams.get('stage');
const company = searchParams.get('company');

const prospects = await prisma.prospect.findMany({
  where: {
    sourceContact: { userId },
    ...(stage ? { status: stage } : {}),
    ...(company ? { companyName: { contains: company, mode: 'insensitive' } } : {}),
  },
  include: {
    sourceContact: { select: { name: true, company: true } },
  },
  orderBy: { createdAt: 'desc' },
});
```

Also add a `POST` handler for creating prospects:

```ts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = prospectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Verify contact belongs to user
    const contact = await prisma.contact.findUnique({ where: { id: parsed.data.contactId } });
    if (!contact || contact.userId !== userId) {
      return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    }

    const prospect = await prisma.prospect.create({
      data: {
        contactId: parsed.data.contactId,
        companyName: parsed.data.companyName,
        relationship: parsed.data.relationship,
        relationshipDesc: parsed.data.relationshipDesc || null,
        location: parsed.data.location || null,
        industry: parsed.data.industry || null,
        website: parsed.data.website || null,
        confidence: parsed.data.confidence || 'medium',
      },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error('Prospect create error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to create prospect.' }, { status: 500 });
  }
}
```

Add import for `prospectCreateSchema` from `@/lib/validators`.

**Step 3: Create bulk prospects endpoint**

Create `src/app/api/prospects/bulk/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prospectBulkUpdateSchema, prospectBulkDeleteSchema } from '@/lib/validators';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = prospectBulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { ids, ...updateData } = parsed.data;
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    const result = await prisma.prospect.updateMany({
      where: {
        id: { in: ids },
        sourceContact: { userId },
      },
      data: cleanData,
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Prospect bulk update error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to update prospects.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json();

    const parsed = prospectBulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const result = await prisma.prospect.deleteMany({
      where: {
        id: { in: parsed.data.ids },
        sourceContact: { userId },
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Prospect bulk delete error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to delete prospects.' }, { status: 500 });
  }
}
```

**Step 4: Create prospect export endpoint**

Create `src/app/api/prospects/export/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const contactId = searchParams.get('contactId');

    const prospects = await prisma.prospect.findMany({
      where: {
        sourceContact: { userId },
        ...(stage ? { status: stage } : {}),
        ...(contactId ? { contactId } : {}),
      },
      include: {
        sourceContact: { select: { name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Company', 'Parent Contact', 'Contact Company', 'Relationship', 'Status', 'Industry', 'Location', 'Confidence', 'Date Added'];
    const rows = [headers.map(escapeCsv).join(',')];

    for (const p of prospects) {
      rows.push([
        escapeCsv(p.companyName),
        escapeCsv(p.sourceContact.name),
        escapeCsv(p.sourceContact.company),
        escapeCsv(p.relationship),
        escapeCsv(p.status),
        escapeCsv(p.industry),
        escapeCsv(p.location),
        escapeCsv(p.confidence),
        escapeCsv(p.createdAt.toISOString().split('T')[0]),
      ].join(','));
    }

    const today = new Date().toISOString().split('T')[0];
    return new NextResponse(rows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cardnurture-prospects-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error('Prospect export error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to export prospects.' }, { status: 500 });
  }
}
```

**Step 5: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 6: Commit**

```bash
git add src/lib/validators.ts src/app/api/prospects/route.ts src/app/api/prospects/bulk/route.ts src/app/api/prospects/export/route.ts
git commit -m "feat: add prospect creation, bulk operations, filtered queries, and CSV export"
```

---

## Task 11: Build Prospects Pipeline Page

**Files:**
- Create: `src/app/contacts/pipeline/page.tsx`

**Step 1: Create the pipeline page**

Create `src/app/contacts/pipeline/page.tsx`. This is the most complex page. It includes:

- StatTileRow with `activeTile="pipeline"`
- View toggle: "Kanban" | "Table" buttons
- Filter bar: contact dropdown, company search, prospect search
- **Kanban view**: Uses `@dnd-kit/core` DndContext + `@dnd-kit/sortable` for drag-and-drop
  - Columns: Lead (status="new"), Qualified (status="contacted"), Proposal, Closed Won (status="converted"), Closed Lost (status="dismissed")
  - Note: The existing Prospect model uses `status` field with values: "new", "contacted", "converted", "dismissed". Map these to kanban column labels.
  - Each prospect card: company name, parent contact name, status badge, date added
  - On drag end: `PATCH /api/prospects/[id]` with new status
- **Table view**: Standard sortable table with checkboxes, BulkActionToolbar for bulk stage update and bulk delete
- "Add Prospect" button: modal with form fields (contact selector dropdown, company name, relationship, location, industry, website, confidence)
- "Export Pipeline" button: opens `/api/prospects/export` in new tab

Key implementation notes:
- Fetch from `GET /api/prospects` on mount
- Fetch contacts from `GET /api/contacts` for the contact selector dropdown and contact filter
- The kanban columns are defined as:
  ```ts
  const PIPELINE_STAGES = [
    { id: 'new', label: 'Lead' },
    { id: 'contacted', label: 'Qualified' },
    { id: 'converted', label: 'Won' },
    { id: 'dismissed', label: 'Lost' },
  ];
  ```
- Drag-and-drop: Use `DndContext` from `@dnd-kit/core` with `useDroppable` for columns and `useDraggable` for cards. On `onDragEnd`, check if the card was dropped in a different column, then call `PATCH /api/prospects/[id]` with the new status.
- Use optimistic updates for drag-and-drop status changes (same pattern as existing `ProspectPipeline.tsx`)

Full page is ~400-500 lines. The implementing agent should follow existing patterns.

**Step 2: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/app/contacts/pipeline/page.tsx
git commit -m "feat: add prospects pipeline page with kanban drag-and-drop and table views"
```

---

## Task 12: Add Query Param Filtering to Contacts Page

**Files:**
- Modify: `src/app/contacts/page.tsx`

**Step 1: Support personality query param filter**

The analytics page navigates to `/contacts?personality=Driver` when clicking a chart segment. Update the contacts page to read this param and add it as a filter.

In `ContactsPage`, after reading `initialFilter` from searchParams:

```tsx
const personalityFilter = searchParams.get('personality');
```

In the `filteredContacts` useMemo, add after the search filter:

```tsx
if (personalityFilter) {
  result = result.filter((c) => c.personalityType === personalityFilter);
}
```

Add `personalityFilter` to the useMemo dependency array.

Optionally show a dismissible banner when a personality filter is active:

```tsx
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
```

**Step 2: Verify build**

```bash
cd cardnurture && npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/app/contacts/page.tsx
git commit -m "feat: support personality query param filter on contacts page"
```

---

## Task 13: End-to-End Smoke Test

**Step 1: Start dev server**

```bash
cd cardnurture && npm run dev
```

**Step 2: Manual verification checklist**

- [ ] `/contacts` — checkboxes appear, select all works, bulk toolbar shows
- [ ] Bulk delete — select contacts, click delete, confirm modal, contacts removed
- [ ] Bulk nurture toggle — select contacts, click nurture on/off, dots update
- [ ] Bulk export — select contacts, click export, CSV downloads with only selected
- [ ] Stat tiles — hover shows pointer cursor, click navigates to correct page
- [ ] `/contacts/analytics` — charts render with data, back arrow works, date range filter works
- [ ] Click personality chart segment → navigates to `/contacts?personality=X` with filter active
- [ ] `/contacts/nurture` — grouping tabs work, nurture toggles work, editor panel opens
- [ ] `/contacts/pipeline` — kanban columns show, drag-and-drop works, table view works, add prospect modal works
- [ ] Mobile responsiveness — all pages render correctly on mobile viewport

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: address smoke test issues"
```
