ALTER TABLE "songs" ADD COLUMN "capo" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "capo_source" text;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_capo_check" CHECK (("songs"."capo" IS NULL AND ("songs"."capo_source" IS NULL OR "songs"."capo_source" = 'editor')) OR ("songs"."capo" BETWEEN 0 AND 11 AND "songs"."capo_source" IN ('sheet', 'ai', 'editor')));