DROP INDEX "orders_stripe_session_idx";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "stripe_checkout_session_id";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "stripe_account_id";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "stripe_details_submitted";