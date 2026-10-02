# Rilis 3 — Kliping Visual dan tata letak media

## Hasil

Menu **Kliping Visual** tetap berada di `/admin/tampilan/kliping`. Admin Utama
dan pengelola Media & Galeri dapat menambah, mengganti, menghapus, dan menyusun
foto/video pada halaman CMS yang tersedia. Halaman CMS tambahan ikut terdaftar;
rute detail artikel, produk, dan album tetap memakai pengelolaan modul masing-masing.
Semua menu dan fungsi Rilis 1/2 dipertahankan. Tidak ada Pengelola Tema.

- Area: Hero, sela bagian teks, galeri halaman, serta kartu Kegiatan/Video/Galeri
  di halaman Media. Satu media per Hero atau per kartu Media, maksimal 40 media
  pada satu halaman.
- Ukuran kecil/sedang/lebar, rasio asli/landscape/portrait/kotak, crop untuk
  mengisi bingkai, titik fokus horizontal/vertikal, teks alternatif, dan poster video.
- Seret pegangan di desktop; tombol Naik/Turun tersedia untuk HP. Urutan publik
  mengikuti urutan media dalam area yang sama.
- Pasangan teks–foto/video: teks dahulu, teks kiri/media kanan, atau media kiri/
  teks kanan. Bagian Sejarah/Muassis memakai teks kiri/media kanan secara default
  ketika ada media yang dipasangkan. Pada HP, teks tetap muncul dahulu.
- Pratinjau draf tersimpan berukuran 375, 768, atau 1440 px. Pratinjau PC di HP
  dapat digeser di dalam bingkainya tanpa membuat seluruh dashboard melebar.
- Draf, versi terbit, riwayat 20 terbitan, pemeriksaan revision, dan aktivitas
  Admin tetap dipakai. Konflik penyimpanan tidak menghapus perubahan lokal;
  tersedia tombol Muat versi terbaru.

Ukuran/rasio berlaku pada kartu, galeri, dan media di sela teks. Hero mengikuti
bingkai halaman yang sudah tersedia. Crop/titik fokus mengatur foto, poster, dan
MP4 pada bingkai tetap; isi pemutar Drive/YouTube mengikuti pemutar sumbernya.
Rasio asli pada foto mempertahankan proporsi foto. URL media tidak diunduh ke VPS.
Penghapusan kliping hanya menghapus penempatannya di website.

## Pemakaian Admin

1. Buka **Kliping Visual**, pilih halaman, lalu **Tambah foto/video**.
2. Pilih media dari galeri/video yang sudah terbit, atau tempel URL foto HTTPS,
   foto Drive publik, video MP4 HTTPS, video Drive publik, atau YouTube.
3. Isi teks alternatif/judul video. Untuk video, isi poster bila diperlukan.
4. Pilih area, ukuran, rasio, crop, dan titik fokus. Untuk pasangan teks–foto,
   pilih **Sela bagian teks**, tentukan bagian, lalu atur **Tata letak teks–foto/video**.
5. Susun media dengan seret-lepas atau Naik/Turun. **Simpan Draf**.
6. Buka **Pratinjau Draf tersimpan**, periksa HP/Tablet/PC, lalu **Terbitkan**.

Teks tetap dikelola melalui Halaman dan Bagian Konten Resmi. Daftar bagian yang
tersedia untuk pengelola media berasal dari teks yang sudah terbit, bukan draf
teks. Bagian kosong/dinonaktifkan tetap tersembunyi. Terbitkan perubahan teks
dahulu agar bagian baru dapat dipilih di Kliping Visual; muat ulang editor setelahnya.
Halaman CMS yang masih draf belum dapat ditinjau melalui pratinjau media ini;
pratinjau draf halaman memerlukan hak pengelolaan konten.

**Pulihkan Versi** mengganti versi terbit setelah konfirmasi, sesuai fungsi lama.
**Pulihkan media lama sebelum Kliping** mengembalikan pemakaian sumber visual
sebelum dokumen Kliping diterbitkan. Tidak ada perubahan otomatis pada data lama
ketika aplikasi diperbarui.

## Data dan akses

Rilis 3 memakai `design_documents` yang sudah tersedia sejak migrasi 0010.
`crop` dan `sectionLayouts` merupakan properti JSON opsional, sehingga snapshot
Rilis 1/2 tetap dapat dibaca. Tidak ada migrasi baru, penggantian database, atau
API key baru. `.env.production` dan Google Drive API key yang sudah bekerja tetap
digunakan.

Pratinjau media memerlukan hak media; pratinjau konten memerlukan hak konten.
Pengunjung, pengelola Pendaftaran, dan pengelola Koperasi tidak memperoleh draf
melalui query pratinjau ataupun header buatan. Pratinjau memakai `private, no-store`.
Penyimpanan dokumen dan catatan aktivitas dilakukan dalam satu transaksi.

## Pemasangan melalui bundle

Unduh `mahida-admin-r3.bundle` dari chat ke folder Downloads. Jalankan di
**PowerShell laptop**, di luar sesi SSH:

```powershell
scp "$env:USERPROFILE\Downloads\mahida-admin-r3.bundle" root@202.155.17.177:/root/mahida-backups/mahida-admin-r3.bundle
ssh root@202.155.17.177
```

Setelah masuk VPS, jalankan blok berikut. Jika Git melaporkan perubahan source
lokal atau merge tidak dapat fast-forward, hentikan dan periksa pesannya; jangan
reset/hapus perubahan.

