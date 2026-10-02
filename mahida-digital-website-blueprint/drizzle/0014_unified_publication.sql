-- Additive publication staging; no existing content/menu/album is rewritten.
CREATE TABLE IF NOT EXISTS publication_documents (
  target text PRIMARY KEY,
  draft jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  scheduled jsonb,
  scheduled_at timestamptz,
  scheduled_by integer REFERENCES users(id) ON DELETE SET NULL,
  scheduled_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scheduled IS NULL) = (scheduled_at IS NULL))
);
CREATE INDEX IF NOT EXISTS publication_due_idx ON publication_documents(scheduled_at) WHERE scheduled_at IS NOT NULL;
