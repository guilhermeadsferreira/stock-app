ALTER TYPE "stock"."payment_type" ADD VALUE 'card';--> statement-breakpoint
ALTER TYPE "stock"."payment_type" ADD VALUE 'pix';--> statement-breakpoint
ALTER TABLE "stock"."customers" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "stock"."customers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "stock"."products" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "stock"."products" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "stock"."user_profiles" ADD COLUMN "name" text;