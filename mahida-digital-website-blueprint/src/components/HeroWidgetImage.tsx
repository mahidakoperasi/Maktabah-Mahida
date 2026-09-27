'use client';

import { useState } from 'react';

export default function HeroWidgetImage({ src, photo }: { src: string; photo: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const visible = failedSource === src ? '/brand/mahida-logo.webp' : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={visible} alt={photo ? 'Foto atau poster Mahida' : 'Logo Mahida'} onError={() => setFailedSource(src)}
      className={photo ? 'h-full w-full object-contain' : 'mx-auto h-24 w-24 object-contain sm:h-36 sm:w-36 lg:h-48 lg:w-48'} />
  );
}
