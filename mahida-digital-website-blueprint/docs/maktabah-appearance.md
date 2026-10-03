# Maktabah — penyempurnaan langkah 1

Perbaikan tampilan desktop pada Kata Pengantar dan Sumber & Penyuntingan, kartu koleksi, banner beranda, serta footer khusus Maktabah. Pencarian isi dan perluasan catatan kaki dikerjakan pada langkah 2; pemasangan VPS pada langkah 3.

## Mengatur banner

1. Buka **Admin → Maktabah & Terjemahan → Tampilan Maktabah**.
2. Pada **Banner Maktabah**, centang **Aktifkan banner**.
3. Isi judul dan pengantar, atau kosongkan untuk mengikuti nama/pengantar Maktabah yang sudah ada.
4. Isi gambar HTTPS atau berkas Google Drive yang dapat dibuka publik. Gambar khusus HP bersifat opsional; jika kosong, gambar desktop digunakan pada HP.
5. Isi teks alternatif, posisi gambar (kiri, kanan, atas, bawah, atau latar belakang), perataan teks, tinggi minimum desktop (180–640 px), dan fokus gambar horizontal/vertikal.
6. Tombol bersifat opsional. Isi label dan tujuan HTTPS atau jalur internal, misalnya `/maktabah/fan`. Kosongkan label untuk menyembunyikannya.

Banner menggantikan tampilan bagian **Nama & pengantar** di beranda, sehingga mengikuti urutan dan sakelar penayangan bagian tersebut. Banner tidak tampil pada halaman fan, pengenalan kitab, atau pembaca. Gambar bagian pengantar serta kliping lama tetap tersimpan dan digunakan saat banner dinonaktifkan. Pengaturan lama tanpa data banner tetap dapat dibaca; banner baru perlu diaktifkan oleh admin.

Gambar banner menggunakan crop sesuai fokus gambar. Jika gambar gagal dimuat, teks dan tombol tetap tersedia. Pada gambar sebagai latar, lapisan hijau gelap menjaga keterbacaan. Tinggi bersifat minimum sehingga teks panjang tidak terpotong.

## Mengatur footer

Footer berwarna hijau dengan tulisan gading dan aksen emas. Isinya terbatas pada **Media sosial**, **Kontak**, dan **Gabung bersama kami**; tidak menyalin daftar menu footer Mahida.

- **Ikuti pengaturan Mahida**: akun dan kontak aktif mengikuti pengaturan Media Sosial & Kontak yang sudah ada, termasuk WhatsApp koperasi jika diaktifkan di sana.
- **Khusus Maktabah**: tambah, hapus, ubah label/platform/tujuan/urutan, dan tampilkan atau sembunyikan akun serta kontak. Tombol **Salin medsos dan kontak Mahida** mengganti daftar khusus dengan salinan entri pengaturan Mahida; perubahan berikutnya tidak mengubah data Mahida. WhatsApp koperasi otomatis hanya tersedia pada mode mengikuti Mahida.
- Ubah judul kelompok, alamat singkat opsional, ajakan, label tombol, serta tujuan pendaftaran/gabung. Tujuan awal adalah `/tentang/pendaftaran`.
- Atur urutan dan tampil/sembunyi masing-masing kelompok. Kelompok medsos/kontak yang kosong tidak ditampilkan. Kosongkan judul untuk menyembunyikan judul; kosongkan label atau tujuan tombol untuk menyembunyikan tombol.
- Sakelar **Tampilkan footer Maktabah** berlaku untuk seluruh footer.

Footer tersedia di seluruh halaman Maktabah. Di pembaca kitab footer berada setelah isi dan navigasi bacaan, bukan panel tetap yang menutupi teks. Website Mahida di luar `/maktabah` tetap memakai footer yang sudah ada.

## Draf, pratinjau, dan terbit

1. **Simpan Draf Tampilan** menyimpan tanpa mengubah tampilan pengunjung.
2. **Pratinjau HP / Tablet / Desktop** menyimpan draf lalu membuka pratinjau berukuran 375/768/1440 px dalam admin. Ukuran besar dapat digulir secara horizontal dalam bingkai pratinjau.
3. **Pratinjau Tampilan** membuka draf terakhir yang sudah tersimpan di tab baru.
4. Setelah diperiksa, pilih **Terbitkan Tampilan** untuk menerbitkan pengaturan.

Pratinjau draf memerlukan sesi admin yang berhak mengelola konten. Tautan pratinjau yang dibuka pengunjung tetap memperlihatkan versi terbit. Konflik revisi meminta admin memuat ulang sebelum menyimpan.

## Kompatibilitas

- Tidak ada migrasi database baru; banner/footer menggunakan pengaturan `maktabah_library` yang sudah ada.
- Data lama tanpa kedua objek baru diberi nilai bawaan tanpa mengganti teks, urutan, atau pengaturan koleksi lama.
- Perbaikan pengantar/sumber memakai aturan khusus bagian prosa, sehingga wrapper proteksi bacaan dan editor admin tetap berfungsi.
- Kartu memakai modifier terpisah dari kotak sampul, mencakup gaya sampul atas dan sampul samping.
- Sinkronisasi dan kredensial Google Docs tidak diubah pada langkah ini.

## Verifikasi langkah 1

- Build produksi dan TypeScript lulus.
- ESLint tanpa error; dua warning lama pada dashboard admin dan pemuatan font global masih ada.
- Seluruh 85 pengujian otomatis lulus pada database uji sementara dengan Chromium, termasuk 14 pengujian Maktabah. Google Docs/Drive memakai fixture, bukan dokumen atau kredensial produksi.
- Pemeriksaan baru mencakup paragraf panjang berurutan pada 320/390/768/1440 px, dua gaya kartu, draf privat, pengeditan admin, pemilihan gambar HP/desktop, lima posisi banner, gambar lokal gagal sebelum hydration, pewarisan kontak aktif, serta footer setelah isi pembaca.
- Pratinjau visual desktop dan HP sudah diperiksa. Pemasangan serta pemeriksaan pada VPS produksi dilakukan pada langkah 3.
