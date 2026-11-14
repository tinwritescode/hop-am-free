CREATE TABLE "ai_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rhythms" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"time_signature" text NOT NULL,
	"subdivision" integer NOT NULL,
	"bpm" integer NOT NULL,
	"steps" jsonb NOT NULL,
	"feel" text NOT NULL,
	"how_to" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rhythms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "song_rhythms" (
	"song_id" integer NOT NULL,
	"rhythm_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"reason" text NOT NULL,
	CONSTRAINT "song_rhythms_song_id_rhythm_id_pk" PRIMARY KEY("song_id","rhythm_id")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"composer" text DEFAULT '' NOT NULL,
	"key" text NOT NULL,
	"genre" text DEFAULT '' NOT NULL,
	"rhythm" text DEFAULT '' NOT NULL,
	"contributor" text NOT NULL,
	"sheet" text NOT NULL,
	"source_url" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "songs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"settings" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "song_rhythms" ADD CONSTRAINT "song_rhythms_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_rhythms" ADD CONSTRAINT "song_rhythms_rhythm_id_rhythms_id_fk" FOREIGN KEY ("rhythm_id") REFERENCES "public"."rhythms"("id") ON DELETE cascade ON UPDATE no action;