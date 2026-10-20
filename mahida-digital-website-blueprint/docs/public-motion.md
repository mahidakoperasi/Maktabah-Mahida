# Animasi publik Mahida

Gerak publik memakai ritme yang sama: menu 180–220 ms, kemunculan bagian halaman 380 ms, pengantar 480 ms, foto saat hover 450 ms, dan promosi 240 ms masuk serta 140 ms keluar. Pola ini merupakan adaptasi untuk Mahida dari referensi pendidikan dan antarmuka modern yang dibahas; bukan penyalinan seluruh efek website referensi.

## Cakupan

- Navigasi desktop: transisi dropdown dan submenu, garis tautan aktif, dan putaran ikon submenu.
- Navigasi HP: panel dan latar muncul/tertutup halus, dengan Esc, fokus keyboard, dan pemulihan scroll tetap berfungsi.
- Beranda, halaman profil, karya, galeri, serta katalog Maktabah: pengantar, judul bagian, kartu dan foto muncul sekali ketika masuk layar. Foto kartu membesar tipis saat hover pada perangkat berkursor.
- Tombol: perubahan warna dan pergeseran kecil, tanpa mengubah ukuran tata letak.
- Promosi: poster dan teks berdampingan di desktop; poster di atas pada HP. Area informasi dapat digulir dan tombol pendaftaran tetap terjangkau. Pratinjau admin menggunakan komponen yang sama.

Poster, judul, deskripsi, jadwal, teks tombol, tujuan, status draf/terbit, serta statistik promosi tetap memakai pengaturan admin yang sudah ada. Promosi yang ditutup tetap tertutup selama navigasi internal dan muncul kembali setelah refresh. Formulir yang sedang diisi tetap menghalangi promosi seperti sebelumnya.

## Batas gerak

Pengaturan perangkat untuk mengurangi gerak langsung menonaktifkan animasi baru, termasuk ketika preferensi berubah saat halaman terbuka. Konten server selalu terlihat walaupun JavaScript atau API animasi tidak tersedia. Tidak ada pengguliran paksa, efek parallax terus-menerus, animasi pengetikan, atau gerakan huruf per karakter.

Admin, login, formulir khusus, dan rute pembaca kitab tidak menjalankan animasi kemunculan halaman. Paragraf bacaan tidak diberi animasi. Penanda catatan, posisi baca, pencarian, dan format Arab memakai perilaku yang sudah dirilis pada 929165a. Elemen yang mendapat fokus keyboard segera menghentikan gerak masuknya.

Pengembang menandai elemen presentasi dengan `data-motion="hero"`, `reveal`, atau `fade`. `PublicMotion` mengamati elemen tersebut dengan IntersectionObserver, menjalankan animasi browser sekali, lalu melepaskan pengamatan. Elemen yang ditambahkan saat navigasi internal ikut diperiksa. Tidak ada pustaka animasi atau dependensi baru.

## Pengujian dan rilis

Pengujian memeriksa konten tanpa JavaScript, fallback API, perubahan preferensi gerak, menu HP/Esc/fokus, serta keterjangkauan tombol promosi dengan judul dan deskripsi maksimum pada 320, 390, 768, dan 1440 px. Suite promosi dan Maktabah juga memeriksa statistik, perilaku refresh/navigasi, pratinjau admin, proteksi konten, pencarian, dan catatan kaki.

Paket ini melanjutkan produksi `mahida:maktabah-929165a`. Gunakan artifact Production Check yang sesuai commit baru dan panduan [rilis](maktabah-release.md). Skrip mempertahankan kunci Google Docs read-only, membuat backup, menguji preview, dan menyediakan rollback container. Tidak ada migrasi database baru, perubahan Nginx, atau pemasangan langsung ke VPS selama pengembangan ini.
