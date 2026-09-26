'use client';

import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';

export default function YouTubeArticleBlock({
  videoId,
  url,
  label,
}: {
  videoId: string;
  url: string;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbnail, setThumbnail] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  );

  return (
    <section className="my-10 overflow-hidden border border-mahida-200 bg-white shadow-sm">
      <div className="relative aspect-video overflow-hidden bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={label || 'Video Mahida'}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={label || 'Putar video Mahida'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
              onError={() =>
                setThumbnail(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
              }
            />
            <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[#075b3a] shadow-xl transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
                <Play size={30} fill="currentColor" className="ml-1" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-5 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a18725]">
            Video Mahida
          </p>
          <h2 className="mt-2 font-serif text-xl font-bold text-[#173d2d] sm:text-2xl">
            {label || 'Saksikan momen lengkapnya'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-warm-gray-500">
            Klik gambar untuk memutar video di dalam artikel.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buka video di YouTube"
          className="shrink-0 text-[#075b3a] hover:text-[#0b7b52]"
        >
          <ArrowUpRight size={20} />
        </a>
      </div>
    </section>
  );
}
