# Pencarian dan catatan kaki Maktabah

## Pengunjung

- Beranda dan menu Pencarian menelusuri judul Indonesia/Arab, ringkasan, judul bab/subbab, isi, serta catatan kaki. Filter tersedia untuk jenis hasil dan fan. Hasil dibatasi 12 per halaman, dengan urutan kitab, bab, kemudian isi.
- Pencarian memakai awalan kata: `terjemah` cocok dengan `terjemahan`. Semua kata yang dimasukkan harus cocok dalam satu hasil. Harakat, tatwil, dan variasi angka Arab diabaikan ketika mencari; tampilan teks asli tetap dipertahankan.
- Pembaca menyediakan Daftar Isi, Cari Bab (judul bab/subbab), dan Cari Isi (seluruh isi kitab). Hasil mengarah ke bagian yang sesuai dan menyorot kata. Tombol hasil sebelumnya/berikutnya mengikuti halaman hasil, dan Kembali ke posisi baca memulihkan posisi sebelum pencarian selama penyimpanan browser tersedia.
- Nomor catatan kaki mengikuti Google Docs. Tekan nomor untuk membuka kotak catatan di desktop atau panel bawah di HP. Esc, tombol tutup, atau Kembali membaca menutup catatan dan mengembalikan fokus tanpa menggeser bacaan. Daftar catatan lengkap tersedia di akhir bab dengan tautan kembali ke penanda.

## Admin

1. Tambahkan catatan menggunakan fitur **Catatan kaki** bawaan Google Docs. Teks biasa yang menyerupai catatan tidak diubah menjadi catatan secara otomatis.
2. Sinkronkan kitab untuk memperbarui isi, catatan, dan indeks. Dokumen lama yang sudah tersimpan perlu satu kali sinkronisasi agar metadata nomor terbaru dari Docs tersedia; sebelum itu nomor cadangan mengikuti urutan penanda.
3. Pada Pengaturan Maktabah, ubah label/petunjuk/tombol/judul pencarian, ukuran huruf catatan 14–24 px, dan apakah catatan diikutkan dalam pencarian.
4. Simpan draf untuk pratinjau tampilan. Terbitkan agar pengaturan dipakai pengunjung. Pencarian tetap menelusuri koleksi terbit; isi draf tidak menjadi hasil publik.

## Data dan rilis

Migrasi `0017_maktabah_search.sql` menambahkan indeks turunan PostgreSQL dengan GIN. Isi utama tetap di `posts` dan `maktabah_books`; tidak ada pemasukan kitab dua kali. Migrasi mengindeks terjemahan terbit yang sudah ada dari isi tersimpan, tanpa meminta kredensial Google atau melakukan akses jaringan.

Trigger memperbarui indeks bersama transaksi penerbitan, sinkronisasi, pengarsipan, perubahan sumber, dan pemblokiran. Endpoint memeriksa lagi status penerbitan, kesesuaian dokumen, dan hash cache. Indeks tidak menyediakan isi draf atau kitab yang sumbernya telah diblokir. Catatan mengikuti waktu pendeteksian pencabutan akses oleh pemeriksaan/sinkronisasi Docs yang sudah ada.

Endpoint publik: `GET /api/maktabah/pencarian?q=...&jenis=all|book|chapter|body&fan=...&page=1`. Tambahkan `kitab=<slug>` untuk pencarian isi satu kitab. Respons memuat potongan maksimum 240 karakter (ditambah penanda elipsis), bukan seluruh isi koleksi. `selected=<id-hasil>` menentukan halaman hasil di pembaca setelah tautan dari pencarian global dibuka. Health menampilkan `maktabahSearchReady`.

Pada langkah rilis, jalankan migrasi bersama backup/preview/health yang biasa dipakai. Pertahankan konfigurasi dan mount kunci Google Docs yang sudah aktif. Perubahan langkah ini belum memasang apa pun ke VPS.

## Verifikasi langkah 2

- Build produksi dan TypeScript lulus; ESLint tanpa error (dua warning lama tetap ada).
- Seluruh 89 pengujian regresi lulus pada database uji sementara. Suite mencakup 18 pengujian Maktabah; pemeriksaan Maktabah diulang setelah merapikan jarak filter pencarian HP.
- Pemeriksaan baru meliputi kesesuaian normalisasi Arab di JavaScript/PostgreSQL, nomor catatan asli, catatan yang dipakai ulang, judul/heading/tabel/isi/catatan, indeks terjemahan lama, paginasi dan pemilihan hasil, draf privat, pembaruan indeks ketika sinkronisasi/arsip/pemblokiran, kembali ke posisi baca, fokus/Esc, catatan panjang, ukuran huruf, serta pengaturan draf/terbit.
- Tampilan pencarian, sorotan isi, dan kotak/panel catatan kaki diperiksa pada desktop dan HP. Google Docs memakai fixture uji; kredensial dan isi dokumen produksi tidak dipakai.
