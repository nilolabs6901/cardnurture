# Contacts Selection & New Pages Design

**Date:** 2026-03-23
**Status:** Approved

## Overview

Enhance the Contacts page with multi-select capabilities and bulk actions, make stat tiles clickable to navigate to three new dedicated pages: Analytics Dashboard, Nurture Management, and Prospects Pipeline.

## Architecture

- **Approach:** Incremental Pages — each new view is a standalone Next.js route
- **Routes:**
  - `/contacts` — enhanced with selection system
  - `/contacts/analytics` — analytics dashboard
  - `/contacts/nurture` — nurture management view
  - `/contacts/pipeline` — prospects pipeline (kanban + table)

---

## Section 1: Contacts Page — Selection System & Bulk Actions

### Checkbox Column
- New first column in the table with checkboxes
- "Select all" checkbox in the header selects/deselects all visible (filtered) contacts
- On mobile cards, a checkbox appears in the top-right corner of each card

### Selection State
- Managed via `useState<Set<string>>` holding selected contact IDs
- Clearing search or switching filter tabs clears the selection

### Bulk Action Toolbar
When 1+ contacts are selected, a floating toolbar slides up from the bottom (sticky bottom bar):
- Selected count: "3 selected"
- **Delete** — red icon button, confirmation modal before executing
- **Toggle Nurture** — enable/disable nurture for selected contacts
- **Export Selected** — downloads CSV of just the selected contacts
- **Add to Campaign** — opens a dropdown/modal to pick a campaign
- **Clear selection** — X button to deselect all

### Tile Clicks
Each stat tile becomes clickable with hover effect and cursor pointer:
- Total Contacts → `/contacts/analytics`
- Active Nurture → `/contacts/nurture`
- Pipeline Prospects → `/contacts/pipeline`

### New API Endpoints
- `DELETE /api/contacts/bulk` — accepts array of contact IDs
- `PATCH /api/contacts/bulk` — accepts array of IDs + fields to update (nurtureEnabled, etc.)
- `GET /api/contacts/export?ids=1,2,3` — export filtered subset

---

## Section 2: Contacts Analytics Dashboard (`/contacts/analytics`)

### Header
- "Contacts Analytics" with back arrow to `/contacts`
- "Export Report" button (CSV summary)

### Stat Row
Same three tiles as main contacts page, "Total Contacts" highlighted as active. Other tiles navigate to their respective pages.

### Contact Growth Chart
- Line/area chart showing contacts added over time (by week or month)
- Lightweight charting library (recharts or custom SVG)
- Date range filter: Last 30d / 90d / 1 year / All time

### Breakdown Cards (grid of 2-3)
- **By Personality Type** — donut/pie chart (Driver, Analytical, Expressive, Amiable, Balanced)
- **By Company** — horizontal bar chart of top 10 companies
- **By Nurture Status** — enabled vs disabled split with percentages

### Recent Activity Feed
- 5-10 recent events: new scans, drafts generated, nurture emails sent
- Pulled from contact `createdAt` and emailDraft timestamps

### Click-Through Behavior
Clicking a chart segment navigates to `/contacts?personality=Driver` (or similar filter param) to pre-filter the main list.

### New API Endpoint
- `GET /api/contacts/analytics` — aggregated stats: growth over time, personality distribution, company counts, nurture breakdown, recent activity

---

## Section 3: Nurture Management View (`/contacts/nurture`)

### Header
- "Nurture Management" with back arrow to `/contacts`
- Stat tile row with "Active Nurture" highlighted

### Summary Bar
Mini-stats row:
- Active nurture count vs total contacts
- Contacts due for nurture in next 7 days
- Contacts overdue (past interval with no recent draft)

### Grouping Tabs
- **By Interval** — groups contacts into 30-day, 60-day, 90-day sections
- **By Topic** — groups by nurture topic: Auto, ROI, custom
- **Due Soon** — sorted by most overdue/soonest due, showing days until next nurture

### Contact Rows
Each row shows:
- Contact name, company, email
- Nurture status dot with toggle button
- Interval badge (30d/60d/90d)
- Current topic
- Last draft date and days since
- "Generate Draft Now" / "Edit Draft" button

### Email Editor Panel
Clicking "Generate Draft Now" or "Edit Draft" opens a split-pane editor (right side on desktop, full-screen on mobile):
- Subject line (editable)
- Email body (rich text editor with generated draft pre-filled)
- Save Draft / Regenerate / Send buttons
- Contact's name, company, and personality type displayed at top

### Hyper-Personalization via Research
- Before generating, the system pulls the contact's `researchSnippets` field
- Research snippets displayed in a collapsible "Research Context" panel above the editor
- Generated email weaves in specific details (company initiatives, industry trends, previous topics)
- "Refresh Research" button to update stale snippets and regenerate

### Selection & Bulk Actions
Same checkbox pattern as main contacts page, floating toolbar with:
- Bulk pause/resume nurture
- Bulk change interval (30d/60d/90d dropdown)
- Bulk change topic (Auto/ROI/custom dropdown)

### New API Endpoints
- `GET /api/contacts/nurture-status` — contacts with computed "due in X days" and overdue flags
- `POST /api/contacts/[id]/research` — fetch/refresh research snippets
- `POST /api/contacts/[id]/generate-draft` — accepts optional `researchContext`, uses personality + research for personalization
- `PATCH /api/contacts/[id]/drafts/[draftId]` — save edits to existing draft
- `PATCH /api/contacts/bulk` — reused from Section 1, supports nurtureInterval and nurtureTopic

---

## Section 4: Prospects Pipeline Page (`/contacts/pipeline`)

### Header
- "Prospects Pipeline" with back arrow to `/contacts`
- Stat tile row with "Pipeline Prospects" highlighted

### View Toggle
- **Kanban Board** (default) — columns for each stage
- **Table View** — traditional sortable list

### Filter Bar
- Filter by parent contact (dropdown)
- Filter by company
- Search by prospect name/company

### Kanban Board View
Columns: **Lead → Qualified → Proposal → Closed Won / Closed Lost**

Each prospect card shows:
- Prospect company name
- Parent contact name (small text)
- Stage badge
- Date added
- Drag handle

Drag-and-drop between columns to update stage (using `@dnd-kit/core`). Column headers show prospect count per stage.

### Table View
Sortable columns: Prospect Company, Parent Contact, Stage, Date Added. Row click opens prospect detail or expands inline.

### Actions
- **"Add Prospect" button** — modal with contact selector dropdown
- **Bulk selection** (table view) — checkboxes with floating toolbar for bulk stage update and bulk delete
- **Export pipeline** — CSV download of current filtered view

### New API Endpoints
- `GET /api/prospects` — all prospects with parent contact info, supports filters (contactId, company, stage)
- `PATCH /api/prospects/[id]` — update single prospect (stage change from drag)
- `PATCH /api/prospects/bulk` — bulk stage update or delete
- `POST /api/prospects` — create prospect linked to a contact
- `GET /api/prospects/export` — CSV export with filters

---

## New Dependencies
- `recharts` — charting for analytics page
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop for kanban pipeline

## Shared Patterns
- Stat tile row component extracted and reused across all four pages (with active state highlighting)
- Checkbox selection + floating bulk toolbar extracted as a reusable hook/component
- Consistent dark theme styling matching existing design system
