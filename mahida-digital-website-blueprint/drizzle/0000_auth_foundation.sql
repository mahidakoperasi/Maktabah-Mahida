-- Mahida Digital auth foundation
-- Safe, non-destructive migration for the users and otp_codes tables.

DO $$
BEGIN
  CREATE TYPE "user_role" AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "uuid" uuid DEFAULT gen_random_uuid();
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_uuid_unique" ON "users" ("uuid");

CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" serial PRIMARY KEY
);

ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "code" varchar(6);
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "type" varchar(50);
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "used" boolean DEFAULT false;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0;
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();

DO $$
BEGIN
  ALTER TABLE "otp_codes"
    ADD CONSTRAINT "otp_codes_user_id_users_id_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE INDEX IF NOT EXISTS "otp_codes_user_id_idx" ON "otp_codes" ("user_id");
CREATE INDEX IF NOT EXISTS "otp_codes_lookup_idx"
  ON "otp_codes" ("user_id", "type", "used", "expires_at");
