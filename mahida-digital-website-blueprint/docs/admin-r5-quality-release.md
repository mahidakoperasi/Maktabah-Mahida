# Rilis 5 — Pemeriksaan kualitas dan pengelolaan rutin

## Hasil

Menu **Pengelolaan Harian** tersedia di `/admin/pengelolaan` untuk semua Admin.
Daftar target, isi laporan, ekspor dan statistik dibatasi oleh kewenangan server.
Panduan Rilis 1–5 bisa dibaca dan diunduh melalui tab Panduan Admin.

- Pemeriksa versi draf/terbit: judul utama dan bagian, tautan teks/tombol/menu,
  akses foto/video Drive, folder asal foto, teks alternatif, YouTube embed,
  jenis media dan ukuran. Periksa juga Beranda, Kontak, Pendaftaran dan Koperasi
  melalui target pengaturan terkait. Pemeriksa tidak menyunting isi atau Drive.
- Laporan mencatat waktu, versi dan hash snapshot. Isi yang berubah ditandai
  usang. Masalah yang diketahui dibedakan dari peringatan yang belum dapat
  diverifikasi. Kesalahan jaringan/kuota/layanan sementara tidak dinyatakan sebagai file dihapus.
  Tautan relatif dalam teks diperiksa dan diminta diganti dengan HTTPS lengkap
  karena editor tulisan hanya merender tautan HTTPS.
- Foto Drive yang sudah pindah dari folder album memberi peringatan jika metadata
  parent tersedia. File hilang/privat/sampah tidak dapat dipastikan penyebabnya
  hanya dari respons 404; pesan meminta pemeriksaan berkas dan izin.
- Panduan ukuran: foto >2 MB dan video langsung >25 MB diberi peringatan.
  Metadata Drive mengukur file asli, sedangkan foto publik memakai thumbnail.
  Penyedia tanpa ukuran memerlukan tinjauan manual. Tidak mengunduh media asli.
- Lima checklist wajib pada **Header & Penerbitan** sebelum terbit/jadwal:
  status, foto/video/alt, tombol, HP, dan informasi pribadi. Perubahan isi
  mengosongkan checklist, termasuk saat isi kemudian dikembalikan seperti semula.
  Simpan otomatis dengan isi yang sama mempertahankan checklist. Snapshot dan
  pemeriksa dicatat dalam transaksi yang
  sama dengan penerbitan/jadwal. Konflik/validasi gagal tidak mencatat review
  atau mengubah terbitan sebagian. Pemulihan ke draf perlu review ulang.
- Editor lama tetap menerbitkan sesuai alur/hak semula. Tautan Pengelolaan Harian
  ditambahkan pada editor bagian resmi, kliping, galeri, konten dan video.
  Checklist wajib server berlaku untuk penerbitan terpadu; panduan mengarahkan
  pemeriksaan/checklist yang sama sebelum menggunakan tombol terbit lama.
- **Analitik bawaan dipilih pengguna.** Data baru mengumpulkan jumlah kunjungan
  halaman dan klik penting per hari WIB. Tidak menggunakan Cloudflare/GA4 atau
  akun tambahan. Statistik hanya terlihat oleh Admin penuh.
- Klik dicatat untuk WhatsApp, pendaftaran, YouTube keluar, brosur, dua tombol
  Beranda, lanjut QRIS dan kirim pesan. Klik bukan bukti transaksi/pengiriman/
  pemutaran berhasil. Kunjungan bukan jumlah orang unik.
- Statistik tidak menyimpan IP, identitas, query URL, referrer, user-agent atau
  cookie analitik. Admin, pratinjau, Do Not Track, Global Privacy Control di
  browser, dan bot yang dikenali dikecualikan. Pencatatan dapat diaktifkan/
  dinonaktifkan Admin penuh. Pemblokir browser/jaringan dapat mengurangi hitungan.
- Retensi agregat 180 hari; baris lama dibersihkan pada kunjungan publik pertama
  setiap hari selama pencatatan aktif. IP di-hash dengan salt acak dan dipakai
  hanya dalam memori satu menit untuk kuota 120 permintaan/menit; tidak ditulis
  ke database statistik. Pembatasan ini bukan identifikasi pengunjung unik.
- Ekspor JSON/CSV dibagi maksimal 50 data dan 8 MB per bagian. Struktur foto/draf
  dipertahankan dalam JSON; objek bersarang CSV disimpan sebagai JSON dalam sel.
  Awalan rumus spreadsheet dinetralkan. Ekspor dicatat pada log aktivitas.

## Kewenangan

