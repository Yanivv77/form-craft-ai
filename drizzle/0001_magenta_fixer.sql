CREATE TABLE "generation_cache" (
	"prompt_hash" text PRIMARY KEY NOT NULL,
	"form_def" jsonb NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"day" text NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_day_scope_key_pk" PRIMARY KEY("day","scope","key")
);
