# Rilis Maktabah Mahida

Rilis ini melanjutkan produksi `mahida:maktabah-6393627`. Jalankan di VPS sebagai root. Source dan image harus berasal dari commit yang sama. Gunakan artifact baru dari CI commit rilis ini; image yang sudah dipakai pada rilis sebelumnya tidak berisi penyempurnaan terbaru.

## Fitur dan batasan

Beranda gading/hijau/emas dengan logo, akses kembali ke Mahida, pencarian, fan, kitab pilihan, terbaru, dan penjelasan sumber. Admin `/admin/maktabah` mengelola judul, pengantar, logo, gambar dan posisi gambar, teks alternatif, urutan/visibilitas bagian, serta gaya/kolom kartu. Tata letak beranda bersifat terstruktur, bukan editor desain bebas.

Fan dapat ditambah, diubah, diurutkan, dan disembunyikan. Fan kosong tidak muncul di beranda. Setiap kitab memiliki fan utama dan fan tambahan; pengarang dan penerjemah hanya menjadi informasi kitab. Terjemahan dan Maktabah memakai sumber data yang sama. Kitab lama tetap tersedia, dengan fan Koleksi Terjemahan sebagai penampung sebelum admin memilih fan. Identitas kontributor lama dipertahankan terpisah dari pengarang/penerjemah.

Halaman pengenalan kitab, kata pengantar, sumber, status lengkap/bertahap, serta pembaca per bab dilengkapi daftar isi desktop/HP, ukuran huruf, proteksi penyalinan biasa, justify, Amiri, lanjut membaca tanpa akun, dan berbagi tautan bab.

Integrasi Google Docs API mendukung Heading 1/2/3, paragraf, format dasar, daftar, tabel, catatan kaki, serta tab dokumen. Admin memiliki Uji Koneksi, Pratinjau, Sinkronkan Sekarang, Jeda, waktu sinkronisasi, dan pesan kesalahan. Pemeriksaan otomatis sekitar dua menit; pembaca memuat pembaruan setelah memilih tombol pemberitahuan. Akses yang dicabut atau dokumen hilang menghentikan penayangan setelah pemeriksaan mendeteksinya, termasuk ketika sinkronisasi dijeda.

**Gambar yang tertanam dalam Google Docs belum diimpor**; pratinjau memberi peringatan. Sampul, gambar fan, dan gambar beranda dikelola di Mahida. Anti-copas tidak mencegah tangkapan layar, OCR, atau pengambilan teknis. Tes Google Docs memakai fixture; koneksi akun Google sebenarnya perlu diuji di VPS.

## 1. Unduh dan kirim image baru

Buka run Production Check untuk commit rilis yang diberikan, pastikan semua job berhasil, unduh artifact **mahida-editorial-image**, lalu ekstrak ZIP. Di PowerShell ganti SHA dan lokasi file sesuai hasil unduhan baru:

```powershell
$releaseSha = "SHA_COMMIT_RILIS_40_KARAKTER"
$releaseShort = $releaseSha.Substring(0, 7)
$imagePath = "D:\Downloads\maktabah-baru\mahida-editorial-image.tar.gz"
Test-Path -LiteralPath $imagePath
ssh root@202.155.17.177 "mkdir -p /root/mahida-backups/maktabah-$releaseShort"
scp "$imagePath" "root@202.155.17.177:/root/mahida-backups/maktabah-$releaseShort/"
```

`Test-Path` harus `True`. Jangan memilih arsip lama yang kebetulan memiliki nama sama.

## 2. Siapkan source di VPS

```bash
RELEASE_SHA=SHA_COMMIT_RILIS_40_KARAKTER
RELEASE_SHORT="${RELEASE_SHA:0:7}"
SOURCE_DIR="/opt/mahida-maktabah-$RELEASE_SHORT"
UPLOAD_DIR="/root/mahida-backups/maktabah-$RELEASE_SHORT"

df -h /
ls -lh "$UPLOAD_DIR/mahida-editorial-image.tar.gz"
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS -w '\n' https://mahida.my.id/api/health

git -C /opt/Maktabah-Mahida fetch --no-tags origin feat/content-protection-promotion
if [ ! -e "$SOURCE_DIR/.git" ]; then
  git -C /opt/Maktabah-Mahida worktree add --detach "$SOURCE_DIR" "$RELEASE_SHA"
fi
git -C "$SOURCE_DIR" rev-parse HEAD
bash -n "$SOURCE_DIR/mahida-digital-website-blueprint/scripts/release-maktabah.sh"
```

