-- Additive only: legacy editorial/settings, CMS and media rows remain untouched.
CREATE TABLE IF NOT EXISTS design_documents (
 path text NOT NULL, kind text NOT NULL CHECK(kind IN ('media','content')),
 draft jsonb, published jsonb, history jsonb NOT NULL DEFAULT '[]'::jsonb,
 revision integer NOT NULL DEFAULT 0, updated_by integer REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(path,kind)
);
CREATE TABLE IF NOT EXISTS contact_messages (
 id serial PRIMARY KEY, name varchar(100) NOT NULL, reply_to varchar(200) NOT NULL,
 subject varchar(200) NOT NULL, message varchar(5000) NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'new' CHECK(status IN ('new','handled')),
 created_at timestamptz NOT NULL DEFAULT now(), handled_at timestamptz
);
CREATE TABLE IF NOT EXISTS contact_rate_limits (
 visitor_hash varchar(64) PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, window_start timestamptz NOT NULL DEFAULT now()
);
-- Only rename the old stock heading, preserving customized headings and selected IDs.
UPDATE settings SET value=jsonb_set(value::jsonb, '{newsTitle}', '"Karya-karya Terbaru"'::jsonb)::text
WHERE key='homepage' AND value::jsonb->>'newsTitle'='Berita & Artikel Terbaru';
