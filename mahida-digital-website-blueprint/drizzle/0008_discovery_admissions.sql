-- Preserve the author's class as printed when each work was published.
CREATE TABLE IF NOT EXISTS authors (
  id serial PRIMARY KEY,
  slug varchar(255) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  photo text,
  bio text,
  institution varchar(255),
  email varchar(255),
  created_at timestamp DEFAULT now()
);

-- Existing deployments may contain author_id values from an older import.
-- Keep those values intact; add the constraint only where all references exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_author_id_authors_id_fk')
    AND NOT EXISTS (
      SELECT 1 FROM posts p LEFT JOIN authors a ON a.id = p.author_id
      WHERE p.author_id IS NOT NULL AND a.id IS NULL
    ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_author_id_authors_id_fk
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE posts ADD COLUMN author_class varchar(100);
CREATE INDEX posts_author_archive_idx ON posts(author_id, status, published_at DESC);

CREATE TABLE admission_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  introduction text NOT NULL DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  application_label varchar(100) NOT NULL DEFAULT 'Daftar Sekarang',
  application_url text NOT NULL DEFAULT '',
  updated_at timestamp NOT NULL DEFAULT now()
);
INSERT INTO admission_settings (id) VALUES (1);

INSERT INTO cms_pages(path, title, intro, status, is_system)
VALUES ('/tentang/pendaftaran', 'Informasi Pendaftaran Santri', 'Informasi pendaftaran santri Pondok Pesantren Mahida.', 'published', true)
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items(parent_id, path, label, sort_order)
SELECT id, '/tentang/pendaftaran', 'Informasi Pendaftaran Santri', 25
FROM navigation_items WHERE path = '/tentang'
ON CONFLICT (path) DO NOTHING;
