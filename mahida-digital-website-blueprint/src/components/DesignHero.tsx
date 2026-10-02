import type { ReactNode } from 'react';
import { isDesignPreview, getDesign } from '@/lib/design-store';
import { VisualItem } from './VisualMedia';
import type { Clip } from '@/lib/design-schema';
export default async function DesignHero({
  path,
  image = '',
  video = '',
  children,
  className = '',
}: {
  path: string;
  image?: string;
  video?: string;
  children: ReactNode;
  className?: string;
}) {
  const preview = await isDesignPreview(path, 'media');
  const design = await getDesign(path, 'media');
  const legacy: Clip | null =
    video || image
      ? {
          id: 'legacy',
          area: 'hero',
          type: video ? 'video' : 'image',
          url: video || image,
          alt: 'Latar Mahida',
          poster: image,
          size: 'wide',
          ratio: 'landscape',
          focalX: 50,
          focalY: 50,
          afterSection: '',
        }
      : null;
  const hero = design ? design.clips.find((c) => c.area === 'hero') : legacy;
  return (
    <header
      className={`relative isolate overflow-hidden bg-[#123d2b] text-white ${className}`}
    >
      {preview && (
        <span className="absolute right-3 top-3 z-20 border bg-white px-3 py-2 text-xs font-bold text-emerald-forest">
          Area media: hero
        </span>
      )}
      {hero && <VisualItem key={`${hero.url}-${hero.type}-${hero.poster}`} clip={hero} hero fallback={image} />}
      {hero?.type === 'image' && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#092d21]/35 via-[#0d3528]/25 to-transparent" />
      )}
      <div
        className={`relative w-full ${hero ? '[&_h1]:drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] [&_p]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : ''}`}
      >
        {children}
      </div>
    </header>
  );
}
