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

## Access

This is a single-user tool. There is **no sign-in screen**. Access is gated on
one shared secret, `APP_ACCESS_KEY`:

1. Set `APP_ACCESS_KEY` in the environment (`openssl rand -hex 32` generates a
   good one).
2. On each new device, visit the app once with the key appended:
   `https://your-app.example.com/?key=<APP_ACCESS_KEY>`
3. The middleware stores it in an httpOnly cookie and redirects to the clean
   URL. That browser stays signed in for a year; you never type it again.

Requests without a valid cookie get a **404**, so a visitor who guesses the URL
gets no signal that anything is hosted there. If `APP_ACCESS_KEY` is unset the
app refuses every request with a 503 — it fails closed rather than serving
itself to the internet.

**To revoke a device** (lost phone, key shared by accident), change
`APP_ACCESS_KEY`. That invalidates every stored cookie at once; re-visit the
`?key=` URL on the devices you still want. There is no per-device sign-out.

`/api/cron/generate-nurture` is deliberately outside this gate — it has its own
`CRON_SECRET` check so an external scheduler can reach it.

### Whose data you see

Contacts are scoped to a user row. With no sign-in, `getOwnerUserId()`
(`src/lib/auth.ts`) resolves the owner: `OWNER_EMAIL` if set, otherwise the
existing user holding the most contacts, otherwise a freshly created account.
The middle case matters on an existing deployment — the old email-only sign-in
created a user for any address typed at the login screen, so a database can
carry stray accounts, and the one with the data is the one to keep using.

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

### Claude API (OCR Accuracy, Personality Analysis, Prospect Research)

**This is the single highest-impact setting.** OCR tries Claude vision first and
only falls back to Tesseract, which is markedly weaker on business cards. Set:

```
ANTHROPIC_API_KEY=sk-ant-...
```

The same key powers personality research (`src/lib/research.ts`) and supply-chain
prospect research (`src/lib/supply-chain.ts`).

Note that a failed vision call is **not** surfaced to the user — it is logged and
the request silently falls back to Tesseract. If scans are coming back poor,
check the server logs for `[OCR]` lines before assuming the key is set correctly.

### OpenAI-Compatible Fallback

Used only when `ANTHROPIC_API_KEY` is unset:

```
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.openai.com
LLM_MODEL=gpt-4o-mini
```

`LLM_BASE_URL` takes **no** `/v1` suffix — the code appends
`/v1/chat/completions` itself.

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
