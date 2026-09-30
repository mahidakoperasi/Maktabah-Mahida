'use client';
/* eslint-disable @next/next/no-img-element -- External media and configurable brand assets. */
import { useEffect, useRef, useState } from 'react';
import { publicImageUrl } from '@/lib/media-links';
type Photo = { id: number; imageUrl: string; caption: string | null };
export default function GalleryLightbox({
  photos,
  title,
}: {
  photos: Photo[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const valid = photos.filter((p) => publicImageUrl(p.imageUrl));
  function step(direction: number) {
    setSelected((i) => (i + direction + valid.length) % valid.length);
  }
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelected((i) => (i + 1) % valid.length);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelected((i) => (i - 1 + valid.length) % valid.length);
      }
    };
    node.addEventListener('keydown', key);
    return () => node.removeEventListener('keydown', key);
  }, [valid.length]);
  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {valid.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className="mb-4 block w-full break-inside-avoid border bg-white p-2 text-left focus-visible:outline-2"
            aria-label={`Buka foto ${p.caption || title} ${i + 1}`}
            onClick={() => {
              setSelected(i);
              dialog.current?.showModal();
            }}
          >
            {}
            <img
              src={publicImageUrl(p.imageUrl)!}
              alt={p.caption || `${title} ${i + 1}`}
              loading="lazy"
              className="h-auto w-full"
            />
            {p.caption && (
              <span className="block p-2 text-sm">{p.caption}</span>
            )}
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        aria-label="Foto galeri"
        className="m-auto max-h-[95dvh] w-[95vw] max-w-6xl overflow-auto border-0 bg-[#092d21] p-4 text-white backdrop:bg-black/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="mb-3 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="min-h-11 border px-4"
            onClick={() => step(-1)}
          >
            Sebelumnya
          </button>
          <button
            type="button"
            className="min-h-11 border px-4"
            onClick={() => dialog.current?.close()}
          >
            Tutup
          </button>
          <button
            type="button"
            className="min-h-11 border px-4"
            onClick={() => step(1)}
          >
            Berikutnya
          </button>
        </div>
        {valid[selected] && (
          <figure>
            {}
            <img
              src={publicImageUrl(valid[selected].imageUrl)!}
              alt={valid[selected].caption || title}
              className="mx-auto max-h-[70dvh] max-w-full object-contain"
            />
            <figcaption className="mt-3 text-center">
              {valid[selected].caption} ({selected + 1}/{valid.length})
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
