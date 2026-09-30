# Finalisasi desain Mahida — review dan rilis terpisah

Pekerjaan ini berasal dari `chore/production-readiness` commit `5dfd7e787979019138e985eda813f7c58aa5d12a` (pasca-PR16). Tidak ada akses VPS, perubahan database produksi, merge, atau deployment dalam pekerjaan ini.

## Perubahan halaman

| Halaman | Hasil |
| --- | --- |
| Beranda | Hero hijau saat kosong; foto dengan gradasi 35% → 25% → transparan; video tanpa overlay hijau, poster/fallback, putar/jeda. Karya terbit lintas Artikel/Esai/Terjemahan/Manuskrip tampil sebelum unit aktif. |
| Profil | Editor format aman, bagian resmi berjudul yang dapat diurutkan/dinonaktifkan, kliping di antara bagian, lokasi dan peta tervalidasi. Gambar lama tidak ditampilkan dua kali. |
| Lima unit | Data terpisah, Tentang Unit dari CMS, fasilitas dinamis dengan urutan/status; tidak ada empat fasilitas dummy. Jenjang, akreditasi terisi, breadcrumb dan CTA lama dipertahankan. Bagian yang disarankan berbeda untuk setiap jenis unit dan berisi teks kosong sampai Admin mengisinya. |
| Kontak | Direktori lama digunakan ulang per layanan, alamat/Maps/jam resmi, formulir opsional menuju inbox Admin. Data pribadi tidak muncul di halaman publik. |
| Pendaftaran | Tautan daftar lama dipertahankan dan ditampilkan di hero, brosur PDF, biaya resmi, timeline, kartu berkas, FAQ, testimoni berizin dan carousel kliping. WhatsApp mengambang hanya jika kontak PPDB aktif. |
| Media/Kegiatan/Video/Galeri | Hero dan tiga kartu visual, kegiatan terbit bertanggal, sorotan dari ID video terbit yang sudah ada, daftar video, galeri foto dengan rasio asli dan lightbox keyboard. Tidak membuat kategori atau filter contoh. |
| Identitas bersama | Logo Admin, navbar/mobile dan footer memakai sumber Admin. Aset bawaan WebP memiliki kanal alpha transparan; komponen logo sekarang tanpa latar media. Untuk logo lain yang putihnya menyatu dalam berkas, Admin mengganti dengan aset transparan. |

Template lama tetap digunakan untuk halaman di luar cakupan. Tidak ada fakta institusi, nomor, biaya, akreditasi, pengurus atau jadwal yang ditambahkan ke produksi.

## Alur Admin

1. **Halaman & Navigasi**: judul, pengantar, isi utama, status halaman dan menu. Halaman dalam cakupan memakai editor paragraf/heading/tebal/daftar/tautan serta pratinjau aman.
2. **Visual & Unit Pendidikan**: metadata dan fasilitas lama. Fasilitas dapat ditambah, dihapus, disusun dan disembunyikan. Bagian Tentang Unit, Fasilitas dan CTA dapat dinonaktifkan. Kemampuan PR16 tetap tersedia.
3. **Bagian Konten Resmi**: bagian terstruktur per halaman; rekomendasi judul adalah label isian, seluruh isi awal kosong dan nonaktif. Di sini juga mengatur Maps, jam layanan, pengaktifan formulir kontak, biaya/brosur/FAQ/testimoni dan ID video sorotan.
4. **Kliping Visual**: URL HTTPS/Drive/MP4/YouTube atau pilihan dari galeri/video terbit. Area responsif `hero`, `inline`, `gallery`, serta tiga foto kartu khusus Media. Ukuran/rasio/titik fokus/alt/poster, drag-and-drop dan tombol naik/turun tersedia. Pemilihan bagian menempatkan media sesudah bagian teks yang dipilih. Teks, tombol, navbar/footer tidak dapat disunting pada editor ini.
5. **Simpan Draf → Pratinjau Draf tersimpan → Terbitkan**. Pratinjau memakai halaman publik yang sama pada 375/768/1440px dengan penanda area media dan hanya dapat membaca draf setelah autentikasi Admin diperiksa. Simpan perubahan dahulu sebelum pratinjau. Menu navigasi tetap mengikuti status terbit.
6. **Pulihkan Versi**: 20 versi terbit terakhir disimpan. Pulihkan media lama sebelum Kliping tersedia untuk kembali ke fallback legacy. Konflik penyimpanan dua sesi ditolak dengan HTTP 409; muat ulang sebelum menyimpan lagi.
7. **Pesan Kontak**: inbox privat, 50 pesan per halaman; Admin membalas melalui kontak yang diisi pengirim dan menandai pesan selesai/baru. Tidak mengklaim pesan otomatis dikirim melalui email/WhatsApp.

