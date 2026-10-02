'use client';
import { useState } from 'react';
import { publicImageUrl } from '@/lib/media-links';
export default function HeaderLogo({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const src = publicImageUrl(url);
  if (!src || failed) return null;
  return (
    <header
      data-publication-header
      className="border-b border-mahida-200 bg-white px-5 py-6 md:py-9"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Logo header website"
        className="mx-auto h-auto max-h-48 w-auto max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </header>
  );
}
