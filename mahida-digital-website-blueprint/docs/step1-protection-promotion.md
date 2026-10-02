# Langkah 1 — Proteksi, format teks dan promosi

Dasar implementasi: Rilis 5, commit `a94cba2`. VPS tidak diubah.

## Perilaku publik

- Artikel, Esai, Berita dan Terjemahan memiliki batas proteksi seleksi, salin, potong, menu konteks teks dan seret. Kontrol interaktif serta input tetap berfungsi. Editor admin tidak memakai proteksi.
- Teks Arab di isi, judul detail dan ringkasan detail memakai Amiri, termasuk di tengah kalimat Indonesia. Paragraf memakai `dir="auto"`, sehingga arah mengikuti huruf kuat pertama. Judul tetap rata awal; paragraf isi justify di HP maupun desktop.
- Proteksi ini hanya menghambat penyalinan biasa; sumber yang sudah dikirim ke browser tetap dapat diambil secara teknis, termasuk melalui tangkapan layar/OCR.
- Promosi terbit dimuat pada kunjungan pertama ke halaman publik, termasuk tautan langsung ke detail. Penutupan dan klik tombol berlaku sepanjang umur dokumen browser, tanpa cookie/localStorage/sessionStorage. Navigasi internal mempertahankannya; refresh memulai kunjungan baru.
- Pop-up tampil sesudah poster berhasil dimuat. Kegagalan poster tidak menghalangi halaman. Tombol tutup, Escape, fokus modal dan pengguliran ditangani dengan elemen dialog native.
- Halaman admin, login dan pratinjau publik tidak memunculkan promosi otomatis.

## Pengelolaan admin

Menu: **Tampilan Website → Proteksi & Promosi** (`/admin/tampilan/promosi`). Akses mengikuti izin pengaturan utama yang sudah ada: admin utama atau akses penuh.

1. Isi judul, keterangan, tautan **berkas gambar** Drive, teks dan tujuan tombol.
2. Jadwal memakai WIB. Kolom kosong berarti tidak ada batas pada sisi tersebut. Waktu mulai inklusif; waktu selesai eksklusif.
3. **Simpan Draf & Proteksi** menyimpan draf kampanye dan toggle proteksi. Versi promosi tayang tetap terpisah.
4. **Pratinjau Pop-up** menampilkan draf tanpa navigasi tombol dan tanpa statistik.
5. **Terbitkan Promosi** memeriksa akses/MIME poster melalui konfigurasi Google Drive API yang sudah ada sebelum mengganti versi tayang. Tidak perlu konfigurasi API baru untuk menyimpan draf.
6. **Jeda Promosi Tayang** menghentikan penayangan pada kunjungan/refresh berikutnya. **Kampanye Baru** membuat ID baru dan statistik kampanye baru; belum mengganti versi tayang.

Tautan tujuan menerima rute publik internal atau HTTPS tanpa kredensial. Jadwal salah, poster selain berkas gambar Drive, dan rute internal admin/API ditolak.

## Penyimpanan dan statistik

- Tidak ada migrasi atau perubahan skema: konfigurasi memakai key `content_promotion` di tabel `settings`; hitungan memakai tabel `analytics_daily` dari Rilis 5.
- Statistik: jumlah pop-up berhasil tampil, penutupan tanpa klik, serta klik tombol. Klik tombol tidak ikut dihitung sebagai penutupan.
- Agregasi harian WIB, jendela 180 hari, bukan jumlah pengunjung unik. Kampanye baru memiliki hitungan sendiri; penyuntingan kampanye mempertahankan ID-nya.
- Statistik promosi memiliki toggle sendiri. Pratinjau, trafik admin yang terautentikasi, bot, Do Not Track dan Global Privacy Control tidak dihitung.
- Endpoint menolak asal lintas situs, memvalidasi ID kampanye aktif dan rute publik, membatasi ukuran request/laju kirim, dan menghindari event ganda dalam satu proses selama 30 menit. IP hanya di-hash dengan salt sementara untuk pembatasan laju; tidak disimpan di database. Angka tetap perkiraan dan bukan catatan transaksi; restart/multi-instance dapat membatasi deduplikasi.

## Verifikasi

- Typecheck, build produksi dan lint tanpa error. Dua warning lint lama tetap ada pada dashboard/font layout.
- Delapan tes browser/API pada database sementara: jadwal/URL, proteksi empat jenis tulisan di HP/desktop, font campuran dan RTL, input/editor, toggle, izin admin, draf terpisah, kegagalan pemeriksaan Drive, terbit/jeda, navigasi/refresh, Escape, pratinjau dan statistik.
- Tes regresi Rilis 4 memeriksa editor, gambar, reaksi tamu, moderasi, rekomendasi dan hero mobile.
- Drive API dan poster menggunakan fixture saat pengujian. Poster dan jadwal nyata perlu diuji melalui admin ketika versi ini dirilis. Produksi/VPS belum disentuh.

## Batas langkah berikutnya

Saat ini rute Maktabah masih berupa empty state; pembaca kitab belum tersedia. Komponen `ProtectedReading` disiapkan agar pembaca native Maktabah pada Langkah 2–3 menggunakan batas proteksi yang sama. Tidak ada pembaca semu yang ditambahkan pada Langkah 1.

Integrasi Google Docs API, CMS kitab, editor kata pengantar beserta tabel/arah Arab, sinkronisasi 1–2 menit, uji koneksi/pratinjau/sinkronkan/jeda, status sinkronisasi, pengendalian sumber yang dicabut dan pemberitahuan pembaruan bacaan tetap menjadi Langkah 2. Tata kelola metadata Mahida versus isi Google Docs mengikuti rancangan pengguna. Desain Maktabah berbasis fan tanpa kategori penulis, pembaca kitab dan rilis menjadi Langkah 3.