| Pengelola | Pemeriksaan | Ekspor |
| --- | --- | --- |
| Admin penuh/utama | Semua target dan statistik | Semua jenis |
| Konten | Bagian resmi, artikel/karya/berita/pengumuman | Konten |
| Media | Kliping, galeri, video | Galeri/foto/kandidat/draf |
| Pendaftaran | Tautan/pengaturan pendaftaran | Pengaturan formulir |
| Koperasi | Produk, WhatsApp, QRIS | Pesanan E-Book |

Pesan formulir kontak hanya untuk Admin penuh, mengikuti hak inbox lama. Ekspor
pesan/pesanan mengandung data pribadi dan harus digunakan untuk pengelolaan yang
sesuai. Password, token sesi, API key dan tautan file E-Book privat tidak diekspor.

Formulir pendaftaran saat ini eksternal. Jawabannya tidak disimpan di Mahida:
ekspor jawaban dilakukan dari penyedia formulir. Rilis ini tidak mengarang data
pendaftaran atau menambah formulir pengumpulan baru.

## Keamanan dan batas pemeriksa

Pemeriksaan hanya dilakukan atas target/data yang diizinkan. Foto Drive memakai
endpoint metadata resmi dan resource key; API key disampaikan lewat header,
bukan URL atau laporan. YouTube memakai endpoint oEmbed resmi tanpa API key.

Tautan eksternal HTTPS diperiksa melalui header HEAD, atau GET Range 0–0 jika
HEAD ditolak. Respons ditutup setelah header. DNS diperiksa dan IP dipin pada
setiap redirect (maksimal tiga); IP lokal/privat/metadata/reserved, kredensial
URL, port khusus dan protokol selain HTTPS tidak dihubungi. Sertifikat TLS tetap
divalidasi. Tidak meneruskan cookie/login Admin ke penyedia luar.

Satu pemeriksaan dibatasi 100 tautan/media, empat paralel, dan sekitar 25 detik
(permintaan terakhir dapat memerlukan sampai 6 detik tambahan). Hasil parsial
diberi peringatan. Pemeriksaan aktif dibatasi satu per Admin dan maksimal 20
bersamaan per proses. Tidak ada crawler seluruh situs atau pekerjaan background
VPS baru. Jalankan pemeriksa untuk target yang akan diterbitkan/ditinjau.

HTTP 200 tidak menjamin pemutaran video di semua usia/wilayah/perangkat. Tampilan
HP, pemutaran, anchor halaman, kontak email/telepon, dan izin informasi pribadi
tetap perlu ditinjau manusia. Deteksi pola pribadi tidak menentukan legalitas
atau memastikan semua informasi sensitif ditemukan.

Ekspor bukan backup database yang bisa langsung dipulihkan. Offset antarbagian
tidak membekukan dataset; unduh ketika tidak ada pengeditan/penghapusan untuk
mengurangi pergeseran antarbagian. Draf tetap privat bagi pengunjung.

## Data dan kompatibilitas

Migrasi baru `0015_quality_operations.sql` hanya menambah `analytics_daily`,
`quality_reports`, `publication_checklists` dan indeks. Pengaturan
`routine_analytics.enabled=true` disemai jika belum ada, sesuai pilihan pengguna;
tidak menimpa konfigurasi yang ada. Konten/galeri/menu/Drive/DB lama tidak dihapus
atau ditulis ulang. Statistik historis sebelum Rilis 5 tidak direkonstruksi.

Paket menyertakan pembaruan logo di atas navigasi `5dc143b` dan melanjutkan Rilis 4
`5bb5c49`. Berfungsi jika pembaruan posisi header sebelumnya sudah maupun belum
dipasang. Menu, rute, Navbar/Footer, galeri folder, kliping, draft/preview,
jadwal/riwayat, pendaftaran dan koperasi tetap memakai sumber data yang sama.

## Paket dan pemasangan

`mahida-admin-r5.zip` berisi bundle, panduan pemasangan ini, dan panduan Admin.
**VPS belum diubah oleh Codex.** Ekstrak ke `D:\Downloads\mahida-admin-r5`.

PowerShell laptop:

```powershell
scp "D:\Downloads\mahida-admin-r5\mahida-admin-r5.bundle" root@202.155.17.177:/root/mahida-backups/mahida-admin-r5.bundle
ssh root@202.155.17.177
```

Pemeriksaan awal di VPS:

```bash
git -C /opt/Maktabah-Mahida status --short --branch
git -C /opt/Maktabah-Mahida log -1 --oneline
git -C /opt/Maktabah-Mahida bundle verify /root/mahida-backups/mahida-admin-r5.bundle
df -h /
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
curl -fsS --max-time 10 http://127.0.0.1:3000/api/health
echo
```

Setelah branch `chore/production-readiness` bersih untuk file tracked, bundle valid,
dan aplikasi lama sehat, jalankan satu kali:

