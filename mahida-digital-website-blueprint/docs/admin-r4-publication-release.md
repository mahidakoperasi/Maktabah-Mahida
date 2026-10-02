# Rilis 4 — Header, sidebar, dan penerbitan

## Hasil dan batas cakupan

Kelanjutan dari commit Rilis 3 `4d6fa69`. Menu/rute/konten lama, Galeri Folder
Drive, Kliping Visual, Karya, Video, Koperasi, Pendaftaran, Navbar dan Footer
menggunakan sumber data yang sama. Tidak ada Pengelola Tema, perubahan warna/font,
perubahan Nginx, penggantian database, atau penghapusan file Drive.

- **Header & Penerbitan**: `/admin/tampilan/penerbitan`. Admin dengan hak penuh
  mengelola halaman CMS; pengelola Media membuka alur album dari Galeri Foto;
  pengelola Konten membuka pengumuman dari modul Pengumuman.
- **URL Drive logo header** tersedia pada Penerbitan dan Kliping Visual per
  halaman. Kosong berarti tidak ada header tambahan atau ruang kosong.
  Terisi berarti logo tampil di atas isi/sidebar, mengikuti guliran normal.
  Halaman album menggunakan identitas `/media/galeri`. Logo baru tanpa kliping
  mempertahankan sumber gambar/hero lama.
- Sidebar galeri membaca menu aktif/terbit dari Halaman & Menu sampai tiga tingkat,
  sticky di desktop dalam batas area konten, dan panel buka/tutup di HP/tablet.
  Mendukung Escape, pemulihan fokus, perangkap Tab, dan pergantian ukuran layar.
- Simpan otomatis setelah jeda 1,5 detik di Penerbitan, Kliping Visual,
  Bagian Konten Resmi dan Galeri Foto. Data yang belum valid tetap di formulir.
  Konflik menghentikan autosave; perubahan lokal dipertahankan sampai Admin
  memilih Muat versi terbaru atau menyimpan kembali.
- Pratinjau lengkap memakai halaman publik yang sama, ukuran 375/768/1440 px,
  melalui sesi Admin sesuai hak. Draf dan kandidat tidak diberikan kepada tamu,
  hak yang tidak sesuai, ataupun header buatan klien. Respons preview private/no-store.
- Penerbitan halaman menyatukan judul/pengantar/teks utama, bagian resmi,
  logo, dan kliping foto/video dalam satu transaksi. Penerbitan album menyatukan
  judul/keterangan dan foto terpilih. Pengumuman menyatukan teks dan media dalam isi.
- Jadwal khusus album dan pengumuman memakai WIB, disimpan sebagai timestamp
  berzona. Snapshot yang dijadwalkan dibekukan; draf berikutnya tidak ikut terbit.
  Jadwal dapat dibatalkan/diganti. Terbitan lama tetap tersedia sampai waktu baru.
- Riwayat Penerbitan mempertahankan 20 versi sebelum terbit. Pulihkan ke draf
  memuat pasangan teks/media, lalu Admin melakukan pratinjau dan menerbitkan ulang.
  Riwayat Kliping dan Galeri lama tetap tersedia.
- Foto Drive diperiksa menggunakan metadata resmi `files.get` sebelum terbit,
  saat penjadwalan, dan ketika jadwal dijalankan. Hanya JPEG/PNG/WebP/GIF/AVIF aktif
  dan dapat dibaca tanpa sesi Google yang diterima; resource key dipertahankan.
  URL salah, izin ditolak, file PDF/folder/sampah, timeout, atau kuota API menahan
  penerbitan tanpa mengubah terbitan. Pengaturan API key dari Rilis 2 dipakai ulang.
  URL HTTPS/path gambar lama tetap dirender browser; server tidak mengambil URL
  bebas atau mengunduh foto asli ke VPS.

## Alur Admin

1. Buat halaman/album/pengumuman melalui modul yang sudah ada jika belum tersedia.
2. Susun media di Kliping/Galeri dan bagian resmi di editor masing-masing.
   Tunggu draf tersimpan. Untuk meninjau pasangan teks/media baru sebelum terbit,
   gunakan Penerbitan dengan hak penuh. Daftar bagian di Kliping untuk Admin penuh
   mencakup bagian draf; pengelola Media tetap melihat bagian yang sudah terbit.
3. Buka Header & Penerbitan atau tautan Penerbitan dari Galeri/Pengumuman,
   pilih target, lalu Muat teks/media terkait terbaru jika editor lain baru berubah.
