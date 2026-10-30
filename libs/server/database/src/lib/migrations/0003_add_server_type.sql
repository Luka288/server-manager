ALTER TABLE "servers" ADD COLUMN "loader_version" text;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "type" text DEFAULT 'vanilla' NOT NULL;