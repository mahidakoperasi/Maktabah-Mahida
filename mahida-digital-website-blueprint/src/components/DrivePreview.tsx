'use client';

import { useState } from 'react';
import { driveThumbnailUrl } from '@/lib/media-links';

export default function DrivePreview({ url, title }: { url: string; title: string }) {
  const src = driveThumbnailUrl(url);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src) return null;
  return <figure className="mx-auto flex max-w-3xl items-center justify-center overflow-hidden rounded border border-mahida-200 bg-white p-3 sm:p-5">
    {failedSource === src ? <p role="status" className="p-5 text-center text-sm text-warm-gray-600">Gambar belum dapat ditampilkan. Periksa akses publik foto di Google Drive.</p>
      // eslint-disable-next-line @next/next/no-img-element
      : <img src={src} alt={title} loading="lazy" onError={() => setFailedSource(src)} className="block h-auto max-h-[70vh] w-auto max-w-full object-contain" />}
  </figure>;
}
