-- Preserve the author's class as printed when each work was published.
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
