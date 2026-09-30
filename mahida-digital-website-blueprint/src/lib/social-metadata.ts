import type { Metadata } from 'next';
import { driveIdFromUrl } from './media-links';

const origin = 'https://mahida.my.id';
const fallbackImage = `${origin}/brand/mahida-logo.webp`;

export function socialImageUrl(source: string | null | undefined): string {
  if (!source) return fallbackImage;
  const driveId = driveIdFromUrl(source);
  if (driveId) return `${origin}/api/og-image/${encodeURIComponent(driveId)}`;
  try {
    const url = new URL(source, origin);
    return url.protocol === 'https:' && (source.startsWith('/') && !source.startsWith('//') || ['mahida.my.id', 'i.ytimg.com'].includes(url.hostname))
      ? url.toString() : fallbackImage;
  } catch { return fallbackImage; }
}

export function socialMetadata({ title, description, image, path }: {
  title: string; description?: string | null; image?: string | null; path: string;
}): Metadata {
  const plain = (description ?? '').replace(/\[\[[^\]]*\]\]/g, '').replace(/\[[^\]]+\]\([^)]*\)/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 260);
  const summary = plain || `Baca ${title} di Mahida Digital.`;
  const url = `${origin}${path}`;
  const imageUrl = socialImageUrl(image);
  return {
    title,
    description: summary,
    alternates: { canonical: url },
    openGraph: { title: `${title} - Maktabah Mahida`, description: summary, url, type: 'article', siteName: 'Mahida Digital', images: [{ url: imageUrl }] },
    twitter: { card: 'summary_large_image', title: `${title} - Maktabah Mahida`, description: summary, images: [imageUrl] },
  };
}
