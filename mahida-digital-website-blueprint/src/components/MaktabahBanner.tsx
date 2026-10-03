"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import type { LibrarySettings } from "@/lib/maktabah-schema";
import { publicImageUrl } from "@/lib/media-links";
import ArabicText from "./ArabicText";
import RichContent from "./RichContent";

export default function MaktabahBanner({
  settings,
  eyebrow,
}: {
  settings: LibrarySettings;
  eyebrow: string;
}) {
  const b = settings.banner;
  const desktop = publicImageUrl(b.imageUrl);
  const mobile = publicImageUrl(b.mobileImageUrl);
  const [failed, setFailed] = useState<string[]>([]);
  const src =
    desktop && !failed.includes(desktop)
      ? desktop
      : mobile && !failed.includes(mobile)
        ? mobile
        : null;
  const mobileSrc = mobile && !failed.includes(mobile) ? mobile : src;
  const imageRef = useRef<HTMLImageElement>(null);
  const recordFailure = useCallback(
    (img: HTMLImageElement) => {
      const url =
        [mobileSrc, src].find(
          (candidate) =>
            candidate &&
            new URL(candidate, window.location.href).href === img.currentSrc,
        ) || src;
      if (url) setFailed((old) => (old.includes(url) ? old : [...old, url]));
    },
    [src, mobileSrc, setFailed],
  );
  useEffect(() => {
    let active = true;
    const img = imageRef.current;
    // A local image may fail before hydration has attached React's error listener.
    if (img?.complete && img.naturalWidth === 0) {
      queueMicrotask(() => {
        if (active) recordFailure(img);
      });
    }
    return () => {
      active = false;
    };
  }, [recordFailure]);
  const title = b.title || settings.name;
  const style = {
    "--banner-height": `${b.height}px`,
    "--banner-focus": `${b.focalX}% ${b.focalY}%`,
    textAlign: b.textAlign,
  } as CSSProperties;
  return (
    <section
      id="library-intro"
      aria-label="Banner Maktabah"
      style={style}
      className={`library-section library-banner library-banner-${b.placement} ${src ? "library-banner-with-image" : "library-banner-no-image"}`}
    >
      <div className="library-banner-copy">
        {eyebrow && <p className="library-eyebrow">{eyebrow}</p>}
        <h1 dir="auto">
          <ArabicText text={title} />
        </h1>
        <div className="library-intro">
          <RichContent content={b.description || settings.intro} />
        </div>
        {b.buttonLabel && b.buttonUrl && (
          <Link
            className="library-button library-banner-button"
            href={b.buttonUrl}
            {...(b.buttonUrl.startsWith("https://")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {b.buttonLabel}
          </Link>
        )}
      </div>
      {src && (
        <picture className="library-banner-picture">
          <source media="(max-width: 639px)" srcSet={mobileSrc ?? src} />
          {/* Banner media is above the fold; text remains available if either image fails. */}
          <img
            ref={imageRef}
            src={src}
            alt={b.imageAlt || title}
            fetchPriority="high"
            onError={(event) => recordFailure(event.currentTarget)}
          />
        </picture>
      )}
    </section>
  );
}
