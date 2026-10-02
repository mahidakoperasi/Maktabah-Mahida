-- Additive: legacy galleries and their public images remain unchanged.
CREATE TABLE IF NOT EXISTS gallery_documents (
  gallery_id integer PRIMARY KEY REFERENCES galleries(id) ON DELETE CASCADE,
  draft jsonb NOT NULL,
  published jsonb,
  candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  synced_at timestamptz,
  updated_by integer REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
