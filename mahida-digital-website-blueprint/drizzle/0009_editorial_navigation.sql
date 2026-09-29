-- Seed only the requested design routes. Existing content and page bodies are preserved.
INSERT INTO cms_pages (path, title, status, is_system) VALUES
  ('/tentang/unit-pendidikan/madrasah-diniyyah', 'Madrasah Diniyyah Mahida Salam', 'published', true),
  ('/tentang/unit-pendidikan/madrasah-al-quran', 'Madrasah Al-Qur''an Mahida Salam', 'published', true),
  ('/tentang/unit-pendidikan/madrasah-tsanawiyah', 'Madrasah Tsanawiyah Mahida Salam', 'published', true),
  ('/tentang/unit-pendidikan/madrasah-aliyyah', 'Madrasah Aliyyah Mahida Salam', 'published', true),
  ('/tentang/unit-pendidikan/unu-blitar', 'Universitas Nahdlatul Ulama'' Blitar di Mahida Salam', 'published', true)
ON CONFLICT (path) DO NOTHING;

-- Keep old pages and menu records for direct links and easy reconfiguration.
-- Only the requested items are initially visible in public navigation.
UPDATE navigation_items SET is_visible = false;

INSERT INTO navigation_items (path, label, parent_id, sort_order, is_visible) VALUES
  ('/', 'Beranda', NULL, 0, true),
  ('/tentang', 'Tentang Mahida', NULL, 10, true),
  ('/media', 'Media', NULL, 20, true),
  ('/tentang/pendaftaran', 'Gabung Bersama Kami', NULL, 30, true)
ON CONFLICT (path) DO UPDATE SET
  label = EXCLUDED.label, parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order, is_visible = EXCLUDED.is_visible;

INSERT INTO navigation_items (path, label, parent_id, sort_order, is_visible)
SELECT x.path, x.label, p.id, x.sort_order, true
FROM (VALUES
  ('/tentang', '/tentang/profil', 'Profil', 10),
  ('/tentang', '/tentang/pendidikan', 'Unit Pendidikan', 20),
  ('/tentang', '/tentang/visi-misi', 'Visi & Misi', 30),
  ('/tentang', '/pesantren/kehidupan', 'Kehidupan Pesantren', 40),
  ('/tentang', '/tentang/kontak', 'Kontak', 50),
  ('/media', '/media/kegiatan', 'Kegiatan', 10),
  ('/media', '/media/video', 'Vidio', 20),
  ('/media', '/media/galeri', 'Galeri', 30),
  ('/media', '/media/pengumuman', 'Pengumuman', 40)
) AS x(parent_path, path, label, sort_order)
JOIN navigation_items p ON p.path = x.parent_path
ON CONFLICT (path) DO UPDATE SET
  label = EXCLUDED.label, parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order, is_visible = EXCLUDED.is_visible;

INSERT INTO navigation_items (path, label, parent_id, sort_order, is_visible)
SELECT x.path, x.label, p.id, x.sort_order, true
FROM (VALUES
  ('/tentang/unit-pendidikan/madrasah-diniyyah', 'Madrasah Diniyyah Mahida Salam', 10),
  ('/tentang/unit-pendidikan/madrasah-al-quran', 'Madrasah Al-Qur''an Mahida Salam', 20),
  ('/tentang/unit-pendidikan/madrasah-tsanawiyah', 'Madrasah Tsanawiyah Mahida Salam', 30),
  ('/tentang/unit-pendidikan/madrasah-aliyyah', 'Madrasah Aliyyah Mahida Salam', 40),
  ('/tentang/unit-pendidikan/unu-blitar', 'Universitas Nahdlatul Ulama'' Blitar di Mahida Salam', 50)
) AS x(path, label, sort_order)
JOIN navigation_items p ON p.path = '/tentang/pendidikan'
ON CONFLICT (path) DO UPDATE SET
  label = EXCLUDED.label, parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order, is_visible = EXCLUDED.is_visible;
