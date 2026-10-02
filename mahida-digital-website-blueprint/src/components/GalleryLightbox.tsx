'use client';
/* eslint-disable @next/next/no-img-element -- Public external Drive photos. */
import { useEffect, useRef, useState } from 'react';
import { publicImageUrl } from '@/lib/media-links';
import type { GalleryPhoto } from '@/lib/gallery-schema';

type Photo = { id: number | string; imageUrl: string; caption: string | null } & Partial<Omit<GalleryPhoto, 'id' | 'imageUrl' | 'caption'>>;
export default function GalleryLightbox({ photos, title, layout = 'masonry' }: { photos: Photo[]; title: string; layout?: 'grid' | 'masonry' | 'spotlight' }) {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const valid = photos.filter((p) => p.selected !== false && p.visible !== false && publicImageUrl(p.imageUrl));
  function step(direction: number) { if (valid.length) setSelected((i) => (i + direction + valid.length) % valid.length); }
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelected((i) => valid.length ? (i + (e.key === 'ArrowRight' ? 1 : -1) + valid.length) % valid.length : 0);
      }
    };
    node.addEventListener('keydown', key);
    return () => node.removeEventListener('keydown', key);
  }, [valid.length]);
  const ratio = (p: Photo) => p.ratio === 'landscape' ? '16 / 9' : p.ratio === 'portrait' ? '3 / 4' : p.ratio === 'square' ? '1 / 1' : layout === 'grid' && (!p.ratio || p.ratio === 'original') ? '4 / 3' : undefined;
  const gridSize = { small: 'sm:col-span-2 lg:col-span-3', medium: 'sm:col-span-3 lg:col-span-4', large: 'sm:col-span-6 lg:col-span-6' };
  return <>
    <div data-gallery-layout={layout} className={layout === 'masonry' ? 'columns-1 gap-4 sm:columns-2 lg:columns-3' : 'grid grid-cols-1 items-start gap-4 sm:grid-cols-6 lg:grid-cols-12'}>
      {valid.map((p, i) => <button key={p.id} type="button" className={`block w-full break-inside-avoid border bg-white p-2 text-left focus-visible:outline-2 ${layout === 'masonry' ? 'mb-4' : layout === 'spotlight' && i === 0 ? 'sm:col-span-6 lg:col-span-12' : gridSize[p.size ?? 'medium']}`} aria-label={`Buka foto ${p.title || p.caption || title} ${i + 1}`} onClick={() => { setSelected(i); dialog.current?.showModal(); }}>
        <div className={layout === 'masonry' ? p.size === 'small' ? 'mx-auto w-3/4' : p.size === 'medium' ? 'mx-auto w-[90%]' : 'w-full' : 'w-full'}>
          <img src={publicImageUrl(p.imageUrl)!} alt={p.alt || p.title || p.caption || `${title} ${i + 1}`} loading="lazy" className="h-auto w-full bg-warm-gray-100" style={{ aspectRatio: ratio(p), objectFit: p.crop ? 'cover' : 'contain', objectPosition: `${p.focalX ?? 50}% ${p.focalY ?? 50}%` }} />
          {p.title && <span className="block px-2 pt-2 font-semibold">{p.title}</span>}
          {p.caption && <span className="block p-2 text-sm">{p.caption}</span>}
        </div>
      </button>)}
    </div>
    <dialog ref={dialog} aria-label="Foto galeri" className="m-auto max-h-[95dvh] w-[95vw] max-w-6xl overflow-auto border-0 bg-[#092d21] p-4 text-white backdrop:bg-black/80" onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className="mb-3 flex flex-wrap justify-between gap-3">
        <button type="button" className="min-h-11 border px-4" onClick={() => step(-1)}>Sebelumnya</button>
        <button type="button" className="min-h-11 border px-4" onClick={() => dialog.current?.close()}>Tutup</button>
        <button type="button" className="min-h-11 border px-4" onClick={() => step(1)}>Berikutnya</button>
      </div>
      {valid[selected] && <figure>
        <img src={publicImageUrl(valid[selected].imageUrl)!} alt={valid[selected].alt || valid[selected].title || valid[selected].caption || title} className="mx-auto max-h-[70dvh] max-w-full object-contain" />
        <figcaption className="mt-3 text-center">{valid[selected].title && <strong className="block">{valid[selected].title}</strong>}{valid[selected].caption} ({selected + 1}/{valid.length})</figcaption>
      </figure>}
    </dialog>
  </>;
}
