'use client';

import { useState } from 'react';
import { PenTool } from 'lucide-react';
import { driveThumbnailUrl } from '@/lib/media-links';

export default function ArticleCover({
  url,
  dark = false,
}: {
  url: string | null;
  dark?: boolean;
}) {
  const src = url ? driveThumbnailUrl(url) ?? url : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className={`absolute inset-0 grid place-items-center ${dark ? 'text-[#f1d63d]' : 'text-[#759081]'}`}>
      <PenTool size={30} strokeWidth={1.5} aria-hidden="true" />
      {src && failedUrl !== src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
