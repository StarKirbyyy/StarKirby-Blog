-- AlterTable
ALTER TABLE "public"."Post"
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Post_viewCount_idx" ON "public"."Post"("viewCount");

-- CreateEnum
CREATE TYPE "public"."NewsletterStatus" AS ENUM ('active', 'unsubscribed');

-- CreateTable
CREATE TABLE "public"."NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "public"."NewsletterStatus" NOT NULL DEFAULT 'active',
    "source" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "public"."NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_subscribedAt_idx" ON "public"."NewsletterSubscriber"("status", "subscribedAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "public"."NewsletterSubscriber"("createdAt");
