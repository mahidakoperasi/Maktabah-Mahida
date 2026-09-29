import type { ReactNode } from 'react';
import Link from 'next/link';
import MediaPlaceholder from './MediaPlaceholder';

export type GenericPageTemplateProps = {
  title: string;
  intro?: string | null;
  paragraphs?: string[];
  section?: string;
  children?: ReactNode;
};

export default function GenericPageTemplate({ title, intro, paragraphs = [], section, children }: GenericPageTemplateProps) {
  return <article className="min-h-screen bg-[#fffef9] text-[#143d2a]">
    <header className="border-b border-mahida-200 px-5 pb-12 pt-14 md:px-8 md:pb-20 md:pt-20 lg:px-12"><div className="mx-auto max-w-[1280px]">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-emerald-rich"><Link href="/">Beranda</Link><span aria-hidden="true"> / </span><span aria-current="page">{title}</span></nav>
      {section && <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-rich">{section}</p>}
      <h1 className="mt-3 max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">{title}</h1>
      {intro && <p className="mt-7 max-w-[720px] text-lg leading-8 text-warm-gray-600 md:text-xl">{intro}</p>}
    </div></header>
    <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[minmax(0,700px)_minmax(0,1fr)] lg:gap-20 lg:px-12">
      <div className="max-w-[700px] space-y-7 text-base leading-8 text-warm-gray-700 md:text-lg">
        {paragraphs.length ? <>
          {paragraphs.slice(0, 2).map((paragraph, index) => <p key={index} dir="auto">{paragraph}</p>)}
          {paragraphs.length > 2 && <MediaPlaceholder label={`Gambar ${title}`} className="aspect-video w-full" />}
          {paragraphs.slice(2).map((paragraph, index) => <p key={index + 2} dir="auto">{paragraph}</p>)}
        </> : !children && <p className="empty-state">Informasi resmi akan tersedia setelah diisi melalui pengelolaan Mahida.</p>}
        {children}
      </div>
      <aside aria-label="Tempat media halaman" className="grid content-start gap-4 md:grid-cols-2 lg:grid-cols-1">
        <MediaPlaceholder label={`Gambar ${title}`} className="aspect-[4/3] w-full" />
        <div className="grid grid-cols-2 gap-4"><MediaPlaceholder label="Galeri 01" className="aspect-square w-full" /><MediaPlaceholder label="Galeri 02" className="aspect-square w-full" /></div>
      </aside>
    </div>
  </article>;
}
