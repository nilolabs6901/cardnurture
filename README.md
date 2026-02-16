# CardNurture

Business card scanner and nurture CRM purpose-built for Combilift regional sales. Upload a business card photo, extract contact info via OCR, research the contact's personality style, generate tone-matched follow-up emails, and build a prospect pipeline from supply chain research.

## Prerequisites

- Node.js >= 18
- npm

## Setup

```bash
# Clone the repo
git clone <repo-url> cardnurture
cd cardnurture

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login

- **Email:** admin@cardnurture.app
- **Password:** cardnurture123

## Features

- **Card Scanning:** Camera capture or file upload with OCR text extraction
- **Bulk Upload:** Process up to 50 business cards at once with queue-based review
- **Personality Research:** Auto-classifies contacts into 4 communication styles (Driver, Analytical, Expressive, Amiable) using web research
- **Tone-Matched Emails:** Generates personalized follow-up drafts matched to each contact's personality
- **Nurture Campaigns:** Automated 90-day educational email drafts focused on Combilift value propositions
- **Supply Chain Prospecting:** Identifies Florida-based companies in the contact's supply chain as potential Combilift prospects
- **Contact Reference Sheet:** Printable contact list with CSV export

## Triggering Nurture Cron

Manually generate nurture email drafts for eligible contacts:

```bash
curl http://localhost:3000/api/cron/generate-nurture
```

For production, set up a cron job or Vercel Cron to call this endpoint. Optionally set `CRON_SECRET` in `.env` and pass it as a query parameter:

```bash
curl "http://localhost:3000/api/cron/generate-nurture?secret=your-secret"
```

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
- Prisma + SQLite (Postgres-compatible schema)
- NextAuth.js
- Tesseract.js (OCR)
- Vitest (Testing)
