"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readingKey, type ReadingPosition } from "./BookReader";
export default function ResumeReading({
  id,
  slug,
  chapterIds,
}: {
  id: number;
  slug: string;
  chapterIds: string[];
}) {
  const [chapter, setChapter] = useState("");
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const value = JSON.parse(
          localStorage.getItem(readingKey(id)) ?? "null",
        ) as ReadingPosition | null;
        if (value && chapterIds.includes(value.chapter))
          setChapter(value.chapter);
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [id, chapterIds]);
  return chapter ? (
    <Link
      className="library-button library-button-secondary"
      href={`/maktabah/kitab/${slug}/baca/${chapter}?lanjut=1`}
    >
      Lanjutkan Membaca
    </Link>
  ) : null;
}
