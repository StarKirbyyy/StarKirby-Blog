-- CreateEnum
CREATE TYPE "public"."NewsletterCampaignStatus" AS ENUM ('queued', 'partial', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "public"."NewsletterDeliveryStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "public"."NewsletterCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "public"."NewsletterCampaignStatus" NOT NULL DEFAULT 'queued',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "senderEmail" TEXT NOT NULL,
    "replyToEmail" TEXT,
    "errorSummary" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsletterDelivery" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT,
    "email" TEXT NOT NULL,
    "status" "public"."NewsletterDeliveryStatus" NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_createdAt_idx" ON "public"."NewsletterCampaign"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdByUserId_createdAt_idx" ON "public"."NewsletterCampaign"("createdByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterDelivery_campaignId_email_key" ON "public"."NewsletterDelivery"("campaignId", "email");

-- CreateIndex
CREATE INDEX "NewsletterDelivery_campaignId_status_createdAt_idx" ON "public"."NewsletterDelivery"("campaignId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NewsletterDelivery_subscriberId_createdAt_idx" ON "public"."NewsletterDelivery"("subscriberId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."NewsletterCampaign" ADD CONSTRAINT "NewsletterCampaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."NewsletterCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "public"."NewsletterSubscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