HEAD harus sama dengan SHA rilis. Produksi harus `mahida:maktabah-6393627 running healthy`. Script membutuhkan minimal 2 GB kosong di filesystem Docker; VPS terakhir memiliki sekitar 9,1 GB kosong. Port preview 3001 harus tersedia. Jika terpakai, periksa pemiliknya sebelum tindakan lain.

## 3. Pertahankan Google Docs yang sudah aktif

Kunci yang sudah berhasil dipakai tetap berada di `/opt/mahida-secrets/mahida-google-docs.json`, dengan pemilik UID 1001 dan mode 600. Env produksi tetap memakai `GOOGLE_DOCS_CREDENTIALS_FILE=/opt/mahida-secrets/mahida-google-docs.json`.

Script memeriksa bahwa env dan mount kontainer aktif cocok dengan file itu, lalu memasangnya read-only pada preview dan produksi. Mount tambahan atau identitas yang tidak cocok menghentikan rilis sebelum produksi ditukar. Preview menonaktifkan worker sinkronisasi agar pemeriksaan tidak menjalankan worker kedua. Backup mencakup database, env, dan konfigurasi kontainer; file konfigurasi disimpan mode 600 dan dapat memuat informasi rahasia.

Pemeriksaan berikut hanya menampilkan izin/path dan hasil keterbacaan, tanpa isi kunci:

```bash
ls -l /opt/mahida-secrets/mahida-google-docs.json
docker inspect -f '{{range .Mounts}}{{println .Type .Source .Destination .RW}}{{end}}' mahida-app
docker exec mahida-app node -e 'const fs=require("node:fs");const p=process.env.GOOGLE_DOCS_CREDENTIALS_FILE;if(p!=="/opt/mahida-secrets/mahida-google-docs.json")process.exit(1);fs.accessSync(p,fs.constants.R_OK);console.log("Identitas Google Docs terbaca.")'
```

## 4. Jalankan di latar belakang

Di shell dengan variabel langkah 2:

```bash
nohup bash "$SOURCE_DIR/mahida-digital-website-blueprint/scripts/release-maktabah.sh" \
  "$RELEASE_SHA" "$UPLOAD_DIR/mahida-editorial-image.tar.gz" \
  > "$UPLOAD_DIR/release.log" 2>&1 < /dev/null &
printf '%s\n' "$!" > "$UPLOAD_DIR/release.pid"
echo "PID rilis: $(cat "$UPLOAD_DIR/release.pid")"
tail -f "$UPLOAD_DIR/release.log"
```

`Ctrl+C` hanya menghentikan pemantauan log. Proses rilis tetap berjalan jika SSH terputus. Setelah menyambung kembali:

```bash
tail -n 80 /root/mahida-backups/maktabah-XXXXXXX/release.log
```

Ganti XXXXXXX dengan tujuh karakter pertama SHA. Jangan memulai proses rilis kedua selagi yang pertama berjalan.

Script memvalidasi source/image, membuat backup database custom-format mode 600, memeriksa backup, menjalankan migrasi 0017 untuk indeks pencarian, menguji preview, dan menukar kontainer. Kontainer Maktabah 6393627 yang sudah memasang kunci Google Docs disimpan untuk rollback. Kegagalan validasi produksi memulihkan kontainer lama otomatis. Migrasi tidak menghapus isi lama, sehingga aplikasi lama dapat berjalan dengan tabel tambahan.

Selesai ditandai **RILIS BERHASIL** beserta lokasi backup, rollback, dan source. Setelah `Preview dan health lulus`, tunggu validasi produksi.

## 5. Verifikasi

```bash
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS -w '\n' https://mahida.my.id/api/health
df -h /
```

Harus menunjukkan `mahida:maktabah-XXXXXXX running healthy`, health `ok:true`, `database:connected`, dan `maktabahReady:true`, dan `maktabahSearchReady:true`.

Periksa HP dan desktop:

