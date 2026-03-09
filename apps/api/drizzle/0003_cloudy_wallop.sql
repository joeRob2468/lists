CREATE TABLE "shared_list_access" (
	"user_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_list_access_user_id_list_id_pk" PRIMARY KEY("user_id","list_id")
);
--> statement-breakpoint
ALTER TABLE "shared_list_access" ADD CONSTRAINT "shared_list_access_list_id_shopping_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE cascade ON UPDATE no action;