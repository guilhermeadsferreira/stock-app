CREATE TABLE "stock"."user_business" (
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_business_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
ALTER TABLE "stock"."user_business" ADD CONSTRAINT "user_business_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "stock"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_business_user_id_idx" ON "stock"."user_business" USING btree ("user_id");