MP4 harus URL HTTPS langsung dengan path `.mp4`, termasuk query token bila diperlukan. Autoplay tergantung browser/sumber. Drive memakai poster dan tombol Putar; berkas privat atau sumber yang menolak embed harus diganti Admin. Media tidak diunduh/disimpan pada kontainer dan tidak ada layanan berbayar baru.

## Audit pemetaan dan migrasi

Migrasi tambahan `drizzle/0010_design_finalization.sql` tidak mengubah file migrasi lama dan tidak menghapus data.

| Data lama | Perlakuan |
| --- | --- |
| `settings.homepage` | Tetap sumber identitas, teks hero, pilihan Karya dan label bagian. Hanya judul stok “Berita & Artikel Terbaru” diganti “Karya-karya Terbaru”; judul kustom dan ID pilihan dipertahankan. Pilihan berita lama yang tidak cocok Karya kembali ke karya terbit terbaru. |
| `settings.editorial:<path>` | Tidak dimigrasikan/destruktif; `images` dan fasilitas tetap fallback. Gambar fallback ditampilkan sekali. Kliping terbit menggantikan media halaman; fasilitas konten lama tetap tersedia. |
| `cms_pages` / `navigation_items` | Tidak diubah migrasi. Konten utama dan status lama tetap digunakan; hanya pratinjau Admin terautentikasi dapat membaca halaman draf. |
| Artikel/Karya/video/galeri/admissions/direktori | Menggunakan modul/tabel lama; tidak menduplikasi entri. |
| `design_documents` (baru) | Kunci `(path,kind)`, `kind=media/content`, draf, terbit, riwayat, nomor revisi dan Admin pengubah. Transaksi + row lock melindungi terbit/rollback. |
| `contact_messages` (baru) | Data pesan privat, waktu dan status penanganan. Hanya API Admin dapat membacanya. |
| `contact_rate_limits` (baru) | Kuota persisten 15 menit: 5 per kontak balasan, 20 per alamat jaringan, 100 keseluruhan; hash HMAC, honeypot, validasi dan pembatasan asal permintaan. Kunci kuota berusia >1 hari dibersihkan saat pesan diterima. |

Proxy menghapus header pratinjau buatan klien. URL iframe mentah/HTML/script tidak diterima; embed Maps hanya Google Maps resmi, video embed hanya Drive/YouTube yang dikenali. RichContent merender elemen React aman tanpa HTML mentah. Reverse proxy saat rilis harus menimpa header alamat jaringan, agar kuota jaringan tidak memakai header klien palsu. Kuota kontak dan keseluruhan tetap berjalan secara terpisah.

## Validasi

