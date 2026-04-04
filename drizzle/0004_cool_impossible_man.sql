CREATE TABLE "stock"."sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"unit_cost" integer NOT NULL,
	"discount_pct" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock"."products" ADD COLUMN "max_discount_pct" integer;--> statement-breakpoint
ALTER TABLE "stock"."sales" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
ALTER TABLE "stock"."sales" ADD COLUMN "status" text DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock"."sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "stock"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock"."sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "stock"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_items_sale_id_idx" ON "stock"."sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_product_id_idx" ON "stock"."sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sales_seller_id_idx" ON "stock"."sales" USING btree ("seller_id");