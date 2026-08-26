-- Where the card was collected and what was actually discussed.
-- Nullable: every existing contact predates the field, and a blank note is a
-- valid state — it means the draft will not claim a conversation happened.
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "metAt" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "metNote" TEXT;
