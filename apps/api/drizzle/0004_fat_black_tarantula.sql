CREATE TABLE "item_categories" (
	"normalized_name" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"confidence" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopping_items" ADD COLUMN "possible_duplicate_of_id" uuid;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD COLUMN "auto_categorize" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_possible_duplicate_of_id_shopping_items_id_fk" FOREIGN KEY ("possible_duplicate_of_id") REFERENCES "public"."shopping_items"("id") ON DELETE set null ON UPDATE no action;