- `npm run lint`: tidak ada error; satu warning font lama pada layout.
- `npm run typecheck` dan `npm run build`.
- Migrasi 0000–0010 pada PostgreSQL 16 lokal terpisah `mahida_ci`; 0010 diuji ulang untuk memeriksa data CMS/editorial lama tidak berubah.
- Playwright (23 tes lulus): 320/375/768/1024/1440px, navigasi publik/Admin, input editor, empty state, draft/published, pratinjau privat/spoofed header, revisi usang, rollback versi dan fallback lama, video/photo overlay, video gagal/Drive/autoplay ditolak, pesan privat/spam, lightbox dan keyboard, serta alur UI Kliping (drag-and-drop serta tombol urutan) dan pendaftaran.
- Pengujian menolak database selain `mahida_ci`. Semua contoh data uji hanya ada di database tersebut.
- Browser lokal memakai Chromium headless alternatif melalui `PW_CHROMIUM_EXECUTABLE`; CI memakai browser Playwright yang diinstal workflow.
- Docker build/image export diverifikasi oleh workflow **Production Check** setelah PR dibuat; Docker tidak tersedia di workspace lokal.

## Panduan rilis setelah PR disetujui (belum dijalankan)

1. Tinjau diff, tunggu **Production Check** hijau, dan periksa contoh media nyata di lingkungan preview. Merge PR ke `chore/production-readiness` dilakukan terpisah setelah persetujuan.
2. Unduh artifact `mahida-editorial-image` dari workflow pada SHA PR yang sudah digabung. Pindahkan archive ke `/root/mahida-backups/mahida-editorial-image.tar.gz` sesuai alur rilis proyek.
3. Di VPS, pastikan working tree bersih sebelum menarik perubahan:

   ```bash
   git -C /opt/Maktabah-Mahida status --short --branch
   git -C /opt/Maktabah-Mahida pull --ff-only origin chore/production-readiness
   ```

4. Jalankan script rilis yang sudah ada setelah archive dan SHA sesuai:

   ```bash
   bash /opt/Maktabah-Mahida/mahida-digital-website-blueprint/scripts/release-editorial.sh /root/mahida-backups/mahida-editorial-image.tar.gz
   ```

   Script mencadangkan DB dan memeriksa dump, memvalidasi SHA image, menjalankan migrasi, memeriksa container preview di 3001, lalu mengganti app di 3000 sambil mempertahankan container lama. Nginx tidak perlu diubah untuk fitur ini. Migrasi tambahan aman untuk aplikasi lama bila rollback app diperlukan.

5. Periksa setelah rilis:

   ```bash
   curl -fsS https://mahida.my.id/api/health
   docker inspect -f '{{.Config.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' mahida-app
   ```

   Uji login, halaman yang disebut, simpan draf kliping dan pastikan pengunjung tidak melihatnya, pratinjau, terbitkan satu media resmi, lalu pulihkan. Form kontak hanya aktif setelah Admin menerbitkan `contactFormEnabled`; kirim pesan uji resmi dan periksa inbox. Periksa HP/tablet/desktop serta video dengan media nyata. Tidak ada bagian resmi yang otomatis diisi atau diterbitkan.

## Rollback setelah rilis terpisah

- Untuk salah penataan: gunakan **Pulihkan Versi** atau **Pulihkan media lama sebelum Kliping**. Ini tidak menghapus data CMS.
- Untuk kegagalan aplikasi: script memulihkan container lama otomatis bila pemeriksaan gagal. Untuk rollback manual sesudah rilis sukses, nama cadangan tersimpan di `/root/mahida-backups/editorial-rollback-container.txt`:

  ```bash
  MAHIDA_OLD_CONTAINER=$(cat /root/mahida-backups/editorial-rollback-container.txt)
  docker stop mahida-app
  docker rename mahida-app "mahida-app-failed-$(date +%Y%m%d%H%M%S)"
  docker rename "$MAHIDA_OLD_CONTAINER" mahida-app
  docker start mahida-app
  curl -fsS https://mahida.my.id/api/health
  ```

- Pertahankan tabel tambahan saat rollback kode; jangan menjatuhkan tabel atau memulihkan seluruh DB bila tidak diperlukan. Restore dump dapat menghapus pesan/konten yang dibuat setelah backup dan harus direncanakan terpisah.
