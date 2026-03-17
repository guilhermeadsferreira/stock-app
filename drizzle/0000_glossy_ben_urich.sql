CREATE SCHEMA "stock";
--> statement-breakpoint
CREATE TYPE "stock"."movement_reason" AS ENUM('purchase', 'adjustment', 'sale', 'loss', 'return');--> statement-breakpoint
CREATE TYPE "stock"."movement_type" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "stock"."payment_type" AS ENUM('cash', 'credit');--> statement-breakpoint
CREATE TABLE "stock"."businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"expiration_alert_days" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."credit_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"barcode" text,
	"purchase_price" integer NOT NULL,
	"sale_price" integer NOT NULL,
	"expiration_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"purchase_price_snapshot" integer NOT NULL,
	"payment_type" "stock"."payment_type" NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."stock_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "stock"."movement_type" NOT NULL,
	"reason" "stock"."movement_reason" NOT NULL,
	"quantity" integer NOT NULL,
	"sale_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock"."user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"business_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock"."credit_payments" ADD CONSTRAINT "credit_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "stock"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock"."sales" ADD CONSTRAINT "sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "stock"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock"."sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "stock"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock"."stock_entries" ADD CONSTRAINT "stock_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "stock"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock"."stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "stock"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_invite_code_idx" ON "stock"."businesses" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "credit_payments_customer_idx" ON "stock"."credit_payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_business_id_idx" ON "stock"."customers" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "barcode_business_idx" ON "stock"."products" USING btree ("barcode","business_id");--> statement-breakpoint
CREATE INDEX "products_business_id_idx" ON "stock"."products" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "sales_business_id_idx" ON "stock"."sales" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "sales_customer_id_idx" ON "stock"."sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "stock"."sales" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_entry_product_idx" ON "stock"."stock_entries" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock"."stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_business_idx" ON "stock"."stock_movements" USING btree ("business_id");