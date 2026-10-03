# Kredensial Google Docs setelah Maktabah dirilis

Panduan ini untuk produksi `mahida:maktabah-6393627` yang sudah sehat. Script `scripts/enable-google-docs.sh` menggunakan image yang sudah ada; tidak melakukan build, migrasi, atau restore database. Kontainer lama dan backup env dipertahankan.

## Google Cloud dan dokumen

1. Buka https://console.cloud.google.com/, pilih project Mahida atau buat project baru.
2. APIs & Services > Library > Google Docs API > Enable.
3. IAM & Admin > Service Accounts > Create Service Account. Nama: `mahida-docs-reader`. Role project tambahan dan domain-wide delegation tidak diperlukan untuk dokumen yang dibagikan langsung.
4. Catat email service account, buka Keys > Add key > Create new key > JSON > Create. Simpan sebagai `D:\Downloads\mahida-google-docs.json`.
5. Buat Google Docs uji dengan teks dan Heading 1/2/3. Share ke email service account sebagai Viewer; matikan Notify people. General access boleh Restricted. Catat tautan `https://docs.google.com/document/d/ID/edit`.

Dokumentasi resmi: https://developers.google.com/workspace/guides/enable-apis dan https://developers.google.com/workspace/guides/create-credentials.

## Kirim kunci dari PowerShell

```powershell
$keyPath = "D:\Downloads\mahida-google-docs.json"
Test-Path -LiteralPath $keyPath
Get-Content -LiteralPath $keyPath -Raw | ConvertFrom-Json | Select-Object type, client_email, project_id
ssh root@202.155.17.177 "mkdir -p /opt/mahida-secrets"
scp "$keyPath" root@202.155.17.177:/opt/mahida-secrets/mahida-google-docs.json
ssh root@202.155.17.177
```

Pastikan Test-Path True, type service_account, dan email sama dengan penerima akses dokumen. Jangan tampilkan private_key, kirim JSON ke percakapan, atau simpan di GitHub. Perintah scp di atas untuk pemasangan awal; jika kunci sudah dipakai produksi, simpan backup aman sebelum menggantinya.

## Izin file di VPS

```bash
chmod 755 /opt/mahida-secrets
chown 1001:1001 /opt/mahida-secrets/mahida-google-docs.json
chmod 600 /opt/mahida-secrets/mahida-google-docs.json
ls -l /opt/mahida-secrets/mahida-google-docs.json
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
ss -H -ltn 'sport = :3001'
```

Harus image mahida:maktabah-6393627, running healthy, dan port 3001 kosong.

Image 6393627 menjalankan aplikasi sebagai UID 1001 tetapi grup utamanya GID 65533 (nogroup). Karena itu root:1001 mode 640 tidak memberi akses kepada aplikasi. Kepemilikan UID 1001 dengan mode 600 memberi izin hanya kepada pengguna aplikasi; file tetap dipasang read-only.

## Ambil script dari branch GitHub

```bash
git -C /opt/Maktabah-Mahida fetch --no-tags origin feat/content-protection-promotion
git -C /opt/Maktabah-Mahida show origin/feat/content-protection-promotion:mahida-digital-website-blueprint/scripts/enable-google-docs.sh > /root/enable-mahida-google-docs.sh
chmod 700 /root/enable-mahida-google-docs.sh
bash -n /root/enable-mahida-google-docs.sh
```

Tidak ada keluaran bash -n berarti sintaks valid. Source aplikasi yang dirilis tetap worktree 6393627.

## Konfigurasi dengan preview dan rollback

Ganti tautan berikut dengan dokumen uji yang sudah dibagikan:

```bash
DOC_URL='https://docs.google.com/document/d/ID_DOKUMEN_UJI/edit'
nohup bash /root/enable-mahida-google-docs.sh "$DOC_URL" > /root/mahida-backups/google-docs-setup.log 2>&1 < /dev/null &
echo $! > /root/mahida-backups/google-docs-setup.pid
tail -f /root/mahida-backups/google-docs-setup.log
```

Ctrl+C hanya menutup pemantauan. Script memakai lock rilis Mahida; jangan menjalankan proses kedua bersamaan.

Script memeriksa produksi, image, port, izin/struktur kunci, otorisasi Google, dan akses dokumen **sebelum** mengubah env atau kontainer. Kemudian backup env, perbarui hanya GOOGLE_DOCS_CREDENTIALS_FILE, pasang file read-only, uji preview 3001, dan buat ulang aplikasi dengan restart unless-stopped. Preview gagal memulihkan env; kegagalan setelah swap juga memulihkan kontainer lama. Mount produksi selain file kunci menyebabkan script berhenti agar konfigurasi lain tetap terjaga.

Berhasil ditandai `GOOGLE DOCS AKTIF` beserta backup env dan nama rollback. Backup env: `/root/mahida-backups/google-docs-TIMESTAMP-PID/env-before-google-docs`. Nama rollback: `mahida-app-before-google-docs-TIMESTAMP-PID`. Script tidak mencetak private key maupun token. Koneksi Google membutuhkan akses keluar HTTPS dan waktu VPS yang benar.

## Pemeriksaan akhir dan admin

```bash
tail -n 40 /root/mahida-backups/google-docs-setup.log
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
curl -fsS -w '\n' https://mahida.my.id/api/health
docker exec mahida-app node -e 'const fs=require("node:fs");const p=process.env.GOOGLE_DOCS_CREDENTIALS_FILE;if(!p)process.exit(1);fs.accessSync(p,fs.constants.R_OK);console.log("Kredensial tersedia dan terbaca.")'
```

Buka ulang `/admin/maktabah`; peringatan konfigurasi harus hilang. Pilih Kitab & Terjemahan, buat kitab uji, isi judul/fan/tautan Docs, Simpan, Uji Koneksi, Pratinjau Isi, Terbitkan. Buka pembaca, ubah dokumen, tunggu sekitar dua menit dan periksa waktu sinkronisasi serta pemberitahuan pembaca. Jika MAKTABAH_SYNC_ENABLED=false sudah sengaja disetel di env, pemeriksaan otomatis tetap dinonaktifkan; script tidak mengubah pengaturan jeda itu. Jeda per kitab tetap dihormati.

HTTP 403/404 dokumen: periksa akses Viewer, email, ID, API Google Docs, dan pembatasan berbagi akun. Otorisasi gagal: periksa JSON/service account dan waktu VPS. Kunci tidak terbaca: periksa pemilik UID 1001 dan mode 600. Jika script gagal, lihat log dan periksa kontainer mahida-app sebelum mengulangi. Gambar tertanam Docs belum diimpor; sampul/tampilan dikelola di Mahida.
