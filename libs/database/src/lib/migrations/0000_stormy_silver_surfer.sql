CREATE TABLE "servers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"memory_mb" integer NOT NULL,
	"jar_file" text NOT NULL,
	"server_directory" text NOT NULL,
	"version" text,
	"status" text NOT NULL
);
