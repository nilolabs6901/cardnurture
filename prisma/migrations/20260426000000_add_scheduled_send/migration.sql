-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "nurtureAutoSend" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "EmailDraft" ADD COLUMN "scheduledSendAt" TIMESTAMP(3);
ALTER TABLE "EmailDraft" ADD COLUMN "sentAt" TIMESTAMP(3);
