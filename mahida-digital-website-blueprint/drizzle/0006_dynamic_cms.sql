-- CMS Tahap 2: navigasi, halaman, karya, media, katalog, dan pesanan e-book.
-- QRIS tidak disemai: pemesanan e-book ditutup sampai merchant mengisinya.

CREATE TABLE cms_pages (
  id serial PRIMARY KEY,
  path varchar(255) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  intro text,
  body text,
  status post_status NOT NULL DEFAULT 'draft',
  is_system boolean NOT NULL DEFAULT false,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE navigation_items (
  id serial PRIMARY KEY,
  parent_id integer REFERENCES navigation_items(id) ON DELETE RESTRICT,
  path varchar(255) NOT NULL UNIQUE,
  label varchar(100) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT navigation_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX navigation_parent_order_idx ON navigation_items(parent_id, sort_order, id);

-- Beranda remains in settings. Seed only safe section titles and approved general introductions.
INSERT INTO cms_pages(path,title,intro,status,is_system) VALUES
  ('/', 'Beranda', 'Ruang digital Mahida.', 'published', true),
  ('/pesantren', 'Pesantren', 'Mengenal kehidupan dan pendidikan Mahida.', 'published', true),
  ('/pesantren/sejarah', 'Sejarah', 'Perjalanan Mahida akan tampil setelah diverifikasi.', 'published', true),
  ('/pesantren/pendidikan', 'Pendidikan', 'Informasi pendidikan Mahida.', 'published', true),
  ('/pesantren/kehidupan', 'Kehidupan Pesantren', 'Kegiatan dan tradisi Mahida.', 'published', true),
  ('/karya', 'Karya', 'Ruang publikasi karya Mahida.', 'published', true),
  ('/karya/artikel', 'Artikel', 'Artikel yang diterbitkan Mahida.', 'published', true),
  ('/karya/esai', 'Esai & Opini', 'Esai dan opini Mahida.', 'published', true),
  ('/karya/terjemahan', 'Terjemahan', 'Terjemahan yang diterbitkan Mahida.', 'published', true),
  ('/karya/manuskrip', 'Manuskrip', 'Arsip manuskrip Mahida.', 'published', true),
  ('/koperasi', 'Koperasi', 'Buku fisik dan e-book Mahida.', 'published', true),
  ('/koperasi/buku', 'Buku Fisik', 'Katalog buku cetak Mahida.', 'published', true),
  ('/koperasi/ebook', 'E-Book', 'Katalog buku digital Mahida.', 'published', true),
  ('/media', 'Media', 'Kabar dan dokumentasi Mahida.', 'published', true),
  ('/media/berita', 'Berita', 'Kabar resmi Mahida.', 'published', true),
  ('/media/kegiatan', 'Kegiatan', 'Kegiatan Mahida.', 'published', true),
  ('/media/video', 'Video', 'Video dari kanal Mahida.', 'published', true),
  ('/media/galeri', 'Galeri', 'Dokumentasi foto Mahida.', 'published', true),
  ('/media/pengumuman', 'Pengumuman', 'Pengumuman resmi Mahida.', 'published', true),
  ('/tentang', 'Tentang Mahida', 'Informasi resmi mengenai Mahida.', 'published', true),
  ('/tentang/profil', 'Profil', 'Informasi umum mengenai Mahida.', 'published', true),
  ('/tentang/sejarah', 'Sejarah', 'Perjalanan Mahida akan tampil setelah diverifikasi.', 'published', true),
  ('/tentang/pendidikan', 'Pendidikan', 'Informasi pendidikan Mahida.', 'published', true),
  ('/tentang/pengasuh', 'Pengasuh', 'Informasi pengasuh akan tampil setelah diverifikasi.', 'published', true),
  ('/tentang/fasilitas', 'Fasilitas', 'Informasi fasilitas Mahida.', 'published', true),
  ('/tentang/visi-misi', 'Visi & Misi', 'Informasi akan tampil setelah diverifikasi.', 'published', true),
  ('/tentang/kontak', 'Kontak', 'Informasi kontak Mahida akan tersedia setelah diverifikasi.', 'published', true),
  ('/literasi', 'Literasi', 'Ruang baca Mahida.', 'published', true),
  ('/maktabah', 'Maktabah', 'Arsip bacaan Mahida.', 'published', true),
  ('/kegiatan', 'Kegiatan', 'Aktivitas Mahida.', 'published', true),
  ('/berita', 'Berita', 'Kabar resmi Mahida.', 'published', true),
  ('/agenda', 'Agenda', 'Jadwal kegiatan Mahida.', 'published', true),
  ('/arsip', 'Arsip', 'Arsip Mahida.', 'published', true);

INSERT INTO navigation_items(path,label,sort_order) VALUES
  ('/', 'Beranda', 0), ('/pesantren', 'Pesantren', 10),
  ('/karya', 'Karya', 20), ('/koperasi', 'Koperasi', 30),
  ('/media', 'Media', 40), ('/tentang', 'Tentang Mahida', 50);

INSERT INTO navigation_items(parent_id,path,label,sort_order)
SELECT p.id, x.path, x.label, x.sort_order FROM
  (VALUES
    ('/pesantren','/pesantren/sejarah','Sejarah',10),
    ('/pesantren','/pesantren/pendidikan','Pendidikan',20),
    ('/pesantren','/pesantren/kehidupan','Kehidupan Pesantren',30),
    ('/karya','/karya/artikel','Artikel',10),
    ('/karya','/karya/esai','Esai & Opini',20),
    ('/karya','/karya/terjemahan','Terjemahan',30),
    ('/karya','/karya/manuskrip','Manuskrip',40),
    ('/koperasi','/koperasi/buku','Buku Fisik',10),
    ('/koperasi','/koperasi/ebook','E-Book',20),
    ('/media','/media/berita','Berita',10),
    ('/media','/media/kegiatan','Kegiatan',20),
    ('/media','/media/video','Video',30),
    ('/media','/media/galeri','Galeri',40),
    ('/media','/media/pengumuman','Pengumuman',50),
    ('/tentang','/tentang/profil','Profil',10),
    ('/tentang','/tentang/visi-misi','Visi & Misi',20),
    ('/tentang','/tentang/kontak','Kontak',30)
  ) AS x(parent_path,path,label,sort_order)
JOIN navigation_items p ON p.path = x.parent_path;

ALTER TABLE posts ADD COLUMN karya_category varchar(30);
ALTER TABLE posts ADD CONSTRAINT posts_karya_category_check CHECK
  (karya_category IS NULL OR karya_category IN ('terjemahan', 'manuskrip'));

CREATE TABLE products (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL UNIQUE,
  description text,
  product_type varchar(20) NOT NULL CHECK (product_type IN ('physical_book','ebook')),
  price integer NOT NULL CHECK (price >= 0),
  image_url text,
  digital_file_url text,
  in_stock boolean NOT NULL DEFAULT true,
  status post_status NOT NULL DEFAULT 'draft',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CHECK (product_type = 'ebook' OR digital_file_url IS NULL)
);
CREATE INDEX products_type_status_idx ON products(product_type,status);

CREATE TABLE videos (
  id serial PRIMARY KEY,
  title varchar(500) NOT NULL,
  slug varchar(500) NOT NULL UNIQUE,
  youtube_id varchar(20) NOT NULL,
  description text,
  status post_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE galleries (
  id serial PRIMARY KEY,
  title varchar(500) NOT NULL,
  slug varchar(500) NOT NULL UNIQUE,
  description text,
  status post_status NOT NULL DEFAULT 'draft',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE gallery_images (
  id serial PRIMARY KEY,
  gallery_id integer NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE ebook_orders (
  id serial PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_snapshot varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  price_snapshot integer NOT NULL CHECK (price_snapshot >= 0),
  file_url_snapshot text NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'awaiting_payment' CHECK
    (status IN ('awaiting_payment','payment_review','paid','delivered','cancelled')),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  reported_at timestamp,
  paid_amount integer CHECK (paid_amount >= 0),
  paid_at timestamp,
  verified_at timestamp,
  delivered_at timestamp
);
CREATE INDEX ebook_orders_status_created_idx ON ebook_orders(status, created_at);
