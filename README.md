# CardNurture

Business card scanner and nurture CRM purpose-built for Combilift regional sales. Upload a business card photo, extract contact info via OCR, research the contact's personality style, generate tone-matched follow-up emails, and build a prospect pipeline from supply chain research.

## Prerequisites

- Node.js >= 18
- npm
- PostgreSQL

## Setup

```bash
# Clone the repo
git clone <repo-url> cardnurture
cd cardnurture

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Create the PostgreSQL database if it does not already exist. Use credentials
# that match DATABASE_URL in .env.
createdb cardnurture

# Apply the committed PostgreSQL migrations
npx prisma migrate deploy

# Optional: seed the database with sample data
npx prisma db seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment variables

The base application requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and
`NEXTAUTH_URL` in `.env`. Set `CRON_SECRET` whenever the nurture cron endpoint
is enabled; that endpoint fails closed when it is missing. The deployment
example includes all four values:

```dotenv
DATABASE_URL="postgresql://cardnurture:***@localhost:5432/cardnurture?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="replace-with-a-long-random-cron-secret"
```

Use a strong, unique random value for `NEXTAUTH_SECRET` and `CRON_SECRET` in
every deployed environment. For production, set `NEXTAUTH_URL` to the public
HTTPS URL of the app. Replace the example PostgreSQL credentials and database
host with the values for your environment.

To validate the Prisma datasource without connecting to the database, run:

```bash
DATABASE_URL='postgresql://cardnurture:***@localhost:5432/cardnurture?schema=public' npx prisma validate
```

For deployments, run `npx prisma migrate deploy` as part of the release before
starting the application. This applies the checked-in PostgreSQL migrations.

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
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/generate-nurture
```

For production, set up a cron job or Vercel Cron to call this endpoint. The
endpoint requires `CRON_SECRET`; pass the matching value as a query parameter
or bearer token:

```bash
curl "http://localhost:3000/api/cron/generate-nurture?secret=$CRON_SECRET"
# Or: curl -H "Authorization: Bearer $CRON_SECRET" \
#   http://localhost:3000/api/cron/generate-nurture
```

## Optional integrations

### LLM (Enhanced Parsing & Personality Analysis)

The app works without an LLM and falls back to rules-based parsing and
keyword-based personality classification. To enable an OpenAI-compatible LLM,
set `LLM_API_KEY` and `LLM_BASE_URL` together. `LLM_MODEL` is optional and
defaults to `gpt-4o-mini`:

```
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.openai.com
LLM_MODEL=gpt-4o-mini
```

Alternatively, set `ANTHROPIC_API_KEY` to use Anthropic for personality
analysis.

### SMTP (Real Email Sending)

Email sending is disabled unless all five SMTP variables are set:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Search API (Better Personality Research)

The search API is optional. Without it, the app falls back to DuckDuckGo HTML
search:

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
