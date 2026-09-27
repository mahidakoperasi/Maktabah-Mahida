# Menelusuri konten yang tampak hilang

Jalankan dari VPS setelah masuk sebagai pengelola. Perintah ini hanya membaca database dan tidak mencetak kredensial:

```bash
docker exec mahida-app node scripts/audit-content.mjs 3
docker inspect mahida-stage2-postgres --format '{{range .Mounts}}{{.Destination}} <- {{.Type}}:{{.Name}}{{println}}{{end}}'
```

- Cocokkan **host dan database aktif** dengan database yang dipakai saat konten dibuat. Kontainer web boleh diganti; database harus memakai volume/bind mount persisten yang sama.
- Baris `posts` berstatus `draft` atau `archived` tetap ada di database, tetapi tidak ditampilkan ke publik. Pulihkan status lewat Admin. Berita yang diterbitkan tampil di `/media/berita`; `/berita` diarahkan ke sana.
- Baris `cms_pages` adalah isi halaman statis, bukan berita. Mengedit halaman `/berita` tidak membuat entri berita baru.
- Jika baris tidak ada di database aktif, periksa cadangan yang dibuat **sebelum** dugaan kehilangan. Pulihkan ke database terpisah untuk membandingkan data terlebih dahulu; jangan menimpa database produksi.
- API `/api/health` memeriksa koneksi dan tabel, bukan jumlah atau keberadaan konten. Periksa hasil simpan di Admin sebelum meninggalkan formulir.

Konten baru tetap membutuhkan tombol **Simpan** atau **Terbitkan**. Penerapan migrasi `0007_guest_engagement.sql` hanya membuat tabel interaksi tamu dan tidak menghapus tabel `posts`.
