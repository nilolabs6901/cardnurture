# Gates: PostgreSQL deployment alignment

Scope: make the documented local/deployment configuration match the live PostgreSQL schema.

- [ ] G1: example environment uses PostgreSQL
  CHECK: grep -n 'DATABASE_URL="postgresql://' .env.example
  EXPECT: DATABASE_URL="postgresql://
  EVIDENCE: pending

- [ ] G2: README no longer instructs SQLite setup
  CHECK: ! grep -nEi 'SQLite|file:\./dev\.db' README.md
  EXPECT: 
  EVIDENCE: pending
- [ ] G1: example environment uses PostgreSQL
  CHECK: grep -q 'DATABASE_URL="postgresql://' .env.example && printf 'postgres-env-pass'
  EXPECT: postgres-env-pass
  EVIDENCE: pending

- [ ] G2: Prisma validates against a PostgreSQL URL
  CHECK: DATABASE_URL='postgresql://cardnurture:***@localhost:5432/cardnurture?schema=public' npx prisma validate && printf 'prisma-validate-pass'
  EXPECT: prisma-validate-pass
  EVIDENCE: pending

- [ ] G3: deployment setup documents migration and required production variables
  CHECK: grep -qE 'PostgreSQL|prisma migrate deploy|NEXTAUTH_SECRET|CRON_SECRET' README.md && printf 'deployment-docs-pass'
  EXPECT: deployment-docs-pass
  EVIDENCE: pending
