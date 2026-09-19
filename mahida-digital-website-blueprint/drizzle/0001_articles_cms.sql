-- Mahida Digital article CMS foundation

DO $$
BEGIN
  CREATE TYPE "post_type" AS ENUM ('article', 'essay', 'news', 'work', 'story', 'announcement');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "post_status" AS ENUM ('draft', 'scheduled', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "posts" (
  "id" serial PRIMARY KEY,
  "title" varchar(500) NOT NULL,
  "slug" varchar(500) NOT NULL,
  "excerpt" text,
  "content" text,
  "content_raw" text,
  "type" "post_type" NOT NULL DEFAULT 'article',
  "status" "post_status" NOT NULL DEFAULT 'draft',
  "featured_image" text,
  "author_id" integer,
  "created_by" integer,
  "published_at" timestamp,
  "scheduled_at" timestamp,
  "editor_pick" boolean DEFAULT false,
  "view_count" integer DEFAULT 0,
  "meta_title" varchar(500),
  "meta_description" text,
  "og_image" text,
  "canonical_url" text,
  "indexable" boolean DEFAULT true,
  "reading_time" integer,
  "docx_file" text,
  "allow_docx_download" boolean DEFAULT false,
  "archive_year" integer,
  "archive_month" integer,
  "event_id" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_unique" ON "posts" ("slug");
CREATE INDEX IF NOT EXISTS "posts_type_status_idx" ON "posts" ("type", "status");
CREATE INDEX IF NOT EXISTS "posts_published_at_idx" ON "posts" ("published_at");
CREATE INDEX IF NOT EXISTS "posts_created_by_idx" ON "posts" ("created_by");

DO $$
BEGIN
  ALTER TABLE "posts"
    ADD CONSTRAINT "posts_created_by_users_id_fk"
    FOREIGN KEY ("created_by")
    REFERENCES "users"("id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
