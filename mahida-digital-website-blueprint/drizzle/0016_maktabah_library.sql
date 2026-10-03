-- Additive: existing translation posts remain the canonical content identity.
CREATE TABLE IF NOT EXISTS maktabah_fans (
  slug text PRIMARY KEY,
  name text NOT NULL,
  intro text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  image_alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  revision integer NOT NULL DEFAULT 0
);
INSERT INTO maktabah_fans(slug,name,sort_order) VALUES
('tafsir','Al-Qur’an & Tafsir',10),('hadits','Hadis & Ilmu Hadis',20),
('fiqh','Fikih',30),('usul-fiqh','Usul Fikih',40),('aqidah','Akidah',50),
('tasawuf','Akhlak & Tasawuf',60),('nahwu','Nahwu',70),('sharaf','Sharaf',80),
('balaghah','Balaghah',90),('sirah-tarikh','Sirah & Tarikh',100),
('koleksi-terjemahan','Koleksi Terjemahan',110)
ON CONFLICT(slug) DO NOTHING;
CREATE TABLE IF NOT EXISTS maktabah_books (
  post_id integer PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  draft jsonb NOT NULL DEFAULT '{}',
  published jsonb,
  revision integer NOT NULL DEFAULT 0,
  chapters jsonb NOT NULL DEFAULT '[]',
  document_id text NOT NULL DEFAULT '',
  content_hash text NOT NULL DEFAULT '',
  sync_paused boolean NOT NULL DEFAULT false,
  blocked boolean NOT NULL DEFAULT false,
  sync_error text NOT NULL DEFAULT '',
  last_checked_at timestamptz,
  last_synced_at timestamptz
);
CREATE INDEX IF NOT EXISTS maktabah_books_doc_idx ON maktabah_books(document_id);
