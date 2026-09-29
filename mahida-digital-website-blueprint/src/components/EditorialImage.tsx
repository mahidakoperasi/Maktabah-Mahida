'use client';

import { useState } from 'react';
import { publicImageUrl } from '@/lib/media-links';
import MediaPlaceholder from './MediaPlaceholder';

export default function EditorialImage({ url, label, className = '' }: { url?: string | null; label: string; className?: string }) {
  const src = url ? publicImageUrl(url) : null;
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <MediaPlaceholder label={label} className={className} />;
  // Admin-provided Drive thumbnails and HTTPS media must remain usable without image host configuration.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={label} loading="lazy" onError={() => setFailed(src)} className={`block bg-[#dce6dc] object-cover ${className}`} />;
}
