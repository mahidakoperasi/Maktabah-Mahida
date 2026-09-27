'use client';

import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import type { VideoEmbed } from '@/lib/media-links';

export default function VideoEmbedBlock({ video, label }: { video: VideoEmbed; label?: string }) {
  const [playing, setPlaying] = useState(false);
  return <section className="my-9 mx-auto max-w-3xl overflow-hidden rounded border border-mahida-200 bg-white shadow-sm">
    <div className={`relative mx-auto w-full overflow-hidden bg-[#073f2c] ${video.portrait ? 'max-w-[420px] aspect-[9/16]' : 'aspect-video'}`}>
      {playing ? <iframe src={video.embedUrl} title={label || `Video ${video.platform}`} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        : <button type="button" className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-[#073f2c] to-[#126443] text-white focus-visible:outline-4 focus-visible:outline-offset-[-4px]" onClick={() => setPlaying(true)} aria-label={`Putar video ${video.platform}: ${label || 'Mahida'}`}>
          {video.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-75" />
          )}
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white text-emerald-forest shadow-lg"><Play size={28} fill="currentColor" aria-hidden="true" /></span>
        </button>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-[#a18725]">{video.platform}</p><p className="mt-1 break-words font-semibold text-[#173d2d]">{label || 'Video Mahida'}</p></div>
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-forest underline-offset-4 hover:underline focus-visible:outline-2">Buka video asli <ArrowUpRight size={16} aria-hidden="true" /></a>
    </div>
  </section>;
}
