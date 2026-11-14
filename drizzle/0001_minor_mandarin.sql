CREATE TABLE "api_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "cli_logins" (
	"device_hash" text PRIMARY KEY NOT NULL,
	"user_code" text NOT NULL,
	"client_name" text NOT NULL,
	"user_id" text,
	"email" text,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "cli_logins_user_code_unique" UNIQUE("user_code")
);
