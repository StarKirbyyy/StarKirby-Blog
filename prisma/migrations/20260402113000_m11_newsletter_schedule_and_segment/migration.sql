-- AlterTable
ALTER TABLE "public"."NewsletterCampaign"
ADD COLUMN "segmentTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "scheduledAt" TIMESTAMP(3),
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);
