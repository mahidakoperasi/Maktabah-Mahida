-- Mahida Digital homepage settings

CREATE TABLE IF NOT EXISTS "settings" (
  "key" varchar(255) PRIMARY KEY,
  "value" text,
  "type" varchar(50) DEFAULT 'string',
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "settings_updated_at_idx"
ON "settings" ("updated_at");
