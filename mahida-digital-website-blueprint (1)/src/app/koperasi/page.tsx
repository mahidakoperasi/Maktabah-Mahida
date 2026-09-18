import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, ShoppingCart, Package, School, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Koperasi Mahida',
  description: 'Katalog publik Koperasi Mahida: kitab, buku, alat tulis, perlengkapan santri, dan paket madrasah.',
};

const productCategories = [
  { name: 'Kitab', desc: 'Kitab kuning & pegangan santri', icon: BookOpen, count: 45, color: 'bg-emerald-50 text-emerald-700' },
  { name: 'Buku', desc: 'Buku umum & referensi', icon: BookOpen, count: 32, color: 'bg-blue-50 text-blue-700' },
  { name: 'ATK', desc: 'Alat tulis kantor & sekolah', icon: Package, count: 28, color: 'bg-purple-50 text-purple-700' },
  { name: 'Perlengkapan Santri', desc: 'Kebutuhan sehari-hari santri', icon: ShoppingCart, count: 40, color: 'bg-amber-50 text-amber-700' },
  { name: 'Paket Madrasah', desc: 'Paket lengkap kebutuhan madrasah', icon: School, count: 8, color: 'bg-red-50 text-red-700' },
];

const featuredProducts = [
  { name: 'Matan Al-Ajurumiyah + Syarh', category: 'Kitab', price: 'Rp 85.000', available: true },
  { name: 'Mushaf Al-Quran A5', category: 'Buku', price: 'Rp 55.000', available: true },
  { name: 'Paket Alat Tulis Santri Baru', category: 'ATK', price: 'Rp 120.000', available: true },
  { name: 'Paket Perlengkapan Wajib', category: 'Perlengkapan Santri', price: 'Rp 350.000', available: true },
  { name: 'Sarf al-Galayaini', category: 'Kitab', price: 'Rp 75.000', available: true },
  { name: 'Kamus Al-Munawwir', category: 'Buku', price: 'Rp 95.000', available: false },
  { name: 'Paket Kitab Kelas 1', category: 'Paket Madrasah', price: 'Rp 250.000', available: true },
  { name: 'Tas Ransel Santri', category: 'Perlengkapan Santri', price: 'Rp 180.000', available: true },
];

export default function KoperasiPage() {
  return (
    <>
      <section className="bg-brass-muted/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass mb-3">Ekosistem</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal mb-2">Koperasi Mahida</h1>
          <p className="text-warm-gray-600 max-w-xl">Kitab, buku, perlengkapan santri, dan kebutuhan lainnya. Bagian dari ekosistem Mahida.</p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {productCategories.map((cat) => (
              <Link
                key={cat.name}
                href="/koperasi"
                className="group p-6 bg-cream border border-mahida-150 hover:border-emerald-300 hover:bg-white transition-all text-center"
              >
                <div className={`w-14 h-14 mx-auto mb-3 rounded-full ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <cat.icon size={22} />
                </div>
                <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">{cat.name}</h3>
                <p className="text-xs text-warm-gray-500 mt-0.5">{cat.desc}</p>
                <span className="text-xs text-warm-gray-400 mt-2 inline-block">{cat.count} item</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Produk Pilihan</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <article
                key={product.name}
                className={`group bg-white rounded-sm overflow-hidden border ${product.available ? 'border-mahida-150 hover:border-emerald-300' : 'border-mahada-100 opacity-70'} transition-all`}
              >
                {/* Product Image Placeholder */}
                <div className="aspect-square bg-gradient-to-br from-mahida-50 to-mahida-100 flex items-center justify-center relative">
                  <BookOpen size={32} className={`text-mahida-300 ${product.available ? '' : 'grayscale'}`} />
                  {!product.available && (
                    <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-sm">Habis</span>
                  )}
                </div>
                
                <div className="p-4">
                  <span className="tag-pill text-[10px]">{product.category}</span>
                  <h3 className="font-semibold text-sm text-charcoal mt-1.5 line-clamp-2 group-hover:text-emerald-forest transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-emerald-forest">{product.price}</span>
                    {product.available && (
                      <button className="text-xs font-medium text-emerald-forest hover:text-emerald-deep underline">Pesan</button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Order Info */}
          <div className="mt-12 bg-parchment rounded-sm p-8 border border-mahida-200 text-center">
            <Mail size={28} className="mx-auto mb-3 text-emerald-forest" />
            <h3 className="font-serif font-bold text-lg text-charcoal mb-2">Cara Memesan</h3>
            <p className="text-sm text-warm-gray-600 max-w-md mx-auto leading-relaxed">
              Untuk pemesanan produk Koperasi Mahida, silakan hubungi kami melalui email 
              atau datang langsung ke kantor koperasi di area pondok.
            </p>
            <a href="mailto:koperasi@mahida.co.id" className="btn-primary mt-4 inline-flex">
              <Mail size={15} />
              koperasi@mahida.co.id
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
