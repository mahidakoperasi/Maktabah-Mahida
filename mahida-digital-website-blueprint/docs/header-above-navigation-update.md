# Pembaruan Rilis 4 — Logo di atas navigasi

Logo header opsional sekarang berada sebelum menu navigasi utama. Logo mengikuti
guliran normal; navigasi tetap menempel di atas layar ketika logo sudah terlewati.
Sidebar galeri tetap berada dalam area konten. Jika logo kosong atau tidak bisa
ditampilkan, tidak ada header tambahan. Logo/menu/konten tetap berasal dari
pengaturan Admin yang sama. Panel menu HP mengikuti bagian bawah navigasi dan
menyesuaikan tinggi ruang layar yang tersedia.

Tidak ada migrasi baru. URL logo yang sudah diterbitkan tidak perlu dimasukkan
atau diterbitkan ulang. Paket ini melanjutkan Rilis 4 `5bb5c49` dan belum
diterapkan ke VPS oleh Codex.

## Pemasangan

Unduh dan ekstrak `mahida-header-update.zip` ke `D:\Downloads`. Di PowerShell
laptop, gunakan jalur hasil ekstraksi berikut:

```powershell
scp "D:\Downloads\mahida-header-update\mahida-header-update.bundle" root@202.155.17.177:/root/mahida-backups/mahida-header-update.bundle
ssh root@202.155.17.177
```

Di VPS, jalankan satu kali:

```bash
(
set -euo pipefail
REPO=/opt/Maktabah-Mahida
APP="$REPO/mahida-digital-website-blueprint"
BUNDLE=/root/mahida-backups/mahida-header-update.bundle
test "$(git -C "$REPO" branch --show-current)" = chore/production-readiness
test -z "$(git -C "$REPO" status --porcelain --untracked-files=no)"
git -C "$REPO" bundle verify "$BUNDLE"
HEADER_SHA="$(git -C "$REPO" bundle list-heads "$BUNDLE" refs/heads/fix/header-above-navigation | awk '{print $1}')"
test "${#HEADER_SHA}" -eq 40
git -C "$REPO" fetch "$BUNDLE" refs/heads/fix/header-above-navigation
test "$(git -C "$REPO" rev-parse FETCH_HEAD)" = "$HEADER_SHA"
git -C "$REPO" merge --ff-only FETCH_HEAD
R4_LOG="/root/mahida-backups/admin-r4-header-$(date +%Y%m%d%H%M%S).log"
printf '%s\n' "$R4_LOG" > /root/mahida-backups/admin-r4-latest-log.txt
nohup bash "$APP/scripts/release-admin-r4.sh" "$HEADER_SHA" > "$R4_LOG" 2>&1 < /dev/null &
echo "PID rilis: $!"
echo "Log rilis: $R4_LOG"
)
```

Jika Git menolak fast-forward atau menemukan perubahan tracked, hentikan dan
kirim hasilnya. Jangan reset/hapus perubahan. File `scripts/create-admin.mjs`
yang untracked tetap dipertahankan. Skrip yang sama dengan pemasangan Rilis 4
membuat image baru ketika produksi lama masih berjalan, memverifikasi dump
database, memeriksa migrasi, menguji preview 3001 dan rute, lalu menukar container.
Container lama disimpan dan dipulihkan otomatis jika validasi produksi gagal.
Tidak menjalankan Docker prune atau mengubah Nginx.

Lihat perkembangan dan hasil akhirnya:

```bash
tail -n 40 "$(cat /root/mahida-backups/admin-r4-latest-log.txt)"
pgrep -af '[r]elease-admin-r4.sh' || true
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS --max-time 10 https://mahida.my.id/api/health
echo
```

Tunggu `RILIS BERHASIL` dan image `mahida:admin-r4-<commit-baru>` dengan status
`running healthy`. Jangan menjalankan pemasangan kedua selama proses berlangsung.
Setelah berhasil, muat ulang halaman publik (Ctrl+F5), periksa posisi logo,
gulir hingga logo terlewati, lalu uji menu HP. Logo tetap bisa diatur per halaman
melalui Header & Penerbitan dan Kliping Visual.

## Pemulihan container

Jika perlu kembali ke container sebelum pembaruan setelah rilis berhasil:

```bash
OLD="$(cat /root/mahida-backups/admin-r4-rollback-container.txt)"
test -n "$OLD"
docker inspect "$OLD" >/dev/null
docker stop mahida-app
docker rename mahida-app "mahida-app-after-header-update-$(date +%Y%m%d%H%M%S)"
docker rename "$OLD" mahida-app
docker start mahida-app
```

Database tetap dipertahankan. Periksa `/api/health` kembali setelah pemulihan.

## Validasi lokal

- Typecheck dan build produksi lulus.
- Lint: 0 error, 2 warning lama.
- Tujuh skenario Playwright terkait lulus: autosave/pratinjau/penerbitan,
  header di atas navigasi, header kosong, navigasi sticky, sidebar dan panel HP,
  serta regresi halaman/Admin/menu pada 320/375/768/1024/1440 px.
- Screenshot header di atas navigasi diperiksa.
- `git diff --check` dan pemeriksaan sintaks skrip rilis lulus.

Pengujian menggunakan database PGlite sekali pakai yang menserialkan protokol
PostgreSQL melalui Sync, Chromium, dan respons Drive simulasi. Bukan pengujian
konkurensi PostgreSQL 16 atau swap Docker lokal. Pemasangan VPS memakai prosedur
backup/preview/rollback Rilis 4 yang sudah berhasil digunakan.
