'use client';
/* eslint-disable @next/next/no-img-element -- External media and configurable brand assets. */
import { useState } from 'react';
import { publicImageUrl } from '@/lib/media-links';
export default function BrandLogo({
  url,
  name = 'Mahida',
  className = 'h-10 w-10',
}: {
  url?: string;
  name?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = url ? publicImageUrl(url) : null;
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt={`Logo ${name}`}
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
