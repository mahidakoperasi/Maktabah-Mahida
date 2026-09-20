-- Mahida Digital media CMS: YouTube, Facebook, and photo galleries

DO $$
BEGIN
  CREATE TYPE "post_status" AS ENUM ('draft', 'scheduled', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "videos" (
  "id" serial PRIMARY KEY,
  "title" varchar(500) NOT NULL,
  "slug" varchar(500) NOT NULL,
  "video_id" varchar(20) NOT NULL,
  "platform" varchar(20) DEFAULT 'youtube',
  "description" text,
  "thumbnail_url" text,
  "category_id" integer,
  "post_id" integer,
  "featured" boolean DEFAULT false,
  "published_at" timestamp,
  "status" "post_status" NOT NULL DEFAULT 'published',
  "view_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "videos_slug_unique" ON "videos" ("slug");
CREATE INDEX IF NOT EXISTS "videos_status_published_idx" ON "videos" ("status", "published_at");

CREATE TABLE IF NOT EXISTS "social_posts" (
  "id" serial PRIMARY KEY,
  "platform" varchar(50) NOT NULL,
  "post_url" text NOT NULL,
  "caption" text,
  "image_url" text,
  "category_id" integer,
  "published_at" timestamp,
  "featured" boolean DEFAULT false,
  "status" "post_status" NOT NULL DEFAULT 'published',
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "social_posts_platform_status_idx" ON "social_posts" ("platform", "status");
CREATE INDEX IF NOT EXISTS "social_posts_published_at_idx" ON "social_posts" ("published_at");

CREATE TABLE IF NOT EXISTS "galleries" (
  "id" serial PRIMARY KEY,
  "title" varchar(500) NOT NULL,
  "slug" varchar(500) NOT NULL,
  "description" text,
  "type" varchar(50) DEFAULT 'album',
  "cover_image" text,
  "event_id" integer,
  "status" "post_status" NOT NULL DEFAULT 'published',
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "galleries_slug_unique" ON "galleries" ("slug");
CREATE INDEX IF NOT EXISTS "galleries_type_status_idx" ON "galleries" ("type", "status");

CREATE TABLE IF NOT EXISTS "gallery_images" (
  "id" serial PRIMARY KEY,
  "gallery_id" integer REFERENCES "galleries"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "caption" text,
  "sort_order" integer DEFAULT 0,
  "focal_point_x" real,
  "focal_point_y" real
);

CREATE INDEX IF NOT EXISTS "gallery_images_gallery_sort_idx" ON "gallery_images" ("gallery_id", "sort_order");