- `/maktabah`: banner HP/desktop, footer ringkas, navigasi, urutan bagian, pencarian judul/bab/isi/catatan, fan, pilihan, terbaru, dan kliping lama.
- `/maktabah/fan`: fan tersedia tanpa kategori/filter pengarang.
- `/karya/terjemahan`: koleksi sama dan tautan lama tetap terbuka.
- `/admin/maktabah`: simpan draft, pratinjau, terbitkan; draft tidak mengubah publik sebelum diterbitkan.
- Satu kitab: pengenalan, kata pengantar, Mulai Membaca, daftar isi, Cari Bab/Cari Isi, sorotan hasil, paginasi hasil, kembali ke posisi baca, bab berikut/sebelumnya, ukuran huruf, Arab, dan lanjut membaca.
- Catatan kaki: nomor mengikuti Docs, kotak desktop/panel HP, Esc/fokus, dan backlink di akhir bab. Sinkronkan kitab lama agar nomor terbaru dari Docs masuk ke cache.
- Admin Tampilan: aktifkan banner, atur footer/kontak/medsos/tombol gabung, label pencarian dan ukuran catatan, lalu terbitkan pengaturan.
- Promosi: tutup, navigasi internal, refresh; perilaku promosi tetap berfungsi.

Untuk Docs gunakan dokumen uji dengan H1/2/3, Arab, daftar, tabel, dan catatan kaki. Simpan tautan, Uji Koneksi, Pratinjau, Terbitkan. Ubah paragraf di Docs; tunggu sekitar dua menit, periksa waktu sinkronisasi serta pemberitahuan pembaca. Uji Jeda dan Sinkronkan Sekarang. Cabut akses **dokumen uji saja**; setelah pemeriksaan berikutnya sumber harus berhenti ditayangkan dan admin melihat kesalahan. Pulihkan akses dan sinkronkan lagi.

## 6. Rollback aplikasi

Gunakan nama rollback rilis berhasil. Perintah ini memulihkan aplikasi Maktabah 6393627, bukan perubahan data setelah rilis:

```bash
ROLLBACK_CONTAINER="$(cat /root/mahida-backups/maktabah-rollback-container.txt)"
docker inspect -f '{{.Name}} {{.Config.Image}} {{.State.Status}}' "$ROLLBACK_CONTAINER"
```

Pastikan image rollback adalah `mahida:maktabah-6393627`, kemudian:

```bash
(
  flock -n 9 || exit 1
  test "$(docker inspect -f '{{.Config.Image}}' "$ROLLBACK_CONTAINER")" = 'mahida:maktabah-6393627' || exit 1
  FAILED_CONTAINER="mahida-app-maktabah-held-$(date +%Y%m%d%H%M%S)"
  docker stop mahida-app || exit 1
  if ! docker rename mahida-app "$FAILED_CONTAINER"; then
    docker start mahida-app
    exit 1
  fi
  if ! docker rename "$ROLLBACK_CONTAINER" mahida-app; then
    docker rename "$FAILED_CONTAINER" mahida-app
    docker start mahida-app
    exit 1
  fi
  if ! docker start mahida-app; then
    docker rename mahida-app "$ROLLBACK_CONTAINER"
    docker rename "$FAILED_CONTAINER" mahida-app
    docker start mahida-app
    exit 1
  fi
) 9>/var/lock/mahida-release.lock
curl -fsS -w '\n' https://mahida.my.id/api/health
```

Simpan backup dan kontainer rollback sampai pemeriksaan selesai. Jangan restore dump saat aplikasi menerima perubahan; restore database memerlukan penghentian penulisan dan pemilihan backup yang tepat. Rollback aplikasi ini tidak memerlukannya.

## Verifikasi script rilis penyempurnaan

`bash -n` lulus. Dua belas skenario orchestration memakai perintah Docker/curl/Git palsu di direktori uji: sukses dengan mount read-only dan backup, source salah, disk kurang, mount tambahan, image salah, backup rusak, migrasi gagal, preview gagal, health indeks belum siap, kegagalan membuat produksi, kunci produksi tidak terbaca, dan validasi HTTPS gagal. Seluruh kegagalan mempertahankan atau memulihkan kontainer awal. Uji ini tidak mengakses VPS.
