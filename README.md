# CardNurture

Business card scanner and nurture CRM purpose-built for Combilift regional sales. Upload a business card photo, extract contact info via OCR, research the contact's personality style, generate tone-matched follow-up emails, and build a prospect pipeline from supply chain research.

## Prerequisites

- Node.js >= 18
- npm
- PostgreSQL 14+ (running locally, or a hosted instance)

## Setup

```bash
# Clone the repo
git clone <repo-url> cardnurture
cd cardnurture

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Point DATABASE_URL at your Postgres instance, then run migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Signing In

Sign-in is **email-only** — there is no password prompt. Enter an address on the
login screen and you are in; if no user exists for that address, one is created
on the spot (`src/lib/auth.ts`).

The seeded sample data belongs to **admin@cardnurture.app**, so use that address
to see the demo contacts and drafts.

> **Deployment note:** because any address is accepted, the app has no real
> access control of its own. Only run it somewhere that is already restricted —
> a private network, a VPN, or behind an authenticating proxy. Do not expose it
> on a public URL as-is.

## Features

- **Card Scanning:** Camera capture or file upload with OCR text extraction
- **Bulk Upload:** Process up to 50 business cards at once with queue-based review
- **Personality Research:** Auto-classifies contacts into 4 communication styles (Driver, Analytical, Expressive, Amiable) using web research
- **Tone-Matched Emails:** Generates personalized follow-up drafts matched to each contact's personality
- **Nurture Campaigns:** Automated 90-day educational email drafts focused on Combilift value propositions
- **Supply Chain Prospecting:** Identifies Florida-based companies in the contact's supply chain as potential Combilift prospects
- **Contact Reference Sheet:** Printable contact list with CSV export

## Triggering Nurture Cron

`CRON_SECRET` must be set in `.env` — the endpoint fails closed and returns
`503 Cron is not configured.` when it is missing, so this is not optional.

Pass the secret either as a query parameter or as a bearer token:

```bash
curl "http://localhost:3000/api/cron/generate-nurture?secret=your-secret"

curl -H "Authorization: Bearer your-secret" \
  http://localhost:3000/api/cron/generate-nurture
```

For production, point a scheduler (Railway cron, Vercel Cron, or any external
job runner) at that URL. Nothing generates nurture drafts unless something calls
this endpoint on a schedule.

## Optional Configuration

### LLM (Enhanced Parsing & Personality Analysis)

Set these in `.env` to enable LLM-powered features:

```
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### SMTP (Real Email Sending)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Search API (Better Personality Research)

```
SEARCH_API_KEY=your-key
SEARCH_API_URL=https://api.search-provider.com/search
```

## Running Tests

```bash
npm test
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js
- Tesseract.js (OCR)
- Vitest (Testing)
