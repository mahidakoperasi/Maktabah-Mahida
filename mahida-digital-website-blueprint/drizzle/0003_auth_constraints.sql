-- Align the auth tables created by 0000_auth_foundation.sql with src/db/schema.ts.
-- This migration intentionally fails if legacy rows contain invalid NULL values,
-- so production data can be repaired explicitly instead of silently corrupted.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "email" IS NULL
       OR "password" IS NULL
       OR "name" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot apply auth constraints: users contains NULL email/password/name values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "otp_codes"
    WHERE "code" IS NULL
       OR "expires_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot apply auth constraints: otp_codes contains NULL code/expires_at values';
  END IF;
END
$$;

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "otp_codes" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "otp_codes" ALTER COLUMN "expires_at" SET NOT NULL;
