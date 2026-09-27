'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function HomepageAboutImage({ src }: { src: string | null }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (src && failedSource !== src) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Pondok Pesantren Mahida" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedSource(src)} loading="lazy" />
  );
  return <div className="absolute inset-0 grid place-items-center">
    <div className="text-center">
      <Image src="/brand/mahida-logo.webp" alt="Logo Mahida" width={190} height={190} className="mx-auto h-44 w-44 object-contain opacity-95" />
      <p className="mt-5 font-arabic text-3xl text-[#075b3a]">مَنْبَعُ الْهِدَايَةِ</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#839087]">Sumber Petunjuk</p>
    </div>
  </div>;
}
