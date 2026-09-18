import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profil Pondok',
  description: 'Profil lengkap Pondok Pesantren Mahida: visi, misi, identitas, dan karakteristik.',
};

export default function ProfilPage() {
  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Tentang → Profil</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Profil Pondok Pesantren Mahida</h1>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Arabic Calligraphy Header */}
          <div className="text-center mb-12 pb-10 border-b border-mahida-200">
            <p className="font-arabic text-3xl text-emerald-forest mb-2" dir="rtl" lang="ar">
              مَنْبَعُ الْهِدَايَةِ
            </p>
            <p className="text-warm-gray-500 italic">&quot;Manba&#39;ul Hidayah — Sumber Petunjuk&quot;</p>
          </div>

          {/* Main Content */}
          <div className="prose-article mx-auto mb-12">
            <h2>Tent Pondok Pesantren Mahida</h2>
            <p>
              Pondok Pesantren Mahida — yang dalam bahasa Arab diambil dari frasa 
              <strong> Manba&#39;ul Hidayah</strong> (منبع الهداية), berarti &quot;Sumber Petunjuk&quot; — 
              adalah lembaga pendidikan Islam yang menggabungkan tradisi keilmuan pesantren klasik 
              dengan pendekatan pembelajaran kontemporer.
            </p>

            <h2>Visi</h2>
            <blockquote>
              Menjadi pusat pendidikan Islam yang menghasilkan generasi berilmu, berkarakter, 
              berkarya, dan berkhidmah untuk ummat.
            </blockquote>

            <h2>Misi</h2>
            <ul>
              <li><strong>Menyelenggarakan pendidikan Islam</strong> yang terintegrasi antara ilmu agama dan pengetahuan umum dengan pendekatan salaf (klasik) dan khalaf (modern).</li>
              <li><strong>Membina santri</strong> agar memiliki keimanan, akhlak mulia, kemandirian, dan kepemimpinan.</li>
              <li><strong>Mengembangkan tradisi ilmiah</strong> melalui pembelajaran kitab kuning (turats) dengan metode sorogan dan bandongan.</li>
              <li><strong>Mendorong produktivitas karya</strong> di bidang literasi, terjemahan, riset, seni budaya, dan media.</li>
              <li><strong>Berkhidmah kepada masyarakat</strong> melalui program sosial, pemberdayaan ekonomi, dan dakwah keislaman.</li>
            </ul>

            <h2>Karakteristik</h2>
            <p>Mahida memiliki beberapa ciri khas yang membedakannya:</p>
            <ol>
              <li>Pengajaran bahasa Arab sebagai alat utama akses kitab kuning</li>
              <li>Kurikulum integratif antara madrasah formal dan pengajian non-formal</li>
              <li>Pendekatan pembelajaran aktif: sorogan, bandongan, mudzakarah, dan bahtsul masa&#39;il</li>
              <li>Lingkungan asrama yang mendukung kedisiplinan dan kemandirian</li>
              <li>Keterlibatan santri dalam kegiatan kreativitas dan kemasyarakatan</li>
            </ol>

            <h2>Nama &quot;Mahida&quot;</h2>
            <p>
              Nama <em>Mahida</em> bukanlah singkatan. Ia adalah nama yang diberikan dengan 
              makna filosofis mendalam — mewakili semangat menjadi sumber petunjuk (manba&#39;ul hidayah) 
              bagi siapa saja yang menuntut ilmu di dalamnya. Dalam perjalanannya, nama ini telah 
              menjadi identitas yang mencerminkan komitmen lembaga pada pendidikan Islam bercorak pesantren.
            </p>
          </div>

          {/* Related Links */}
          <div className="grid md:grid-cols-3 gap-5 mt-12 pt-10 border-t border-mahida-200">
            <Link href="/tentang/sejarah" className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest transition-colors">
              <span className="label text-xs mb-2 block">Baca Juga</span>
              <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Sejarah Mahida</h3>
              <ArrowRight size={14} className="mt-2 text-warm-gray-400 group-hover:text-emerald-forest transition-colors" />
            </Link>
            <Link href="/tentang/pengasuh" className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest transition-colors">
              <span className="label text-xs mb-2 block">Baca Juga</span>
              <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Pengasuh</h3>
              <ArrowRight size={14} className="mt-2 text-warm-gray-400 group-hover:text-emerald-forest transition-colors" />
            </Link>
            <Link href="/tentang/pendidikan" className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest transition-colors">
              <span className="label text-xs mb-2 block">Baca Juga</span>
              <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Program Pendidikan</h3>
              <ArrowRight size={14} className="mt-2 text-warm-gray-400 group-hover:text-emerald-forest transition-colors" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
