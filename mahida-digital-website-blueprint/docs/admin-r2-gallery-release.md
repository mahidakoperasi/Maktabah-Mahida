# Rilis 2 — Galeri Folder Drive

## Dipertahankan

Semua menu, rute, video, album lama, engagement, pengaturan dan fungsi publik tetap ada.
Input foto satu per satu tetap tersedia di Galeri Foto. Tidak ada Pengelola Tema,
perubahan warna/font/Navbar/Footer, atau pemindahan rute. Migrasi 0012 hanya
menambah `gallery_documents`; migrasi lama tidak diubah. Album lama tidak ditulis
ulang oleh migrasi. Slug album yang sudah ada tidak berubah saat diedit.
Foto album lama dari path lokal atau URL HTTPS tetap dapat dikelola; kandidat
folder dan input manual baru tetap menggunakan foto Google Drive.
Migrasi tambahan 0013 membuat tabel `revisions` jika belum ada, sesuai schema dan
pemakaian modul lama. Tidak menghapus/mengganti riwayat yang sudah ada. Kekurangan
migrasi ini ditemukan ketika menguji penyimpanan berita pada database baru.

## Persiapan satu kali oleh pengelola VPS

1. Di Google Cloud Console, buat/pilih proyek dan aktifkan **Google Drive API**.
2. Buat API key. Batasi API ke Google Drive API. Untuk server, gunakan pembatasan
   alamat IP keluar VPS, bukan HTTP referrer browser. Alamat IP keluar perlu
   diverifikasi sendiri jika VPS memakai NAT/proxy.
3. Tambahkan `GOOGLE_DRIVE_API_KEY=...` ke `.env.production` melalui editor lokal
   di VPS. Jangan mengirim key ke chat, Git, dashboard, URL publik, atau screenshot.
   Jangan memakai awalan `NEXT_PUBLIC_`. Simpan berkas env dengan izin 600.
4. Container baru memperoleh key melalui `--env-file` ketika skrip rilis dijalankan.
   Tanpa key, publik/album lama/input manual tetap bekerja; tombol sinkronisasi
   diberi penjelasan bahwa konfigurasi server belum tersedia.

Integrasi memakai GET resmi Drive API (`files.get` dan `files.list`). Tidak ada
OAuth browser, service account, scraping folder, upload/download asli, perubahan
izin Drive, atau operasi hapus di Drive. Subfolder dan shortcut tidak ditelusuri.
Hanya JPEG/PNG/WebP/GIF/AVIF menjadi kandidat. Resource key tautan dipertahankan.
Folder yang aksesnya ditolak, pembatasan key, kuota, timeout, respons parsial, atau
lebih dari 500 foto memberi pesan jelas tanpa menyimpan hasil sinkronisasi sebagian.

Referensi resmi:
- https://developers.google.com/workspace/drive/api/guides/search-files
- https://developers.google.com/workspace/drive/api/guides/resource-keys
- https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list

## Alur admin

1. Buat folder Drive, isi foto, bagikan **Siapa saja yang memiliki link → Pelihat**.
2. Di Media → Galeri Foto, buat album, isi judul dan tautan folder; **Simpan Draft**.
3. **Ambil Foto dari Folder** atau **Sinkronkan Folder**. Tunggu 30 detik antar sync.
4. Kandidat tidak otomatis dipilih. Pilih foto (maksimal 40), isi judul/keterangan/alt,
   ubah urutan, ukuran, rasio, crop, titik fokus, dan tampil/sembunyi.
5. **Simpan Draft**, **Pratinjau**, lalu **Terbitkan**. Minimal satu foto tampil
   diperlukan untuk terbit. Foto baru hasil sync tetap kandidat sampai dikurasi.
6. Hapus dari album hanya menghapus pilihan website. File di Drive tetap ada.
   Album yang diarsipkan bisa dibuka dan **Pulihkan & Terbitkan**.

Grid menyediakan bingkai seragam (asli memakai 4:3 dengan contain kecuali crop),
Masonry mempertahankan foto original utuh, Sorotan menempatkan foto tampil pertama
di area besar. Rasio/ukuran dapat ditimpa per foto. Crop hanya tampilan thumbnail;
lightbox membuka gambar utuh. Penyesuaian titik fokus efektif ketika crop dan rasio
tetap dipilih. Foto tidak ditemukan saat sync ditandai, bukan dihapus otomatis.

## Keamanan data

Kandidat, draft, published dan history disimpan terpisah. Publik membaca snapshot
published, bukan draft/kandidat. Proyeksi `gallery_images` diperbarui hanya saat
publish agar sampul/list/SEO/engagement lama tetap bekerja. Semua mutasi API baru
memeriksa sesi, scope media, same-origin, input dan revision; dua penyimpanan pada
revision sama menghasilkan satu keberhasilan dan satu 409. Mutasi, proyeksi dan
catatan aktivitas bersifat atomik. Histori 20 perubahan dapat dimuat ke formulir
dan disimpan ulang sebagai draft; tidak langsung mengganti terbitan.

## Rilis & rollback

Unggah bundle lewat PowerShell ke `/root/mahida-backups/`, fetch dari bundle,
merge `--ff-only`, lalu jalankan `release-admin-r2.sh SHA_COMMIT_BUNDLE`.
Skrip tidak pull GitHub atau menghapus perubahan lokal. `.env.production` dan
untracked `create-admin.mjs` tetap ada. Image dibuat saat produksi tetap berjalan,
backup diverifikasi sebelum migrasi, lalu pratinjau port 3001 diuji. Docker harus
`healthy`, API lokal/publik harus `ok:true`, `database:connected`,
`galleryFolderReady:true`. Container sebelumnya disimpan; kegagalan setelah swap
memulihkan container lama. Migrasi tambahan tidak otomatis dihapus saat rollback.

Uji nyata setelah rilis: satu folder publik milik admin, satu file baru, sync ulang,
pastikan foto baru tidak muncul di publik sampai dipilih dan diterbitkan. Cek juga
dua sesi admin, HP/desktop, album lama, metode manual, dan crop/alt/lightbox.

## Verifikasi lokal

- Build produksi Next.js dan TypeScript diperiksa.
- ESLint tidak menemukan error; dua warning lama di dashboard/layout masih ada.
- Migrasi 0000–0013 diuji pada database sekali pakai `mahida_ci`, bukan VPS.
- Pengujian galeri mencakup izin per tugas, same-origin, maksimal 40 pilihan,
  draf/kandidat/foto tersembunyi tidak bocor ke HTML publik, konflik dua penyimpanan,
  arsip/pulihkan, album lama, input manual, alt/crop/lightbox dan tiga layout pada
  320/768/1440 px. Pengujian fitur lama juga dijalankan.
  Hasil akhir: seluruh 27 skenario Playwright lulus.
- Drive API diuji dengan respons simulasi termasuk pagination, resource key,
  akses ditolak dan respons parsial. Folder publik nyata belum diuji; membutuhkan
  key server dan folder milik pengelola.
- Skrip rilis diperiksa sintaks Bash. Docker build dan alur swap/rollback belum
  dijalankan di mesin lokal ini karena Docker tidak tersedia. Skrip rilis akan
  memvalidasi image, backup, pratinjau dan produksi pada VPS sebelum menyatakan sukses.
