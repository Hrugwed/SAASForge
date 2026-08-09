-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE_EXPIRED';

-- AlterTable (defaults safely backfill any pre-existing delivery records)
ALTER TABLE "processed_webhook" ADD COLUMN     "eventType" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "livemode" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "processed_webhook" ALTER COLUMN "eventType" DROP DEFAULT,
ALTER COLUMN "livemode" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "planKey" TEXT,
ADD COLUMN     "providerEventCreatedAt" TIMESTAMP(3);