```bash
set -euo pipefail
REPO=/opt/Maktabah-Mahida
BUNDLE=/root/mahida-backups/mahida-admin-r3.bundle
APP="$REPO/mahida-digital-website-blueprint"
test "$(git -C "$REPO" branch --show-current)" = chore/production-readiness
test -z "$(git -C "$REPO" status --porcelain --untracked-files=no)"
git -C "$REPO" bundle verify "$BUNDLE"
R3_SHA="$(git -C "$REPO" bundle list-heads "$BUNDLE" refs/heads/chore/production-readiness | awk '{print $1}')"
test "${#R3_SHA}" -eq 40
git -C "$REPO" fetch "$BUNDLE" refs/heads/chore/production-readiness
git -C "$REPO" merge --ff-only FETCH_HEAD
test "$(git -C "$REPO" rev-parse HEAD)" = "$R3_SHA"
R3_LOG="/root/mahida-backups/admin-r3-release-$(date +%Y%m%d%H%M%S).log"
printf '%s\n' "$R3_LOG" > /root/mahida-backups/admin-r3-latest-log.txt
nohup bash "$APP/scripts/release-admin-r3.sh" "$R3_SHA" > "$R3_LOG" 2>&1 < /dev/null &
echo "Log rilis: $R3_LOG"
```

`nohup` membuat proses rilis tetap berjalan ketika laptop atau SSH terputus.
Skrip membangun image saat aplikasi lama masih melayani, memvalidasi label commit,
membuat dan memeriksa dump database, menjalankan migrasi yang belum diterapkan,
kemudian menguji container pratinjau di port 3001. Sesudah pratinjau lulus,
container lama disimpan dan diganti. Kegagalan sesudah penggantian memulihkan
container lama. Tidak ada `git pull`, pembersihan Docker, perubahan Nginx, atau
penghapusan berkas source/data.

## Pemeriksaan hasil

```bash
tail -n 40 "$(cat /root/mahida-backups/admin-r3-latest-log.txt)"
pgrep -af '[r]elease-admin-r3.sh' || true
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS --max-time 10 http://127.0.0.1:3000/api/health
echo
curl -fsS --max-time 10 https://mahida.my.id/api/health
echo
```

Hasil akhir: `mahida:admin-r3-<commit> running healthy`, `RILIS BERHASIL` pada log,
dan kedua health menampilkan `ok:true`, `database:connected`,
`galleryFolderReady:true`, serta `visualClippingReady:true`.
Status `running starting` berarti pemeriksaan Docker belum selesai; periksa log
lagi. Jika skrip masih berjalan, jangan menjalankan rilis kedua.

Setelah itu, buka kembali Admin (Ctrl+F5 bila perlu), uji satu foto pada bagian
Sejarah/Muassis, simpan draf, periksa tiga pratinjau, dan lihat halaman publik
melalui jendela privat sebelum dan sesudah menerbitkan. Uji juga sinkronisasi
album Drive yang sudah bekerja pada Rilis 2.

Nama container cadangan ada di `/root/mahida-backups/admin-r3-rollback-container.txt`.
Untuk kembali ke container tersebut secara manual setelah rilis berhasil:

```bash
OLD="$(cat /root/mahida-backups/admin-r3-rollback-container.txt)"
test -n "$OLD"
docker inspect "$OLD" >/dev/null
docker stop mahida-app
docker rename mahida-app "mahida-app-after-admin-r3-$(date +%Y%m%d%H%M%S)"
docker rename "$OLD" mahida-app
docker start mahida-app
```

Rollback container tidak menimpa database. Dump `admin-r3-<waktu>.dump` disimpan
sebagai cadangan terpisah; pemulihan database hanya dilakukan bila diperlukan.

## Verifikasi sebelum paket dibuat

- Build produksi, pemeriksaan TypeScript, dan lint lulus. Dua warning lama pada
  dashboard/layout masih ada; tidak ada error lint baru.
- Seluruh **36 skenario Playwright** lulus: 27 regresi lama dan 9 skenario Rilis 3.
  Pemeriksaan mencakup seret-lepas, Naik/Turun, ganti/hapus media, crop/fokus,
  poster dan video kartu, layout dua kolom, pratinjau, konflik, riwayat/aktivitas,
  hak per tugas, draf privat, halaman CMS tambahan, dan album Drive lama.
- Dashboard dan halaman publik diperiksa pada 320, 375, 768, 1024, dan 1440 px.
  Tata letak Sejarah/Muassis juga diperiksa melalui screenshot.
- Migrasi 0000–0013 dan API diuji dengan PostgreSQL embedded (PGlite) pada database
  sekali pakai lokal, dengan runner Chromium satu proses. Runner lokal memakai
  serialisasi pesan protokol hingga Sync untuk menjaga query antar koneksi tetap
  utuh. Ini menguji perilaku aplikasi; tidak menggantikan uji konkurensi native
  PostgreSQL 16 atau Docker pada VPS.
- Skrip rilis lulus pemeriksaan sintaks Bash. Docker build serta penggantian/
  rollback container belum dijalankan lokal karena Docker tidak tersedia.
  VPS dan GitHub tidak diubah saat pembuatan paket ini.

Pengujian dapat diulang pada database PostgreSQL native khusus `mahida_ci`
dengan `DATABASE_URL` dan `JWT_SECRET` uji, `npm run db:migrate`,
`npm run build`, lalu `npm run test:responsive`. Jangan memakai database produksi
untuk suite ini: fixture pengujian mengubah/menghapus data uji.
