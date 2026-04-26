# Railway Setup

End-to-end checklist for getting CardNurture running on Railway with automated nurture emails. **Do these in order.** Total time: ~10 minutes.

## 1. Generate a CRON_SECRET

On your laptop:

```bash
openssl rand -hex 32
```

Copy the output. You'll paste it into Railway twice (main service + each cron service).

## 2. Sign up for Resend (recommended SMTP)

[resend.com](https://resend.com) — free tier is 3,000 emails/month, no credit card. Faster setup than Gmail and won't get throttled.

1. Sign up, verify your email.
2. **Domains** → **Add Domain** → enter the domain you want emails to come from (e.g. `yourdomain.com`). Add the DNS records Resend shows you (SPF, DKIM). If you don't have a domain, skip this and use the `onboarding@resend.dev` sender for now — fine for testing, not great for deliverability.
3. **API Keys** → **Create API Key** → copy the key (starts with `re_...`).

You now have:
- `SMTP_HOST=smtp.resend.com`
- `SMTP_PORT=587`
- `SMTP_USER=resend`
- `SMTP_PASS=<your re_... key>`
- `SMTP_FROM="CardNurture <hello@yourdomain.com>"` (or `onboarding@resend.dev` if you skipped DNS)

## 3. Set Railway environment variables

Railway dashboard → your project → main service → **Variables** tab → click **Raw Editor** and paste:

```
CRON_SECRET=<paste from step 1>
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<paste from step 2>
SMTP_FROM=CardNurture <hello@yourdomain.com>
```

Save. Railway redeploys automatically. Wait for the green deploy.

## 4. Find your public URL

Main service → **Settings** → **Networking** → **Public Domain**. It looks like `cardnurture-production.up.railway.app`. Copy it.

## 5. Sanity-check the deployment

```bash
curl https://<your-public-domain>/api/health
```

Expect: `{"status":"ok","timestamp":"..."}`. If you get that, the new build is live and the health route works.

## 6. Add the two cron services

Cron jobs on Railway are just tiny services with a schedule + a one-shot start command. Repeat this twice:

### Cron A: generate nurture drafts (daily)

1. In your project, click **+ New** → **Empty Service**.
2. Rename it: **Settings** → **Service Name** → `cron-generate-nurture`.
3. **Settings** → **Source** → set **Image** to `curlimages/curl:latest` (avoids rebuilding your whole Next.js app every time the cron runs).
4. **Settings** → **Deploy** → **Cron Schedule**: `0 9 * * *` (daily 09:00 UTC).
5. **Settings** → **Deploy** → **Custom Start Command**:
   ```
   curl -fsS "https://<your-public-domain>/api/cron/generate-nurture?secret=$CRON_SECRET"
   ```
6. **Variables** tab → add `CRON_SECRET` with the same value from step 1. (Or use Railway **Project → Shared Variables** so both crons inherit it.)

### Cron B: send scheduled drafts (every 15 minutes)

Same steps as Cron A, with these differences:
- Service name: `cron-send-scheduled`
- Cron schedule: `*/15 * * * *`
- Start command:
  ```
  curl -fsS "https://<your-public-domain>/api/cron/send-scheduled-drafts?secret=$CRON_SECRET"
  ```

## 7. Force-trigger each cron once to verify

In each cron service → **Deployments** → **⋯** menu → **Redeploy**. Watch the **Logs** tab. You should see something like:

```
{"generated":0,"skipped":3,"errors":0}
```

for `cron-generate-nurture`, and:

```
{"sent":0,"failed":0,"skipped":0}
```

for `cron-send-scheduled` (zeros are fine — means there's nothing due yet).

In your **main service** logs you'll see the matching `[nurture]` / `[sender]` lines.

## 8. End-to-end smoke test (optional)

To prove auto-send actually fires:

1. In the app, create a contact with an email address you control.
2. Manually flip its `createdAt` to >90 days ago and `nurtureAutoSend = true` (via the Prisma Studio in `npx prisma studio` against your prod DB, or just wait).
3. Trigger `cron-generate-nurture` — a draft is created with `status='scheduled'` and `scheduledSendAt = now + 24h`.
4. Manually update that draft's `scheduledSendAt` to a past timestamp.
5. Trigger `cron-send-scheduled` — the draft should be sent and status flips to `sent`.

## How to disable auto-send for a specific contact

Set `nurtureAutoSend = false` on that contact. Drafts will still be generated but stay in `status='draft'` waiting for a manual click.

## Cost estimate

- Main service: ~$5/month (Hobby plan baseline) — already what you're paying.
- Each cron service: ~$0.10/month (runs for ~2 seconds per invocation).
- Resend free tier: $0 up to 3,000 emails/month.

Total added cost: under $1/month.
