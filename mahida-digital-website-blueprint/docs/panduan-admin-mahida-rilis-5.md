# Panduan Admin Mahida — Rilis 1–5

## Mulai setiap hari

1. Buka Pengelolaan Harian → Pemeriksaan. Pilih versi terbit untuk memeriksa halaman yang sedang dilihat pengunjung.
2. Periksa pengumuman/album terjadwal di Header & Penerbitan. Jadwal diproses pada permintaan pertama setelah waktunya tiba; pesan kegagalan perlu ditangani dan dijadwalkan ulang.
3. Tinjau inbox Pesan Kontak, moderasi komentar, dan pesanan E-Book sesuai kewenangan Anda.

## Susun teks, foto dan logo

1. Atur judul/teks melalui Halaman & Menu atau editor konten. Susun bagian resmi melalui Bagian Konten Resmi dan foto/video melalui Kliping Visual.
2. Simpan otomatis pada editor draf menunggu 1,5 detik setelah data valid. Perubahan belum valid tetap lokal; jangan menutup halaman sebelum draf tersimpan.
3. URL Drive logo header diisi dengan tautan berkas foto. Kosong berarti logo header disembunyikan. Logo berada di atas navigasi dan ikut hilang saat digulir; menu tetap terlihat.
4. Galeri: tempel URL folder Drive, sinkronkan, pilih foto yang tampil, isi judul/keterangan/teks alternatif, lalu atur ukuran, rasio, crop dan urutan. Kandidat hilang bukan berarti foto boleh langsung dihapus dari kurasi.
5. Foto Drive harus aktif dan dapat dibaca Siapa saja yang memiliki link → Pelihat. Jika foto tidak lagi berada dalam folder album, pindahkan kembali atau perbarui pilihan foto. Pemeriksa tidak memindahkan atau menghapus file.

## Periksa sebelum terbit

1. Di Header & Penerbitan, muat teks/media terkait terbaru setelah memakai editor lain. Jalankan Periksa kualitas draf. Di Pengelolaan Harian Anda juga dapat memilih versi draf atau terbit.
2. Perbaiki masalah tautan, judul kosong, teks alternatif dan akses Drive. Peringatan belum dapat diperiksa berarti jaringan/penyedia membatasi pemeriksa; jangan menganggapnya pasti rusak.
3. Panduan ukuran: usahakan foto di bawah 2 MB, video langsung di bawah 25 MB. Ukuran yang tidak tersedia harus ditinjau manual; foto Drive memakai thumbnail sehingga ukuran asli bukan ukuran transfer halaman.
4. Pratinjau halaman lengkap pada HP, tablet dan desktop. Uji tombol dan pemutaran video: usia/wilayah/login atau layanan sosial bisa membatasi embed walaupun tautannya tersedia.
5. Tinjau nama, kontak, nomor identitas, foto anak/santri, alamat pribadi, dan izin publikasi. Deteksi pola pribadi hanya bantuan; bukan kepastian atau pengganti tinjauan manusia.
6. Centang lima item checklist: status halaman, foto/video/alt, tombol/tautan, tampilan HP, dan informasi pribadi. Terbitkan teks & media atau jadwalkan album/pengumuman. Perubahan isi mengosongkan checklist untuk ditinjau ulang.
7. Checklist wajib dan dicatat bersama penerbitan terpadu. Editor lama masih dapat menerbitkan sesuai hak masing-masing; gunakan tautan Pengelolaan Harian untuk pemeriksaan dan ikuti checklist yang sama sebelum memakai tombol terbit lama.

## Riwayat dan pemulihan

1. Riwayat Header & Penerbitan menyimpan 20 versi sebelum terbit. Pulihkan pasangan teks/media ke draf, periksa kualitas, lakukan pratinjau, lengkapi checklist, kemudian terbitkan ulang.
2. Jika muncul konflik sesi atau sumber terkait berubah, muat versi terbaru. Jangan menimpa atau menghapus perubahan tanpa meninjau isinya.
3. Hasil pemeriksaan menyimpan waktu dan versi yang diperiksa. Jika isi berubah, laporan diberi tanda usang dan perlu dijalankan ulang. Pemeriksaan tidak mengubah draf/terbitan.

## Statistik bawaan Mahida

1. Admin penuh membuka Pengelolaan Harian → Statistik: periode 7/30/90 hari, halaman teratas, klik penting dan rekap harian. Hari dihitung menurut WIB.
2. Kunjungan adalah jumlah halaman dilihat, bukan orang unik. Klik WhatsApp, pendaftaran, YouTube, brosur, tombol Beranda, lanjut QRIS dan kirim pesan dicatat sebagai klik; bukan bukti transaksi, pemutaran atau pengiriman berhasil.
3. Tidak menyimpan nama, email, IP, query URL, teks WhatsApp, referrer, user-agent atau cookie analitik ke tabel statistik. Admin, pratinjau, bot yang dikenali dan Do Not Track tidak dihitung; pemblokir skrip/jaringan dapat mengurangi jumlah.
4. Statistik aktif setelah migrasi Rilis 5 dan hanya mengumpulkan data baru. Admin penuh dapat menonaktifkan atau mengaktifkannya; agregat lama dipertahankan sampai retensi 180 hari. IP hanya dipakai sementara dalam memori untuk membatasi spam permintaan.

## Ekspor sesuai kewenangan

1. Media: galeri beserta foto/kandidat/draf. Konten: artikel, karya, berita dan pengumuman. Admin penuh: halaman/kliping, pesan kontak dan statistik. Pendaftaran: pengaturan formulir. Koperasi: pesanan E-Book.
2. Pilih JSON atau CSV. Ekspor dibagi maksimal 50 data dan 8 MB per bagian. Unduh bagian berikutnya sampai selesai. Lakukan saat tidak ada penyuntingan untuk mengurangi perubahan urutan antarbagian; ekspor bukan backup database untuk restore.
3. JSON mempertahankan struktur foto/draf; CSV menyimpan struktur bersarang sebagai JSON dalam sel dan menetralkan awalan rumus. Ekspor tidak memasukkan password, token sesi, API key atau tautan file E-Book privat.
4. Ekspor pesan kontak dan pesanan berisi data pribadi. Simpan hanya di tempat yang sesuai dan gunakan untuk pengelolaan yang sah. Setiap ekspor dicatat pada log aktivitas Admin.
5. Pendaftaran saat ini memakai formulir eksternal. Jawaban pendaftaran tidak disimpan di Mahida; unduh jawaban dari penyedia formulir. Ekspor Mahida hanya berisi pengaturan dan URL formulir, bukan jawaban yang tidak dimiliki aplikasi.