4. Isi logo header opsional dan teks. Tunggu simpan otomatis atau klik Simpan Draf.
5. Klik Pratinjau halaman lengkap, periksa HP/Tablet/PC.
6. Terbitkan teks & media, atau isi waktu WIB untuk album/pengumuman dan Jadwalkan.
7. Gunakan Riwayat versi & pemulihan untuk memuat versi lama ke draf.

Jadwal dijalankan pada permintaan halaman publik pertama setelah waktu tercapai,
atau saat Admin membuka daftar Penerbitan; tidak memerlukan cron/API publik
untuk menulis. Maksimal tiga jadwal diproses per permintaan. Jika beberapa jadwal
jatuh tempo bersamaan, sisanya mengikuti permintaan selanjutnya. Jika aplikasi
sedang mati, jadwal berjalan setelah aplikasi kembali melayani. Hak penerbit yang
sudah dicabut, album diarsipkan, atau foto Drive gagal pemeriksaan menghentikan
jadwal dan menampilkan pesan di Penerbitan; terbitan lama/draf tidak ditimpa.

Editor lama tetap bisa menerbitkan bagian sesuai haknya. Untuk pasangan teks
baru dan media baru, gunakan tombol Terbitkan teks & media di Penerbitan.
Autosave Rilis 4 tidak mengubah status publik secara otomatis. Pengaturan
Beranda/direktori/komersial yang sudah ada tetap memakai alur semula.

## Data dan kompatibilitas

Migrasi tambahan `0014_unified_publication.sql` hanya menambahkan tabel
`publication_documents` dan indeks jadwal. Snapshot dan media memakai JSON
opsional; tidak menulis ulang halaman/menu/album lama saat migrasi. Transaksi
mengunci target dan dokumen terkait, menggunakan revision dan hash sumber untuk
menolak sesi usang. Mutasi/proyeksi publik/riwayat/aktivitas bersifat atomik.
Draf yang lebih baru tetap disimpan ketika snapshot terjadwal menjadi publik.

Pemulihan penuh dilakukan melalui riwayat Penerbitan; riwayat media lama tetap
mendukung pemulihan media secara terpisah sesuai alur sebelumnya. Pratinjau/terbit
halaman CMS memerlukan hak penuh karena menyatukan teks dan media.

## Paket dan pemasangan

Paket `mahida-admin-r4.zip` berisi `mahida-admin-r4.bundle` dan panduan ini.
Ekstrak ZIP di Downloads terlebih dahulu. **Belum ada perubahan pada VPS.**

PowerShell laptop, di luar SSH:

```powershell
scp "$env:USERPROFILE\Downloads\mahida-admin-r4.bundle" root@202.155.17.177:/root/mahida-backups/mahida-admin-r4.bundle
ssh root@202.155.17.177
```

Sesudah masuk VPS:

```bash
set -euo pipefail
REPO=/opt/Maktabah-Mahida
BUNDLE=/root/mahida-backups/mahida-admin-r4.bundle
APP="$REPO/mahida-digital-website-blueprint"
test "$(git -C "$REPO" branch --show-current)" = chore/production-readiness
test -z "$(git -C "$REPO" status --porcelain --untracked-files=no)"
git -C "$REPO" bundle verify "$BUNDLE"
R4_SHA="$(git -C "$REPO" bundle list-heads "$BUNDLE" refs/heads/feat/admin-r4-publishing | awk '{print $1}')"
test "${#R4_SHA}" -eq 40
git -C "$REPO" fetch "$BUNDLE" refs/heads/feat/admin-r4-publishing
git -C "$REPO" merge --ff-only FETCH_HEAD
test "$(git -C "$REPO" rev-parse HEAD)" = "$R4_SHA"
R4_LOG="/root/mahida-backups/admin-r4-release-$(date +%Y%m%d%H%M%S).log"
printf '%s\n' "$R4_LOG" > /root/mahida-backups/admin-r4-latest-log.txt
nohup bash "$APP/scripts/release-admin-r4.sh" "$R4_SHA" > "$R4_LOG" 2>&1 < /dev/null &
echo "Log rilis: $R4_LOG"
```

