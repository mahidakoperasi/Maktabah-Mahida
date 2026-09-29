import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import EditorialImage from './EditorialImage';

export type UnitTemplateProps = {
  title: string;
  level: string;
  accreditation?: string;
  description?: string;
  facilities?: { title: string; description?: string }[];
  images?: string[];
  facilityImages?: string[];
  ctaTitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sectionLabel?: string;
  aboutHeading?: string;
  facilitiesHeading?: string;
  registrationLabel?: string;
};

export default function UnitTemplate({ title, level, accreditation, description, facilities = [], images = [], facilityImages = [], ctaTitle, ctaLabel, ctaHref, sectionLabel, aboutHeading, facilitiesHeading, registrationLabel }: UnitTemplateProps) {
  const slots = Array.from({ length: 4 }, (_, index) => facilities[index] ?? { title: `Fasilitas ${String(index + 1).padStart(2, '0')}` });
  return <div className="bg-[#fffef9] text-[#143d2a]">
    <header className="bg-[#123d2b] px-5 py-16 text-white md:px-8 md:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px]">
        <nav aria-label="Breadcrumb" className="mb-9 flex flex-wrap gap-2 text-xs text-white/80 md:text-sm"><Link href="/">Beranda</Link><span aria-hidden>/</span><Link href="/tentang/pendidikan">Unit Pendidikan</Link><span aria-hidden>/</span><span aria-current="page">{title}</span></nav>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4c72f]">{sectionLabel || 'Pendidikan Mahida'}</p>
        <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">{title}</h1>
      </div>
    </header>
    <div className="border-b border-mahida-200 bg-[#eaf0e7]"><dl className="mx-auto grid max-w-[1280px] grid-cols-1 gap-5 px-5 py-6 md:grid-cols-2 md:gap-8 md:px-8 lg:px-12">
      <div><dt className="text-xs font-bold uppercase tracking-widest text-warm-gray-600">Jenjang</dt><dd className="mt-1 text-lg font-bold">{level}</dd></div>
      <div><dt className="text-xs font-bold uppercase tracking-widest text-warm-gray-600">Akreditasi</dt><dd className="mt-1 text-lg font-bold">{accreditation || 'Informasi belum dicantumkan'}</dd></div>
    </dl></div>
    <section aria-labelledby="about-unit" className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-2 lg:gap-20 lg:px-12">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-rich">Mengenal unit</p><h2 id="about-unit" className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{aboutHeading || 'Tentang Unit'}</h2><p className="mt-7 max-w-prose text-base leading-8 text-warm-gray-600 md:text-lg">{description || 'Informasi resmi unit ini akan ditambahkan melalui pengelolaan Mahida.'}</p></div>
      <EditorialImage url={images[0]} label={`Gambar ${title}`} className="aspect-[4/3] w-full" />
    </section>
    <section aria-labelledby="facilities" className="bg-[#f2f4ed] py-16 md:py-24"><div className="mx-auto max-w-[1280px] px-5 md:px-8 lg:px-12">
      <h2 id="facilities" className="text-3xl font-black tracking-tight md:text-5xl">{facilitiesHeading || 'Fasilitas'}</h2>
      <div className="mt-9 grid gap-4 lg:grid-cols-4 lg:grid-rows-2">
        {slots.map((facility, index) => <details key={index} className={`group overflow-hidden border border-mahida-200 bg-white lg:min-h-[240px] ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : index === 3 ? 'lg:col-span-2' : ''}`}>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"><EditorialImage url={facilityImages[index]} label={`Foto fasilitas ${index + 1}`} className={`w-full ${index === 0 ? 'aspect-[4/3] lg:aspect-auto lg:h-[380px]' : 'aspect-video lg:h-[165px]'}`} /><span className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 text-lg font-bold group-open:text-emerald-rich">{facility.title}<span aria-hidden>+</span></span></summary>
          <p className="px-5 pb-5 text-sm leading-6 text-warm-gray-600">{facility.description || 'Keterangan fasilitas belum tersedia.'}</p>
        </details>)}
      </div>
    </div></section>
    <section className="bg-[#123d2b] px-5 py-16 text-white md:px-8 md:py-24"><div className="mx-auto flex max-w-[1280px] flex-col gap-7 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#e4c72f]">{registrationLabel || 'Pendaftaran'}</p><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-5xl">{ctaTitle || 'Bergabung bersama Mahida'}</h2></div><Link href={ctaHref || '/tentang/pendaftaran'} className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#e4c72f] px-6 py-3 text-sm font-bold text-[#123d2b]">{ctaLabel || 'Informasi Pendaftaran'} <ArrowUpRight size={18} aria-hidden /></Link></div></section>
  </div>;
}
