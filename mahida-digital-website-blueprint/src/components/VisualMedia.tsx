'use client';
/* eslint-disable @next/next/no-img-element -- External URLs remain browser-loaded; no container storage or image proxy. */
import { useEffect, useRef, useState } from 'react';
import { directVideo, type Clip } from '@/lib/design-schema';
import {
  driveIdFromUrl,
  publicImageUrl,
  youtubeIdFromUrl,
} from '@/lib/media-links';
export function VisualItem({
  clip,
  hero = false,
  fallback = '',
}: {
  clip: Clip;
  hero?: boolean;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false),
    [imageFailed, setImageFailed] = useState(false),
    [playing, setPlaying] = useState(false),
    [blocked, setBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const direct = clip.type === 'video' && directVideo(clip.url);
  useEffect(() => {
    if (hero && direct) video.current?.play().catch(() => setBlocked(true));
  }, [hero, direct, clip.url]);
  const poster = publicImageUrl(clip.poster || fallback),
    src = publicImageUrl(clip.url);
  const ratio =
    clip.ratio === 'portrait'
      ? 'aspect-[3/4]'
      : clip.ratio === 'square'
        ? 'aspect-square'
        : clip.ratio === 'original'
          ? clip.type === 'video'
            ? 'aspect-video'
            : ''
          : 'aspect-video';
  const style = { objectPosition: `${clip.focalX}% ${clip.focalY}%` };
  const fit = clip.crop === false ? 'object-contain' : 'object-cover';
  const imageClass = hero
    ? `absolute inset-0 h-full w-full ${fit}`
    : clip.ratio === 'original'
      ? 'h-auto w-full'
      : `h-full w-full ${fit}`;
  const photo = (url: string | null) =>
    url && !imageFailed ? (
      <img
        src={url}
        alt={clip.alt}
        loading={hero ? 'eager' : 'lazy'}
        onError={() => {
          if (!failed && poster && poster !== src) setFailed(true);
          else setImageFailed(true);
        }}
        style={style}
        className={imageClass}
      />
    ) : null;
  const id = driveIdFromUrl(clip.url),
    youtube = youtubeIdFromUrl(clip.url);
  return (
    <div
      data-visual-id={clip.id}
      data-visual-type={clip.type}
      className={
        hero
          ? 'absolute inset-0 bg-[#123d2b]'
          : `relative overflow-hidden ${ratio}`
      }
    >
      {clip.type === 'image' ? (
        photo(failed ? poster : src)
      ) : failed ? (
        photo(poster)
      ) : direct ? (
        <video
          ref={video}
          autoPlay={hero}
          loop={hero}
          muted={hero}
          playsInline
          controls={!hero || blocked}
          preload={hero ? 'metadata' : 'none'}
          poster={poster || undefined}
          onError={() => setFailed(true)}
          aria-label={clip.alt}
          className={imageClass}
          style={style}
        >
          <source src={clip.url} type="video/mp4" />
        </video>
      ) : playing ? (
        <iframe
          title={clip.alt}
          src={
            id
              ? `https://drive.google.com/file/d/${id}/preview`
              : `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1`
          }
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <>
          {photo(
            poster ||
              (youtube
                ? `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`
                : null),
          )}
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute bottom-4 right-4 z-20 rounded bg-white px-5 py-3 font-bold text-[#123d2b]"
          >
            Putar video
          </button>
        </>
      )}
      {hero && direct && !failed && (
        <button
          type="button"
          aria-label={blocked ? 'Putar video latar' : 'Jeda video latar'}
          onClick={() => {
            if (video.current?.paused) {
              video.current
                .play()
                .then(() => setBlocked(false))
                .catch(() => setBlocked(true));
            } else {
              video.current?.pause();
              setBlocked(true);
            }
          }}
          className="absolute bottom-4 right-4 z-20 rounded bg-white px-5 py-3 font-bold text-[#123d2b]"
        >
          {blocked ? 'Putar video' : 'Jeda video'}
        </button>
      )}
    </div>
  );
}
export default function VisualGrid({
  clips,
  carousel = false,
  besideText = false,
}: {
  clips: Clip[];
  carousel?: boolean;
  besideText?: boolean;
}) {
  return clips.length ? (
    <div
      data-visual-grid
      aria-label={carousel ? 'Foto kegiatan dan fasilitas' : 'Kliping visual'}
      tabIndex={carousel ? 0 : undefined}
      className={
        carousel
          ? 'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4'
          : besideText
            ? 'grid min-w-0 grid-cols-1 gap-4'
            : 'grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-6 lg:grid-cols-12'
      }
    >
      {clips.map((clip) => (
        <figure
          key={clip.id}
          data-clip-id={clip.id}
          className={
            carousel
              ? `min-w-0 shrink-0 snap-center ${clip.size === 'wide' ? 'w-full sm:w-[85%]' : clip.size === 'small' ? 'w-[70%] sm:w-[40%]' : 'w-[85%] sm:w-[55%]'}`
              : besideText
                ? `min-w-0 mx-auto ${clip.size === 'small' ? 'w-3/4' : clip.size === 'medium' ? 'w-[90%]' : 'w-full'}`
                : clip.size === 'wide'
                  ? 'min-w-0 sm:col-span-6 lg:col-span-12'
                  : clip.size === 'medium'
                    ? 'min-w-0 sm:col-span-3 lg:col-span-6'
                    : 'min-w-0 sm:col-span-2 lg:col-span-3'
          }
        >
          <VisualItem
            key={`${clip.url}-${clip.type}-${clip.poster}`}
            clip={clip}
          />
        </figure>
      ))}
    </div>
  ) : null;
}