```bash
(
set -euo pipefail
REPO=/opt/Maktabah-Mahida
APP="$REPO/mahida-digital-website-blueprint"
BUNDLE=/root/mahida-backups/mahida-admin-r5.bundle
test "$(git -C "$REPO" branch --show-current)" = chore/production-readiness
test -z "$(git -C "$REPO" status --porcelain --untracked-files=no)"
git -C "$REPO" bundle verify "$BUNDLE"
R5_SHA="$(git -C "$REPO" bundle list-heads "$BUNDLE" refs/heads/feat/admin-r5-quality | awk '{print $1}')"
test "${#R5_SHA}" -eq 40
git -C "$REPO" fetch "$BUNDLE" refs/heads/feat/admin-r5-quality
test "$(git -C "$REPO" rev-parse FETCH_HEAD)" = "$R5_SHA"
git -C "$REPO" merge --ff-only FETCH_HEAD
R5_LOG="/root/mahida-backups/admin-r5-release-$(date +%Y%m%d%H%M%S).log"
printf '%s\n' "$R5_LOG" > /root/mahida-backups/admin-r5-latest-log.txt
nohup bash "$APP/scripts/release-admin-r5.sh" "$R5_SHA" > "$R5_LOG" 2>&1 < /dev/null &
echo "PID rilis: $!"
echo "Log rilis: $R5_LOG"
)
```

Hentikan jika Git menolak fast-forward/perubahan source. Jangan reset/hapus
perubahan. File untracked seperti `scripts/create-admin.mjs` dan env dipertahankan.
Tidak melakukan git pull, prune Docker, penggantian database atau perubahan Nginx.

Skrip memakai prosedur Rilis 4 yang sudah berhasil: build sementara container lama
tetap melayani, dump terverifikasi, migrasi tambahan, preview 3001, pemeriksaan
health/rute, container lama sebagai cadangan, lalu switch dengan rollback otomatis
jika validasi produksi gagal. Jangan menjalankan rilis kedua selama proses berjalan.

Pemeriksaan akhir:

```bash
tail -n 40 "$(cat /root/mahida-backups/admin-r5-latest-log.txt)"
pgrep -af '[r]elease-admin-r5.sh' || true
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS --max-time 10 http://127.0.0.1:3000/api/health
echo
curl -fsS --max-time 10 https://mahida.my.id/api/health
echo
```

Hasil yang diharapkan: `RILIS BERHASIL`, image `mahida:admin-r5-<commit>` dengan
`running healthy`, `qualityReady:true` dan seluruh flag sehat Rilis 4.

Sesudah rilis, buka Pengelolaan Harian, periksa versi terbit sebuah galeri,
pratinjau HP, coba ekspor sesuai peran, dan baca panduan. Statistik baru terlihat
setelah kunjungan/klik publik; kunjungan sesi Admin tidak dihitung.

Rollback container manual setelah rilis berhasil:

```bash
OLD="$(cat /root/mahida-backups/admin-r5-rollback-container.txt)"
test -n "$OLD"
docker inspect "$OLD" >/dev/null
docker stop mahida-app
docker rename mahida-app "mahida-app-after-admin-r5-$(date +%Y%m%d%H%M%S)"
docker rename "$OLD" mahida-app
docker start mahida-app
```

Rollback mempertahankan DB, konten dan tabel baru; kode lama tidak mengumpulkan
statistik/pemeriksaan baru. Restore dump adalah tindakan terpisah dan bisa
menghilangkan data yang masuk setelah backup, sehingga tidak dilakukan otomatis.

## Verifikasi lokal

Typecheck, lint (0 error; dua warning lama), build produksi, migrasi tambahan,
pengujian hak akses, checklist, kualitas media, statistik dan ekspor dijalankan
sebelum paket diserahkan. Regresi mencakup Rilis 1–4 dan pembaruan posisi header. Total 59 skenario unik:
12 skenario kualitas/pengelolaan dan 47 regresi. Pengujian dibagi dalam beberapa
batch. Tangkapan layar Pengelolaan Harian dan statistik pada 375/1440 px ditinjau;
regresi layout publik mencakup 320/375/768/1024/1440 px. Migrasi dijalankan ulang
untuk memastikan migrasi yang sudah diterapkan dilewati tanpa perubahan data.

Pengujian memakai PGlite sekali pakai `mahida_ci` melalui protokol PostgreSQL yang
diserialkan sampai Sync, Chromium dan metadata Drive/YouTube simulasi. Ini bukan
pengujian konkurensi PostgreSQL 16 native atau swap Docker lokal. Metadata Drive
nyata tetap diperiksa saat Admin menjalankan fitur di server. Respons layanan luar
yang membatasi pemeriksa ditandai belum terverifikasi, bukan dipastikan rusak.

Referensi metadata Drive:
https://developers.google.com/workspace/drive/api/reference/rest/v3/files
