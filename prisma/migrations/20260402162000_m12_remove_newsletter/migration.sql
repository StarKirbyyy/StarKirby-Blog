-- Remove newsletter feature data structures
DROP TABLE IF EXISTS "public"."NewsletterDelivery";
DROP TABLE IF EXISTS "public"."NewsletterCampaign";
DROP TABLE IF EXISTS "public"."NewsletterSubscriber";

DROP TYPE IF EXISTS "public"."NewsletterDeliveryStatus";
DROP TYPE IF EXISTS "public"."NewsletterCampaignStatus";
DROP TYPE IF EXISTS "public"."NewsletterStatus";
