ALTER TABLE "servers" ALTER COLUMN "jar_file" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "launch" jsonb;