Hentikan jika Git mendeteksi perubahan atau tidak dapat fast-forward; jangan
reset/hapus perubahan. Bundle menyertakan kelanjutan Rilis 1–3 sejak `bea6fb1`,
sehingga belum mendorong perubahan lokal ke GitHub juga didukung. Env dan berkas
untracked tetap ada. Skrip memakai prosedur Rilis 3: build sambil produksi lama
berjalan, dump DB terverifikasi sebelum migrasi, preview 3001, health dan rute,
container cadangan, lalu pergantian dengan rollback otomatis bila gagal.
Tidak melakukan git pull, Docker prune, atau perubahan konfigurasi Nginx.

Pemeriksaan akhir:

```bash
tail -n 40 "$(cat /root/mahida-backups/admin-r4-latest-log.txt)"
pgrep -af '[r]elease-admin-r4.sh' || true
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS --max-time 10 http://127.0.0.1:3000/api/health
echo
curl -fsS --max-time 10 https://mahida.my.id/api/health
echo
```

Hasil: `mahida:admin-r4-<commit> running healthy`, `RILIS BERHASIL`, dan
`publicationReady:true` bersama flag sehat lama. Jangan menjalankan rilis kedua
selama proses sebelumnya masih berjalan.

Rollback container manual setelah rilis berhasil:

```bash
OLD="$(cat /root/mahida-backups/admin-r4-rollback-container.txt)"
test -n "$OLD"
docker inspect "$OLD" >/dev/null
docker stop mahida-app
docker rename mahida-app "mahida-app-after-admin-r4-$(date +%Y%m%d%H%M%S)"
docker rename "$OLD" mahida-app
docker start mahida-app
```

Rollback container mempertahankan DB dan tabel baru. Jadwal belum diproses oleh
kode lama; draf/riwayat Penerbitan tetap tersimpan sampai kode Rilis 4 kembali
aktif. Versi yang sudah terbit dipulihkan melalui Penerbitan sebelum rollback bila
perlu. Pemulihan dump DB adalah tindakan terpisah bila memang dibutuhkan.

## Verifikasi

- TypeScript dan build produksi Next.js lulus. Lint: 0 error, 2 warning lama
  pada dashboard/layout.
- **47 skenario Playwright lulus**: 36 regresi Rilis 1–3/finalisasi sebelumnya dan
  11 Rilis 4. Mencakup draf privat, header spoofing, scope, same-origin,
  revision/hash sumber, terbit/pemulihan teks-media, jadwal beku/draf lebih baru,
  pembatalan jadwal, pencabutan hak/arsip, logo opsional/fallback visual lama,
  metadata bagian draf untuk pengelola penuh, autosave, preview lengkap,
  sidebar 320/375/768/1024/1440 px, keyboard dan tidak ada gulir horizontal.
- Migrasi 0000–0014 dan penerapan ulang runner lulus. Skrip rilis lolos `bash -n`;
  `git diff --check` bersih. Screenshot sidebar desktop diperiksa.
- Pengujian memakai PostgreSQL embedded (PGlite) melalui protokol PostgreSQL
  yang diserialkan hingga Sync, dan Chromium dengan satu proses. Hasil ini
  menguji aplikasi dan CAS, bukan pengujian konkurensi PostgreSQL 16 native/Docker.
  Workflow CI disiapkan untuk PostgreSQL 16 dan respons Drive simulasi.

Database pengujian adalah `mahida_ci` sekali pakai lokal; tidak ada koneksi ke
DB/VPS produksi.
Respons Drive disimulasikan untuk pemeriksaan izin, metadata dan resource key.
Foto/folder Drive nyata milik Admin tetap perlu pemeriksaan saat pratinjau rilis.
Docker build/swap/rollback tidak dijalankan lokal karena Docker tidak tersedia.
GitHub tidak dipush/merge dan VPS tidak disentuh.

Untuk mengulang tes pada PostgreSQL native khusus `mahida_ci` (jangan DB produksi),
isi `DATABASE_URL`, `JWT_SECRET` uji, dan `GOOGLE_DRIVE_API_KEY=test-only-key`, lalu:

```bash
npm run db:migrate
npm run typecheck
npm run lint
npm run build
NODE_OPTIONS="--import ./tests/mock-drive.mjs" npm run test:responsive
```

`mock-drive.mjs` hanya preload untuk tes dan menolak database selain `mahida_ci`.
Tidak diimpor atau diaktifkan oleh kode/Docker produksi.

Referensi implementasi Drive:
https://developers.google.com/workspace/drive/api/reference/rest/v3/files/get
https://developers.google.com/workspace/drive/api/guides/resource-keys
