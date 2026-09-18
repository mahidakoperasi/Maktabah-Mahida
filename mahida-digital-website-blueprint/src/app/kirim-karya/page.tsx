import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, FileText, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kirim Karya',
  description: 'Panduan dan ketentuan pengiriman karya ke Mahida Digital. Esai, terjemahan, sastra, riset, dan karya kreatif.',
};

const acceptedWorks = [
  {
    category: 'Esai & Gagasan',
    examples: 'Pemikiran pendidikan, sosial, pesantren, refleksi, budaya, opini',
    format: '.docx',
    wordCount: '1.500 - 5.000 kata',
  },
  {
    category: 'Terjemahan & Khazanah',
    examples: 'Terjemahan kitab, syarah, ta\'liq, ringkasan kitab',
    format: '.docx',
    wordCount: 'Sesuai panjang teks asli',
  },
  {
    category: 'Sastra',
    examples: 'Puisi, cerpen, prosa, nadhom, sastra pegon, sastra Jawa',
    format: '.docx',
    wordCount: 'Bervariasi',
  },
  {
    category: 'Riset & Kajian',
    examples: 'Makalah, laporan penelitian, resume kajian, bahtsul masa\'il',
    format: '.docx',
    wordCount: '2.000 - 10.000 kata',
  },
  {
    category: 'Budaya & Tradisi',
    examples: 'Tradisi pesantren, budaya Jawa, macapat, shalawat',
    format: '.docx',
    wordCount: '1.500 - 5.000 kata',
  },
];

export default function KirimKaryaPage() {
  return (
    <>
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Karya</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">Kirim Karya</h1>
          <p className="text-white/70 max-w-xl">
            Mahida Digital menerima karya dari siapa saja yang ingin berkontribusi. 
            Berikut panduan lengkap pengiriman karya.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Process Flow */}
          <div className="bg-parchment rounded-sm p-8 border border-mahida-200 mb-12">
            <h2 className="font-serif font-bold text-lg text-charcoal mb-6">Proses Pengiriman</h2>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {[
                { step: '1', label: 'Siapkan', desc: 'Tulis karya dalam format .docx' },
                { step: '2', label: 'Kirim', desc: 'Email ke alamat resmi' },
                { step: '3', label: 'Review', desc: 'Admin membaca & menilai' },
                { step: '4', label: 'Terbit', desc: 'Dipublikasikan di website' },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="w-10 h-10 mx-auto bg-emerald-forest text-white rounded-full flex items-center justify-center font-serif font-bold text-sm mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-sm text-charcoal">{item.label}</h3>
                  <p className="text-xs text-warm-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted Works */}
          <h2 className="font-serif font-bold text-xl text-charcoal mb-6">Jenis Karya yang Diterima</h2>
          <div className="space-y-4 mb-12">
            {acceptedWorks.map((work) => (
              <div key={work.category} className="border border-mahida-200 rounded-sm p-6 hover:border-emerald-300 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-semibold text-charcoal">{work.category}</h3>
                    <p className="text-sm text-warm-gray-600 mt-1">{work.examples}</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="label block mb-0.5">Format</span>
                      <span className="font-medium text-emerald-forest">{work.format}</span>
                    </div>
                    <div>
                      <span className="label block mb-0.5">Panjang</span>
                      <span className="font-medium text-warm-gray-700">{work.wordCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines */}
          <h2 className="font-serif font-bold text-xl text-charcoal mb-6">Ketentuan & Pedoman</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-green-50 rounded-sm border border-green-200">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-charcoal mb-1">Yang Kami Terima</h3>
                  <ul className="text-xs text-warm-gray-600 space-y-1">
                    <li>• Karya orisinal (bukan hasil AI/PLAGIASI)</li>
                    <li>• Format Microsoft Word (.docx)</li>
                    <li>• Bahasa Indonesia atau Arab</li>
                    <li>• Topik relevan dengan pesantren/islam/budaya</li>
                    <li>• Tidak mengandung SARA atau ujaran kebencian</li>
                    <li>• Belum pernah diterbitkan di media lain</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-red-50 rounded-sm border border-red-200">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-charcoal mb-1">Yang Tidak Kami Terima</h3>
                  <ul className="text-xs text-warm-gray-600 space-y-1">
                    <li>• Konten hasil generasi AI tanpa sentuhan manusia</li>
                    <li>• Format PDF (sebagai sumber utama)</li>
                    <li>• Artikel berita biasa (kirim sebagai berita)</li>
                    <li>• Promosi produk/jasa komersial</li>
                    <li>• Konten yang melanggar hukum</li>
                    <li>• Materi kursus dari lembaga lain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="bg-mahida-50 rounded-sm p-6 border border-mahida-200 mb-12">
            <h3 className="font-semibold text-charcoal mb-2 flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-forest" />
              Hak Cipta
            </h3>
            <p className="text-sm text-warm-gray-600 leading-relaxed">
              Dengan mengirimkan karya, Anda menyetujui bahwa:
            </p>
            <ul className="text-sm text-warm-gray-600 space-y-1 mt-2 ml-4 list-disc">
              <li>Hak cipta tetap menjadi milik penulis</li>
              <li>Mahida Digital mendapatkan hak publikasi di platformnya</li>
              <li>Karya dapat diedit untuk keperluan tata letak dan konsistensi editorial</li>
              <li>Nama penulis akan selalu dicantumkan</li>
            </ul>
          </div>

          {/* CTA - Email */}
          <div className="text-center bg-emerald-forest text-white rounded-sm p-10">
            <Mail size={32} className="mx-auto mb-4 text-brass-light" />
            <h2 className="font-serif font-bold text-xl mb-2">Kirim Karyamu Sekarang</h2>
            <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
              Lampirkan file .docx dan sertakan informasi: nama penulis, judul karya, ringkasan singkat.
            </p>
            <a
              href="mailto:karya@mahida.co.id?subject=Kirim%20Karya%20-%20Mahida%20Digital&body=Assalamu'alaikum,%0D%0A%0D%0ABerikut saya lampirkan karya untuk ditinjau:%0D%0A- Nama Penulis:%0D%0A- Judul Karya:%0D%0A- Ringkasan:%0D%0A"
              className="inline-flex items-center gap-2 bg-white text-emerald-forest font-semibold px-8 py-3.5 hover:bg-cream transition-colors"
            >
              <Mail size={17} />
              Kirim Melalui Email
            </a>
            <p className="text-white/50 text-xs mt-4">karya@mahida.co.id</p>
          </div>

          {/* Note about account */}
          <p className="text-center text-sm text-warm-gray-500 mt-8">
            Tidak perlu memiliki akun untuk mengirim karya. Namun, jika karya diterbitkan, 
            kami mendorong penulis untuk membuat akun agar bisa mendapatkan notifikasi dan statistik.{' '}
            <Link href="/daftar" className="text-emerald-forest hover:underline font-medium">Buat Akun</Link>
          </p>
        </div>
      </section>
    </>
  );
}
