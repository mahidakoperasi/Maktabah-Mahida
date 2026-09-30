# Mahida Digital Website

Website Mahida memakai Next.js, PostgreSQL, dan Drizzle ORM. Pada VPS, Nginx menerima HTTPS untuk mahida.my.id dan meneruskan permintaan ke aplikasi di 127.0.0.1:3000. Database hanya tersedia di jaringan Docker mahida-network.

## Login dan keamanan

Login hanya untuk admin. Pendaftaran publik dan OTP tidak aktif. Nginx membatasi permintaan login per IP. Aplikasi membatasi percobaan per akun admin selama 15 menit melalui tabel login_rate_limits. API admin memeriksa peran dan status verifikasi akun dari database.

## Variabel lingkungan

Lihat .env.example untuk nama variabel. DATABASE_URL dan JWT_SECRET wajib ada. Nilai asli pada VPS disimpan di .env.production dengan izin 600. Jangan masukkan file rahasia ke Git atau membagikan isinya. File tersebut dikecualikan dari build Docker melalui .dockerignore.

## Pemeriksaan kode

Jalankan npm ci, npm run typecheck, npm run lint, dan npm run build sebelum rilis. package-lock.json mengunci versi paket; Dockerfile memakai npm ci. Lint Tahap 1 lulus tanpa error, dengan satu peringatan font pada src/app/layout.tsx.

## Database dan rilis

Berkas migrasi bernomor berada di drizzle/. Skrip scripts/migrate.mjs mencatat migrasi yang sudah diterapkan. Buat cadangan database sebelum migrasi dan jangan mengubah berkas migrasi lama.

Di VPS ini, kontainer aplikasi bernama mahida-app, PostgreSQL bernama mahida-postgres, dan cadangan manual berada di /root/mahida-backups/. Sebelum mengganti aplikasi: buat image baru, jalankan migrasi yang diperlukan, uji image pada port lokal sementara, lalu gunakan skrip pergantian dengan pemulihan otomatis. Periksa kesehatan aplikasi dan HTTPS setelah pergantian.

## Perintah pemeriksaan VPS

Status kontainer: docker ps
Kesehatan situs: curl -fsS https://mahida.my.id/api/health
Konfigurasi Nginx: nginx -t
Pastikan aplikasi hanya memakai alamat 127.0.0.1:3000 dan jangan membuka port 3000 langsung ke internet.
