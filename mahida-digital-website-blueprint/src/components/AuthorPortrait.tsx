'use client';

import { useState } from 'react';

export default function AuthorPortrait({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 font-serif text-3xl text-white">
    {failed ? name.trim().slice(0, 1).toLocaleUpperCase('id-ID') : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`Foto ${name}`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    )}
  </div>;
}
