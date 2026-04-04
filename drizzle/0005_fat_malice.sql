ALTER TABLE "stock"."sales" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stock"."sales" ALTER COLUMN "quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stock"."sales" ALTER COLUMN "unit_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stock"."sales" ALTER COLUMN "purchase_price_snapshot" DROP NOT NULL;